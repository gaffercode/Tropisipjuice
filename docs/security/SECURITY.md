# Security & Privacy Boundaries — Tropisip (`corporate/tropisip`)

## 1. Security Posture & Data Classification

`corporate/tropisip` is a **public-facing static frontend marketing capsule** (`Risk: R1`). It processes no financial transactions, stores no user accounts, connects to no databases or backend APIs, and handles no regulated clinical/health (PHI/RME) data.

| Asset / Data Class | Location | Classification | Handling Rule |
|---|---|---|---|
| Brand source code, procedural 3D shaders, menu catalog | `src/`, `tests/`, `docs/` | Public-safe capsule source | Tracked inside capsule only; never published through monorepo `origin` |
| Local brand posters & videos | `sources/` | Local-only reference (contains phone number on poster image) | Excluded via `.gitignore`; **never** committed, imported, or bundled into `dist/` |
| Visitor reservation form inputs (name, email, date, notes) | Ephemeral React state in `OrderCateringForm.tsx` | Transient user-entered PII in browser memory | Never transmitted over network, never written to `localStorage`, cookies, or logs; cleared on page reload |
| Secrets / API keys / tokens | None | Prohibited in repo | Capsule requires zero credentials; never add `.env` secrets or hardcoded tokens |

## 2. Authentication, Authorization & Trust Boundaries

- **Authentication / Authorization:** Not applicable — all pages and interactive 3D/calculator surfaces are anonymous and read-only. There are no authenticated admin routes, cookies, JWTs, or session stores.
- **Zero External Runtime Requests:** All fonts (`@fontsource/poppins`, `@fontsource/jetbrains-mono`), SVG brand marks, 3D textures, HDRI lighting, and Web Audio foley are bundled or generated locally. This eliminates third-party CDN supply-chain injection at runtime and prevents passive visitor IP leakage to external font/media CDNs.
- **Deterministic Non-Cryptographic Receipt Codes:** `generateReservationCode()` in `src/lib/reservation.ts` uses an FNV-1a 32-bit hash solely to produce human-readable reference tags (`TSIP-XXXXXX`). It is **not** a security token, authorization proof, or collision-resistant identifier.

## 3. Automated Security & Privacy Controls

`tests/tropisip.test.ts` enforces two static guardrails on every `pnpm run test` run:
1. **Zero External URL Guard:** Scans `index.html` and every file under `src/` against `/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i` to block accidental external runtime scripts, images, fonts, or API endpoints.
2. **Zero Phone-Number PII Guard:** Scans `index.html` and `src/` against `/\+?62[\s-]?\d{3}[\s-]?\d{3,4}[\s-]?\d{3,4}/` to prevent real Indonesian phone numbers from local posters in `sources/` from leaking into tracked files.

## 4. Threat Model & Unverified Surfaces

| Threat / Risk | Current Mitigation | Residual Gap / Boundary |
|---|---|---|
| Accidental PII leak from `sources/` posters | `.gitignore` ignores `sources/`; Vitest regex test blocks phone numbers in `src/` | Manual check still required before any `git add` so `sources/` is never force-added (`git add -f`) |
| Supply-chain compromise in npm dependencies | Pinned `pnpm-lock.yaml`; capsule isolated via local `pnpm-workspace.yaml` | No automated `pnpm audit` CI gate configured yet; run manually before production promotion |
| Client-side XSS via user input | React JSX auto-escapes all form inputs (`customerName`, `contactEmail`, `notes`); zero `dangerouslySetInnerHTML` | Future backend/email integrations must validate and sanitize inputs server-side |
| Unauthorized publication or deployment | Root `.agents/BOUNDARIES.md` forbids pushing `projects/**` to monorepo `origin`; `R3` deploy gate requires Gaffer sign-off | Enforcement relies on SAFRS governance discipline and local review until a dedicated capsule remote is configured |

## 5. Incident Handling & Escalation

If a phone number, credential, or `sources/` media file is accidentally staged or committed:
1. **Stop immediately** — do not push to any remote.
2. Unstage or revert inside the local branch only; never rewrite shared history without Gaffer's explicit instruction.
3. Escalate immediately to **Gaffer (dr. Ferdi Iskandar)** with the exact file path and diff.
