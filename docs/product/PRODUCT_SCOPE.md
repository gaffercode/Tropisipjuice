# Product Scope — Tropisip (`corporate/tropisip`)

## 1. Product Purpose & Problem Solved

Tropisip ("Good Juice, Good Vibes") is a fresh Indonesian fruit juice brand offering 100% real-fruit beverages without preservatives at accessible daily pricing (`Rp 7.000` for `16oz`, `Rp 10.000` for `22oz`). Generic static menus fail to convey freshness, fruit fiber density, cold condensation, or playful brand personality, while video-heavy sites bloat download size and break offline or on constrained connections.

This capsule solves that problem with a **100% procedural, zero-external-asset 3D editorial web showcase** in Bahasa Indonesia (`index.html` `lang="id"`). Visitors interactively inspect six real beverage layers, morph all six official menu variants live in 3D, magnify fruit pulp and condensation through a true 2.6× WebGL optical macro lens, listen to procedural Web Audio ASMR foley while scrolling, compare nutrition facts across `16oz` and `22oz`, and compose validated single-cup or `25+` cup event catering reservations.

## 2. Users & Operators

| Role | Goals | Primary Surfaces |
|---|---|---|
| Retail Beverage Visitor | Explore all 6 Tropisip flavors, inspect texture/freshness, verify nutrition & Rp 7.000/10.000 pricing, prepare a quick cup order | Hero 6-flavor switcher, 6-layer scroll anatomy, `#specs`, `#order` (`Pesan Satuan`) |
| Event / Office Catering Planner | Plan 25–300 cup bundles, verify 5%/8% automatic catering savings and 50+ cup complimentary chilled bar cooler eligibility, generate a reservation summary code | `#order` (`Katering Acara (25+)`, deterministic `TSIP-XXXXXX` receipt) |
| Capsule Maintainer / Designer | Update menu pricing, flavor shader profiles, Bahasa Indonesia slogans, or build/verify static `dist/` bundles for hosting | `src/data/flavors.ts`, `src/three/`, `src/styles/editorial.css`, `pnpm run build` |
| Human Owner (Gaffer) | Approve pricing/brand changes, R2 contract/dependency updates, merges, and live R3 hosting deployments | `project.contract.json`, `.agents/HANDOFF.md`, release approvals |

## 3. Implemented Product Workflows

1. **Live 6-Flavor 3D Showcase (`src/data/flavors.ts`, `src/three/cupAssembly.ts`):**
   - Official menu synced to the local Tropisip poster: **Jus Mangga**, **Jus Alpukat** (with signature vertical chocolate glaze wall-drizzles), **Jus Buah Naga**, **Jus Jambu**, **Jus Semangka**, and **Jus Melon**.
   - Switching flavors smoothly morphs GLSL juice colors, subsurface scattering, pulp fiber/seed/drizzle parameters, floating fruit chunk geometry (cubes, avocado crescents, watermelon wedges), sunlit backdrop washes, and all nutrition/pricing panels.
2. **6-Layer Lenis Scroll Deconstruction (`src/data/layers.ts`, `src/three/kinematics.ts`):**
   - Smooth scroll explodes the assembled cup vertically into: `01 Tutup Dome & Sedotan`, `02 Gelas PP Berembun Dingin`, `03 Inti Jus Buah Peras Dingin`, `04 Potongan Buah Segar Asli`, `05 Es Kristal, Mint & Biji Chia`, and `06 Dasar Gelas Berulir Bening`, then reassembles cleanly for `#specs` and `#order`.
3. **2.6× Optical Macro Inspection (`src/three/TropisipStage.ts`, `src/components/StageCanvas.tsx`):**
   - Activated via `MAKRO 2,6×` or keyboard shortcut `M` (`Esc` to close). Renders a dedicated secondary WebGL camera (`2.6×` magnification) into a `384×384` offscreen render target tracked via pointer raycasting.
4. **Opt-In Procedural ASMR Foley (`src/audio/foleyEngine.ts`):**
   - Activated via the `ASMR` header pill. Synthesizes scroll-velocity-modulated cold juice pour noise, micro-bubble pops, crystal ice clinks, and lid snaps strictly via Web Audio API.
5. **Nutrition Specs (`16oz / 22oz`) & Order/Catering Reservation (`src/components/NutritionSpecs.tsx`, `src/components/OrderCateringForm.tsx`, `src/lib/reservation.ts`):**
   - Toggling `16oz (473ml)` vs `22oz (650ml)` updates pricing (`Rp 7.000` / `Rp 10.000`), fruit weight, calories, Vitamin C, fiber, potassium, AND scales the 3D cup live.
   - Reservation form validates name, email, date, and minimum quantities (`>=1` quick, `>=25` catering), computes optional `+Rp 1.500/cup` chia-mint add-on and 5%/8% catering discounts, and emits a deterministic `TSIP-XXXXXX` confirmation receipt.

## 4. Boundaries, Non-Goals & Known Limitations

- **Client-Side-Only Reservation:** Submitting `#order` generates an on-screen confirmation receipt (`TSIP-XXXXXX`) only; it does **not** send emails, store orders in a database, trigger WhatsApp messages, or process payments.
- **No Hardcoded Contact Number:** Although local reference posters in gitignored `sources/` show a WhatsApp number, embedding personal numbers in tracked source is prohibited by SAFRS `BOUNDARIES.md`. Any future WhatsApp dispatch link must be configured explicitly via runtime environment variables at deployment time.
- **WebGL Hardware Requirement:** Full 3D rendering requires browser WebGL support. When WebGL initialization fails, `StageCanvas.tsx` surfaces a non-blocking Bahasa Indonesia fallback notice while keeping all editorial copy, specs, and order forms usable.
- **Audio Autoplay Constraint:** Browsers block Web Audio until a user gesture occurs; ASMR foley intentionally defaults to OFF until toggled by the visitor.
- **Mobile Viewport Simplification:** Below `1180px` / `1120px`, the top navbar flavor pills and right-hand `ANATOMI` rail hide to preserve readable content width; visitors switch flavors via the Hero card, `#specs`, or `#order`.
