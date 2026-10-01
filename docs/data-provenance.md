# Q-Flow — Data Provenance

Every field used by a model or shown in the UI is tagged **measured · reported ·
derived · reanalysis · synthetic · assumption**, with its source and formula. Code:
`data/provenance.py` (field ledger) and `data/governance.py` (inventory + schema audit).

## Layered strategy (master doc §8)
- **Layer A — real:** EU MRV (fuel/CO₂, 2020–2025), ERA5 wind/wave (Indian coasts),
  GFW gross tonnage, AIS density rasters, IMO DCS reports, Shifts & FuelCast operational data.
- **Layer B — derived (formula-documented):** distance, annual-avg speed, energy, fuel
  intensity, CO₂/fuel ratio (B1, MRV); wind speed/direction, sea-state severity (B2, ERA5).
- **Layer C — synthetic (labelled, seeded):** vessel pool, weather multipliers (grounded
  in ERA5 percentiles), scenario demand/deadline/prices. See [dataset-layers.md](dataset-layers.md).

## Provenance ledger (§8.5 schema)
Per field: `field_name, source_type (measured/derived/synthetic), source_name, unit,
transformation_formula`. Served live at `GET /api/provenance`.

| field | type | source | formula/notes |
|---|---|---|---|
| total_fuel_mt, total_co2_mt, time_at_sea_h, fuel_per_dist_kg_nm | measured | EMSA THETIS-MRV | reported |
| distance_nm | derived | MRV | total_fuel_kg / fuel_per_dist |
| avg_speed_kn | derived | MRV | distance / time_at_sea |
| gt | measured | GFW registry | per-IMO gross tonnage |
| wind_speed_ms / wind_dir_deg | derived | ERA5 | √(u²+v²) / atan2(u,v) |
| swh | reanalysis | ERA5 | significant wave height |
| fuel WtW factors | assumption/literature | IMO MEPC.391(81)/FuelEU | representative, versioned (`qflow-factors-v1`) |
| grid EF | measured | CEA (India) | ~0.71 kgCO₂/kWh |
| vessel pool, weather multipliers | synthetic | generated | seeded; ERA5-calibrated |

## Governance artifacts (`data/governance.py` → `artifacts/`)
`data_registry.csv` (52 files classified + hashed), `file_hashes.json`,
`schema_audit/*.json` (per-column type/missing/range). Raw files are never modified.

## Non-negotiables honoured
- Synthetic data is **never** presented as measured (e.g. the Kaggle set = scenario-only).
- Annual MRV is used for calibration/benchmark, **not** as high-frequency labels.
- No invalid joins / join-by-row-number; entity joins are explicit (IMO).
- Units declared and converted explicitly; conflicting fields quarantined.

## Licences
See [references.md](references.md). Note: FuelCast is CC-BY-NC-ND (non-commercial,
no-derivatives — research use, dataset not redistributed); Shifts CC-BY-NC-SA.
