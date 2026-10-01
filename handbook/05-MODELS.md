# 05 · Models

Q-Flow has three models. The naming mirrors the problem statement: **predict**,
**price**, **optimize**.

## ① Fuel prediction

**MRV fleet-intensity model** — XGBoost, QPSO-tuned, log-target transform.
Chronological 2025 holdout: **R² ≈ 0.26, MAE ≈ 28.9 kg/nm `VERIFIED METRIC`**.
Beats untuned XGBoost, linear, and random forest on the same split.

> The ~0.25 R² ceiling is honestly attributed to the **absence of a usable
> ship-size feature in MRV** (confirmed by a DWT ablation). Documented in full in
> [docs/model-versions.md](../docs/model-versions.md), including the
> accuracy-improvement log (the log-target fix took R² from catastrophic-negative
> to +0.25).

**Operational power model** — speed-resolved, trained on the Shifts marine
benchmark and **validated on real FuelCast vessels**: in-domain **R² ≈ 0.98**,
shifted **R² ≈ 0.95**, **sMAPE ≈ 5% `VERIFIED METRIC`**. This is the strong
predictor; the untuned XGBoost is preferred for deployment (more robust under
distribution shift than the QPSO-tuned variant).

**Physics baseline** — an MRV-calibrated physics fuel-rate model drives the
**optimizer loop** so results are valid across vessels. ML models are validated
separately and installed via a pluggable predictor hook (`set_predictor`). `DESIGN`

## ② Emissions & cost engine `IMPLEMENTED`

Deterministic, versioned, unit-tested (`backend/emissions/`). Computes:

- **WtT / TtW / WtW GHG** per fuel pathway (gCO₂e/MJ → tonnes).
- **Fuel + shore-power cost** in **INR** (ship bunker converted at ₹83/USD; road at
  India retail).
- Optional **GHG cap** wired into the search.

Every factor carries a provenance tag — IMO MEPC.391(81), FuelEU conventions,
GLEC/DEFRA (road), CEA India grid factor (~710 gCO₂/kWh). See `factors.py`.

## ③ Fleet optimizer — MO-QPSO `IMPLEMENTED`

Quantum-behaved PSO (Sun et al.): position update
`x' = p ± α·|mbest − x|·ln(1/u)` — delta-potential-well, **no velocity term**.

- **Mixed-variable decoder**: a continuous `[0,1]` genotype → activation / speed /
  fuel / shore-power, then **constraint repair** to feasibility.
- **Pareto archive** of non-dominated plans across fuel ↔ cost ↔ GHG.
- Benchmarked against **NSGA-II** and **classical PSO (MOPSO)** over multiple seeds
  (hypervolume, convergence, scalability, box plots).

Math & pseudocode: [docs/algorithm.md](../docs/algorithm.md),
[docs/mathematical-model.md](../docs/mathematical-model.md).
