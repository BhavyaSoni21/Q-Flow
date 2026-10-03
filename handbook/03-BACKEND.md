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
| `tests/` | 62 tests |

## Endpoints (all under `/api`)

| Method · Path | Purpose |
|---------------|---------|
| `GET /api/health` | Liveness + calibration scale + pool size |
| `GET /api/status` | Active predictor version plus fleet, factor, storage, artifact hash, and holdout-metric status |
| `GET /api/models` | Model registry metadata, artifact presence, SHA-256, and holdout metrics |
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
| `GET /api/fuels/pathways` | Versioned pathway factors, provenance, and availability labels |
| `GET /api/provenance` · `/experiments` | Provenance ledger & run log |
| `POST /api/scenarios` · `GET /api/scenarios` · `GET /api/scenarios/{id}` · `POST /api/scenarios/compare` | Persist, list, load, and compare versioned scenarios |

## The engine contract `DESIGN`

`optimize_fleet(request, vehicles, algo, pop, iters, seed)` runs in a threadpool
(non-blocking). The optimizer calls `problem.evaluate` per candidate, which calls
the predictor + emissions engine — never a hard-coded fuel number. Results carry
objectives (fuel/energy, cost INR, WtW GHG), a feasibility flag, and a run id.

## Engine trust metadata `IMPLEMENTED`

`GET /api/status` and live optimization responses expose the active calibrated
predictor (`physics-mrv-cal-v1`), synthetic fleet status, representative factor
status, and persistent-file scenario storage. Clients should retain these labels
with results; they describe the evidence level of the recommendation.

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
