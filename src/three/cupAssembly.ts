import * as THREE from 'three';
import { FLAVORS, FLAVOR_ORDER, type CupSizeId, type FlavorId } from '../data/flavors';
import type { LayerKey } from '../data/layers';
import type { StageKinematics } from './kinematics';
import {
  createCondensationMaps,
  createContactShadowTexture,
  createCupEmblemTexture,
  createFruitFleshTexture,
  createMintLeafTexture,
} from './proceduralTextures';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tagLayer(obj: THREE.Object3D, layerKey: LayerKey, feature: string): void {
  obj.userData.layerKey = layerKey;
  obj.userData.feature = feature;
  obj.traverse((child) => {
    child.userData.layerKey = layerKey;
    child.userData.feature = feature;
  });
}

const JUICE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Realistic organic frothy meniscus undulation at top surface of fresh juice
    if (pos.y > 0.94) {
      float wave1 = sin(pos.x * 7.5 + uTime * 1.6) * cos(pos.z * 7.0 - uTime * 1.3);
      float wave2 = sin((pos.x - pos.z) * 14.0 + uTime * 2.2) * 0.4;
      pos.y += (wave1 + wave2) * 0.012 * smoothstep(0.94, 1.08, pos.y);
    }
    vLocalPos = pos;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const JUICE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uDeepColor;
  uniform vec3 uSssColor;
  uniform vec3 uPulpColor;
  uniform vec3 uFoamColor;
  uniform float uPulpDensity;
  uniform float uSssIntensity;
  uniform float uSwirlStrength;
  uniform float uSeedDensity;
  uniform float uFiberLength;
  uniform float uTime;
  uniform vec3 uSunDir;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vLocalPos;
  varying vec2 vUv;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p = p * 2.03 + vec3(1.7, 9.2, 4.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    // 1. Height gradient: deeper juicy density at bottom -> luminous sunlit top
    float h = clamp((vLocalPos.y + 1.24) / 2.34, 0.0, 1.0);
    vec3 col = mix(mix(uDeepColor, uBaseColor, 0.38), uBaseColor, smoothstep(0.0, 0.72, h));

    // 2. Domain-warped photographic fruit pulp texture (eliminates smooth plastic look!)
    vec3 warp = vec3(
      fbm(vLocalPos * 4.2 + vec3(0.0, uTime * 0.03, 0.0)),
      fbm(vLocalPos * 4.2 + vec3(4.3, 1.8, 2.7)),
      fbm(vLocalPos * 4.2 + vec3(1.9, 6.4, 3.1))
    );
    vec3 pulpCoord = vLocalPos * vec3(7.5, mix(7.0, 15.0, uFiberLength), 7.5) + warp * 1.45;
    float macroPulp = fbm(pulpCoord);
    float fineGrain = noise3(vLocalPos * 46.0);
    float ultraFineGrain = noise3(vLocalPos * 92.0);

    // Rich juicy pulp variation & micro-speckling like real cold-blended fruit
    float pulpHighlight = smoothstep(0.36, 0.80, macroPulp) * uPulpDensity;
    col = mix(col, mix(uBaseColor * 1.12, uSssColor, 0.48), pulpHighlight * 0.34);
    col *= 0.93 + fineGrain * 0.14 + (ultraFineGrain - 0.5) * 0.08;

    // 3. Trapped cold micro air-bubbles pressing against the inner PP wall
    vec3 bubbleGrid = vLocalPos * 34.0;
    vec3 bCell = floor(bubbleGrid);
    vec3 bF = fract(bubbleGrid) - 0.5;
    float bRnd = hash31(bCell + vec3(11.3, 7.1, 3.7));
    float bubbleMask = (1.0 - smoothstep(0.08, 0.21, length(bF))) * step(0.84, bRnd);
    col = mix(col, mix(uFoamColor, vec3(1.0, 0.99, 0.96), 0.52), bubbleMask * 0.36);

    // 4. Fresh blended fruit froth / slush collar at the upper meniscus
    float foamZone = smoothstep(0.85, 0.99, h);
    float foamNoise = fbm(vLocalPos * 16.0 + vec3(0.0, uTime * 0.04, 0.0));
    float topFace = smoothstep(0.45, 0.92, N.y);
    float foamAmt = clamp(foamZone * (0.35 + foamNoise * 0.55) + topFace * (0.28 + foamNoise * 0.45), 0.0, 0.82);
    col = mix(col, uFoamColor, foamAmt * 0.62);

    // 5. Authentic Indonesian Jus Alpukat chocolate glaze wall-drizzles (pouring down inner cup)
    if (uSwirlStrength > 0.05) {
      float theta = atan(vLocalPos.z, vLocalPos.x);
      float dripWave = sin(theta * 5.0 + fbm(vLocalPos * 3.1) * 2.2) * 0.5 + 0.5;
      float dripReach = 0.22 + 0.68 * pow(dripWave, 1.4);
      float inDripHeight = smoothstep(1.0 - dripReach - 0.14, 1.0 - dripReach + 0.08, h);
      float streamCore = smoothstep(0.76, 0.93, sin(theta * 5.0 + sin(vLocalPos.y * 2.4 + theta) * 0.85));
      float thinVein = smoothstep(0.82, 0.96, sin(theta * 9.0 - vLocalPos.y * 2.2 + warp.x * 2.8));
      float cocoaMask = clamp((streamCore * inDripHeight * 0.9 + thinVein * inDripHeight * 0.55) * (1.0 - topFace * 0.85), 0.0, 1.0);
      col = mix(col, uPulpColor, cocoaMask * uSwirlStrength * 0.88);
    }

    // 6. Sharp botanical micro-seeds (Buah Naga obsidian seeds, Semangka / Jambu micro-pips)
    if (uSeedDensity > 0.04) {
      vec3 seedGrid = vLocalPos * 25.0;
      vec3 sCell = floor(seedGrid);
      vec3 sF = fract(seedGrid) - 0.5;
      float sRnd = hash31(sCell);
      float sDist = length(sF * vec3(1.0, 1.55, 1.0));
      float seedDot = (1.0 - smoothstep(0.09, 0.16, sDist)) * step(1.0 - uSeedDensity * 0.34, sRnd);
      col = mix(col, vec3(0.07, 0.02, 0.05), seedDot * 0.88);
    }

    // 7. Commercial food-photography studio lighting (warm daylight key + softbox bounce + crisp SSS)
    float ndotl = dot(N, L);
    float wrapDiffuse = clamp((ndotl + 0.65) / 1.65, 0.0, 1.0);
    float sideFill = clamp(dot(N, normalize(vec3(-0.75, 0.25, 0.55))) * 0.5 + 0.5, 0.0, 1.0);
    float bottomBounce = clamp(-N.y * 0.5 + 0.5, 0.0, 1.0) * (1.0 - h) * 0.16;

    // Physical Subsurface Scattering glow through fruit edge & backlit rim
    vec3 backDir = normalize(L + N * 0.32);
    float backScatter = pow(clamp(dot(V, -backDir), 0.0, 1.0), 2.5);
    float rimGlow = pow(1.0 - max(dot(N, V), 0.0), 2.1);
    float sss = (backScatter * 0.78 + rimGlow * 0.52) * uSssIntensity * (1.1 - uPulpDensity * 0.22);

    // Wet juicy micro-specular across fruit meniscus & wall
    vec3 H = normalize(L + V);
    float wetSpec = pow(max(dot(N, H), 0.0), 48.0) * (0.18 + topFace * 0.52 + fineGrain * 0.14);

    // Cylindrical studio depth shading (gentle realistic falloff at extreme silhouette edges)
    float edgeAO = mix(0.84, 1.0, smoothstep(0.0, 0.45, max(dot(N, V), 0.0)));

    vec3 lit = col * (0.72 + wrapDiffuse * 0.42 + sideFill * 0.16 + bottomBounce) * edgeAO;
    lit += uSssColor * sss * 0.5;
    lit += vec3(1.0, 0.98, 0.94) * wetSpec;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

const DROPLET_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalNormal;

  void main() {
    vLocalNormal = normalize(normal);
    #ifdef USE_INSTANCING
      mat4 worldMat = modelMatrix * instanceMatrix;
    #else
      mat4 worldMat = modelMatrix;
    #endif
    vec4 wp = worldMat * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(worldMat) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const DROPLET_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSunDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalNormal;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.8);

    // Crisp studio pinpoint highlight on upper dew bead + subtle bottom refraction caustic
    vec3 H = normalize(L + V);
    float specPinpoint = pow(max(dot(N, H), 0.0), 120.0);
    float specSoft = pow(max(dot(N, H), 0.0), 22.0) * 0.16;
    float bottomCaustic = pow(clamp(-vLocalNormal.y, 0.0, 1.0), 2.6) * (1.0 - ndotv * 0.5);
    float meniscusDark = smoothstep(0.18, 0.78, fresnel) * smoothstep(0.15, -0.75, vLocalNormal.y);

    vec3 waterCol = vec3(1.0, 0.995, 0.985) * (specPinpoint * 1.65 + specSoft + bottomCaustic * 0.42 + fresnel * 0.24);
    waterCol = mix(waterCol, vec3(0.05, 0.12, 0.08), meniscusDark * 0.48);

    // Ultra-clear optical center so fruit texture shows through sharply
    float alpha = clamp(0.06 + fresnel * 0.36 + specPinpoint * 0.88 + bottomCaustic * 0.18 + meniscusDark * 0.22, 0.0, 0.88);
    gl_FragColor = vec4(waterCol, alpha);
  }
