# 04 · Frontend

React + Vite SPA in `frontend/`. React Router (`BrowserRouter`), Recharts for
charts, a single data layer that toggles between mock and the live backend.

## Pages (`src/pages/`)

| Page | What it does |
|------|--------------|
| `Scenario.jsx` | Build a scenario; Ship/Road mode toggle; pick fleet, fuels, distance, deadline, carbon price, and run Monte Carlo weather/risk tests |
| `Optimization.jsx` | Run the optimizer; Pareto frontier, deployment plan, KPIs (INR) |
| `Prediction.jsx` | Single-prediction tool with physics sanity check and current-input explanation |
| `Benchmarking.jsx` | Live, recomputable optimizer + prediction benchmarks (Recompute button) |
| `Provenance.jsx` | Data-provenance ledger, experiment log, and MRV/ERA5/AIS/GFW availability |
| API data layer | Model registry, digital-twin, fuel-sensitivity, annual KPI, and EACF contracts are exposed through `src/lib/api.js` |
| Authentication bridge | `AuthContext` synchronizes `/api/auth/session`; live API calls use same-origin cookies with `credentials: include`; no bearer secret is stored in browser build variables |
| `Emissions.jsx` | Lifecycle factors plus indicative CII-style KPI check |
| `Landing.jsx`, auth pages | Marketing landing + instant access |

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
box plot), `PredictionCharts`. Legends sit at the top of each benchmark chart so
they don't collide with x-axis labels.

## Build & run

```bash
cd frontend
npm install
npm run dev     # :5173, proxies /api → :8000
npm run build   # dist/  (reads VITE_* at build time)
```
`vercel.json` rewrites non-asset paths to `index.html` for client-side routing.
