# Verification Evidence — Tropisip (`corporate/tropisip`)

This document records directly observed verification runs, exit codes, acceptance criteria, and explicitly separates **EXECUTED** checks from **NOT RUN** or **FAILED/ESCALATED** gates.

## 1. Executed Checks & Observed Results (2026-11-22)

All capsule commands below were executed from `projects/corporate/tropisip/` on Node `v24.21.0` and `pnpm 12.4.2`:

| Check | Exact Command | Exit Code | Status | Observed Evidence |
|---|---|---|---|---|
| Dependency install | `pnpm install` | `0` | PASS | Resolved 114 packages into capsule-local `node_modules/` and `pnpm-lock.yaml` (1.6s) |
| TypeScript check | `pnpm run typecheck` | `0` | PASS | `tsc --noEmit` reported 0 errors across `src/` and `tests/` |
| Unit & static compliance tests | `pnpm run test` | `0` | PASS | `vitest run` — 1 file, `8/8` tests passed (6-flavor pricing, kinematics, reservation engine, zero external URLs, zero PII) |
| Production build | `pnpm run build` | `0` | PASS | Vite 6.4.6 built 55 modules into `dist/` (`index.html` 0.78 kB, `index.css` 63.97 kB, `index.js` 317.13 kB, `three.js` 513.67 kB, `lenis.js` 18.80 kB, bundled `@fontsource` fonts) |
| Deploy dry-run | `pnpm run deploy:dry-run` | `0` | PASS | `Tropisip deploy dry-run OK: dist/index.html (779 bytes) ready for static hosting.` |
| Dead CSS / var static scan | Inline Node regex scan over `src/styles/editorial.css` vs `src/**/*.{ts,tsx}` | `0` | PASS | `0` unused CSS classes (excluding dynamic `is-left`/`is-right`), `0` unused CSS custom properties |
| Live browser visual & interaction audit | Headless Chromium audit against `pnpm run preview` (`http://127.0.0.1:4180/`) at `1440×900` | `0` | PASS | `0` console errors, `0` page errors, `0` failed requests, `0` external network requests (`24` local requests); screenshots verified Mango, Avocado chocolate drizzle, Dragon Fruit, Watermelon chunks, 6-layer explosion, 2.6× optical macro loupe, ASMR toggle, 16oz/22oz specs, bright Orange/Cyan CTAs, and `TSIP-XXXXXX` receipt |

## 2. Not Run / Escalated Gates

| Gate | Command / Reference | Status | Reason / Next Owner |
|---|---|---|---|
| SRDS hygiene contract lint check | `srds_audit.py --repo . --scope projects/corporate/tropisip --kind capsule --strict` | ESCALATED (non-doc contract mismatch) | `project.contract.json` uses SAFRS `commands.lint.program: null` with `notApplicableReason`; `srds_audit.py` requires an executable argv object for `lint`. Per SRDS v1.2 rule against mutating contracts solely to satisfy doc checks, `project.contract.json` was left untouched for Gaffer to decide whether to add an executable linter. |
| Empirical SAFRS extraction proof | `pnpm project:verify corporate/tropisip` | NOT RUN | Capsule is newly authored and not yet committed or registered in `projects/corporate/AGENTS.md`; extraction verification awaits Gaffer approval. |
| Monorepo root governance gate | `pnpm run governance` | NOT RUN | Capsule work stayed strictly inside `projects/corporate/tropisip/`; root checkout currently contains unrelated uncommitted work in `projects/academic/academic-smartboard/`. |
| Physical mobile device QA | Real iOS/Android touch testing | NOT RUN | Browser verification covered `1440×900` desktop viewport only. |
| Live production hosting smoke | External CDN / domain deployment | NOT RUN | No live hosting provider is configured and deployment requires explicit `R3` Gaffer approval. |

## 3. Acceptance Criteria for Release Readiness

Before promoting `corporate/tropisip` to a live public host:
1. All four local capsule commands (`typecheck`, `test`, `build`, `deploy:dry-run`) exit `0` after the final commit.
2. Independent semantic review accepts the SRDS-FULL v1.2 documentation pack (`READY_FOR_REVIEW` -> `DOCUMENTATION_COMPLETE`).
3. Empirical extraction (`pnpm project:verify corporate/tropisip`) passes from a fresh isolated directory.
4. Gaffer gives explicit approval for merge and live deployment.
