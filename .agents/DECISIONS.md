# DECISIONS — corporate/tropisip

## 2026-11-22 — 100% Procedural Zero-External-Asset Architecture
- **Decision**: Bundle `@fontsource/poppins` and `@fontsource/jetbrains-mono` locally and generate all 3D geometry, sunlit studio HDRI (`FloatType` `DataTexture` → `PMREMGenerator`), silkscreen Tropisip emblem & fruit textures, and Web Audio ASMR foley procedurally at runtime.
- **Rationale**: Satisfies strict zero-external-asset requirement, works offline with zero CDN dependency, and keeps capsule extraction 100% self-contained.
- **Privacy**: Local `sources/` folder (containing posters with a phone number) is excluded via `.gitignore` and verified absent from `src/` by automated Vitest compliance checks.
