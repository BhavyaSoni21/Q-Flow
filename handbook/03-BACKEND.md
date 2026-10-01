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
| `data/` | MRV/ERA5/GFW loaders, `provenance.py`, `splits.py`, `governance.py`, `ingest/` |
| `experiments/` | benchmark scripts + `benchmark_service.py` (live, cached recompute) |
| `schemas/` | pydantic request/response models |
| `tests/` | 53 tests |

## Endpoints (all under `/api`)

| Method · Path | Purpose |
|---------------|---------|
| `GET /api/health` | Liveness + calibration scale + pool size |
| `POST /api/predict/fuel` | Predict fuel for a vessel + operating state |
| `GET /api/predict/scatter` | Predicted-vs-actual points |
| `POST /api/optimize/fleet` | Ship optimization → Pareto frontier |
| `POST /api/optimize/road` | Road optimization (same contract) |
| `GET /api/optimize/runs/{id}` | Recorded run lookup |
| `GET /api/benchmarks/prediction` | Model comparison (`?force=true` recomputes) |
| `GET /api/benchmarks/optimizer` | Combined optimizer benchmark (`?force=true`) |
| `GET /api/benchmarks/{optimization,hv-curves,scalability,boxplot}` | Individual sections |
| `GET /api/vessels` · `/fuels` · `/road/vehicles` · `/road/fuels` | Metadata |
| `GET /api/provenance` · `/experiments` | Provenance ledger & run log |
| `POST /api/scenarios` · `GET /api/scenarios/{id}` | Save/load scenarios |

## The engine contract `DESIGN`

`optimize_fleet(request, vehicles, algo, pop, iters, seed)` runs in a threadpool
(non-blocking). The optimizer calls `problem.evaluate` per candidate, which calls
the predictor + emissions engine — never a hard-coded fuel number. Results carry
objectives (fuel/energy, cost INR, WtW GHG), a feasibility flag, and a run id.

## Benchmark service `IMPLEMENTED`

`experiments/benchmark_service.py` caches results in memory with a lock. Optimizer
benchmarks compute live from the real engine on first load (and on `?force=true`);
prediction benchmarks serve the committed real results by default and retrain live
on `?force=true` **when the MRV datasets are present**.

## Run it

```bash
cd backend && python -m uvicorn app:app --port 8000
python -m pytest -q        # 53 tests
```
