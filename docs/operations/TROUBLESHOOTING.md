# Troubleshooting Guide — Tropisip (`corporate/tropisip`)

This guide documents real observed and architectural failure modes for `corporate/tropisip`, exact diagnostic steps, verified recovery actions, and unresolved conditions.

## 1. Port `4180` Already In Use (`EADDRINUSE`)
- **Symptom:** `pnpm run dev` or `pnpm run preview` exits immediately because `vite.config.ts` sets `strictPort: true` on `127.0.0.1:4180`.
- **Diagnosis:** Check whether a prior `vite preview` or `vite dev` session is still bound to port `4180`.
- **Recovery:** Stop the existing preview/dev process cleanly, then re-run `pnpm run dev` or `pnpm run preview`. Confirm HTTP `200` at `http://127.0.0.1:4180/`.

## 2. WebGL Unavailable or Context Lost
- **Symptom:** Browser displays the Bahasa Indonesia fallback banner `PRATINJAU 3D WEBGL TIDAK TERSEDIA` or a blank 3D canvas while HTML sections still render.
- **Diagnosis:** Hardware acceleration is disabled in the browser, GPU drivers crashed, or excessive Vite HMR cycles exhausted the browser's active WebGL context limit.
- **Recovery:** Enable browser hardware acceleration, close extra WebGL tabs, and perform a full tab reload so `TropisipStage` creates a fresh `WebGLRenderer` context (and `dispose()` frees prior contexts cleanly).

## 3. ASMR Foley Button Does Not Produce Sound
- **Symptom:** Clicking `ASMR` toggles to `ASMR NYALA` or stays muted with no audible pour/ice-clink sound.
- **Diagnosis:** Browser autoplay policy suspends `AudioContext` until a direct click gesture; OS tab mute or missing audio output device in headless environments also silences synthesis.
- **Recovery:** Click the `ASMR` button directly in the header, verify the label switches to `ASMR NYALA` (`aria-pressed="true"`), scroll the page to trigger velocity-driven pour foley, or click a flavor button to trigger a modal ice clink. Verify `0` `AudioContext` errors in DevTools console.

## 4. `pnpm run test` Fails Zero-External-Asset or PII Audit
- **Symptom:** `tests/tropisip.test.ts` fails with `Unexpected external URL in ...` or `Unexpected phone number in ...`.
- **Diagnosis:** An `http(s)://` URL (e.g. Google Fonts link or external image) or an Indonesian phone number (`+62...`) was introduced into `index.html` or `src/`.
- **Recovery:** Replace external fonts/media with bundled `@fontsource/*` or procedural Canvas2D/SVG/GLSL code, remove any hardcoded phone number, and re-run `pnpm run test` until `8/8` tests pass.

## 5. `deploy:dry-run` Fails with Missing `dist/index.html`
- **Symptom:** `pnpm run deploy:dry-run` exits `1` with `Deploy dry-run failed: dist/index.html missing.`
- **Diagnosis:** `dist/` has not been built or was cleaned before running the dry-run check.
- **Recovery:** Run `pnpm run build` first, then re-run `pnpm run deploy:dry-run` and confirm exit code `0`.

## 6. Unresolved / Escalated Condition: `srds_audit.py` `INVALID_LIFECYCLE_COMMAND` on `lint`
- **Symptom:** Running `srds_audit.py` / `srds_full.py` reports `INVALID_LIFECYCLE_COMMAND projects/corporate/tropisip/project.contract.json — lint`.
- **Cause:** `project.contract.json` uses the SAFRS v1 N/A shape (`program: null` + `notApplicableReason`), whereas `srds_audit.py` currently requires an executable `{program, args}` object for `lint`.
- **Escalation:** Do not edit `srds_audit.py` or fabricate a fake contract entry during documentation passes. Escalate to Gaffer to decide whether to add a real capsule-local linter (e.g. Biome) in a dedicated `R2` engineering task.
