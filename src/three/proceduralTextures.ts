import * as THREE from 'three';
import type { FlavorId } from '../data/flavors';

/** Deterministic PRNG (Mulberry32) so procedural textures are crisp and reproducible */
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

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, ry);
  ctx.bezierCurveTo(rx * 1.15, ry * 0.35, rx * 1.0, -ry * 0.65, 0, -ry);
  ctx.bezierCurveTo(-rx * 1.0, -ry * 0.65, -rx * 1.15, ry * 0.35, 0, ry);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(250, 246, 237, 0.34)';
  ctx.lineWidth = Math.max(2, rx * 0.09);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, ry * 0.72);
  ctx.quadraticCurveTo(rx * 0.08, 0, 0, -ry * 0.62);
  ctx.stroke();
  ctx.restore();
}

/**
 * Generates the authentic Brunswick Green (#0C4B2A) Tropisip silkscreen emblem
 * mapped cleanly onto the front face of the clear PP cup.
 */
export function createCupEmblemTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.51;
  const ink = '#0A3E22';

  // Sprouting botanical leaves crowning the upper right of "tropisip"
  drawLeaf(ctx, cx + 124, cy - 110, 20, 42, -0.58, ink);
  drawLeaf(ctx, cx + 170, cy - 125, 25, 55, 0.24, ink);
  drawLeaf(ctx, cx + 216, cy - 90, 16, 34, 0.92, ink);

  // Bold rounded lowercase "tropisip" wordmark
  ctx.save();
  ctx.fillStyle = ink;
  ctx.font = '800 166px "Poppins", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '-4px';
  ctx.fillText('tropisip', cx, cy + 4);
  ctx.restore();

  // Signature curved smile arc underneath wordmark
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 196, cy + 88);
  ctx.quadraticCurveTo(cx, cy + 68, cx + 196, cy + 88);
  ctx.stroke();

  const drawDrop = (x: number, y: number, r: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.45, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawDrop(cx - 236, cy + 104, 9.5, 0.42);
  drawDrop(cx - 220, cy + 126, 7, -0.35);
  drawDrop(cx + 236, cy + 104, 9.5, -0.42);
  drawDrop(cx + 220, cy + 126, 7, 0.35);
  ctx.restore();

  // Curved "GOOD JUICE, GOOD VIBES" tagline underneath arc
  const slogan = 'GOOD JUICE, GOOD VIBES';
  ctx.save();
  ctx.fillStyle = ink;
  ctx.font = '700 29px "Poppins", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const radius = 920;
  const arcCenterY = cy - 782;
  const totalAngle = 0.42;
  const startAngle = Math.PI * 0.5 + totalAngle * 0.5;
  const step = totalAngle / Math.max(1, slogan.length - 1);

  for (let i = 0; i < slogan.length; i += 1) {
    const angle = startAngle - i * step;
    const x = cx + Math.cos(angle) * radius;
    const y = arcCenterY + Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle - Math.PI * 0.5);
    ctx.fillText(slogan[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Subtle back-side Indonesian fresh batch stamp
  const backX = width * 0.03;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 62, 34, 0.58)';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('100% BUAH SEGAR · TANPA PENGAWET', backX, cy - 16);
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText('PERAS DINGIN HARIAN · SAJIKAN 4 °C', backX, cy + 18);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates ultra-fine chilled PP cup condensation frost roughness & micro-bead bump maps
 * so the cup wall reads like real cold photography rather than flat plastic.
 */
export function createCondensationMaps(): {
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (rCtx && bCtx) {
    const rand = mulberry32(41802026);

    const grad = rCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0.0, 'rgb(34, 34, 34)');
    grad.addColorStop(0.16, 'rgb(88, 88, 88)');
    grad.addColorStop(0.55, 'rgb(132, 132, 132)');
    grad.addColorStop(0.92, 'rgb(118, 118, 118)');
    grad.addColorStop(1.0, 'rgb(52, 52, 52)');
    rCtx.fillStyle = grad;
    rCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = 'rgb(120, 120, 120)';
    bCtx.fillRect(0, 0, size, size);

    // Dense fine mist micro-condensation (9,000 tiny chilled dew dots)
    for (let i = 0; i < 9000; i += 1) {
      const x = rand() * size;
      const y = (0.08 + rand() * 0.88) * size;
      const rad = 0.6 + rand() * 2.1;

      const rShade = Math.floor(105 + rand() * 70);
      rCtx.fillStyle = `rgba(${rShade}, ${rShade}, ${rShade}, 0.28)`;
      rCtx.beginPath();
      rCtx.arc(x, y, rad, 0, Math.PI * 2);
      rCtx.fill();

      const bShade = Math.floor(155 + rand() * 85);
      bCtx.fillStyle = `rgba(${bShade}, ${bShade}, ${bShade}, 0.42)`;
      bCtx.beginPath();
      bCtx.arc(x, y, rad * 0.9, 0, Math.PI * 2);
      bCtx.fill();
    }

    // Fine realistic downward condensation drip trails
    for (let i = 0; i < 340; i += 1) {
      const x = rand() * size;
      const y = (0.14 + rand() * 0.78) * size;
      const rad = 1.6 + rand() * 4.8;
      const elongated = rand() > 0.68;

      if (elongated) {
        const trailLen = 32 + rand() * 110;
        const trailGrad = rCtx.createLinearGradient(x, y - trailLen, x, y);
        trailGrad.addColorStop(0, 'rgba(20, 20, 20, 0.0)');
        trailGrad.addColorStop(1, 'rgba(14, 14, 14, 0.82)');
        rCtx.strokeStyle = trailGrad;
        rCtx.lineWidth = rad * 0.95;
        rCtx.lineCap = 'round';
        rCtx.beginPath();
        rCtx.moveTo(x + (rand() - 0.5) * 3, y - trailLen);
        rCtx.lineTo(x, y);
        rCtx.stroke();
      }

      rCtx.fillStyle = 'rgba(10, 10, 10, 0.92)';
      rCtx.beginPath();
      rCtx.ellipse(x, y, rad, rad * (elongated ? 1.5 : 1.08), 0, 0, Math.PI * 2);
      rCtx.fill();

      const bumpGrad = bCtx.createRadialGradient(x, y, 0, x, y, rad * 1.15);
      bumpGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      bumpGrad.addColorStop(0.65, 'rgba(210, 210, 210, 0.65)');
      bumpGrad.addColorStop(1, 'rgba(120, 120, 120, 0.0)');
      bCtx.fillStyle = bumpGrad;
      bCtx.beginPath();
      bCtx.ellipse(x, y, rad * 1.15, rad * (elongated ? 1.55 : 1.12), 0, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.needsUpdate = true;

  return { roughnessMap, bumpMap };
}

/**
 * Generates realistic cellular fruit flesh textures for all 6 Tropisip flavors.
 */
export function createFruitFleshTexture(flavorId: FlavorId): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const seedMap: Record<FlavorId, number> = {
      mango: 101,
      avocado: 202,
      dragonfruit: 303,
      guava: 404,
      watermelon: 505,
      melon: 606,
    };
    const rand = mulberry32(seedMap[flavorId]);

    if (flavorId === 'mango') {
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#FFD426');
      grad.addColorStop(0.5, '#FFB800');
      grad.addColorStop(1, '#F28B00');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 850; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        const len = 18 + rand() * 64;
        ctx.strokeStyle =
          rand() > 0.45 ? 'rgba(255, 240, 165, 0.36)' : 'rgba(218, 108, 0, 0.25)';
        ctx.lineWidth = 1 + rand() * 2.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len * 0.2, y + len);
        ctx.stroke();
      }
    } else if (flavorId === 'dragonfruit') {
      const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 18, size * 0.5, size * 0.5, size * 0.72);
      grad.addColorStop(0, '#F51873');
      grad.addColorStop(0.65, '#DE0E63');
      grad.addColorStop(1, '#9E0548');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 520; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle = 'rgba(255, 160, 200, 0.16)';
        ctx.beginPath();
        ctx.arc(x, y, 2 + rand() * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 360; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        const rx = 2.0 + rand() * 1.8;
        const ry = rx * 1.65;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * Math.PI);
        ctx.fillStyle = '#180710';
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 235, 244, 0.52)';
        ctx.beginPath();
        ctx.arc(-rx * 0.28, -ry * 0.28, rx * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (flavorId === 'avocado') {
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#E8F296');
      grad.addColorStop(0.55, '#B2D44C');
      grad.addColorStop(0.86, '#7DA329');
      grad.addColorStop(1, '#315A1C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 750; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle =
          rand() > 0.5 ? 'rgba(248, 252, 208, 0.18)' : 'rgba(68, 102, 22, 0.12)';
        ctx.beginPath();
        ctx.arc(x, y, 2 + rand() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (flavorId === 'guava') {
      const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 20, size * 0.5, size * 0.5, size * 0.72);
      grad.addColorStop(0, '#FA9FA2');
      grad.addColorStop(0.7, '#F07A7E');
      grad.addColorStop(1, '#D45A62');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Soft guava flesh grain + pale golden seeds
      for (let i = 0; i < 650; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle =
          rand() > 0.88 ? 'rgba(245, 225, 168, 0.72)' : 'rgba(255, 212, 214, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + rand() * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (flavorId === 'watermelon') {
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#FF4747');
      grad.addColorStop(0.72, '#EB3236');
      grad.addColorStop(0.88, '#F6F4E6');
      grad.addColorStop(1, '#2D7336');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Juicy crystalline watermelon cells
      for (let i = 0; i < 950; i += 1) {
        const x = rand() * size;
        const y = rand() * size * 0.78;
        ctx.fillStyle =
          rand() > 0.5 ? 'rgba(255, 152, 145, 0.22)' : 'rgba(176, 18, 28, 0.18)';
        ctx.beginPath();
        ctx.arc(x, y, 1.4 + rand() * 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp dark watermelon pips
      for (let i = 0; i < 42; i += 1) {
        const x = rand() * size;
        const y = rand() * size * 0.62;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * Math.PI);
        ctx.fillStyle = '#241414';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Melon Sky Rocket: bright translucent spring-green flesh
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#DAF79C');
      grad.addColorStop(0.6, '#B4E058');
      grad.addColorStop(1, '#84BA32');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 820; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        ctx.fillStyle =
          rand() > 0.5 ? 'rgba(244, 255, 212, 0.26)' : 'rgba(104, 152, 34, 0.16)';
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + rand() * 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a realistic botanical mint leaf albedo + alpha texture with fine venation.
 */
export function createMintLeafTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const cx = size * 0.5;

    const leafGrad = ctx.createLinearGradient(cx, size * 0.92, cx, size * 0.08);
    leafGrad.addColorStop(0, '#1A693C');
    leafGrad.addColorStop(0.5, '#2E9153');
    leafGrad.addColorStop(1, '#5FBC72');

    ctx.fillStyle = leafGrad;
    ctx.beginPath();
    ctx.moveTo(cx, size * 0.94);
    ctx.bezierCurveTo(size * 0.88, size * 0.72, size * 0.86, size * 0.28, cx, size * 0.06);
    ctx.bezierCurveTo(size * 0.14, size * 0.28, size * 0.12, size * 0.72, cx, size * 0.94);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(222, 245, 200, 0.74)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, size * 0.92);
    ctx.lineTo(cx, size * 0.12);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(208, 236, 185, 0.56)';
    for (let i = 0; i < 7; i += 1) {
      const yStart = size * (0.82 - i * 0.1);
      const span = size * (0.29 - Math.abs(i - 2.6) * 0.055);
      const yEnd = yStart - size * 0.11;

      ctx.beginPath();
      ctx.moveTo(cx, yStart);
      ctx.quadraticCurveTo(cx + span * 0.55, yStart - 16, cx + span, yEnd);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, yStart);
      ctx.quadraticCurveTo(cx - span * 0.55, yStart - 16, cx - span, yEnd);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a realistic soft studio contact shadow + subtle colored caustic tint ground disc.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(22, 38, 26, 0.36)');
    grad.addColorStop(0.36, 'rgba(34, 48, 36, 0.20)');
    grad.addColorStop(0.72, 'rgba(92, 78, 54, 0.06)');
    grad.addColorStop(1, 'rgba(250, 246, 237, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
