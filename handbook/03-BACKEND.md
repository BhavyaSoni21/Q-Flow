# 03 · Backend

FastAPI app in `backend/`. Entry point: `app.py` (installs CORS from
`CORS_ORIGINS`, installs the MRV-calibrated predictor, mounts routers).

## Modules

| Dir | Responsibility |
|-----|----------------|
| `api/` | Routers + `compat.py` (engine ↔ frontend-shape mappers), `engine_state.py` (shared pool + predictor install) |
| `optimization/` | `fleet_engine.py` (ship), `road_fleet.py` (road), `mo_qpso`, `nsga2_baseline`, `selection` |
| `prediction/` | `physics_baseline.py`, XGBoost models, power/road models, `tune_qpso.py`, SHAP explainability, registry |
| `emissions/` | `factors.py` (sourced, versioned), `lifecycle.py`, `cost.py` |
| `data/` | MRV/ERA5/GFW loaders, `provenance.py`, `splits.py`, `governance.py`, `user_db.py` (SQLite), `ingest/` |
| `experiments/` | benchmark scripts + `benchmark_service.py` (live, cached recompute) |
| `schemas/` | pydantic request/response models |
| `tests/` | 62 tests |

## Endpoints (all under `/api`)

| Method · Path | Purpose |
|---------------|---------|
| `GET /api/health` | Liveness, calibration scale, pool size, and fleet-storage readiness |
| `GET /api/security/status` | Non-secret CORS, rate-limit, logging, and security-header posture |
| `GET /api/status` | Active predictor version plus fleet, factor, storage, artifact hash, and holdout-metric status |
| `GET /api/auth/session` · `POST /api/auth/logout` | Same-origin session discovery and cookie logout |
| `GET /api/fleet/storage` · `POST /api/fleet/backups` | Fleet SQLite schema status and admin-only consistent backup |
| `GET /api/models` | Model registry metadata, artifact presence, SHA-256, and holdout metrics |
| `GET /api/models/health` · `POST /api/models/{name}/archive` | Model health checks and admin-only rollback archive creation |
| `GET /api/benchmarks/confidence` | 95% confidence intervals where seed dispersion is available |
| `GET /api/digital-twins` | Fleet-level synthetic twin summaries |
| `POST /api/fuels/sensitivity` | Indicative fuel price/WtW sensitivity scenarios |
| `POST /api/compliance/annual` | Indicative year-by-year CII-style checks |
| `POST /api/eacf/evaluate` | Explicit Explainability/Accounting/Constraints/Feasibility contract |
| `POST /api/predict/fuel` | Predict fuel for a vessel + operating state |
| `GET /api/data/status` | Local MRV/ERA5/AIS/GFW availability and live credential status |
| `POST /api/compliance/cii` | Indicative operational CII-style intensity/cap calculation |
| `GET /api/digital-twins/{vessel_id}` | Synthetic telemetry summary and fuel-rate drift signal |
| `POST /api/corridors/optimize` | Synthetic port/fuel/shore-power corridor alternatives |
| `GET /api/predict/scatter` | Predicted-vs-actual points |
| `POST /api/optimize/fleet` | Ship optimization → Pareto frontier |
| `POST /api/optimize/robustness` | Monte Carlo normal/adverse/severe weather, prediction-error, fuel-price, and delay uncertainty analysis |
| `POST /api/optimize/road` | Road optimization (same contract) |
| `GET /api/optimize/runs/{id}` | Recorded run lookup |
| `GET /api/benchmarks/prediction` | Model comparison (`?force=true` recomputes) |
| `GET /api/benchmarks/optimizer` | Combined optimizer benchmark (`?force=true`) |
| `GET /api/benchmarks/{optimization,hv-curves,scalability,boxplot}` | Individual sections |
| `GET /api/vessels` · `POST/PUT/DELETE /api/vessels/{id}` · `/vessels/{id}/availability` · `/vessels/{id}/availability-history` | SQLite-backed fleet metadata, CRUD, and availability audit history |
| `GET /api/fleet/storage` · `POST /api/fleet/backups` | Storage schema status and admin-only consistent SQLite backup |
| `GET /api/fuels/pathways` | Versioned pathway factors, provenance, and availability labels |
| `GET /api/ports` | List of known port names for the Scenario port-pair selectors |
| `GET /api/routes` | Route presets with reference distances (nm) mirroring `types.js` |
| `GET /api/provenance` · `/experiments` | Provenance ledger & run log (each run now includes `originPort`/`destinationPort`) |
| `POST /api/scenarios` · `GET /api/scenarios` · `GET /api/scenarios/{id}` · `POST /api/scenarios/compare` | Persist, list, load, and compare versioned scenarios |
| `GET /api/users/profile` · `POST /api/users/profile` | View and update user profile info in the SQLite database |
| `GET /api/users/dashboard` | Fetch summarized metrics (carbon saved, scenarios run) from SQLite |
| `POST /api/users/feedback` | Record predicted vs actual fuel feedback |

## The engine contract `DESIGN`

`optimize_fleet(request, vehicles, algo, pop, iters, seed)` runs in a threadpool
(non-blocking). The optimizer calls `problem.evaluate` per candidate, which calls
the predictor + emissions engine — never a hard-coded fuel number. Results carry
objectives (fuel/energy, cost INR, WtW GHG), a feasibility flag, and a run id.

The `OptimizeRequest` schema now includes optional `origin_port` and `destination_port`
fields. These are forwarded from the frontend's `originPort`/`destinationPort` config,
recorded in the run log for provenance, and returned in `GET /api/experiments`.
The `route_distance_nm` field remains authoritative for the engine; port names are
used for labeling and corridor context only.

## Engine trust metadata `IMPLEMENTED`

`GET /api/status` and live optimization responses expose the active calibrated
predictor (`physics-mrv-cal-v1`), synthetic fleet status, representative factor
status, and persistent-file scenario storage. Clients should retain these labels
with results; they describe the evidence level of the recommendation.

## User & Scenario Storage

User profiles, scenario histories, and dashboard metrics are now stored in a SQLite database via `user_db.py`.
- **Database Location:** Configurable via the `QFLOW_DB_DIR` environment variable (defaults to `results/store`).
- **Backward Compatibility:** `POST /api/scenarios` double-writes to both the legacy JSON `scenario_store.py` and the new SQLite `user_db.py`.

## Benchmark service `IMPLEMENTED`

`experiments/benchmark_service.py` caches results in memory with a lock. Optimizer
benchmarks compute live from the real engine on first load (and on `?force=true`);
prediction benchmarks serve the committed real results by default and retrain live
on `?force=true` **when the MRV datasets are present**.

## Run it

```bash
cd backend && python -m uvicorn app:app --port 8000
python -m pytest -q        # 62 tests
```

For the prototype telemetry predictor, regenerate the local ignored artifact with
`python prediction/train_synthetic_engine.py` from `backend/`. Without that local
artifact the API intentionally falls back to the calibrated physics predictor.
