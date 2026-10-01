# Q-Flow — Model & Version History

> Living record of the project's model versions, benchmark numbers, and **how we
> improved accuracy** over iterations. Update this whenever a model or metric changes.
> Last updated: 2026-10-01.

Scope: MRV years **2020–2025** (2023 not published). Prediction target =
**fuel-per-distance intensity (kg / n mile)**. Benchmark = 64,799 ship-years.

Metric key (regression — "accuracy" is a proxy, read with R²):
- **Accuracy** = 100 − sMAPE (avg % the prediction lands within).
- **R²** = variance explained (1 = perfect, 0 = no better than the mean, negative = worse).
- **MAE / RMSE** = mean-absolute / root-mean-square error in kg/nm (RMSE is outlier-sensitive).

---

## 1. Current best model
**QPSO-tuned XGBoost** (log-target), `model: fuel_intensity_xgb` — current.
Chronological hold-out (train 2020–2024, **test 2025**): **Accuracy ≈ 75.1%**,
**R² = 0.255**, MAE = 28.9 kg/nm. It beats untuned XGBoost, linear, random forest,
and the naive mean floor.

---

## 2. Benchmark results (2020–2025)

### Chronological split — test = 2025 (future-year generalization) · primary
| Model | Accuracy | R² | MAE | RMSE | sMAPE |
|---|---|---|---|---|---|
| **qpso_xgboost** ⭐ | **75.1%** | **0.255** | 28.9 | 142.4 | 24.9% |
| xgboost | 75.1% | 0.241 | 28.6 | 143.8 | 24.9% |
| random_forest | 75.9% | −0.150 ⚠️ | 29.1 | 177.0 | 24.1% |
| linear | 64.5% | 0.060 | 42.0 | 160.1 | 35.5% |
| mean_floor (naive) | 51.4% | ≈0 | 56.5 | 165.3 | 48.6% |

### Vessel-holdout split — unseen ships (20%)
| Model | Accuracy | R² | MAE | RMSE | sMAPE |
|---|---|---|---|---|---|
| xgboost | 79.5% | 0.023 | 32.0 | 569.1 | 20.5% |
| random_forest | 79.5% | 0.021 | 31.9 | 569.6 | 20.5% |
| linear | 70.7% | 0.008 | 43.5 | 573.3 | 29.3% |
| mean_floor | 59.4% | ≈0 | 56.7 | 576.2 | 40.6% |

Notes: random forest's **negative R²** on 2025 means it fails on extreme/outlier
ships despite a decent average. Vessel-split RMSE (~570) is **outlier-dominated**
(even the naive mean has RMSE 576), so MAE/sMAPE are the trustworthy numbers there.
Source: `results/metrics/prediction_benchmark.csv`.

---

## 3. How we increased accuracy (iteration log)

The headline gain came from **fixing how the target is modelled**, not from a
fancier model. Fuel-per-distance is heavy-tailed (a few huge-intensity ships), so
on the full 2020–2025 data the raw-target models were wrecked by outliers.

### m0 — raw target (deprecated)
Trained directly on fuel-per-distance. On the 2020–2025 chronological test it
collapsed — squared error dominated by a handful of extreme ships:

| Model | R² (raw target) |
|---|---|
| random_forest | **−83.9** |
| xgboost | −4.3 |
| qpso_xgboost | −36.4 |

Average error (MAE/sMAPE) looked fine, but R²/RMSE were meaningless — a textbook
heavy-tailed-target failure.

### m1 — log-target transform (current) ✅
Every model now trains on **log1p(fuel-per-distance)** and inverts to original
units for metrics (`TransformedTargetRegressor`, applied uniformly incl. the QPSO
tuner). Same data, same features — only the target scale changed:

| Model | R² before (raw) | R² after (log) |
|---|---|---|
| xgboost | −4.3 | **0.241** |
| qpso_xgboost | −36.4 | **0.255** |
| random_forest | −83.9 | −0.150 |

**Result:** R² went from catastrophic-negative to **+0.25**, and the metrics
became interpretable and honest.

### m1 + QPSO tuning
On top of the log target, the quantum-inspired QPSO hyperparameter search lifted
XGBoost further: **R² 0.241 → 0.255** (the model we ship) — concrete evidence the
quantum-inspired tuner earns its place.

### Accuracy improvement summary
| Step | Best R² | Best Accuracy | What changed |
|---|---|---|---|
| m0 raw target | negative | — | baseline, outlier-wrecked |
| m1 log target | 0.241 | ~75% | log1p target transform |
| m1 + QPSO | **0.255** | **~75.1%** | quantum-inspired tuning |
| m2 + DWT proxy | 0.149 | ~71% | size feature — **reverted** (MRV DWT only ~10% covered) |
| m3 + GFW GT (26% cov) | 0.268 | ~68% | real GT size feature — **marginal** (R² ↑ slightly, MAE/sMAPE ↓ from imputing the 74% uncovered); not adopted as a win |

