# Changelog — Tropisip (`corporate/tropisip`)

All verified milestones for the `corporate/tropisip` capsule are recorded below. No unverified or pre-capsule releases are invented.

## [1.0.0] — 2026-11-22 (Local Verified Capsule)

### Added
- Sovereign capsule scaffolding (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `project.contract.json`, `scripts/deploy-dry-run.mjs`, `.gitignore` fencing `sources/`).
- 100% procedural Three.js WebGL studio (`src/three/proceduralHdri.ts`, `src/three/proceduralTextures.ts`, `src/three/cupAssembly.ts`, `src/three/kinematics.ts`, `src/three/TropisipStage.ts`) featuring sunlit studio HDRI, 6 Lenis scroll-exploded botanical layers, custom GLSL fruit pulp + subsurface scattering + froth meniscus + refractive condensation droplets + clear frosted fluted PP cup base, and a 2.6× WebGL optical macro lens.
- Full 6-product official Tropisip menu synced to the local poster (`Jus Mangga`, `Jus Alpukat` with vertical chocolate wall-drizzles, `Jus Buah Naga`, `Jus Jambu`, `Jus Semangka`, `Jus Melon`) at uniform `Rp 7.000` (`16oz`) / `Rp 10.000` (`22oz`) pricing.
- Procedural Web Audio API ASMR foley synthesizer (`src/audio/foleyEngine.ts`) for scroll-reactive cold juice pour, bubble pops, and crystal ice clinks.
- 100% Bahasa Indonesia editorial UI (`src/App.tsx`, `src/components/*`, `src/styles/editorial.css`) with witty Tropisip slogans, vibrant Orange (`#FF6B1A`) & Cyan (`#00B5A3`) CTAs, translucent frosted-linen nutrition/pricing sheet, validated quick-order & 25+ cup catering reservation form (`TSIP-XXXXXX`), and footer credit (`Website built & animated by dr. Novia DA · Sentra Mitra Design`).
- Automated Vitest suite (`tests/tropisip.test.ts`, 8/8 tests) covering 6-flavor pricing, 6-layer scroll kinematics, order/catering calculations & validation, zero external asset URLs, and zero PII/phone number leaks.
- Full SRDS-FULL v1.2 documentation suite (`docs/**`, `docs/documentation.manifest.json`, `README.md`, `AGENTS.md`).

### Changed
- Applied `/react-best-practices` performance refactor: eliminated 60–120Hz React re-renders on `pointermove` and `scroll` via DOM refs, removed duplicate RAF loop, pre-allocated Three.js scratch vectors for zero per-frame heap allocations, added `LAYER_BY_KEY` O(1) lookup, memoized leaf components, and removed all dead TypeScript fields and unused CSS rules/custom properties.
