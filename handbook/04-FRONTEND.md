# 04 · Frontend

React + Vite SPA in `frontend/`. React Router (`BrowserRouter`), Recharts for
charts, a single data layer that toggles between mock and the live backend.

## Pages (`src/pages/`)

| Page | What it does |
|------|--------------|
| `Landing.jsx` | Public portal with Hero search, In-Focus highlights, quick module grid, live AIS vessel counts, and quick-start links |
| `About.jsx` | Dedicated company, mission, and team overview (Team Egreen Quanta, SIH26138) highlighting regulatory compliance (IMO MEPC.391(81), FuelEU Maritime, CEA India grid) and scientific integrity |
| `Features.jsx` | Interactive capability showcase with categorized filters (Quantum Optimizer, Fuel AI, Lifecycle Emissions, Audit & Benchmarking) and the 5-step evaluation pipeline |
| `Dashboard.jsx` | Post-login home — fetches and displays dynamic simulation history, carbon metrics, company profile, and quick-start cards from the SQLite backend |
| `Profile.jsx` | Manage user profile settings and view account information, syncing with the SQLite backend |
| `Scenario.jsx` | Full-bleed scenario builder with sticky summary HUD; Ship/Road mode toggle; **From/To port-pair selectors**; fleet, fuels, distance, deadline, carbon price, and Monte Carlo weather/risk tests |
| `Optimization.jsx` | Run the optimizer; `DataStatus` banner; rich multi-vessel fleet deployment table, connected cost-vs-WtW Pareto frontier, balanced slider selection, and operational KPIs (INR) |
| `Prediction.jsx` | Single-prediction tool with physics sanity check, current-input explanation, global & local SHAP graphs, and holdout validation graphs |
| `Benchmarking.jsx` | Instant (<1ms precomputed) & live recomputable optimizer + prediction benchmarks with hypervolume (HV) and boxplot metrics |
| `Provenance.jsx` | Data-provenance ledger, experiment log (incl. `originPort`/`destinationPort` per run), and MRV/ERA5/AIS/GFW availability |
| `Emissions.jsx` | Lifecycle factors (WtT, TtW, WtW), OPS shore power cold-ironing calculations, plus indicative CII-style KPI check |
| Auth & Modals | User login, registration, password reset, and interactive review feedback modal |

## Data layer (`src/lib/`)

- **`api.js`** — one object with all calls. `maybeReal(path, mockFn)` fetches
  `${API_BASE}${path}` when `USE_MOCK` is false, falling back to mock on failure.
  `API_BASE = import.meta.env.VITE_API_BASE || "/api"`.
- **`store.jsx`** — global config + `mode` ("ship"/"road"); `runOptimization`
  dispatches to the ship or road endpoint based on mode. `DEFAULT_CONFIG` now uses
  `originPort`/`destinationPort` instead of `routeId`. Completed runs are **persisted
  to `sessionStorage`** (key `qflow_store_v1`) so navigation between pages and hard
  refreshes do not lose a finished optimization result. The backend SQLite database permanently stores historical data.
- **`types.js`** — exports `PORTS` (list of known port names), `ROUTES` (presets with
  `{origin, destination, refDistance}`), and `getRouteDistance(origin, destination)` to
  look up reference distances. The old `routeId`-based `ROUTES` array is replaced.
- **`mock.js`** — representative, seeded data; `USE_MOCK = VITE_USE_MOCK !== "false"`.
- **`nav.js`** — updated navigation entries including the new `/dashboard` and `/profile` routes.

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


## Navigation & Layout Structure `IMPLEMENTED`

The application provides a polished dual-layer navigation experience:
- **Public Layout (`LandingHeader.jsx`, `LandingFooter.jsx`):** Powers `/`, `/about`, and `/features` with smooth active route indicators, light/dark accessibility toggles, and direct links to live modules.
- **Application Layout (`SiteHeader.jsx`, `SiteFooter.jsx`):** Powers authenticated routes with the Dashboard, Scenario builder, Insights mega-menu (Benchmarking, Prediction, Emissions, Provenance), user profile management, and logout.
- **Footers:** Standardized across both layouts with regulatory compliance badges (IMO MEPC.391(81), FuelEU Maritime 2025/2030, ISO 19030, CEA India Grid 710 gCO₂/kWh) and direct links to all subpages.

## Build & run

```bash
cd frontend
npm install
npm run dev     # :5173, proxies /api → :8000
npm run build   # dist/  (reads VITE_* at build time)
```
`vercel.json` rewrites non-asset paths to `index.html` for client-side routing.
