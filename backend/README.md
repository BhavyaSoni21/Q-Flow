# Q-Flow — Backend

FastAPI decision-support engine for Q-Flow (SIH26138): fuel prediction,
lifecycle emissions & cost, and the quantum-inspired multi-objective fleet
optimizer. Built on the handoff engine (`optimization/fleet_engine.py`) and
restructured toward the master doc §11 module tree.

## Status — Phase 0 (scaffold)
The handoff engine and its 8 tests are ported **unchanged** and green. Later
phases split the engine into `emissions/` + `optimization/` modules, add the
MRV data layer, the XGBoost predictor (Strategy A), and the §10 FastAPI routes.

## Layout (target = master doc §11)
```
backend/
├── requirements.txt
├── conftest.py              # test bootstrap (Phase 0)
├── optimization/            # the search + problem model
│   ├── fleet_engine.py      # FleetProblem (decode/repair/objectives) + optimize_fleet facade
│   ├── archive.py           # dominance, crowding, hypervolume, archive update
│   ├── selection.py         # balanced Pareto pick
│   ├── mo_qpso.py           # MO-QPSO + MOPSO control
│   ├── nsga2_baseline.py    # NSGA-II baseline (pymoo)
│   ├── constraints.py       # independent §4 Step 8 feasibility verifier + GHG cap
│   └── config_default.json  # synthetic vessels + sourced fuels
├── emissions/               # energy, lifecycle, shore_power, cost, compliance, factors (sourced)
├── data/                    # loaders, validation, provenance, feature_engineering (Phase 2)
├── prediction/              # physics_baseline, train_xgb, tune_qpso, predict (Phase 3)
├── api/                     # prediction/optimization/scenario/benchmark routes (Phase 4)
├── schemas/                 # pydantic request/response models (Phase 4)
├── experiments/             # benchmark runners + results store (Phase 7)
└── tests/
```

## Setup & test
```bash
cd backend
python -m pip install -r requirements.txt
python -m pytest -q            # runs the 8 ported engine tests
```
(Windows PowerShell: same commands.)
