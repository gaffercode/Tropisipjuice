# Architecture Decisions — Tropisip (`corporate/tropisip`)

This register records all verified architectural decisions evidenced in the capsule codebase and `.agents/DECISIONS.md`, along with open undecided items. No historical decisions prior to capsule creation (`2026-11-22`) exist or are fabricated.

## 1. Decision Register

### ADR-TROP-001 — 100% Procedural Runtime & Zero External Assets (2026-11-22)
- **Status:** Accepted & Implemented
- **Evidence:** `src/three/proceduralHdri.ts`, `src/three/proceduralTextures.ts`, `src/audio/foleyEngine.ts`, `src/main.tsx`, `tests/tropisip.test.ts`
- **Decision:** Generate all 3D geometry, studio HDRI lighting, cup emblem & fruit textures, and Web Audio foley procedurally in TypeScript/GLSL, and bundle `Poppins` + `JetBrains Mono` locally via `@fontsource/*`.
- **Trade-offs:** Eliminates third-party CDN failures, CORS/HDRI loading stalls, and external media bloat while keeping capsule extraction 100% offline-capable. Trade-off is a ~513 kB (131 kB gzip) `three` JS chunk and custom shader maintenance instead of artist-exported `.glb` files.

### ADR-TROP-002 — Photorealistic Clear PP Vessel & Custom GLSL Droplets Over Opaque Primitives (2026-11-22)
- **Status:** Accepted & Implemented
- **Evidence:** `src/three/cupAssembly.ts` (`JUICE_FRAGMENT_SHADER`, `DROPLET_FRAGMENT_SHADER`, `STUDIO_SPECULAR_SHELL_FRAGMENT`, `buildClearTactileBaseGrip`)
- **Decision:** Replace `MeshPhysicalMaterial` transmission passes on the cup wall and opaque white droplets/base with custom GLSL refractive dew droplets, a dual-softbox Fresnel reflection shell, domain-warped cellular fruit pulp + froth meniscus, vertical chocolate glaze wall-drizzles for Avocado, and a clear frosted fluted PP cup foot.
- **Trade-offs:** Works reliably across both the main camera and the secondary 2.6× `WebGLRenderTarget` macro pass without Three.js transmission-buffer exclusion artifacts, while matching the real product photography in `sources/`.

### ADR-TROP-003 — Official 6-Flavor Catalog Synced to Tropisip Menu Poster (2026-11-22)
- **Status:** Accepted & Implemented
- **Evidence:** `src/data/flavors.ts`, `src/components/NutritionSpecs.tsx`, `src/components/OrderCateringForm.tsx`, `tests/tropisip.test.ts`
- **Decision:** Expand live 3D flavors from 3 to all 6 official Tropisip poster variants (`Jus Mangga`, `Jus Alpukat`, `Jus Buah Naga`, `Jus Jambu`, `Jus Semangka`, `Jus Melon`) at uniform `Rp 7.000` (`16oz`) / `Rp 10.000` (`22oz`) pricing, rendered 100% in Bahasa Indonesia with witty brand slogans and bright Orange (`#FF6B1A`) + Cyan (`#00B5A3`) CTAs.
- **Trade-offs:** Higher initial procedural texture creation cost (6 Canvas2D 512×512 fruit textures generated once at mount) in exchange for instant flavor switching across the full real menu.

### ADR-TROP-004 — Ref-Driven Transient State & Zero-Allocation Render Loop (2026-11-22)
- **Status:** Accepted & Implemented
- **Evidence:** `src/App.tsx`, `src/components/StageCanvas.tsx`, `src/components/LayerRail.tsx`, `src/three/TropisipStage.ts`, `src/three/cupAssembly.ts`
- **Decision:** Keep continuous scroll progress and macro pointer coordinates outside React state (updating DOM `textContent`/`transform` directly via refs), eliminate redundant `requestAnimationFrame` loops, memoize leaf components with `React.memo`, and pre-allocate scratch `THREE.Vector3`/`THREE.Color` instances.
- **Trade-offs:** Slightly more imperative ref wiring in `App.tsx` and `StageCanvas.tsx` in exchange for eliminating 60–120Hz React re-renders during scroll and mouse movement.

### ADR-TROP-005 — Privacy Fence on `sources/` & Client-Side-Only Reservation Receipts (2026-11-22)
- **Status:** Accepted & Implemented
- **Evidence:** `.gitignore`, `src/lib/reservation.ts`, `tests/tropisip.test.ts`
- **Decision:** Keep local brand books/posters (`sources/`) gitignored and never embed the WhatsApp phone number shown on posters into tracked source files; enforce via automated regex test in `tests/tropisip.test.ts`.
- **Trade-offs:** Order/catering submissions produce local `TSIP-XXXXXX` receipts only until a human-approved production dispatch integration is configured.

## 2. Open & Undecided Architectural Questions

1. **Production Hosting & Order Dispatch Target:** No hosting provider (Vercel, Cloudflare Pages, Netlify) or backend/WhatsApp webhook is wired yet. If live WhatsApp handoff is desired later, the destination number should be injected via a build-time or runtime environment variable (e.g. `VITE_WA_NUMBER`) outside git.
2. **Capsule `lint` Contract Alignment:** `project.contract.json` currently declares `commands.lint.program: null` with a SAFRS `notApplicableReason`, which `srds_audit.py` flags as `INVALID_LIFECYCLE_COMMAND`. Adding a dedicated capsule-local linter (e.g. Biome) or script is an open R2 decision for Gaffer.
3. **Monorepo Router Registration:** `projects/corporate/AGENTS.md` and `projects/corporate/README.md` do not yet list `tropisip` as a registered child capsule, pending Gaffer's approval to register and commit this capsule.
