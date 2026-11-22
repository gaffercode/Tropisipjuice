# Operations Runbook — Tropisip (`corporate/tropisip`)

## 1. Runtime Services & Dependencies

`corporate/tropisip` is a static single-page web application with **zero backend daemons, zero databases, and zero external runtime dependencies** (`project.contract.json#externalDependencies: []`). Operational tasks consist of building the static bundle (`dist/`), running the local Vite preview server for smoke verification, and validating static deployment artifacts.

| Process | Command (from capsule root) | Bind Address | Purpose |
|---|---|---|---|
| Local Dev (HMR) | `pnpm run dev` | `http://127.0.0.1:4180/` | Interactive development with live reload |
| Local Preview (Static) | `pnpm run preview` | `http://127.0.0.1:4180/` | Serves compiled `dist/` for QA & smoke checks |
| Deploy Artifact Check | `pnpm run deploy:dry-run` | N/A (local CLI) | Confirms `dist/index.html` exists and is non-empty |

## 2. Standard Operational Workflows

### Starting Local Preview Cleanly
```bash
cd projects/corporate/tropisip
pnpm install --frozen-lockfile
pnpm run build
pnpm run deploy:dry-run
pnpm run preview
```

### Health & Smoke Verification
Verify the preview server returns HTTP `200` on `/` (`project.contract.json#smoke`):
- Host: `127.0.0.1`
- Port: `4180`
- Path: `/`
- Expected Status: `200`
- Browser sanity: confirm WebGL canvas renders the Tropisip cup on Classic Linen (`#FAF6ED`), `0` console errors, and `0` network requests outside `127.0.0.1:4180`.

### Stopping the Local Server
Terminate the foreground `vite preview` / `vite dev` process cleanly with `Ctrl+C` (or stop the background task in your process manager). No mutable state files or locks are left behind (`mutableStatePaths: []`).

## 3. Backup, Recovery & Rollback

- **Data Backup:** Not applicable — the capsule stores zero persistent runtime data. Source code and lockfile are the sole state to preserve in version control.
- **Local Build Recovery:** If `dist/` becomes stale or corrupted, delete `dist/` and run `pnpm run build` followed by `pnpm run deploy:dry-run`.
- **Static Hosting Rollback:** Once deployed to a static host in the future, rollback is achieved by re-promoting the previous immutable `dist/` build artifact or reverting the source commit and rebuilding.

## 4. Ownership & Escalation

- **Product & Operational Owner:** Gaffer (dr. Ferdi Iskandar)
- **Visual Design & Animation Lead:** dr. Novia DA · Sentra Mitra Design
- **Escalation Triggers:** Any need to bind a public domain, configure live hosting credentials, integrate a backend/WhatsApp webhook, or push to a remote repository requires explicit Gaffer authorization (`R2`/`R3`).
