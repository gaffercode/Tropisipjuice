import React, { memo, useEffect, useRef, useState } from 'react';
import { FLAVORS, type CupSizeId, type FlavorId } from '../data/flavors';
import { TropisipStage, type MacroTelemetry } from '../three/TropisipStage';

interface StageCanvasProps {
  flavorId: FlavorId;
  sizeId: CupSizeId;
  scrollProgressRef: React.MutableRefObject<number>;
  macroEnabled: boolean;
  onCloseMacro: () => void;
}

const LOUPE_RADIUS = 112;

const DEFAULT_TELEMETRY: MacroTelemetry = {
  magnification: '2,6×',
  layerTitle: 'Gelas PP Berembun Dingin',
  surfaceFeature: '420+ Butir Embun Dingin 4 °C',
  focalDistanceMm: 48,
};

function clampLoupeCoords(clientX: number, clientY: number): [number, number] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = Math.max(LOUPE_RADIUS + 20, Math.min(vw - LOUPE_RADIUS - 20, clientX));
  const y = Math.max(LOUPE_RADIUS + 84, Math.min(vh - LOUPE_RADIUS - 96, clientY));
  return [x - LOUPE_RADIUS, y - LOUPE_RADIUS];
}

export const StageCanvas: React.FC<StageCanvasProps> = memo(
  ({ flavorId, sizeId, scrollProgressRef, macroEnabled, onCloseMacro }) => {
    const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const macroCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const loupeRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef<TropisipStage | null>(null);
    const macroEnabledRef = useRef(macroEnabled);
    const lastPointerRef = useRef<[number, number]>([780, 420]);

    const [webglError, setWebglError] = useState(false);
    const [stageReady, setStageReady] = useState(false);
    const [telemetry, setTelemetry] = useState<MacroTelemetry>(DEFAULT_TELEMETRY);

    // Mount WebGL stage once; zero React re-renders on pointermove or scroll (rerender-use-ref-transient-values)
    useEffect(() => {
      const mainCanvas = mainCanvasRef.current;
      const macroCanvas = macroCanvasRef.current;
      if (!mainCanvas || !macroCanvas) return;

      lastPointerRef.current = [window.innerWidth * 0.64, window.innerHeight * 0.48];
      if (loupeRef.current) {
        const [tx, ty] = clampLoupeCoords(lastPointerRef.current[0], lastPointerRef.current[1]);
        loupeRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      let stage: TropisipStage | null = null;
      try {
        stage = new TropisipStage({
          mainCanvas,
          macroCanvas,
          getScrollProgress: () => scrollProgressRef.current,
          onTelemetry: setTelemetry,
          onReady: () => setStageReady(true),
        });
        stageRef.current = stage;
      } catch {
        setWebglError(true);
        return;
      }

      const onResize = () => {
        stage?.resize();
        if (loupeRef.current && macroEnabledRef.current) {
          const [tx, ty] = clampLoupeCoords(lastPointerRef.current[0], lastPointerRef.current[1]);
          loupeRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        lastPointerRef.current[0] = e.clientX;
        lastPointerRef.current[1] = e.clientY;
        if (!macroEnabledRef.current) return;
        stage?.setPointerPosition(e.clientX, e.clientY);
        if (loupeRef.current) {
          const [tx, ty] = clampLoupeCoords(e.clientX, e.clientY);
          loupeRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      };

      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });

      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onPointerMove);
        stage?.dispose();
        stageRef.current = null;
      };
    }, [scrollProgressRef]);

    useEffect(() => {
      stageRef.current?.setFlavor(flavorId);
    }, [flavorId]);

    useEffect(() => {
      stageRef.current?.setSize(sizeId);
    }, [sizeId]);

    useEffect(() => {
      macroEnabledRef.current = macroEnabled;
      const stage = stageRef.current;
      if (!stage) return;
      if (macroEnabled) {
        const [px, py] = lastPointerRef.current;
        stage.setPointerPosition(px, py);
        if (loupeRef.current) {
          const [tx, ty] = clampLoupeCoords(px, py);
          loupeRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      }
      stage.setMacroEnabled(macroEnabled);
    }, [macroEnabled]);

    const flavor = FLAVORS[flavorId];

    return (
      <>
        <div className="stage-shell" aria-hidden="true">
          <div
            className="stage-sun-wash"
            style={{
              background: `
                radial-gradient(circle at 68% 42%, ${flavor.accentSoftBg} 0%, rgba(250, 246, 237, 0) 58%),
                radial-gradient(circle at 18% 82%, ${flavor.accentStrongBg} 0%, rgba(250, 246, 237, 0) 52%),
                radial-gradient(circle at 86% 14%, rgba(255, 200, 40, 0.22) 0%, rgba(250, 246, 237, 0) 44%)
              `,
            }}
          />

          <canvas
            ref={mainCanvasRef}
            className={`stage-webgl-canvas ${stageReady ? 'is-ready' : ''}`}
          />

          {webglError ? (
            <div className="stage-fallback-note">
              <span className="mono-label">PRATINJAU 3D WEBGL TIDAK TERSEDIA</span>
              <p>Akselerasi WebGL tidak aktif di peramban perangkat ini.</p>
            </div>
          ) : null}
        </div>

        <div
          ref={loupeRef}
          className={`macro-loupe ${macroEnabled ? 'is-visible' : ''}`}
          aria-live="polite"
        >
          <div className="macro-loupe-ring" style={{ borderColor: flavor.hex }}>
            <canvas ref={macroCanvasRef} className="macro-loupe-canvas" />
            <div className="macro-reticle">
              <span className="reticle-h" />
              <span className="reticle-v" />
              <span className="reticle-center" />
            </div>
            <span className="macro-badge-top mono-label">
              {telemetry.magnification} · f/2.0 · {telemetry.focalDistanceMm}MM
            </span>
          </div>

          <div className="macro-readout-card">
            <div className="macro-readout-head">
              <span className="mono-label">{telemetry.layerTitle.toUpperCase()}</span>
              <button
                type="button"
                className="macro-close-btn"
                onClick={onCloseMacro}
                aria-label="Tutup lensa makro optik"
              >
                ×
              </button>
            </div>
            <p className="macro-readout-feature">{telemetry.surfaceFeature}</p>
            <p className="macro-readout-note">{flavor.macroFocusNote}</p>
          </div>
        </div>
      </>
    );
  },
);
StageCanvas.displayName = 'StageCanvas';