`;

const STUDIO_SPECULAR_SHELL_VERTEX = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const STUDIO_SPECULAR_SHELL_FRAGMENT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 3.2);

    // Authentic commercial photo-studio dual vertical softbox strips reflecting on clear PP plastic
    vec3 R = reflect(-V, N);
    float leftSoftbox = smoothstep(0.62, 0.94, dot(R, normalize(vec3(-0.78, 0.14, 0.60))));
    float rightSoftbox = smoothstep(0.68, 0.96, dot(R, normalize(vec3(0.76, 0.22, 0.61))));
    float frostBand = smoothstep(-1.2, -0.5, vLocalPos.y) * (1.0 - smoothstep(0.78, 1.15, vLocalPos.y));

    float highlight = leftSoftbox * 0.34 + rightSoftbox * 0.26 + fresnel * 0.42;
    vec3 col = mix(vec3(0.99, 0.985, 0.96), vec3(1.0), 0.6);
    float alpha = clamp(highlight * 0.56 + frostBand * 0.055, 0.0, 0.52);

    gl_FragColor = vec4(col, alpha);
  }
`;

interface FloatingChunkMeta {
  mesh: THREE.Object3D;
  basePos: THREE.Vector3;
  radialDir: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  phase: number;
}

interface InternalPulpMeta {
  basePos: THREE.Vector3;
  speed: number;
  phase: number;
  scale: number;
}

export class TropisipCupAssembly {
  public readonly root = new THREE.Group();
  public readonly layers: Record<LayerKey, THREE.Group>;

  private readonly juiceUniforms: {
    uBaseColor: { value: THREE.Color };
    uDeepColor: { value: THREE.Color };
    uSssColor: { value: THREE.Color };
    uPulpColor: { value: THREE.Color };
    uFoamColor: { value: THREE.Color };
    uPulpDensity: { value: number };
    uSssIntensity: { value: number };
    uSwirlStrength: { value: number };
    uSeedDensity: { value: number };
    uFiberLength: { value: number };
    uTime: { value: number };
    uSunDir: { value: THREE.Vector3 };
  };

  private readonly pulpParticlesMesh: THREE.InstancedMesh;
  private readonly pulpParticlesMat: THREE.MeshStandardMaterial;
  private readonly pulpMeta: InternalPulpMeta[] = [];

  private readonly chunkGroups: Partial<Record<FlavorId, THREE.Group>> = {};
  private readonly chunkMetas: Partial<Record<FlavorId, FloatingChunkMeta[]>> = {};
  private readonly chunkCubeGeo: THREE.BufferGeometry;
  private readonly chunkAvoGeo: THREE.BufferGeometry;
  private readonly chunkWatermelonGeo: THREE.BufferGeometry;

  private readonly iceMetas: FloatingChunkMeta[] = [];
  private readonly mintMetas: FloatingChunkMeta[] = [];
  private readonly chiaGroup = new THREE.Group();
  private readonly shadowMesh: THREE.Mesh;

  private readonly dummy = new THREE.Object3D();

  private currentFlavor: FlavorId = 'mango';
  private currentSize: CupSizeId = '16oz';
  private introElapsed = 0;

