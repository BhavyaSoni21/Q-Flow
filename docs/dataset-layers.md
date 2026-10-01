# Q-Flow — Dataset Layers (A / B / C) Status

Authoritative record of what data we have, how it's categorized against the master
doc's §8 three-layer strategy, and what's derived vs. synthetic. Anchored to
`SIH26138_Master_Implementation_Document.md` §8. Last updated 2026-10-01.

**Context:** this is the **SIH (India)** build. The predictor trains on EU MRV
(the only ship-level fuel dataset available); weather scenarios use real **Indian**
coordinates. That split is intentional and honest — ERA5 is not joined to MRV
(see the nuance in Layer B), so EU-trained prediction + India-weather scenarios
is consistent, not contradictory.

---

## Layer A — Real public data (what we physically have)

All raw data lives under `Datasets/` and is **git-ignored** (large / reproducible
public data; AIS alone is 2.7 GB).

| Source | Path | Size | Role | Caveat |
|--------|------|------|------|--------|
| **EMSA THETIS-MRV** | `Datasets/MRV/` | 40 MB | **predictor training + validation** | annual per-ship aggregate; 2 schemas; 2023 missing |
| **AIS transit-count** | `Datasets/AIS/` | 2.7 GB | map / route **context** only | density raster, NOT per-ship speed |
| **IMO DCS reports** | `Datasets/IMO/` | 4.1 MB | **emission-factor sourcing** + fleet cross-check | aggregate PDFs, not ship-level |
| **ERA5 wind+wave** | `Datasets/ERA5/{west,east}/` | 7.7 MB×2 | **weather scenarios** | point time-series, not joinable to MRV |

### MRV detail
- 7 files, **94,108 ship-year rows** (2018–2022, 2024, 2025). **2023 is missing.**
- Two schemas: 2018–2022 = **62 cols** (single sheet); 2024–2025 = **113 cols** + a
  second `Partial ERs` sheet, and these newer years add **CH₄ / CO₂eq** columns
  (supports the §6.3 CO₂/CH₄/N₂O requirement).
- Key columns 100% populated: IMO, name, ship type, total fuel, fuel-per-distance,
  time-at-sea, CO₂, technical efficiency. Some rows have 0 fuel/time (filter in Phase 2).

### ERA5 detail (finalized coordinates)
| Folder | lat, lon | Location | SST | Waves | Fields |
|--------|----------|----------|-----|-------|--------|
| `ERA5/west/` | **18.5, 71.5** | Arabian Sea off Mumbai | 28.5 °C | 100% (1.43 m avg) | u10, v10, fg10, msl, sst, sp + swh, mwp, mwd |
| `ERA5/east/` | **13.0, 81.5** | Bay of Bengal off Chennai | 29.1 °C | 100% (1.20 m avg) | same |
- Hourly series 2020-01-01 → 2026-09-26 (59,064 rows each).
- Both coasts captured; **west alone is sufficient** for the MVP (one point yields
  all three sea-states via percentiles). West = primary (monsoon → `severe` scenario).

### Not available (out of scope)
- **ERA5 ocean currents** — a different dataset (ORAS5); currents excluded for the hackathon.
- **Per-vessel AIS tracks** — only density rasters were provided; so no per-ship speed/weather join.

---

## Layer B — Derived data (computed in Phase 2; every field documents its formula)

Layer B splits into **two tracks** because ERA5 weather cannot attach to individual
MRV ship-rows (MRV has no position/timestamp). B1 trains the predictor; B2 feeds
the scenario/optimizer side.

### B1 — per-ship features for the predictor (from MRV)
| Derived field | Formula | Status |
|---|---|---|
| Distance traveled | `total_fuel_kg ÷ (kg/nm)` | ✅ |
| At-sea duration | `Time spent at sea [hours]` | ✅ |
| **Annual avg speed** | `distance ÷ time-at-sea` | ✅ — Strategy A's key signal |
| Fuel intensity | per-distance / per-transport-work (direct) | ✅ |
| Estimated energy | `fuel × LHV` | ✅ |
| Operational carbon intensity | `CO₂ ÷ distance` | ✅ (CII-like) |
| Laden ratio | laden vs total columns | ⚠️ partial |

### B2 — weather features (from ERA5)
| Derived field | Formula | Status |
|---|---|---|
| Wind speed | `√(u10² + v10²)` | ✅ (needed v10) |
| Wind direction | `atan2(u10, v10)` | ✅ |
| Significant wave height / period / direction | `swh`, `mwp`, `mwd` (direct) | ✅ |
| **Sea-state severity bands** | percentiles of `swh`+wind over the series | ✅ → feeds Layer C |
| Monsoon seasonality | monthly aggregates (Jun–Sep spike) | ✅ |

**Architectural nuance:** B2 lives at the **route/scenario level**, not the
training-row level. The predictor trains on B1; weather feeds scenarios. This is
stated honestly, not hidden.

**AIS** contributes to B only as spatial **route-density context** (which corridors
are busy) — not a per-ship feature.

**Not derivable** (no AIS tracks / no MRV position): per-ship weather exposure join,
max speed, speed bins. Strategy A does not need them.

---

## Layer C — Physics-informed synthetic scenarios (handoff builds most; ERA5 upgrades weather)

Every synthetic field is labeled `synthetic` with its generation rule (§8.3).

| Synthetic field | Source | Status |
|---|---|---|
| Vessel pool (capacity, power, speed bounds, fuel compat, shore-power) | `make_vessel_pool()` | ✅ built, labeled synthetic |
| Cargo demand / deadline / routes | `default_route()` | ✅ — set **real Indian routes** (e.g. Mumbai↔Kochi) + real distances |
| **Weather scenarios** `normal/adverse/severe` | was hand-set `1.00/1.15/1.35` | 🔼 **now groundable** from ERA5 `swh`/wind percentiles at the 2 Indian points (monsoon = `severe`) |
| Shore-power grid factor / price | `default_route()` | ⬜ placeholder → use an India grid-intensity figure |
| Fuel prices + WtW lifecycle factors | `DEFAULT_FUELS` | ⬜ **still PLACEHOLDER** → source from IMO PDFs |

---

## Outstanding work by phase
- **Phase 1:** replace PLACEHOLDER fuel/emission factors using the IMO sources;
  swap in an India grid-intensity figure for shore power.
- **Phase 2:** implement B1 (MRV) + B2 (ERA5) derivations; convert ERA5 percentiles
  into the three weather multipliers so `adverse`/`severe` are data-backed.
- Optional: add the missing **MRV 2023** file to close the chronological-split gap.

## Summary
- **Layer A** = complete (MRV + AIS + IMO + real Indian ERA5). Only ERA5 currents / per-vessel AIS are intentionally out of scope.
- **Layer B** = fully specified; built in Phase 2. ERA5 makes the weather half real.
- **Layer C** = mostly built in the handoff; ERA5 upgrades weather scenarios from
  guessed to data-grounded, and IMO sourcing retires the placeholder factors.

