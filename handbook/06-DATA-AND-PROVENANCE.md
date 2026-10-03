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
| **Synthetic development extensions** | Uncertainty, twin, corridor, and integration testing | `Datasets/Synthetic/`; seeded fuel prices, port delays, vessel telemetry, and port network; never measured |

> Raw datasets are **not committed** (large / licensed) — they live under
> `Datasets/` locally and are git-ignored. The deployed server therefore cannot
> retrain prediction models; it serves the committed real results instead
> (see [03 · Backend](03-BACKEND.md) benchmark service). `DATA-DEPENDENT`

## Synthetic development extensions `DATA-DEPENDENT`

Run `python data/generate_synthetic_extensions.py` from `backend/` to create
`Datasets/Synthetic/fuel_prices_monthly.csv`, `port_delays.csv`,
`vessel_telemetry.csv`, `port_network.csv`, and `MANIFEST.json`. The manifest records seed, row
counts, and limitations. These files support development calibration only;
they are not measured, market-authoritative, or regulatory data. The telemetry powers `/api/digital-twins/{vessel_id}` and the network powers `/api/corridors/optimize`; both responses retain an explicit development-only status.

The fuel sensitivity, annual KPI, and EACF endpoints are analytical prototype
contracts. They preserve indicative labels and must not be used as regulatory
certification without approved reference data and review.

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
