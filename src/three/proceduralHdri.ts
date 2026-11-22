import * as THREE from 'three';

/**
 * Generates a 100% procedural sunlit tropical studio equirectangular HDRI
 * as a FloatType DataTexture processed via PMREMGenerator.
 *
 * Lighting signature:
 * - Warm Classic Linen studio cyclorama bounce below horizon (#FAF6ED / #EFE5D0)
 * - Golden overhead atrium skylight softbox for rich condensation & ice speculars
 * - Dual crisp daylight side rim panels to carve transparent PET dome & PP cup edges
 * - Subtle dappled botanical palm-canopy modulation in the upper hemisphere
 */
export function createSunlitStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const width = 512;
  const height = 256;
  const data = new Float32Array(width * height * 4);

  const smoothstep = (e0: number, e1: number, x: number): number => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1); // 0 = bottom (south pole), 1 = top (north pole) for DataTexture default flipY=false
    const phi = (1 - v) * Math.PI; // 0 = zenith, PI = nadir
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi); // +1 at zenith, -1 at nadir

    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const theta = (u - 0.5) * Math.PI * 2;

      const dx = sinPhi * Math.cos(theta);
      const dy = cosPhi;
      const dz = sinPhi * Math.sin(theta);

      // Base warm studio cyclorama: Classic Linen floor -> sunlit warm ivory horizon -> soft golden sky
      const upMix = smoothstep(-0.25, 0.75, dy);
      let r = 0.88 + upMix * 0.28;
      let g = 0.84 + upMix * 0.28;
      let b = 0.76 + upMix * 0.30;

      // Subtle dappled palm-canopy warmth in upper hemisphere (very gentle editorial modulation)
      if (dy > 0.1) {
        const canopyWave =
          Math.sin(theta * 5.0 + dy * 4.5) * 0.5 + Math.cos(theta * 9.0 - dy * 6.0) * 0.5;
        const canopyMask = smoothstep(0.15, 0.75, dy) * 0.08;
        r -= canopyMask * (0.22 + canopyWave * 0.15);
        g -= canopyMask * (0.08 + canopyWave * 0.1);
        b -= canopyMask * (0.28 + canopyWave * 0.14);
      }

      // 1. Overhead sunlit atrium softbox (warm golden key)
      const keyDirX = 0.42;
      const keyDirY = 0.78;
      const keyDirZ = 0.46;
      const keyDot = Math.max(0, dx * keyDirX + dy * keyDirY + dz * keyDirZ);
      const keySoftbox = smoothstep(0.76, 0.96, keyDot);
      const keyCore = Math.pow(keyDot, 22);
      r += keySoftbox * 4.8 + keyCore * 5.5;
      g += keySoftbox * 4.45 + keyCore * 5.0;
      b += keySoftbox * 3.75 + keyCore * 4.0;

      // 2. Crisp left vertical editorial strip softbox (carves left cup & droplet rim)
      const leftStripAz = Math.abs(theta + 1.95);
      const leftStrip =
        (1 - smoothstep(0.08, 0.34, leftStripAz)) *
        smoothstep(-0.18, 0.05, dy) *
        (1 - smoothstep(0.55, 0.82, dy));
      r += leftStrip * 3.4;
      g += leftStrip * 3.45;
      b += leftStrip * 3.35;

      // 3. Warm right rim strip (highlights translucent ice & fruit edges)
      const rightStripAz = Math.abs(theta - 1.72);
      const rightStrip =
        (1 - smoothstep(0.08, 0.32, rightStripAz)) *
        smoothstep(-0.1, 0.12, dy) *
        (1 - smoothstep(0.62, 0.85, dy));
      r += rightStrip * 3.9;
      g += rightStrip * 3.55;
      b += rightStrip * 2.85;

      // 4. Crisp overhead studio ring accent for domed lid specular crown
      const crownRing =
        smoothstep(0.72, 0.84, dy) * (1 - smoothstep(0.88, 0.97, dy)) * 1.45;
      r += crownRing * 1.05;
      g += crownRing * 1.02;
      b += crownRing * 0.95;

      // 5. Warm Classic Linen floor bounce
      const floorBounce = smoothstep(0.05, -0.55, dy);
      r = r * (1 - floorBounce * 0.25) + 0.96 * floorBounce * 0.25;
      g = g * (1 - floorBounce * 0.25) + 0.92 * floorBounce * 0.25;
      b = b * (1 - floorBounce * 0.25) + 0.84 * floorBounce * 0.25;

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 1.0;
    }
  }

  const equirect = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.LinearSRGBColorSpace;
  equirect.magFilter = THREE.LinearFilter;
  equirect.minFilter = THREE.LinearFilter;
  equirect.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(equirect);
  equirect.dispose();
  pmrem.dispose();

  return envRT.texture;
}
