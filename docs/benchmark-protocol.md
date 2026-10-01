# Q-Flow — Benchmark Protocol

How every reported number is produced. Rule: no chart from an unrecorded run; report
in-domain *and* harder splits separately; never hide per-source weakness behind a
pooled average (governance spec Phase 9, master doc §14/§16).

## A. Prediction — MRV fleet intensity (`experiments/run_prediction_benchmark.py`)
- **Target:** fuel-per-distance (kg/n mile) — leakage-safe (not derived from the target).
- **Models:** mean floor, linear, random forest, XGBoost, QPSO-tuned XGBoost (log1p target).
- **Splits:** chronological (train ≤2024, **test 2025**) and vessel-holdout (unseen IMOs).
- **Metrics:** MAE, RMSE, R², sMAPE → `results/metrics/prediction_benchmark.csv`.
- **Headline:** QPSO-XGB R² ≈ 0.255 (chronological). Capped by annual-aggregate data;
  this is the *fleet benchmark*, not the strong predictor.

## B. Prediction — operational power (`experiments/train_power_model.py`)
- **Data:** Shifts marine (speed-resolved). **Target:** power (kW) → fuel via SFOC.
- **Splits:** in-domain `dev_in` **and** distribution-shifted `dev_out` (the Shifts point).
- **Headline:** XGBoost R² 0.984 in-domain / 0.948 shifted. QPSO wins in-domain (0.986)
  but is worse shifted (0.924) → prefer untuned for deployment (Phase-10 rule).

## C. Prediction — cross-vessel (`experiments/run_fuelcast_experiments.py`, real data)
Four protocols reported **separately** on the 3 FuelCast vessels:
- E1 source-specific (within vessel): R² 0.60–0.97
- E2 pooled + vessel id: 0.983
- **E3 leave-one-vessel-out (unseen vessel): −0.9 to −56** ← ships don't transfer zero-shot
→ `results/metrics/fuelcast_experiments.csv`. This is why the optimizer uses the
physics predictor (scales across vessels).

## D. Optimizer (`experiments/run_optimizer_benchmark.py`)
- **Compared:** NSGA-II vs classical MOPSO vs MO-QPSO.
- **Held constant:** same scenario, decision variables, objectives, constraints,
  evaluation budget, stopping condition; **multiple seeds**.
- **Metrics:** hypervolume (↑), IGD+ (↓), feasible rate, runtime, evals-to-95%-HV,
  front size, std across seeds; + scalability sweep (5/10/25/50 vessels) and HV
  convergence curves → `results/metrics/optimization_benchmark.json`.
- No superiority claimed from one lucky run.

## Reproducibility (`experiments/results_store.py`, master doc §16)
Every optimizer run persists a manifest: `run_id, algorithm, seed, population_size,
iterations, objective_set, dataset_version, model_version, runtime_seconds,
result_count, feasibility_rate`. Models persisted with metadata (`models/metadata.json`).
Fixed `(request, seed, vessels)` ⇒ identical output.

## Honesty rules enforced
- Report R² **and** sMAPE/MAE together (a model can look "accurate" by sMAPE yet have
  negative R² on outliers — e.g. random forest).
- Leakage-safe splits only (chronological / entity holdout), never plain random for the headline.
- Synthetic data labelled; data-capped limitations stated, not hidden.
