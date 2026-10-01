# 06 · Data & provenance

Data integrity is a first-class feature. Every field is labeled, every factor is
sourced, every reported number is traceable.

## Integrity commitments `DESIGN`

- Every data field is labeled **`measured`**, **`derived`**, or **`synthetic`**,
  with its source and (for derived) its formula.
- Every fuel/emissions factor is **sourced and versioned** (`emissions/factors.py`).
- Every reported metric is traceable to a **recorded experiment** (seed, dataset,
  model version) via `results_store`.
- Benchmarks use **multiple seeds** — no claims from a single lucky run.
- Synthetic components (vessel/vehicle pools, some weather scenarios) are **clearly
  labeled synthetic** and never presented as measured data.

## Datasets

| Dataset | Use | Notes |
|---------|-----|-------|
| **EU MRV** (2020–2025) | Fleet-intensity training | Annual, in-scope years; chronological + vessel holdout |
| **Copernicus ERA5** | Weather features (Indian coasts) | Added-resistance proxy |
| **Global Fishing Watch** | Vessel gross-tonnage join | ~partial coverage; size feature |
| **Shifts marine benchmark** | Power-model training | Strong predictor; distribution-shift test |
| **FuelCast (real 3-vessel)** | Power-model validation | Cross-vessel transfer reported candidly |
| **VED (road OBD)** | Road surrogate calibration | MAF-derived fuel rate |
| **GLEC / DEFRA** | Road WtW factors | Diesel/petrol/electricity |

> Raw datasets are **not committed** (large / licensed) — they live under
> `Datasets/` locally and are git-ignored. The deployed server therefore cannot
> retrain prediction models; it serves the committed real results instead
> (see [03 · Backend](03-BACKEND.md) benchmark service). `DATA-DEPENDENT`

## Provenance in the product `IMPLEMENTED`

- `GET /api/provenance` → the field-level data ledger (type, source, status, version).
- `GET /api/experiments` → the run log; each run records config JSON, seed, model
  version, runtime, hypervolume, feasibility.
- The **Provenance** page renders both; click a run to inspect its full config.

## Honesty log

Scope and method decisions (multi-modal → ship-only → multi-modal; the DWT-feature
ablation; the log-target fix; the FuelCast cross-vessel finding) are recorded in
[docs/model-versions.md](../docs/model-versions.md) and
[docs/data-provenance.md](../docs/data-provenance.md).
