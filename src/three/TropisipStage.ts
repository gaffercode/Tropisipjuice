import * as THREE from 'three';
import type { CupSizeId, FlavorId } from '../data/flavors';
import { BOTANICAL_LAYERS, LAYER_BY_KEY, type LayerKey } from '../data/layers';
import { disposeObjectTree, TropisipCupAssembly } from './cupAssembly';
import { computeStageKinematics, type StageKinematics } from './kinematics';
import { createSunlitStudioEnvMap } from './proceduralHdri';

export interface MacroTelemetry {
  magnification: string;
  layerTitle: string;
  surfaceFeature: string;
  focalDistanceMm: number;
}

export interface TropisipStageOptions {
  mainCanvas: HTMLCanvasElement;
  macroCanvas: HTMLCanvasElement;
  getScrollProgress: () => number;
  onTelemetry?: (telemetry: MacroTelemetry) => void;
}

const MAIN_FOV = 34;
const MACRO_MAGNIFICATION = 2.6;
const MACRO_MAGNIFICATION_LABEL = `${MACRO_MAGNIFICATION.toFixed(1).replace('.', ',')}×`;
const MACRO_FOV = THREE.MathUtils.radToDeg(
  2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(MAIN_FOV) / 2) / MACRO_MAGNIFICATION),
);
const MACRO_RT_SIZE = 384;

