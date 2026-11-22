# Governance Boundaries — Tropisip (`corporate/tropisip`)

## 1. SAFRS Applicability & Authority Hierarchy

`corporate/tropisip` is a sovereign product capsule under the `corporate` domain (`projects/corporate/tropisip/`). When nested inside the Sentra monorepo, authority follows the canonical SAFRS v1.1 hierarchy:

1. Explicit human input from **Gaffer (dr. Ferdi Iskandar)**
2. Monorepo L1 Constitution and `SAFRS_SPEC.md`
3. Root `docs/architecture/MONOREPO_PURPOSE.md` and `.agents/BOUNDARIES.md`
4. Root `AGENTS.md`
5. Domain router `projects/corporate/AGENTS.md`
6. Capsule-local [AGENTS.md](../../AGENTS.md) and `.agents/` state (`HANDOFF.md`, `CONTEXT.md`, `DECISIONS.md`)

Documentation links remain strictly capsule-local so the capsule stays portable when extracted outside the monorepo.

## 2. Risk Classification & Approval Matrix

| Risk Tier | Scope Examples in `corporate/tropisip` | Authority Required |
|---|---|---|
| `R0` (Read-only) | Code inspection, audits, running `typecheck` / `test` / `srds_*` checks | Autonomous agent execution |
| `R1` (Reversible local) | Scoped edits to `src/`, `tests/`, `docs/`, `.agents/`, local `vite build` / `preview` | Autonomous agent execution within single-writer capsule scope |
| `R2` (Boundary changes) | Dependency upgrades (`package.json` / `pnpm-lock.yaml`), `project.contract.json` changes, CI workflows, monorepo domain router registration (`projects/corporate/AGENTS.md`) | Explicit review per boundary package; escalate material changes to Gaffer |
| `R3` (Production / Irreversible) | `git push` to any remote, merging/fast-forwarding `main`, live public hosting deployment, external webhook/credential setup | **Mandatory prior explicit Gaffer approval in the same session** |

## 3. Capsule Sovereignty & Publication Gate

- **No Root Coupling:** `projects/corporate/tropisip/` carries its own `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, and `project.contract.json`. It must never import root workspace packages or assume monorepo root scripts at runtime, build, test, or deploy time.
- **No Monorepo Remote Publication:** Per root `.agents/BOUNDARIES.md`, capsule code under `projects/**` is **never** published through the monorepo `origin` remote. Future publication must go only through a dedicated, Gaffer-authorized capsule remote after a PII scan confirms zero phone numbers or `sources/` artifacts in git history.
- **Provenance & Attribution:** Agent commits must include the required `Co-Authored-By` trailer. Capsule state changes update `projects/corporate/tropisip/.agents/HANDOFF.md` only—never overwrite root `.agents/HANDOFF.md` for capsule-only work.

## 4. Human vs. Agent Accountability

- Automated checks (`vitest`, `tsc`, `srds_audit.py`, `srds_level2.py`, `srds_full.py`) establish structural and hygiene readiness (`READY_FOR_REVIEW`), **never** final semantic certification (`DOCUMENTATION_COMPLETE`) or production authorization.
- Independent human review and explicit Gaffer sign-off remain the terminal gate for merging, registering the capsule in `projects/corporate/AGENTS.md`, or deploying to live public hosting.