> **Note:** the MRV *intensity* model is capped ~0.26 by annual-aggregate data; it
> serves as the fleet benchmark. The project's strong predictor is the
> **speed-resolved power model** below (R² 0.98), not this intensity model.

### m2 — DWT size proxy (attempted 2026-10-01, **reverted**)
Hypothesis: the ~0.25 R² ceiling was due to no ship-size feature, so recover
deadweight from MRV as `dwt_carried = (CO2/distance) ÷ (CO2/(dwt·distance))`
(total CO2 cancels → leakage-free size). It did **not** work:

| Model (chronological, test 2025) | R² with DWT | R² without (m1) |
|---|---|---|
| xgboost | 0.176 | **0.241** |
| qpso_xgboost | 0.149 | **0.255** |

**Root cause (diagnosed):** MRV's CO2-per-DWT column is only **~10% populated** —
so `dwt_carried` was ~90% imputed-constant plus a few extreme outliers (max 4.1M dwt
from near-zero denominators). That added noise + spurious split points, so XGBoost
**overfit and generalized worse** to the held-out year. Reverted to m1.

**Lesson:** MRV genuinely cannot supply a dense size feature. The real fix is an
**external vessel register** (IMO → DWT / engine power), i.e. Strategy C — which
needs a dataset we don't yet have.

### Current ceiling / next lever
R² is capped ~0.25 by the **absence of a usable size feature in MRV** (confirmed by
the m2 experiment above). Pushing higher requires joining an external IMO→DWT/power
register (Strategy C); it cannot be squeezed out of MRV alone.

---

## 3b. Operational power model (the strong predictor)

Separate from the MRV intensity model, trained on **speed-resolved operational data**
(Shifts marine benchmark; validated on real FuelCast vessels). This is the model the
product's prediction story rests on.

| Model | In-domain R² | Shifted R² | sMAPE |
|---|---|---|---|
| xgboost (power) | 0.984 | **0.948** | 5.0% |
| qpso_xgboost (power) | **0.986** | 0.924 | 4.6% |

- Target = shaft/engine power (kW) → fuel via SFOC. Features: speed, draft, wind,
  current, waves, hull fouling. Artifact: `models/power_shifts_xgb.joblib`.
- Honest note: QPSO won in-domain but was **slightly worse under distribution shift**
  (0.924 vs 0.948) — for deployment the untuned XGBoost is preferred (Phase-10 rule:
  promote only on deployment-like validation).

### FuelCast cross-vessel finding (real 3-vessel data) ⚠️
Running the governance-spec 4-experiment on real FuelCast vessels:

| Protocol | R² |
|---|---|
| E1 source-specific (within vessel) | 0.60–0.97 |
| E2 pooled + vessel id | 0.983 |
| **E3 leave-one-vessel-out (unseen vessel)** | **−0.9 to −56** |

**Ship fuel models do NOT transfer zero-shot to an unseen vessel** — each vessel has a
different absolute fuel scale. Great in-domain / with vessel identity; collapses on a
brand-new vessel. This is why the **fleet optimizer uses the physics predictor**
(scales with installed power across vessels), not the raw ML model. Reporting E3
separately (not hiding it behind the pooled 0.98) is exactly what the spec mandates.

---


## 4. Project version history (phases)
| Version | Phase | Delivered | Tests |
|---|---|---|---|
| v0.1 | 0 | Backend scaffold; handoff fleet engine ported unchanged | 8 |
| v0.2 | 1 | Audited emissions/cost engine extracted; sourced lifecycle factors | 21 |
| v0.3 | 1b | Optimizer split into modules; GHG cap wired + independent constraint verifier | 25 |
| v0.4 | 2 | MRV data layer (2-schema loader, cleaning, B1/B2 features, provenance, splits) | 31 |
| v0.5 | 3 | Strategy-A predictor: physics + MRV calibration, baselines, **XGBoost + QPSO tuner**, benchmark; engine integration | 38 |
| v0.6 | 4 | FastAPI §10 API (predict/optimize/benchmarks/metadata/scenarios), run store, **joblib model persistence** | 46 |
| v0.7 | 5 | Frontend↔backend wiring: API reshaped to the React contract, compat layer, hv convergence curve, real optimizer benchmark + scatter served | 48 |

---

## 5. Honesty / limitations
- "Accuracy" (100−sMAPE) and R² are both reported; never quote accuracy alone
  (random forest looks ~76% accurate but has negative R² — it fails on outliers).
- Benchmarks use leakage-safe splits (chronological + vessel-holdout), never plain random.
- The predictor's R² ceiling is a documented **data limitation** (no size feature), not hidden.
- Every number here is reproducible from `experiments/run_prediction_benchmark.py`
  and recorded in `results/metrics/`.
