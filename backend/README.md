# Q-Flow — Backend

FastAPI decision-support engine for Q-Flow (SIH26138): fuel prediction,
lifecycle emissions & cost, and the quantum-inspired multi-objective fleet
optimizer. Built on the handoff engine (`optimization/fleet_engine.py`) and
restructured toward the master doc §11 module tree.

## Status
Phases 0–4 complete: emissions engine, optimizer modules + GHG cap, MRV data
layer, Strategy-A predictor (XGBoost + QPSO tuner), and the FastAPI §10 API with
model persistence. 46 tests green.

## Layout (master doc §11)
```
backend/
├── app.py                   # FastAPI app (Phase 4)
├── requirements.txt
├── conftest.py              # test import bootstrap
├── optimization/            # the search + problem model
│   ├── fleet_engine.py      # FleetProblem (decode/repair/objectives) + optimize_fleet facade
│   ├── archive.py           # dominance, crowding, hypervolume, archive update
│   ├── selection.py         # balanced Pareto pick
│   ├── mo_qpso.py           # MO-QPSO + MOPSO control
│   ├── nsga2_baseline.py    # NSGA-II baseline (pymoo)
│   ├── constraints.py       # independent §4 Step 8 feasibility verifier + GHG cap
│   └── config_default.json  # synthetic vessels + sourced fuels
├── emissions/               # energy, lifecycle, shore_power, cost, compliance, factors (sourced)
├── data/                    # mrv loader, validation, features (B1), weather (B2), provenance, splits, dataset
├── prediction/              # physics_baseline, dataset, models, benchmark, tune_qpso, predict, registry
├── api/                     # engine_state + prediction/optimization/metadata/benchmark routes
├── schemas/                 # pydantic request models
├── experiments/             # run_prediction_benchmark, train_models, results_store
└── tests/
```

## Setup & test
```bash
cd backend
python -m pip install -r requirements.txt
python -m pytest -q
```

## Train model artifacts (once) & run the API
```bash
python experiments/train_models.py        # writes models/*.joblib + metadata.json + calibration scale
uvicorn app:app --reload --port 8000       # serves the §10 API (loads artifacts, no retrain)
```
Key routes: `POST /api/predict/fuel`, `POST /api/optimize/fleet` (+ `/runs/{id}`),
`GET /api/benchmarks/prediction`, `GET /api/vessels|/fuels|/provenance`, `POST /api/scenarios`.

> **Security:** CORS is open by default for local development. Fleet APIs support
> optional bearer roles; configure QFLOW tokens and restrict CORS before exposure.
