# Testing Strategy — Tropisip (`corporate/tropisip`)

## 1. Test Taxonomy & Actual Inventory

All automated tests run via **Vitest 3.2.7** in the `node` environment (`vitest.config.ts`) with zero external services, mocks of remote APIs, or real user data.

### Automated Suite: `tests/tropisip.test.ts` (`8` tests across `4` describe blocks)

| Suite | Tests | Source Under Test | What It Proves |
|---|---|---|---|
| `Katalog 6 Produk Resmi Tropisip & Slogan Lucu` | 2 | `src/data/flavors.ts` | Exact 6-flavor order (`mango`, `avocado`, `dragonfruit`, `guava`, `watermelon`, `melon`), exact brand hexes (`#FFB800`, `#E83F5B`, `#6B8E23`), >=4 funny slogans, uniform `16oz Rp 7.000` / `22oz Rp 10.000` pricing, volume/cup scale monotonicity, and `formatIdr` formatting |
| `Kinematika Ledakan 6 Lapisan Botanikal` | 2 | `src/data/layers.ts`, `src/three/kinematics.ts` | Exact 6 layer keys, assembled Hero (`explodeFactor === 0`, canonical `+0` offsets), deterministic top-to-bottom mid-scroll explosion (`domedLid > ppCup > juiceCore > baseGrip`), and clean reassembly at `#specs`/`#order` (`t = 0.92`) |
| `Kalkulator Pesan Cepat & Katering Acara` | 3 | `src/lib/reservation.ts` | Accurate `16oz` quick-order subtotals + `+Rp 1.500/cup` chia-mint add-on, 8% catering discount & chilled cooler perk at `50+` cups (`22oz`), Bahasa Indonesia field validation (`customerName`, `contactEmail`, `>=25` catering minimum), and deterministic `TSIP-XXXXXX` code generation |
| `Audit 100% Prosedural, Nol Aset Eksternal & Nol PII` | 1 | `index.html`, all files in `src/` | Recursively scans `index.html` and every `src/**/*` file to guarantee **zero** external `http(s)://` URLs (excluding W3C SVG namespace), **zero** Indonesian phone number patterns (`+62...`), and `lang="id"` HTML attribute |

## 2. Additional Verification Layers

- **Static Type Safety:** `pnpm run typecheck` (`tsc --noEmit` with `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- **Build & Artifact Gate:** `pnpm run build` + `pnpm run deploy:dry-run` validates bundling, font asset emission, and `dist/index.html` integrity.
- **Manual / Browser Visual & Interactive Audit:** Executed against `pnpm run preview` (`http://127.0.0.1:4180/`) at `1440×900` checking WebGL2 rendering, all 6 flavor transitions, 6-layer vertical explosion, 2.6× optical macro loupe z-index & tracking, Web Audio ASMR toggle, `16oz`/`22oz` specs toggle, order/catering form submission, `0` console/page errors, and `0` external network requests.

## 3. Reproduction & Safe Test Fixtures

```bash
cd projects/corporate/tropisip
pnpm run test
```

All test drafts in `tests/tropisip.test.ts` use synthetic fixture values (`Nadia Studio`, `nadia@contoh.id`, `2026-12-01`). Never put real customer emails, real phone numbers, or production identifiers into test fixtures.

## 4. Known Coverage Gaps

The following areas are **not** currently covered by automated headless CI tests and must be accounted for during human review:

1. **WebGL Shader Compilation & GPU Visual Regression:** Vitest runs in `node` without a WebGL2 context; GLSL shader compilation (`JUICE_FRAGMENT_SHADER`, `DROPLET_FRAGMENT_SHADER`, `STUDIO_SPECULAR_SHELL_FRAGMENT`) and visual fidelity are verified via live browser inspection rather than automated Playwright visual diffs.
2. **React DOM Component Interaction Tests:** No `@testing-library/react` or Playwright E2E suite is installed in `package.json`; form DOM interactions, Lenis smooth scrolling, and keyboard shortcuts (`M`/`Escape`) are verified manually in the browser.
3. **Web Audio Acoustic Output:** Browser audit verifies `AudioContext` initialization and zero runtime errors on toggle, but actual audible output quality requires human listening verification.
4. **Mobile Touch & Small-Viewport Audit:** Live browser checks were conducted at desktop `1440×900`; physical mobile touch scrolling and loupe ergonomics remain untested on real devices.
