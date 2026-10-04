# 04 · Frontend

React + Vite SPA in `frontend/`. React Router (`BrowserRouter`), Recharts for
charts, a single data layer that toggles between mock and the live backend.

## Pages (`src/pages/`)

| Page | What it does |
|------|--------------|
| `Scenario.jsx` | Build a scenario; Ship/Road mode toggle; pick fleet, fuels, distance, deadline, carbon price, and run Monte Carlo weather/risk tests |
| `Optimization.jsx` | Run the optimizer; connected cost-vs-WtW Pareto frontier, deployment plan, balanced slider selection, and KPIs (INR) |
| `Prediction.jsx` | Single-prediction tool with physics sanity check, current-input explanation, SHAP graphs, and holdout validation graphs |
| `Benchmarking.jsx` | Live, recomputable optimizer + prediction benchmarks (Recompute button) |
| `Provenance.jsx` | Data-provenance ledger, experiment log, and MRV/ERA5/AIS/GFW availability |
| API data layer | Model registry, digital-twin, fuel-sensitivity, annual KPI, and EACF contracts are exposed through `src/lib/api.js` |
| Authentication bridge | `AuthContext` synchronizes `/api/auth/session`; live API calls use same-origin cookies with `credentials: include`; no bearer secret is stored in browser build variables |
| `Emissions.jsx` | Lifecycle factors plus indicative CII-style KPI check |
| `Landing.jsx`, auth pages | Marketing landing + read-only Sandbox/Demo access for independent auditing |

## Data layer (`src/lib/`)

- **`api.js`** — one object with all calls. `maybeReal(path, mockFn)` fetches
  `${API_BASE}${path}` when `USE_MOCK` is false, falling back to mock on failure.
  `API_BASE = import.meta.env.VITE_API_BASE || "/api"`.
- **`store.jsx`** — global config + `mode` ("ship"/"road"); `runOptimization`
  dispatches to the ship or road endpoint based on mode.
- **`mock.js`** — representative, seeded data; `USE_MOCK = VITE_USE_MOCK !== "false"`.

`Scenario`, `Prediction`, and `Provenance` render the shared `DataStatus`
component. In live mode it displays the active model version and fleet-data
status returned by `/api/status`; in mock mode it labels the screen as using
representative seeded data.

## Mock ↔ live `DATA-DEPENDENT`

- Default (`VITE_USE_MOCK` unset/true): representative mock data, no backend needed.
- Live (`VITE_USE_MOCK=false`): real API calls. If a call fails, the layer **silently
  falls back to mock** and logs `[api] live … failed, falling back to mock` — check
  the console to confirm you're truly connected.

The banner reports the configured mode and whether the backend status endpoint
responded. Individual requests can still fall back if the backend becomes
unavailable, so live deployments should monitor the browser console and API
health endpoint.

## Charts `IMPLEMENTED`

`src/components/charts/` — `ParetoChart`, `BenchmarkCharts` (HV curve, scalability,
box plot), `PredictionCharts`. The Pareto chart uses operating cost (INR) and WtW
GHG (tCO2e) as fixed axes, connects returned plans in cost order, and keeps
fuel-colored selectable markers with fuel, cost, WtW, and feasibility tooltips.
Chart margins and axis widths reserve space for labels and tick values. Legends sit
at the top of each benchmark chart so they don't collide with x-axis labels.

## Optimization interaction details `IMPLEMENTED`

`Optimization.jsx` keeps the balanced-selection controls tied to the current
`weightedPoint` recommendation. Each objective slider shows two values:

- `Original` — the baseline fuel, cost, or WtW GHG value.
- `Optimized` — the current TOPSIS-selected value for the active preference weights.

Changing a slider updates the optimized value without requiring a new optimization
request. Cost formatting is non-negative and uses INR values; fuel is shown in
tonnes and WtW GHG in tCO2e. The case-study buttons also update the scenario inputs
and rerun the optimizer for their respective baseline, speed, green-fleet, and
adverse-weather contexts.

The optimizer presents only plans that reduce both operating cost and WtW GHG
against the baseline. Baseline comparison deltas use `optimized − baseline`, so
negative deltas mean a reduction. Cost and emissions themselves remain
nonnegative; if a run finds no plan improving both objectives, the page reports
that no qualifying solution was found.

## Prediction graphs and validation splits `IMPLEMENTED`

The Prediction page renders:

- Global SHAP feature importance.
- Local SHAP contribution waterfall for the current input.
- Predicted-versus-actual validation points with a y=x reference line.
- Residuals against actual fuel with a zero-error reference line.

The Time holdout and Vessel holdout controls request different deterministic
prototype samples in mock mode. In live mode, the graphs use
`GET /api/predict/scatter`; if a recorded validation artifact is unavailable, the
charts show `No validation points available` instead of rendering a blank graph.


## SEO, Accessibility & Route Selection `IMPLEMENTED`

The frontend includes `robots.txt`, `sitemap.xml`, and `site.webmanifest` to ensure proper search engine indexing and accessibility. State management (`store.jsx`) and authentication context (`AuthContext.jsx`) have been hardened to improve route selection, ensuring authenticated states and correct mode states (Ship/Road) are securely maintained across page navigation. Routing and SPA behavior are strictly governed by `vercel.json` which supports these assets natively.

## Build & run

```bash
cd frontend
npm install
npm run dev     # :5173, proxies /api → :8000
npm run build   # dist/  (reads VITE_* at build time)
```
`vercel.json` rewrites non-asset paths to `index.html` for client-side routing.
