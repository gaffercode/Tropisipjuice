# Developer Setup & Workflow — Tropisip (`corporate/tropisip`)

## 1. Environment Prerequisites

| Requirement | Supported / Verified Version | Evidence |
|---|---|---|
| Node.js | `>=24` (verified on `v24.21.0`) | `project.contract.json` (`runtime.version: "24"`) |
| Package Manager | `pnpm` `11.21.0` / `12.x` (verified on `pnpm 12.4.2`) | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| Operating System | Windows 11 (`pwsh`), macOS, or Linux | Cross-platform Node/Vite scripts only |
| Browser (for visual work) | Any modern Chromium/Firefox/Safari with WebGL2 & Web Audio | `src/three/TropisipStage.ts`, `src/audio/foleyEngine.ts` |

## 2. Sovereign Workspace Isolation

`projects/corporate/tropisip/` contains its own `pnpm-workspace.yaml` (`packages: ['.']`), `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`. Always execute `pnpm` commands from inside `projects/corporate/tropisip/`—never rely on monorepo root dependencies or workspace catalogs.

## 3. Reproducible Setup Commands

```bash
cd projects/corporate/tropisip
pnpm install --frozen-lockfile
```

### Environment Variables & Secrets

| Variable | Required | Scope | Notes |
|---|---|---|---|
| None | No | N/A | Zero runtime or build environment variables are required. Do not create `.env` files with credentials or phone numbers. |

Local reference assets placed under `sources/` (brand book PDF, posters, videos) are excluded by `.gitignore` and must never be imported from `src/` or copied into `public/` or `dist/`.

## 4. Daily Development Workflow

```bash
# Start Vite dev server with HMR on http://127.0.0.1:4180/
pnpm run dev

# Run strict TypeScript check (noUnusedLocals, noUnusedParameters, strict)
pnpm run typecheck

# Run Vitest unit + zero-external-asset + PII compliance suite
pnpm run test

# Build optimized production bundle into dist/
pnpm run build

# Serve built dist/ locally on http://127.0.0.1:4180/
pnpm run preview

# Verify static deploy artifact without network side effects
pnpm run deploy:dry-run
```

## 5. Development Notes & Pitfalls

- **Strict Port Binding:** `vite.config.ts` sets `strictPort: true` on `127.0.0.1:4180` for both `dev` and `preview` so smoke checks hit a deterministic address. Stop any running `preview` server before launching `dev` (or vice versa).
- **WebGL HMR Cleanup:** `StageCanvas.tsx` disposes the WebGL renderer, `WebGLRenderTarget`, environment map, geometries, materials, and textures on unmount via `TropisipStage.dispose()` and `disposeObjectTree()`. If frequent HMR edits exhaust browser WebGL contexts, refresh the tab to reset the GPU context pool.
- **Font Bundling:** `Poppins` and `JetBrains Mono` CSS files are imported in `src/main.tsx`. Do not add `<link href="https://fonts.googleapis.com/...">` to `index.html`; `tests/tropisip.test.ts` will fail the build gate if any external HTTP URL is added.
- **Reduced Motion Testing:** Toggle OS/DevTools `prefers-reduced-motion: reduce` to verify idle cup floating, rotation sway, and internal pulp/ice drift pause cleanly while scroll positioning remains functional.
