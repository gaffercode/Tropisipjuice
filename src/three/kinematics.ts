import type { LayerKey } from '../data/layers';

export interface LayerTransform {
  offsetY: number;
  radialSpread: number;
  rotationY: number;
  tiltZ: number;
}

export interface StageKinematics {
  scrollProgress: number;
  explodeFactor: number;
  activeLayerIndex: number; // -1 when hero or reassembled footer
  assemblyRotationY: number;
  assemblyTiltX: number;
  assemblyOffsetX: number;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  layers: Record<LayerKey, LayerTransform>;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Deterministic scroll-to-3D choreography:
 * - 0.00 -> 0.14: Hero (cup assembled, subtle floating spin, positioned slightly right on desktop)
 * - 0.14 -> 0.76: 6-Layer Botanical Explosion (smooth vertical separation + orbital spotlight)
 * - 0.76 -> 1.00: Reassembly for Nutrition Specs & Order/Catering Studio
 */
export function computeStageKinematics(
  rawScroll: number,
  isCompactViewport = false,
): StageKinematics {
  const s = clamp01(rawScroll);

  // Ramp up explosion entering Chapter 1, hold cleanly through Chapter 6, reassemble for Specs
  const explodeIn = smoothstep(0.11, 0.24, s);
  const explodeOut = 1 - smoothstep(0.73, 0.84, s);
  const explodeFactor = clamp01(explodeIn * explodeOut);

  // Determine which of the 6 layers is currently spotlighted
  let activeLayerIndex = -1;
  if (s >= 0.14 && s <= 0.77) {
    const normalizedLayerScroll = clamp01((s - 0.15) / (0.76 - 0.15));
    activeLayerIndex = Math.min(5, Math.floor(normalizedLayerScroll * 6));
  }

  // Smooth horizontal staging so the 3D cup breathes cleanly opposite editorial cards
  // Hero: clear right gallery slot. Chapters alternate opposite left/right cards. Specs/Order: left showcase.
  let desktopOffsetX = 1.28;
  if (s < 0.14) {
    desktopOffsetX = lerp(1.28, 1.18, smoothstep(0.0, 0.14, s));
  } else if (s < 0.76) {
    const chapterPhase = clamp01((s - 0.14) / 0.62) * 5;
    const wave = Math.cos(chapterPhase * Math.PI); // +1 when card is left -> cup right; -1 when card is right -> cup left
    desktopOffsetX = wave * 1.15;
  } else {
    desktopOffsetX = lerp(-1.15, -1.42, smoothstep(0.76, 0.88, s));
  }

  const assemblyOffsetX = isCompactViewport ? 0 : desktopOffsetX;

  // Vertical explode offsets for the 6 distinct architectural layers
  const nz = (v: number): number => (v === 0 ? 0 : v);
  const layers: Record<LayerKey, LayerTransform> = {
    domedLid: {
      offsetY: nz(1.52 * explodeFactor),
      radialSpread: 0,
      rotationY: nz(0.22 * explodeFactor),
      tiltZ: nz(-0.045 * explodeFactor),
    },
    ppCup: {
      offsetY: nz(0.38 * explodeFactor),
      radialSpread: 0,
      rotationY: nz(-0.12 * explodeFactor),
      tiltZ: nz(0.015 * explodeFactor),
    },
    juiceCore: {
      offsetY: nz(-0.12 * explodeFactor),
      radialSpread: 0,
      rotationY: nz(0.14 * explodeFactor),
      tiltZ: 0,
    },
    fruitChunks: {
      offsetY: nz(0.74 * explodeFactor),
      radialSpread: nz(1.0 * explodeFactor),
      rotationY: nz(0.75 * explodeFactor),
      tiltZ: nz(0.035 * explodeFactor),
    },
    iceInfusion: {
      offsetY: nz(-0.74 * explodeFactor),
      radialSpread: nz(0.86 * explodeFactor),
      rotationY: nz(-0.62 * explodeFactor),
      tiltZ: nz(-0.025 * explodeFactor),
    },
    baseGrip: {
      offsetY: nz(-1.38 * explodeFactor),
      radialSpread: 0,
      rotationY: nz(0.18 * explodeFactor),
      tiltZ: nz(0.015 * explodeFactor),
    },
  };

  // Focus camera gently along Y as user descends from Domed Lid down to Tactile Base Grip
  const verticalScan =
    s >= 0.14 && s <= 0.78
      ? lerp(0.82, -0.74, smoothstep(0.16, 0.74, s)) * explodeFactor
      : 0.24;

  // Generous gallery camera distance so domed lid & straw never clip behind top navigation bar
  const baseZ = isCompactViewport ? 8.6 : 7.55;
  const explodedZ = isCompactViewport ? 10.2 : 9.35;
  const cameraZ = lerp(baseZ, explodedZ, explodeFactor);
  const cameraY = lerp(0.42, 0.26 + verticalScan * 0.42, explodeFactor);
  const cameraX = Math.sin(s * Math.PI * 1.4) * (isCompactViewport ? 0.18 : 0.28);

  // Start dead-center facing +Z so the Tropisip emblem greets visitors in the Hero,
  // then rotate gracefully across the 6-layer showcase and return front-facing in Specs/Order
  const assemblyRotationY = s * Math.PI * 2.0;
  const assemblyTiltX = lerp(0.06, 0.12, explodeFactor) - smoothstep(0.78, 1.0, s) * 0.04;

  return {
    scrollProgress: s,
    explodeFactor,
    activeLayerIndex,
    assemblyRotationY,
    assemblyTiltX,
    assemblyOffsetX,
    cameraPos: [cameraX, cameraY, cameraZ],
    cameraTarget: [0, verticalScan * 0.68, 0],
    layers,
  };
}
