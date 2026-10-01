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
├── optimization/            # decoder, repair, archive, mo_qpso, nsga2, selection
│   ├── fleet_engine.py      # ported handoff engine (monolith, split in Phase 1)
│   └── config_default.json  # synthetic vessels + placeholder fuels
├── emissions/               # energy, lifecycle, shore_power, cost, compliance (Phase 1)
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
