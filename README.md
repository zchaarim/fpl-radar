# FPL Radar

Dark squad board for a Fantasy Premier League team. Talks only to the first-party API in `fpl-radar-backend` (the official FPL site blocks browsers with CORS).

## Run locally

Two terminals:

```bash
# backend
FPL_SYNC_TOKEN=dev python -m fpl_radar.api

# this app
npm install
npm run dev
```

The UI is on [http://127.0.0.1:5173](http://127.0.0.1:5173). Override the API with `VITE_API_BASE_URL` (see `.env.example`). The first board load waits on a warm `ModelContext` the same way `/v1/status` does.

## v1

- Enter FPL team id; stored in `localStorage` and in `/:entryId`.
- Fifteen players on a compact pitch (XI by position, bench below).
- Unfinished gameweeks only. Metrics: xP, opponent, xGI/90, ownership.
- Subs, replacements, captain/vice, budget and FT overrides. **Save squad** keeps that snapshot for this browser session (Transfers and Plan will read it later).

Transfers and Plan are nav stubs for later.

## CI

PRs and `main` run typecheck/build, Gitleaks, npm audit, Trivy, and CodeQL. Details: [docs/cicd.md](docs/cicd.md).

## CI

PRs and `main` run typecheck/build, Gitleaks, npm audit, Trivy, and CodeQL. Details: [docs/cicd.md](docs/cicd.md).