  private readonly targetBaseColor = new THREE.Color(FLAVORS.mango.brightHex);
  private readonly targetDeepColor = new THREE.Color(FLAVORS.mango.deepHex);
  private readonly targetSssColor = new THREE.Color(FLAVORS.mango.sssHex);
  private readonly targetPulpColor = new THREE.Color(FLAVORS.mango.pulpHex);
  private readonly targetFoamColor = new THREE.Color(FLAVORS.mango.foamHex);
  private targetPulpDensity = FLAVORS.mango.pulpDensity;
  private targetSssIntensity = FLAVORS.mango.sssIntensity;
  private targetSwirlStrength = FLAVORS.mango.swirlStrength;
  private targetSeedDensity = FLAVORS.mango.seedDensity;
  private targetFiberLength = FLAVORS.mango.fiberLength;

  private chunkWeights: Record<FlavorId, number> = {
    mango: 1,
    avocado: 0,
    dragonfruit: 0,
    guava: 0,
    watermelon: 0,
    melon: 0,
  };
  private currentScaleY = 1.0;
  private currentScaleXZ = 1.0;

  constructor() {
    this.layers = {
      domedLid: new THREE.Group(),
      ppCup: new THREE.Group(),
      juiceCore: new THREE.Group(),
      fruitChunks: new THREE.Group(),
      iceInfusion: new THREE.Group(),
      baseGrip: new THREE.Group(),
    };

    Object.entries(this.layers).forEach(([key, group]) => {
      group.name = key;
      this.root.add(group);
    });

    const initial = FLAVORS.mango;
    this.juiceUniforms = {
      uBaseColor: { value: new THREE.Color(initial.brightHex) },
      uDeepColor: { value: new THREE.Color(initial.deepHex) },
      uSssColor: { value: new THREE.Color(initial.sssHex) },
      uPulpColor: { value: new THREE.Color(initial.pulpHex) },
      uFoamColor: { value: new THREE.Color(initial.foamHex) },
      uPulpDensity: { value: initial.pulpDensity },
      uSssIntensity: { value: initial.sssIntensity },
      uSwirlStrength: { value: initial.swirlStrength },
      uSeedDensity: { value: initial.seedDensity },
      uFiberLength: { value: initial.fiberLength },
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.55, 0.72, 0.42).normalize() },
    };

    this.buildDomedStrawLid();
    this.buildCondensationPpCup();
    const { pulpMesh, pulpMat } = this.buildJuiceCore();
    this.pulpParticlesMesh = pulpMesh;
    this.pulpParticlesMat = pulpMat;

    this.chunkCubeGeo = this.createSoftOrganicCube(0.23, 0.2, 0.22, 0.03);
    this.chunkAvoGeo = this.createAvocadoWedgeGeometry();
    this.chunkWatermelonGeo = this.createWatermelonWedgeGeometry();

    // Only build Mango chunks eagerly for instant frame-0 startup; other 5 build on idle/switch
    this.ensureFlavorChunksBuilt('mango');

    this.buildIceChiaMintInfusion();
    this.shadowMesh = this.buildClearTactileBaseGrip();
  }

  /** Layer 1: Realistic Thin Crystal PET Domed Snap-Lid + Brunswick Green Straw */
  private buildDomedStrawLid(): void {
    const group = this.layers.domedLid;

    // Authentic sleek low-profile clear PET dome + stepped snap-collar rim
    const domePoints: THREE.Vector2[] = [
      new THREE.Vector2(1.075, 1.155),
      new THREE.Vector2(1.092, 1.195),
      new THREE.Vector2(1.048, 1.23),
      new THREE.Vector2(0.995, 1.245),
      new THREE.Vector2(0.972, 1.29),
      new THREE.Vector2(0.90, 1.45),
      new THREE.Vector2(0.75, 1.62),
      new THREE.Vector2(0.52, 1.74),
      new THREE.Vector2(0.28, 1.805),
      new THREE.Vector2(0.145, 1.815),
      new THREE.Vector2(0.14, 1.79),
    ];

    const domeGeo = new THREE.LatheGeometry(domePoints, 72);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.24,
      roughness: 0.04,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 2.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    tagLayer(domeMesh, 'domedLid', 'Tutup Dome PET Bening Kristal');
    group.add(domeMesh);

    // Crisp rim specular collar (authentic press-fit PET lip)
    const rimRingGeo = new THREE.TorusGeometry(1.045, 0.019, 18, 72);
    rimRingGeo.rotateX(Math.PI / 2);
    const rimRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.48,
      roughness: 0.08,
      clearcoat: 1.0,
      envMapIntensity: 2.2,
    });
    const rimRing = new THREE.Mesh(rimRingGeo, rimRingMat);
    rimRing.position.y = 1.215;
    tagLayer(rimRing, 'domedLid', 'Bibir Segel Klik 95mm');
    group.add(rimRing);

    const innerRimGeo = new THREE.TorusGeometry(0.985, 0.011, 14, 72);
    innerRimGeo.rotateX(Math.PI / 2);
    const innerRim = new THREE.Mesh(innerRimGeo, rimRingMat);
    innerRim.position.y = 1.245;
    tagLayer(innerRim, 'domedLid', 'Alur Pengunci Tutup Dome');
    group.add(innerRim);

    const portGeo = new THREE.TorusGeometry(0.142, 0.012, 14, 40);
    portGeo.rotateX(Math.PI / 2);
    const portRing = new THREE.Mesh(portGeo, rimRingMat);
    portRing.position.y = 1.808;
    tagLayer(portRing, 'domedLid', 'Lubang Sedotan Cross-Slit');
    group.add(portRing);

    // Sleek angled Brunswick Green sipping straw (proportioned cleanly under topbar)
    const strawGroup = new THREE.Group();
    const strawOuterGeo = new THREE.CylinderGeometry(0.062, 0.062, 2.05, 32, 1, true);
    const strawMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c4b2a,
      roughness: 0.2,
      metalness: 0.02,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.35,
      side: THREE.DoubleSide,
    });
    const strawOuter = new THREE.Mesh(strawOuterGeo, strawMat);
    strawOuter.position.y = 1.56;
    strawGroup.add(strawOuter);

    const strawLipGeo = new THREE.TorusGeometry(0.06, 0.008, 12, 32);
    strawLipGeo.rotateX(Math.PI / 2);
    const strawLipMat = new THREE.MeshStandardMaterial({
      color: 0x166e40,
      roughness: 0.28,
    });
    const strawLip = new THREE.Mesh(strawLipGeo, strawLipMat);
    strawLip.position.y = 2.585;
    strawGroup.add(strawLip);

    strawGroup.rotation.z = -0.1;
    strawGroup.rotation.x = 0.04;
    strawGroup.position.set(0.05, 0.0, 0.02);
    tagLayer(strawGroup, 'domedLid', 'Sedotan Hijau Brunswick Tropisip');
    group.add(strawGroup);
  }

  /** Layer 2: Photorealistic Clear PP Cup + Studio Softbox Reflections + Tropisip Emblem + 420 Micro Dew Beads */
  private buildCondensationPpCup(): void {
    const group = this.layers.ppCup;
    const { roughnessMap, bumpMap } = createCondensationMaps();

    // True commercial 16oz/22oz tapered clear PP cup profile reaching all the way to clear bottom rim
    const cupPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.67, -1.30),
      new THREE.Vector2(0.715, -1.24),
      new THREE.Vector2(0.745, -1.04),
      new THREE.Vector2(0.84, -0.15),
      new THREE.Vector2(0.955, 0.82),
      new THREE.Vector2(1.005, 1.15),
      new THREE.Vector2(1.068, 1.185),
      new THREE.Vector2(1.058, 1.22),
      new THREE.Vector2(0.992, 1.21),
    ];

    const cupGeo = new THREE.LatheGeometry(cupPoints, 72);
    const cupMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      roughness: 0.28,
      roughnessMap,
      bumpMap,
      bumpScale: 0.015,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 2.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cupMesh = new THREE.Mesh(cupGeo, cupMat);
    tagLayer(cupMesh, 'ppCup', 'Dinding Gelas PP Bening Dingin');
    group.add(cupMesh);

    // Commercial studio softbox specular reflection pass (creates real crisp glass/PP side highlights)
    const specShellGeo = new THREE.LatheGeometry(cupPoints, 72);
    const specShellMat = new THREE.ShaderMaterial({
      vertexShader: STUDIO_SPECULAR_SHELL_VERTEX,
      fragmentShader: STUDIO_SPECULAR_SHELL_FRAGMENT,
      transparent: true,
      depthWrite: false,
    });
    const specShell = new THREE.Mesh(specShellGeo, specShellMat);
    specShell.scale.set(1.002, 1.0, 1.002);
    tagLayer(specShell, 'ppCup', 'Pantulan Softbox Studio Gelas PP');
    group.add(specShell);

    // Crisp rolled clear PP lip rim
    const rolledLipGeo = new THREE.TorusGeometry(1.03, 0.022, 18, 72);
    rolledLipGeo.rotateX(Math.PI / 2);
    const rolledLipMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.52,
      roughness: 0.08,
      clearcoat: 1.0,
      envMapIntensity: 2.2,
    });
    const rolledLip = new THREE.Mesh(rolledLipGeo, rolledLipMat);
    rolledLip.position.y = 1.195;
    tagLayer(rolledLip, 'ppCup', 'Bibir Gelas PP Bening');
    group.add(rolledLip);

    // Silkscreened Tropisip Emblem dead-center facing +Z
    const emblemTex = createCupEmblemTexture();
    const emblemGeo = new THREE.CylinderGeometry(0.976, 0.768, 1.86, 72, 1, true);
    emblemGeo.rotateY(Math.PI);
    const emblemMat = new THREE.MeshStandardMaterial({
      map: emblemTex,
      transparent: true,
      alphaTest: 0.03,
      roughness: 0.34,
      metalness: 0.02,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
    emblemMesh.position.y = -0.04;
    tagLayer(emblemMesh, 'ppCup', 'Emblem Tropisip Hijau Brunswick');
    group.add(emblemMesh);

    // 420+ Ultra-Fine Realistic Glass-Water Condensation Micro-Beads (NOT chunky cartoon polka dots!)
    const dropletCount = 420;
    const dropletGeo = new THREE.SphereGeometry(1, 12, 10);
    const dropletMat = new THREE.ShaderMaterial({
      vertexShader: DROPLET_VERTEX_SHADER,
      fragmentShader: DROPLET_FRAGMENT_SHADER,
      uniforms: {
        uSunDir: { value: new THREE.Vector3(0.55, 0.72, 0.42).normalize() },
      },
      transparent: true,
      depthWrite: false,
    });
    const droplets = new THREE.InstancedMesh(dropletGeo, dropletMat, dropletCount);
    const rand = mulberry32(88421);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < dropletCount; i += 1) {
      const yNorm = 0.05 + rand() * 0.88;
      const y = -1.16 + yNorm * 2.22;
      const radiusAtY = THREE.MathUtils.lerp(0.735, 0.994, (y + 1.24) / 2.4) + 0.006;
      const theta = rand() * Math.PI * 2;

      const isFrontEmblemZone =
        Math.sin(theta) > 0.48 && Math.abs(Math.cos(theta)) < 0.72 && Math.abs(y + 0.05) < 0.38;
      const sizeRoll = rand();
      // Fine photographic scale: tiny chilled mist beads + occasional elongated gravity tear-drop
      const baseRad = isFrontEmblemZone
        ? 0.0045 + rand() * 0.0075
        : sizeRoll > 0.9
          ? 0.012 + rand() * 0.0105
          : 0.005 + rand() * 0.0085;
      const gravityStretch = sizeRoll > 0.86 ? 1.38 + rand() * 0.58 : 1.02 + rand() * 0.18;

      dummy.position.set(Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY);
      dummy.lookAt(0, y, 0);
      dummy.scale.set(baseRad, baseRad * gravityStretch, baseRad * 0.55);
      dummy.updateMatrix();
      droplets.setMatrixAt(i, dummy.matrix);
    }
    droplets.instanceMatrix.needsUpdate = true;
    tagLayer(droplets, 'ppCup', '420+ Butir Embun Dingin 4 °C');
    group.add(droplets);
  }

  /** Layer 3: Full-Height Photorealistic Cold-Pressed Juice Core with Dynamic SSS & Pulp Suspension */
  private buildJuiceCore(): {
    pulpMesh: THREE.InstancedMesh;
    pulpMat: THREE.MeshStandardMaterial;
  } {
    const group = this.layers.juiceCore;

    // Fills realistically down to the clear bottom cup foot (matching real Tropisip photos!)
    const corePoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, -1.245),
      new THREE.Vector2(0.655, -1.245),
      new THREE.Vector2(0.695, -1.20),
      new THREE.Vector2(0.725, -1.04),
      new THREE.Vector2(0.822, -0.14),
      new THREE.Vector2(0.946, 0.96),
      new THREE.Vector2(0.935, 1.05),
      new THREE.Vector2(0.86, 1.075),
      new THREE.Vector2(0.42, 1.055),
      new THREE.Vector2(0.0, 1.062),
    ];

    const coreGeo = new THREE.LatheGeometry(corePoints, 72);
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: JUICE_VERTEX_SHADER,
      fragmentShader: JUICE_FRAGMENT_SHADER,
      uniforms: this.juiceUniforms,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    tagLayer(coreMesh, 'juiceCore', 'Inti Jus Buah Asli Berserat & Busa Segar');
    group.add(coreMesh);

    // 420 Instanced Fine Suspended Pulp Fibers orbiting just beneath wall (DynamicDrawUsage per threejs-animation)
    const pulpCount = 420;
    const pulpGeo = new THREE.IcosahedronGeometry(0.011, 0);
    const pulpMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(FLAVORS.mango.pulpHex),
      roughness: 0.46,
      metalness: 0.02,
    });
    const pulpMesh = new THREE.InstancedMesh(pulpGeo, pulpMat, pulpCount);
    pulpMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const rand = mulberry32(314159);

    for (let i = 0; i < pulpCount; i += 1) {
      const y = -1.12 + rand() * 2.1;
      const wallR = THREE.MathUtils.lerp(0.688, 0.942, (y + 1.24) / 2.3);
      const r = wallR * (0.96 + rand() * 0.045);
      const theta = rand() * Math.PI * 2;
      const basePos = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
      const scale = 0.5 + rand() * 0.95;

      this.pulpMeta.push({
        basePos,
        speed: 0.2 + rand() * 0.45,
        phase: rand() * Math.PI * 2,
        scale,
      });

      this.dummy.position.copy(basePos);
      this.dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      this.dummy.scale.set(scale * 1.45, scale * 0.65, scale * 0.65);
      this.dummy.updateMatrix();
      pulpMesh.setMatrixAt(i, this.dummy.matrix);
    }
    pulpMesh.instanceMatrix.needsUpdate = true;
    tagLayer(pulpMesh, 'juiceCore', 'Serat Daging Buah & Biji Mikro Alami');
    group.add(pulpMesh);

    return { pulpMesh, pulpMat };
  }

  /** Layer 4: Lazy-built Flavor-Adaptive Procedural Floating Fruit Chunks for all 6 Tropisip Flavors */
  public ensureFlavorChunksBuilt(id: FlavorId): void {
    if (this.chunkGroups[id]) return;

    const metaMap: Record<
      FlavorId,
      { geo: THREE.BufferGeometry; tint: number; roughness: number; count: number; feature: string; seed: number }
    > = {
      mango: { geo: this.chunkCubeGeo, tint: 0xffce1f, roughness: 0.24, count: 9, feature: 'Dadu Mangga Arumanis Juicy', seed: 772026 },
      avocado: { geo: this.chunkAvoGeo, tint: 0xb0d448, roughness: 0.36, count: 8, feature: 'Irisan Alpukat Mentega Segar', seed: 772127 },
      dragonfruit: { geo: this.chunkCubeGeo, tint: 0xf41c73, roughness: 0.25, count: 9, feature: 'Potongan Buah Naga Merah Berbiji', seed: 772228 },
      guava: { geo: this.chunkCubeGeo, tint: 0xf98f92, roughness: 0.32, count: 9, feature: 'Potongan Jambu Biji Merah', seed: 772329 },
      watermelon: { geo: this.chunkWatermelonGeo, tint: 0xff4c4c, roughness: 0.22, count: 8, feature: 'Potongan Segitiga Semangka Merah', seed: 772430 },
      melon: { geo: this.chunkCubeGeo, tint: 0xbae65c, roughness: 0.24, count: 9, feature: 'Dadu Melon Hijau Sky Rocket', seed: 772531 },
    };

    const cfg = metaMap[id];
    const rand = mulberry32(cfg.seed);
    const grp = new THREE.Group();
    const metas: FloatingChunkMeta[] = [];
    this.chunkGroups[id] = grp;
    this.chunkMetas[id] = metas;
    this.layers.fruitChunks.add(grp);

    const tex = createFruitFleshTexture(id);
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      bumpMap: tex,
      bumpScale: 0.012,
      color: cfg.tint,
      roughness: cfg.roughness,
      clearcoat: 0.78,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.35,
    });

    for (let i = 0; i < cfg.count; i += 1) {
      const angle = (i / cfg.count) * Math.PI * 2 + rand() * 0.35;
      const ringR = 0.28 + (i % 3) * 0.19;
      const y = 0.74 + (rand() - 0.5) * 0.34;
      const basePos = new THREE.Vector3(Math.cos(angle) * ringR, y, Math.sin(angle) * ringR);
      const radialDir = new THREE.Vector3(
        Math.cos(angle),
        (rand() - 0.35) * 0.55,
        Math.sin(angle),
      ).normalize();

      const mesh = new THREE.Mesh(cfg.geo, mat);
      mesh.position.copy(basePos);
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      mesh.scale.setScalar(0.8 + rand() * 0.34);
      tagLayer(mesh, 'fruitChunks', cfg.feature);
      grp.add(mesh);

      metas.push({
        mesh,
        basePos,
        radialDir,
        rotSpeed: new THREE.Vector3(
          (rand() - 0.5) * 0.5,
          (rand() - 0.5) * 0.6,
          (rand() - 0.5) * 0.4,
        ),
        phase: rand() * Math.PI * 2,
      });
    }

    grp.visible = id === this.currentFlavor;
  }

  private createSoftOrganicCube(w: number, h: number, d: number, jitter: number): THREE.BufferGeometry {
    const geo = new THREE.BoxGeometry(w, h, d, 5, 5, 5);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i);
      const len = v.length();
      const spherePush = v.clone().normalize().multiplyScalar((w + h + d) / 5.4);
      v.lerp(spherePush, 0.24);
      const wave = Math.sin(v.x * 26 + v.y * 19) * Math.cos(v.z * 23) * jitter * (0.4 + len);
      v.addScaledVector(v.clone().normalize(), wave);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private createAvocadoWedgeGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, -0.05);
    shape.quadraticCurveTo(0, 0.16, 0.19, -0.03);
    shape.quadraticCurveTo(0.05, -0.01, -0.04, -0.04);
    shape.quadraticCurveTo(-0.12, -0.07, -0.18, -0.05);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.026,
      bevelThickness: 0.026,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }

  private createWatermelonWedgeGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.17);
    shape.lineTo(0.18, -0.11);
    shape.quadraticCurveTo(0, -0.17, -0.18, -0.11);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }

  /** Layer 5: 28 Faceted Crushed Ice Crystals + 6 Veined Mint Leaves + 110 Organic Chia Seeds */
  private buildIceChiaMintInfusion(): void {
    const group = this.layers.iceInfusion;
    const rand = mulberry32(90512);

    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0xf7fcff,
      transparent: true,
      opacity: 0.54,
      roughness: 0.05,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 2.65,
      depthWrite: false,
    });

    const iceCount = 28;
    for (let i = 0; i < iceCount; i += 1) {
      const geo = new THREE.DodecahedronGeometry(0.105 + rand() * 0.068, 0);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j += 1) {
        const vx = pos.getX(j);
        const vy = pos.getY(j);
        const vz = pos.getZ(j);
        const facetWarp = 0.8 + Math.abs(Math.sin(vx * 18 + i) * Math.cos(vz * 15 - vy * 12)) * 0.38;
        pos.setXYZ(j, vx * facetWarp, vy * (0.76 + rand() * 0.26), vz * facetWarp);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, iceMat);
      const angle = (i / iceCount) * Math.PI * 2 + rand() * 0.4;
      const r = 0.16 + rand() * 0.54;
      const y = 0.32 + (rand() - 0.5) * 0.72;
      const basePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      mesh.position.copy(basePos);
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      tagLayer(mesh, 'iceInfusion', 'Kristal Es Serut Bening');
      group.add(mesh);

      this.iceMetas.push({
        mesh,
        basePos,
        radialDir: new THREE.Vector3(Math.cos(angle), (rand() - 0.5) * 0.5, Math.sin(angle)).normalize(),
        rotSpeed: new THREE.Vector3((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.4),
        phase: rand() * Math.PI * 2,
      });
    }

    const mintTex = createMintLeafTexture();
    const mintGeo = new THREE.PlaneGeometry(0.45, 0.64, 8, 12);
    const mPos = mintGeo.attributes.position;
    for (let i = 0; i < mPos.count; i += 1) {
      const x = mPos.getX(i);
      const y = mPos.getY(i);
      const zCurve = -Math.pow(y * 1.15, 2) * 0.22 + Math.abs(x) * 0.18;
      mPos.setZ(i, zCurve);
    }
    mintGeo.computeVertexNormals();

    const mintMat = new THREE.MeshStandardMaterial({
      map: mintTex,
      transparent: true,
      alphaTest: 0.35,
      roughness: 0.46,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2 + 0.4;
      const r = 0.46 + (i % 2) * 0.2;
      const y = 0.46 + ((i % 3) - 1) * 0.22;
      const basePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const leaf = new THREE.Mesh(mintGeo, mintMat);
      leaf.position.copy(basePos);
      leaf.rotation.set(0.55 + rand() * 0.5, angle + Math.PI * 0.5, (rand() - 0.5) * 0.7);
      leaf.scale.setScalar(0.75 + rand() * 0.26);
      tagLayer(leaf, 'iceInfusion', 'Daun Mint Kebun Segar');
      group.add(leaf);

      this.mintMetas.push({
        mesh: leaf,
        basePos,
        radialDir: new THREE.Vector3(Math.cos(angle), 0.18, Math.sin(angle)).normalize(),
        rotSpeed: new THREE.Vector3(0.15, 0.22, 0.12),
        phase: rand() * Math.PI * 2,
      });
    }

    const chiaCount = 110;
    const kernelGeo = new THREE.SphereGeometry(0.017, 8, 8);
    const kernelMat = new THREE.MeshStandardMaterial({
      color: 0x221f1c,
      roughness: 0.4,
    });
    const haloGeo = new THREE.SphereGeometry(0.034, 10, 10);
    const haloMat = new THREE.MeshPhysicalMaterial({
      color: 0xf7f5ec,
      transparent: true,
      opacity: 0.32,
      roughness: 0.08,
      clearcoat: 1.0,
      envMapIntensity: 1.9,
      depthWrite: false,
    });

    const kernels = new THREE.InstancedMesh(kernelGeo, kernelMat, chiaCount);
    const halos = new THREE.InstancedMesh(haloGeo, haloMat, chiaCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < chiaCount; i += 1) {
      const theta = rand() * Math.PI * 2;
      const r = 0.28 + rand() * 0.56;
      const y = -0.3 + rand() * 0.96;
      dummy.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      dummy.scale.set(0.85, 1.38, 0.72);
      dummy.updateMatrix();
      kernels.setMatrixAt(i, dummy.matrix);

      dummy.scale.setScalar(0.95 + rand() * 0.32);
      dummy.updateMatrix();
      halos.setMatrixAt(i, dummy.matrix);
    }
    kernels.instanceMatrix.needsUpdate = true;
    halos.instanceMatrix.needsUpdate = true;
    tagLayer(kernels, 'iceInfusion', 'Biji Chia Organik Terhidrasi');
    tagLayer(halos, 'iceInfusion', 'Lapisan Gel Hidrasi Biji Chia');
    this.chiaGroup.add(kernels, halos);
    group.add(this.chiaGroup);
  }

  /**
   * Layer 6: Photorealistic Clear Frosted PP Stepped Base Grip
   * (Replaces opaque white toy-like base with authentic clear chilled cup foot matching real photos!)
   */
  private buildClearTactileBaseGrip(): THREE.Mesh {
    const group = this.layers.baseGrip;

    const footPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, -1.325),
      new THREE.Vector2(0.56, -1.318),
      new THREE.Vector2(0.665, -1.30),
      new THREE.Vector2(0.695, -1.245),
      new THREE.Vector2(0.728, -1.04),
      new THREE.Vector2(0.715, -1.025),
    ];
    const footGeo = new THREE.LatheGeometry(footPoints, 72);
    const clearFootMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.34,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.98,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const footMesh = new THREE.Mesh(footGeo, clearFootMat);
    tagLayer(footMesh, 'baseGrip', 'Dasar Gelas PP Bening Berjenjang');
    group.add(footMesh);

    // Subtle refracted glass-bottom rim line
    const bottomRimGeo = new THREE.TorusGeometry(0.655, 0.015, 14, 72);
    bottomRimGeo.rotateX(Math.PI / 2);
    const bottomRimMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.46,
      roughness: 0.1,
      clearcoat: 1.0,
      envMapIntensity: 2.3,
    });
    const bottomRim = new THREE.Mesh(bottomRimGeo, bottomRimMat);
    bottomRim.position.y = -1.305;
    tagLayer(bottomRim, 'baseGrip', 'Cincin Dasar Kaca PP Bening');
    group.add(bottomRim);

    // Ultra-delicate translucent fluted tactile grip ridges molded into clear cup foot
    const ribCount = 28;
    const ribGeo = new THREE.CapsuleGeometry(0.011, 0.15, 6, 10);
    const ribMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.16,
      clearcoat: 1.0,
      envMapIntensity: 2.1,
      depthWrite: false,
    });
    const ribs = new THREE.InstancedMesh(ribGeo, ribMat, ribCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < ribCount; i += 1) {
      const theta = (i / ribCount) * Math.PI * 2;
      const r = 0.718;
      dummy.position.set(Math.cos(theta) * r, -1.16, Math.sin(theta) * r);
      dummy.rotation.set(0, -theta, 0.1);
      dummy.updateMatrix();
      ribs.setMatrixAt(i, dummy.matrix);
    }
    ribs.instanceMatrix.needsUpdate = true;
    tagLayer(ribs, 'baseGrip', '28 Alur Pegangan Bening Anti-Selip');
    group.add(ribs);

    // Soft studio ambient-occlusion contact shadow on warm Classic Linen floor
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(3.1, 3.1);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -1.39;
    this.root.add(shadowMesh);

    return shadowMesh;
  }

  public setFlavor(flavorId: FlavorId): void {
    this.ensureFlavorChunksBuilt(flavorId);
    this.currentFlavor = flavorId;
    const spec = FLAVORS[flavorId];
    this.targetBaseColor.set(spec.brightHex);
    this.targetDeepColor.set(spec.deepHex);
    this.targetSssColor.set(spec.sssHex);
    this.targetPulpColor.set(spec.pulpHex);
    this.targetFoamColor.set(spec.foamHex);
    this.targetPulpDensity = spec.pulpDensity;
    this.targetSssIntensity = spec.sssIntensity;
    this.targetSwirlStrength = spec.swirlStrength;
    this.targetSeedDensity = spec.seedDensity;
    this.targetFiberLength = spec.fiberLength;
  }

  public setSize(sizeId: CupSizeId): void {
    this.currentSize = sizeId;
  }

  /**
   * Snaps initial transforms to the exact starting Hero pose BEFORE frame 0 paints
   * so there is zero sideways jump or jarring pop-in on first load.
   */
  public snapToKinematics(kinematics: StageKinematics, reducedMotion = false): void {
    this.introElapsed = reducedMotion ? 1.0 : 0.0;
    const introEase = reducedMotion ? 1.0 : 0.0;
    const introScale = 0.94 + 0.06 * introEase;
    const sizeSpec = FLAVORS[this.currentFlavor].sizes[this.currentSize];
    this.currentScaleY = sizeSpec.cupScaleY;
    this.currentScaleXZ = sizeSpec.cupScaleXZ;

    this.root.position.set(
      kinematics.assemblyOffsetX,
      reducedMotion ? 0 : -0.18 * (1 - introEase),
      0,
    );
    this.root.rotation.set(
      kinematics.assemblyTiltX,
      kinematics.assemblyRotationY + (reducedMotion ? 0 : 0.22 * (1 - introEase)),
      0,
    );
    this.root.scale.set(
      this.currentScaleXZ * introScale,
      this.currentScaleY * introScale,
      this.currentScaleXZ * introScale,
    );

    (Object.keys(this.layers) as LayerKey[]).forEach((key) => {
      const grp = this.layers[key];
      const target = kinematics.layers[key];
      grp.position.y = target.offsetY;
      grp.rotation.y = target.rotationY;
      grp.rotation.z = target.tiltZ;
    });
  }

  public update(elapsed: number, dt: number, kinematics: StageKinematics, reducedMotion = false): void {
    const safeDt = Math.min(dt, 0.05);
    const smooth = 1 - Math.exp(-safeDt * 11.5);
    const animTime = reducedMotion ? 0 : elapsed;

    // Silky cubic-out entrance glide over 0.78s (zero snap, zero overshoot)
    this.introElapsed = reducedMotion ? 1.0 : Math.min(1.0, this.introElapsed + safeDt / 0.78);
    const introEase = 1 - Math.pow(1 - this.introElapsed, 3);
    const introScale = 0.94 + 0.06 * introEase;
    const introOffsetY = reducedMotion ? 0 : -0.18 * (1 - introEase);
    const introSpinY = reducedMotion ? 0 : 0.22 * (1 - introEase);

    this.juiceUniforms.uTime.value = animTime;
    this.juiceUniforms.uBaseColor.value.lerp(this.targetBaseColor, smooth);
    this.juiceUniforms.uDeepColor.value.lerp(this.targetDeepColor, smooth);
    this.juiceUniforms.uSssColor.value.lerp(this.targetSssColor, smooth);
    this.juiceUniforms.uPulpColor.value.lerp(this.targetPulpColor, smooth);
    this.juiceUniforms.uFoamColor.value.lerp(this.targetFoamColor, smooth);
    this.juiceUniforms.uPulpDensity.value = THREE.MathUtils.lerp(
      this.juiceUniforms.uPulpDensity.value,
      this.targetPulpDensity,
      smooth,
    );
    this.juiceUniforms.uSssIntensity.value = THREE.MathUtils.lerp(
      this.juiceUniforms.uSssIntensity.value,
      this.targetSssIntensity,
      smooth,
    );
    this.juiceUniforms.uSwirlStrength.value = THREE.MathUtils.lerp(
      this.juiceUniforms.uSwirlStrength.value,
      this.targetSwirlStrength,
      smooth,
    );
    this.juiceUniforms.uSeedDensity.value = THREE.MathUtils.lerp(
      this.juiceUniforms.uSeedDensity.value,
      this.targetSeedDensity,
      smooth,
    );
    this.juiceUniforms.uFiberLength.value = THREE.MathUtils.lerp(
      this.juiceUniforms.uFiberLength.value,
      this.targetFiberLength,
      smooth,
    );

    this.pulpParticlesMat.color.lerp(this.targetPulpColor, smooth);

    // Live 16oz / 22oz scaling combined with silky entrance scale
    const sizeSpec = FLAVORS[this.currentFlavor].sizes[this.currentSize];
    this.currentScaleY = THREE.MathUtils.lerp(this.currentScaleY, sizeSpec.cupScaleY, smooth);
    this.currentScaleXZ = THREE.MathUtils.lerp(this.currentScaleXZ, sizeSpec.cupScaleXZ, smooth);
    this.root.scale.set(
      this.currentScaleXZ * introScale,
      this.currentScaleY * introScale,
      this.currentScaleXZ * introScale,
    );

    // Global turntable + organic float + smooth entrance settle
    this.root.position.x = THREE.MathUtils.lerp(this.root.position.x, kinematics.assemblyOffsetX, smooth);
    this.root.position.y = (reducedMotion ? 0 : Math.sin(animTime * 1.15) * 0.036) + introOffsetY;
    const idleSway = reducedMotion ? 0 : Math.sin(animTime * 0.55) * 0.12 * introEase;
    this.root.rotation.y = kinematics.assemblyRotationY + idleSway + introSpinY;
    this.root.rotation.x = kinematics.assemblyTiltX;

    // Explode 6 botanical layers smoothly
    (Object.keys(this.layers) as LayerKey[]).forEach((key) => {
      const grp = this.layers[key];
      const target = kinematics.layers[key];
      grp.position.y = THREE.MathUtils.lerp(grp.position.y, target.offsetY, smooth);
      grp.rotation.y = THREE.MathUtils.lerp(grp.rotation.y, target.rotationY, smooth);
      grp.rotation.z = THREE.MathUtils.lerp(grp.rotation.z, target.tiltZ, smooth);
    });

    // Subtle internal pulp motion
    if (!reducedMotion) {
      for (let i = 0; i < this.pulpMeta.length; i += 1) {
        const m = this.pulpMeta[i];
        const bob = Math.sin(animTime * m.speed + m.phase) * 0.02;
        const angleDrift = animTime * 0.05 * m.speed;
        const cosA = Math.cos(angleDrift);
        const sinA = Math.sin(angleDrift);
        this.dummy.position.set(
          m.basePos.x * cosA - m.basePos.z * sinA,
          m.basePos.y + bob,
          m.basePos.x * sinA + m.basePos.z * cosA,
        );
        this.dummy.rotation.set(m.phase + animTime * 0.16, m.phase * 1.3, animTime * 0.12);
        const fiberStretch = 1.0 + this.juiceUniforms.uFiberLength.value * 1.05;
        this.dummy.scale.set(m.scale * fiberStretch, m.scale * 0.68, m.scale * 0.68);
        this.dummy.updateMatrix();
        this.pulpParticlesMesh.setMatrixAt(i, this.dummy.matrix);
      }
      this.pulpParticlesMesh.instanceMatrix.needsUpdate = true;
    }

    // Flavor-specific floating fruit chunks across all 6 flavors (only animate built chunks)
    const chunkSpread = kinematics.layers.fruitChunks.radialSpread;
    FLAVOR_ORDER.forEach((id) => {
      const grp = this.chunkGroups[id];
      const metas = this.chunkMetas[id];
      if (!grp || !metas) return;

      const goal = id === this.currentFlavor ? 1 : 0;
      this.chunkWeights[id] = THREE.MathUtils.lerp(this.chunkWeights[id], goal, smooth * 1.35);
      const w = this.chunkWeights[id];
      grp.visible = w > 0.02;
      if (!grp.visible) return;
      grp.scale.setScalar(0.35 + w * 0.65);

      for (let i = 0; i < metas.length; i += 1) {
        const m = metas[i];
        const bobY = reducedMotion ? 0 : Math.sin(animTime * 1.4 + m.phase) * 0.04;
        m.mesh.position
          .copy(m.basePos)
          .addScaledVector(m.radialDir, chunkSpread * 0.68);
        m.mesh.position.y += bobY;
        if (!reducedMotion) {
          m.mesh.rotation.x += m.rotSpeed.x * dt;
          m.mesh.rotation.y += m.rotSpeed.y * dt;
          m.mesh.rotation.z += m.rotSpeed.z * dt;
        }
      }
    });

    // Crushed ice, veined mint leaves, and hydrated organic chia
    const iceSpread = kinematics.layers.iceInfusion.radialSpread;
    for (let i = 0; i < this.iceMetas.length; i += 1) {
      const m = this.iceMetas[i];
      const bobY = reducedMotion ? 0 : Math.cos(animTime * 1.25 + m.phase) * 0.035;
      m.mesh.position
        .copy(m.basePos)
        .addScaledVector(m.radialDir, iceSpread * 0.56);
      m.mesh.position.y += bobY;
      if (!reducedMotion) {
        m.mesh.rotation.x += m.rotSpeed.x * dt;
        m.mesh.rotation.y += m.rotSpeed.y * dt;
      }
    }

    for (let i = 0; i < this.mintMetas.length; i += 1) {
      const m = this.mintMetas[i];
      const flutter = reducedMotion ? 0 : Math.sin(animTime * 1.6 + m.phase) * 0.038;
      m.mesh.position
        .copy(m.basePos)
        .addScaledVector(m.radialDir, iceSpread * 0.85);
      m.mesh.position.y += flutter;
      if (!reducedMotion) {
        m.mesh.rotation.z = Math.sin(animTime * 1.1 + m.phase) * 0.14;
      }
    }

    if (!reducedMotion) {
      this.chiaGroup.rotation.y = animTime * 0.18;
    }
    const chiaScale = 1 + iceSpread * 0.42;
    this.chiaGroup.scale.set(chiaScale, 1 + iceSpread * 0.15, chiaScale);

    // Contact shadow adapts cleanly during vertical explosion
    const shadowFade = 1 - kinematics.explodeFactor * 0.44;
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * shadowFade;
    this.shadowMesh.position.y = -1.41 - kinematics.explodeFactor * 1.32;
    this.shadowMesh.scale.setScalar(1 + kinematics.explodeFactor * 0.22);
  }
}

/**
 * Full recursive GPU disposal utility per threejs-animation skill:
 * disposes geometries, materials, and every attached texture map slot cleanly.
 */
export function disposeObjectTree(root: THREE.Object3D): void {
  const seenGeos = new Set<THREE.BufferGeometry>();
  const seenMats = new Set<THREE.Material>();
  const seenTexs = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && !seenGeos.has(mesh.geometry)) {
      seenGeos.add(mesh.geometry);
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (seenMats.has(m)) continue;
        seenMats.add(m);
        for (const value of Object.values(m)) {
          if (value && typeof value === 'object' && 'isTexture' in value) {
            const tex = value as THREE.Texture;
            if (!seenTexs.has(tex)) {
              seenTexs.add(tex);
              tex.dispose();
            }
          }
        }
        m.dispose();
      }
    }
  });
}
