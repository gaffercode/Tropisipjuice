# AGENTS.md — Tropisip Capsule (`corporate/tropisip`)

## 1. Canonical Read Order

Read these capsule-local files in order before mutating anything under `projects/corporate/tropisip/`:

1. `.agents/HANDOFF.md` — current session state, verified evidence, and open blockers.
2. `.agents/CONTEXT.md` — immutable capsule facts, stack, and protected paths.
3. `.agents/DECISIONS.md` and [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md) — durable capsule architecture decisions.
4. [docs/governance/BOUNDARIES.md](docs/governance/BOUNDARIES.md) — risk classification, authority limits, and SAFRS capsule boundaries.
5. Task-scoped documentation in [docs/documentation.manifest.json](docs/documentation.manifest.json) (`docs/architecture/ARCHITECTURE.md`, `docs/engineering/DEVELOPMENT.md`, `docs/engineering/TESTING.md`, `docs/security/SECURITY.md`).

When nested inside the Sentra monorepo, root `AGENTS.md`, `SAFRS_SPEC.md`, `.agents/BOUNDARIES.md`, and `projects/corporate/AGENTS.md` remain authoritative above this file. Documentation references to root policy never create a runtime, build, test, or deploy dependency on root files.

## 2. Capsule Scope & Sovereignty

- **Capsule ID:** `corporate/tropisip`
- **Owner:** Gaffer (dr. Ferdi Iskandar)
- **Design & Animation Credit:** dr. Novia DA · Sentra Mitra Design
- **Default Risk Tier:** `R1` (reversible local engineering). Elevate to `R2` for dependency, contract, CI, or public domain changes; elevate to `R3` for live deployment, external credentials, or irreversible data operations.
- **Sovereignty Rule:** This capsule owns its own `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `project.contract.json`, `src/`, `tests/`, and `docs/`. Never import from monorepo root `packages/`, root configs, or sibling capsules.

## 3. Hard Non-Negotiable Boundaries

- **100% Procedural Runtime:** Never introduce external runtime image, video, font CDN, audio, or 3D model URLs into `index.html` or `src/`. Fonts must stay self-hosted via `@fontsource/*`; all 3D geometry, HDRI, textures, and ASMR audio must remain procedural.
- **Zero PII / Privacy Fence:** Local brand reference posters under `sources/` are gitignored and contain a real phone number. Never bundle `sources/`, never commit `sources/`, and never embed real phone numbers, messaging JIDs, or credentials into tracked files.
- **Single-Writer Scope Fence:** Modify only paths inside `projects/corporate/tropisip/`. Do not mutate root `.agents/HANDOFF.md`, root `AGENTS.md`, `.safrs/**`, or sibling capsules without explicit authorization.
- **Human Approval Gates:** Never run `git push`, merge to `main`, publish to external remotes, or deploy to live hosting without explicit Gaffer approval in the current session.

## 4. Capsule Lifecycle Commands

Run all commands from the capsule root (`projects/corporate/tropisip/`):

| Stage | Command | Purpose |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | Reproducible capsule-local dependency install |
| Dev server | `pnpm run dev` | Local Vite HMR server on `http://127.0.0.1:4180/` |
| Typecheck | `pnpm run typecheck` | Strict TypeScript check (`tsc --noEmit`) |
| Test | `pnpm run test` | Vitest suite (`tests/tropisip.test.ts`, includes zero-asset & PII audit) |
| Build | `pnpm run build` | Typecheck + Vite production bundle into `dist/` |
| Preview | `pnpm run preview` | Local static preview server on `http://127.0.0.1:4180/` |
| Deploy Dry-Run | `pnpm run deploy:dry-run` | Verifies `dist/index.html` readiness with zero side effects |

## 5. Acceptance & Handoff Protocol

Before declaring any task complete:

1. Run `pnpm run typecheck`, `pnpm run test`, `pnpm run build`, and `pnpm run deploy:dry-run` after the final edit.
2. For visual, WebGL, or interaction changes, verify the rendered page live at `http://127.0.0.1:4180/` with zero console errors, zero page errors, and zero external network requests.
3. Overwrite `.agents/HANDOFF.md` with directly observed results and append any new durable architectural decisions to `.agents/DECISIONS.md` and [docs/architecture/DECISIONS.md](docs/architecture/DECISIONS.md).
4. Never fabricate PASS results, skip failing checks, or edit validators/contracts merely to make a documentation check pass.
