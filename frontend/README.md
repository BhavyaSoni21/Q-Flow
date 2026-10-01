# Q-Flow — Frontend

React + Vite dashboard for the Q-Flow platform (SIH26138). The landing page
and the app are a single React project (the standalone static landing page was
merged into `src/pages/Landing.jsx` + `src/components/landing/`).

## Structure → master doc §11 mapping

The app keeps a standard, working React layout that already satisfies the master
doc's §11 intent (we aligned to it rather than flattening the app):

| Master doc §11 | In this app | Notes |
|----------------|-------------|-------|
| `pages/ScenarioBuilder` | `src/pages/Scenario.jsx` | route `/scenario` |
| `pages/PredictionAnalysis` | `src/pages/Prediction.jsx` | route `/prediction` |
| `pages/OptimizationResults` | `src/pages/Optimization.jsx` | route `/optimization` |
| `pages/BenchmarkLab` | `src/pages/Benchmarking.jsx` | route `/benchmarking` |
| `pages/Provenance` | `src/pages/Provenance.jsx` | route `/provenance` |
| — | `src/pages/Emissions.jsx` | extra: emissions & fuels view |
| — | `src/pages/Landing.jsx` | public landing (route `/`) |
| `components/ParetoChart`, `ConvergenceChart`, `BenchmarkTable` | `src/components/charts/{ParetoChart,BenchmarkCharts,PredictionCharts}.jsx` | |
| `components/KPI cards`, `FleetPlanTable`, `ConstraintStatus`, `ProvenancePanel` | `src/components/shared/{KpiStrip,DataTable,Panel,...}.jsx` | |
| `services/predictionApi` | `src/services/predictionApi.js` | wraps `src/lib/api.js` |
| `services/optimizationApi` | `src/services/optimizationApi.js` | wraps `src/lib/api.js` |
| `services/benchmarkApi` | `src/services/benchmarkApi.js` | wraps `src/lib/api.js` |

`src/lib/api.js` is the single data layer: it has a `USE_MOCK` flag and otherwise
calls the FastAPI §10 routes (`/api/predict/fuel`, `/api/optimize/fleet`,
`/api/benchmarks/*`, `/api/vessels`, `/api/fuels`, `/api/provenance`). The three
`services/*` modules are thin domain-grouped wrappers over it (services kept as
`.js` to match the JS/JSX codebase; the master doc's `.ts` naming is cosmetic).

> Note: this app was generated on **Base44** (auth + SDK). The Base44 run
> instructions below still apply; the FastAPI backend we build plugs in via the
> `USE_MOCK` toggle in `src/lib/api.js`.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

## Run Locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored. Your app id is in the Builder URL (`app.base44.com/apps/<id>/...`); `base44 link --help` shows the non-interactive flags.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in this repo's `base44/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it (`[base44] Proxy not enabled`, every `/api` call fails), and alongside `base44 dev` the second Vite silently takes the next port and you end up looking at the wrong one.
- **The app must be published at least once for the UI to load under `base44 dev`.** The frontend boots by fetching app settings from the hosted app; before the first publish that fails and every page redirects to login. The local API works regardless.
- Entities, functions, and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Everything else (Core integrations, OAuth login) is forwarded to your deployed app. Full breakdown: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

## Frontend Only, Hosted Backend

To work on just the frontend against your app's live hosted backend:

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data** — plain `base44 dev` keeps everything local.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

This repo syncs to Base44 through git, so publish from the dashboard rather than `base44 deploy` — a CLI deploy ships your local tree directly, bypassing the sync, and the deployed state silently diverges from the repo.

## Docs & Support

GitHub integration: [https://docs.base44.com/developers/app-code/local-development/github](https://docs.base44.com/developers/app-code/local-development/github)

Local development: [https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview)

Support: [https://app.base44.com/support](https://app.base44.com/support)
