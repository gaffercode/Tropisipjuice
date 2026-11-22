# Deployment & Release Promotion — Tropisip (`corporate/tropisip`)

## 1. Build Artifact Profile

`pnpm run build` (`tsc --noEmit && vite build`) compiles the capsule into a pure static site inside `dist/`:
- `dist/index.html` — single-page entrypoint (`lang="id"`)
- `dist/assets/*.js` — split ES2022 chunks (`index`, `three`, `lenis`)
- `dist/assets/*.css` — editorial stylesheet + `@fontsource` declarations
- `dist/assets/*.woff` / `*.woff2` — self-hosted `Poppins` and `JetBrains Mono` font files

No server-side runtime, serverless functions, container daemon, or database migrations are required.

## 2. Pre-Release Dry-Run & Smoke Contract

`project.contract.json` defines two non-destructive release checks:
1. **Deploy Dry-Run (`pnpm run deploy:dry-run`):** Executes `scripts/deploy-dry-run.mjs`, which verifies `dist/` and `dist/index.html` exist and reports bundle size without touching any remote service.
2. **Local HTTP Smoke (`pnpm run preview`):** Serves `dist/` at `http://127.0.0.1:4180/` and expects HTTP `200` on `/` within `15s`.

```bash
cd projects/corporate/tropisip
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run deploy:dry-run
```

## 3. Current Hosting Status & Promotion Boundary

- **Live Hosting Provider:** **Not yet configured.** There is currently no `vercel.json`, `netlify.toml`, `Dockerfile`, CI workflow, or live public URL attached to this capsule.
- **Promotion Gate (`R3`):** Deploying `dist/` to any public static host (Vercel, Cloudflare Pages, Netlify, or Sentra corporate hosting), binding a custom domain, or adding a production WhatsApp redirect environment variable requires **explicit prior approval from Gaffer (dr. Ferdi Iskandar)**.
- **Rollback Plan:** Because `dist/` is a stateless static bundle, rollback on any future static host consists of re-activating the previous deployment snapshot or checking out the prior verified git commit and re-running `pnpm run build` + `pnpm run deploy:dry-run`.