export class TropisipStage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly mainCamera: THREE.PerspectiveCamera;
  private readonly macroCamera: THREE.PerspectiveCamera;
  private readonly macroRT: THREE.WebGLRenderTarget;
  private readonly macroPixelBuffer = new Uint8Array(MACRO_RT_SIZE * MACRO_RT_SIZE * 4);
  private readonly macroCtx: CanvasRenderingContext2D | null;
  private readonly macroImageData: ImageData | null;
  private readonly macroTempCanvas: HTMLCanvasElement;
  private readonly macroTempCtx: CanvasRenderingContext2D | null;

  private readonly cup: TropisipCupAssembly;
  private readonly envMap: THREE.Texture;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2(0, 0);
  private readonly macroFocusPoint = new THREE.Vector3(0, 0.25, 0.9);
  private readonly smoothCamPos = new THREE.Vector3(0, 0.42, 7.55);
  private readonly smoothCamTarget = new THREE.Vector3(0, 0.16, 0);
  private readonly reducedMotionQuery: MediaQueryList | null;

  // Pre-allocated scratch math objects for zero per-frame heap allocations
  private readonly scratchCamGoal = new THREE.Vector3();
  private readonly scratchTargetGoal = new THREE.Vector3();
  private readonly scratchFallbackFocus = new THREE.Vector3();
  private readonly scratchViewDir = new THREE.Vector3();
  private readonly scratchPrevClearColor = new THREE.Color();

  private readonly getScrollProgress: () => number;
  private readonly onTelemetry?: (telemetry: MacroTelemetry) => void;

  private macroEnabled = false;
  private disposed = false;

  private lastLayerTitle = 'Gelas PP Berembun Dingin';
  private lastFeature = '420+ Butir Embun Dingin 4 °C';
  private lastFocalMm = 48;

  // Last emitted values to avoid redundant React state updates when macro telemetry hasn't changed
  private emittedLayerTitle = '';
  private emittedFeature = '';
  private emittedFocalMm = -1;

  constructor(options: TropisipStageOptions) {
    this.getScrollProgress = options.getScrollProgress;
    this.onTelemetry = options.onTelemetry;
    this.reducedMotionQuery =
      typeof window !== 'undefined' && 'matchMedia' in window
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    this.renderer = new THREE.WebGLRenderer({
      canvas: options.mainCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.envMap = createSunlitStudioEnvMap(this.renderer);
    this.scene.environment = this.envMap;

    const sunKey = new THREE.DirectionalLight(0xfff7e6, 2.45);
    sunKey.position.set(4.5, 6.2, 4.4);
    this.scene.add(sunKey);

    const linenHemi = new THREE.HemisphereLight(0xfffcf4, 0xeee4ce, 1.25);
    this.scene.add(linenHemi);

    const rimBack = new THREE.DirectionalLight(0xffebc2, 1.75);
    rimBack.position.set(-4.2, 2.8, -3.6);
    this.scene.add(rimBack);

    this.mainCamera = new THREE.PerspectiveCamera(MAIN_FOV, 1, 0.1, 40);
    this.mainCamera.position.copy(this.smoothCamPos);

    this.macroCamera = new THREE.PerspectiveCamera(MACRO_FOV, 1, 0.08, 25);

    this.macroRT = new THREE.WebGLRenderTarget(MACRO_RT_SIZE, MACRO_RT_SIZE, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      samples: 0,
    });

    options.macroCanvas.width = MACRO_RT_SIZE;
    options.macroCanvas.height = MACRO_RT_SIZE;
    this.macroCtx = options.macroCanvas.getContext('2d');
    this.macroImageData = this.macroCtx
      ? this.macroCtx.createImageData(MACRO_RT_SIZE, MACRO_RT_SIZE)
      : null;

    this.macroTempCanvas = document.createElement('canvas');
    this.macroTempCanvas.width = MACRO_RT_SIZE;
    this.macroTempCanvas.height = MACRO_RT_SIZE;
    this.macroTempCtx = this.macroTempCanvas.getContext('2d');

    this.cup = new TropisipCupAssembly();
    this.scene.add(this.cup.root);

    this.resize();
    this.renderer.setAnimationLoop(this.tick);
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.mainCamera.aspect = width / Math.max(1, height);
    this.mainCamera.updateProjectionMatrix();
  }

  public setFlavor(flavorId: FlavorId): void {
    this.cup.setFlavor(flavorId);
  }

  public setSize(sizeId: CupSizeId): void {
    this.cup.setSize(sizeId);
  }

  public setMacroEnabled(enabled: boolean): void {
    this.macroEnabled = enabled;
    if (enabled) {
      this.emitTelemetryIfChanged(true);
    }
  }

  public setPointerPosition(clientX: number, clientY: number): void {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    this.pointerNdc.x = (clientX / w) * 2 - 1;
    this.pointerNdc.y = -(clientY / h) * 2 + 1;
  }

  private renderMacroLensPass(kinematics: StageKinematics): void {
    if (!this.macroEnabled || !this.macroCtx || !this.macroImageData || !this.macroTempCtx) {
      return;
    }

    this.raycaster.setFromCamera(this.pointerNdc, this.mainCamera);
    const hits = this.raycaster.intersectObject(this.cup.root, true);

    if (hits.length > 0) {
      const hit = hits[0];
      this.macroFocusPoint.lerp(hit.point, 0.35);

      const layerKey = hit.object.userData.layerKey as LayerKey | undefined;
      const feature = hit.object.userData.feature as string | undefined;
      if (layerKey) {
        const spec = LAYER_BY_KEY.get(layerKey);
        if (spec) {
          this.lastLayerTitle = spec.title;
        }
      }
      if (feature) {
        this.lastFeature = feature;
      }
    } else {
      const fallbackY =
        kinematics.activeLayerIndex >= 0
          ? BOTANICAL_LAYERS[kinematics.activeLayerIndex].explodedFocusY * 0.42
          : 0.12;
      this.scratchFallbackFocus.set(this.cup.root.position.x, fallbackY, 0.92);
      this.macroFocusPoint.lerp(this.scratchFallbackFocus, 0.14);
      this.lastFeature = 'Embun Dingin & Serat Buah Asli';
    }

    this.scratchViewDir
      .subVectors(this.mainCamera.position, this.macroFocusPoint)
      .normalize();
    const macroDist = Math.max(
      2.15,
      this.mainCamera.position.distanceTo(this.macroFocusPoint) * 0.72,
    );
    this.macroCamera.position
      .copy(this.macroFocusPoint)
      .addScaledVector(this.scratchViewDir, macroDist);
    this.macroCamera.lookAt(this.macroFocusPoint);
    this.macroCamera.updateMatrixWorld();

    this.lastFocalMm = Math.round(macroDist * 14.5);

    const prevClearAlpha = this.renderer.getClearAlpha();
    this.renderer.getClearColor(this.scratchPrevClearColor);

    this.renderer.setRenderTarget(this.macroRT);
    this.renderer.setClearColor(0xfaf6ed, 1);
    this.renderer.clear();
    this.renderer.render(this.scene, this.macroCamera);
    this.renderer.readRenderTargetPixels(
      this.macroRT,
      0,
      0,
      MACRO_RT_SIZE,
      MACRO_RT_SIZE,
      this.macroPixelBuffer,
    );
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(this.scratchPrevClearColor, prevClearAlpha);

    const dst = this.macroImageData.data;
    const rowBytes = MACRO_RT_SIZE * 4;
    for (let y = 0; y < MACRO_RT_SIZE; y += 1) {
      const srcOffset = (MACRO_RT_SIZE - 1 - y) * rowBytes;
      const dstOffset = y * rowBytes;
      dst.set(this.macroPixelBuffer.subarray(srcOffset, srcOffset + rowBytes), dstOffset);
    }

    this.macroTempCtx.putImageData(this.macroImageData, 0, 0);

    const ctx = this.macroCtx;
    ctx.clearRect(0, 0, MACRO_RT_SIZE, MACRO_RT_SIZE);
    ctx.drawImage(this.macroTempCanvas, 0, 0);

    const half = MACRO_RT_SIZE * 0.5;
    const opticalVignette = ctx.createRadialGradient(half, half, half * 0.74, half, half, half);
    opticalVignette.addColorStop(0, 'rgba(12, 75, 42, 0.0)');
    opticalVignette.addColorStop(0.84, 'rgba(12, 75, 42, 0.06)');
    opticalVignette.addColorStop(1, 'rgba(12, 75, 42, 0.28)');
    ctx.fillStyle = opticalVignette;
    ctx.fillRect(0, 0, MACRO_RT_SIZE, MACRO_RT_SIZE);

    this.emitTelemetryIfChanged(false);
  }

  private emitTelemetryIfChanged(force: boolean): void {
    if (!this.onTelemetry) return;
    if (
      !force &&
      this.lastLayerTitle === this.emittedLayerTitle &&
      this.lastFeature === this.emittedFeature &&
      this.lastFocalMm === this.emittedFocalMm
    ) {
      return;
    }

    this.emittedLayerTitle = this.lastLayerTitle;
    this.emittedFeature = this.lastFeature;
    this.emittedFocalMm = this.lastFocalMm;

    this.onTelemetry({
      magnification: MACRO_MAGNIFICATION_LABEL,
      layerTitle: this.lastLayerTitle,
      surfaceFeature: this.lastFeature,
      focalDistanceMm: this.lastFocalMm,
    });
  }

  private readonly tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsed = this.clock.elapsedTime;
    const reducedMotion = Boolean(this.reducedMotionQuery?.matches);

    const isCompact = window.innerWidth < 960;
    const kinematics = computeStageKinematics(this.getScrollProgress(), isCompact);

    this.cup.update(elapsed, dt, kinematics, reducedMotion);

    const camSmooth = 1 - Math.exp(-dt * 5.2);
    this.scratchCamGoal.set(
      kinematics.cameraPos[0],
      kinematics.cameraPos[1],
      kinematics.cameraPos[2],
    );
    this.scratchTargetGoal.set(
      kinematics.cameraTarget[0],
      kinematics.cameraTarget[1],
      kinematics.cameraTarget[2],
    );
    this.smoothCamPos.lerp(this.scratchCamGoal, camSmooth);
    this.smoothCamTarget.lerp(this.scratchTargetGoal, camSmooth);

    this.mainCamera.position.copy(this.smoothCamPos);
    this.mainCamera.lookAt(this.smoothCamTarget);

    this.renderer.render(this.scene, this.mainCamera);

    if (this.macroEnabled) {
      this.renderMacroLensPass(kinematics);
    }
  };

  public dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    disposeObjectTree(this.scene);
    this.envMap.dispose();
    this.macroRT.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
  }
}
