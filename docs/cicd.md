# CI

GitHub Actions is the gate for this static Vite app. It does **not** host the UI. Production hosting (Cloudflare Pages or GitHub Pages) is later; bake `VITE_API_BASE_URL` into that build.

Workflows: `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`. Dependabot: `.github/dependabot.yml`.

| Event | `npm ci` + `npm run build` | Gitleaks, npm audit, Trivy fs | CodeQL | Upload `dist/` artifact |
|---|---|---|---|---|
| **PR into `main` / `master`** | Yes | Yes | Yes | Yes |
| **Push / merge to `main` / `master`** | Yes | Yes | Yes | Yes |
| **Fork PR** | Yes | Yes | Yes | Yes (artifact on the fork’s workflow run) |

There is **no** Docker image, GHCR publish, or deploy job. Those belong to `fpl-radar-backend`.

## What CI does not do

- Serve the app 24/7.
- Deploy on merge.
- Inject a production API URL (Pages/Cloudflare will set `VITE_API_BASE_URL` at build time).
