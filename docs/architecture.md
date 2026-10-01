# Q-Flow — Architecture

Verified mapping of the master doc §3 pipeline to the implemented code. The design
is a **decoupled three-model system** behind one optimizer; the UI is a presentation
layer over a credible engine (master doc §24).

## Pipeline → modules
| # | Master-doc stage | Module(s) |
|---|------------------|-----------|
| 1 | Scenario input | `schemas/`, `api/compat.py` (React shapes) |
| 2 | Validation / scenario builder | `optimization/fleet_engine.py` (`validate_vessels`, `validate_route`, `default_route`) |
| 3 | Data & feature layer | `data/` (`mrv`, `features`, `weather`, `provenance`, `registry`, `splits`) + `optimization/config_default.json` |
| 4 | Fuel prediction engine | `prediction/` (`physics_baseline`, `power_model`, `dataset`, `models`, `tune_qpso`, `predict`) → pluggable `_PREDICTOR` |
| 5 | Emissions & cost engine | `emissions/` (`energy`, `lifecycle`, `shore_power`, `cost`, `compliance`, `factors`) |
| 6 | Constraint & feasibility | decoder + repair in `fleet_engine`; independent verifier `optimization/constraints.py` |
| 7 | Optimization engine | `optimization/` (`mo_qpso`, `nsga2_baseline`, `archive`, `selection`) |
| 8 | Results & explainability | `selection`, `prediction/explainability` (SHAP), `data/provenance`, `experiments/results_store` |
| 9 | Dashboard & report | `frontend/` + `api/` routes via `compat.py` |

## The critical rule (master doc §3) — enforced
> The optimizer must call the predictor **and** the emissions engine for every
> candidate; it must not optimize against hard-coded fuel values.

Verified in code:
- `mo_qpso.run_qpso` and `nsga2_baseline.run_nsga2` evaluate **every** candidate via `problem.evaluate(x)`.
- `FleetProblem.evaluate_plan` calls the pluggable `_PREDICTOR(feats)` then feeds its
  output into `emissions.{energy,shore_power,lifecycle,cost}`. Objectives (fuel GJ,
  cost USD, WtW tCO2e) are **computed**, never hard-coded.
- The predictor is swapped via `set_predictor()`; the API installs the MRV-calibrated
  physics predictor (`api/engine_state.init_predictor`).

## Candidate evaluation loop (per particle/individual)
```
latent x in [0,1]^(4N)
  → decode  (on/off, speed, fuel index, shore power)        optimization/fleet_engine.decode
  → repair  (availability, schedule, compat, bunkering,     (9-step, in decode + repair_x)
             shore, cargo greedy fill)
  → predict fuel rate (t/h)                                 prediction (pluggable _PREDICTOR)
  → energy / shore split / lifecycle GHG / cost             emissions/*
  → objectives [fuel_GJ, cost_USD, wtw_tCO2e] (+ GHG-cap penalty)
  → non-dominated archive update                            optimization/archive
```

## Predictor strategy (two models, distinct roles)
- **In the optimizer loop:** MRV-calibrated **physics** predictor — scales with
  installed power, so it is valid across *different* vessels (the fleet case).
- **Operational / per-vessel:** data-driven **power model** (Shifts/FuelCast, R² 0.98).
  It does **not** zero-shot transfer across vessels (see `benchmark-protocol.md`), so it
  is not the fleet-loop predictor unless retrained on a normalized target.

## Service boundary
`app.py` (FastAPI) wires the routers; CORS is open and there is **no auth** — local
demo only. The optimizer runs in a threadpool (CPU-bound), never on the event loop.
Each successful run is persisted with a reproducibility manifest (`experiments/results_store`).
