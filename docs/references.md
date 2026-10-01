# Q-Flow — Data Sources & Citations

External datasets and references used, with licenses. Cite these wherever results
derived from them are shown (per the data-governance spec, Phase 16).

## FuelCast (real ship fuel/power — predictor validation)
> Viga, J., Mueck, P., Löser, A., & Weis, T. (2026). *FuelCast: Benchmarking
> Tabular and Temporal Models for Ship Fuel Consumption.* In Advanced Analytics
> and Learning on Temporal Data (pp. 54–69). Springer Nature Switzerland.
> ISBN 978-3-032-15535-1. Dataset: https://huggingface.co/datasets/krohnedigital/FuelCast
- License: CC-BY-NC-ND-4.0 (non-commercial, attribution, no-derivatives). Used for
  non-commercial research/benchmarking; dataset not redistributed.

```bibtex
@InProceedings{10.1007/978-3-032-15535-1_4,
  author    = {Viga, Justus and Mueck, Penelope and L{\"o}ser, Alexander and Weis, Torben},
  title     = {FuelCast: Benchmarking Tabular and Temporal Models for Ship Fuel Consumption},
  booktitle = {Advanced Analytics and Learning on Temporal Data},
  year      = {2026},
  publisher = {Springer Nature Switzerland},
  address   = {Cham},
  pages     = {54--69},
  isbn      = {978-3-032-15535-1}
}
```

## Shifts 2.0 — Marine Cargo Vessel Power Consumption (speed-resolved predictor)
> Shifts Challenge 2.0 marine power-consumption benchmark. arXiv:2206.15407.
> CC-BY-NC-SA-4.0. (We use the released synthetic subset; labelled synthetic.)

## EU MRV (fleet intensity + calibration)
> EMSA THETIS-MRV, Publication of information on CO2 emissions from maritime
> transport, reporting years 2018–2025. European Commission / EMSA.

## ERA5 (weather scenarios)
> Hersbach, H. et al. ERA5 hourly single-level reanalysis. Copernicus Climate
> Change Service (C3S) Climate Data Store.

## IMO DCS reports (fleet calibration / regulatory context)
> IMO MEPC Secretariat reports of fuel-oil-consumption data (MEPC 76/77/79/84-6-1;
> reporting years 2019–2024).

## Emission factors
> IMO MEPC.391(81) LCA guidelines / FuelEU Maritime conventions (representative
> well-to-wake factors); India grid factor: CEA CO2 Baseline Database.

## Additional / candidate sources (shared for evaluation)
Links provided for consideration; each to be assessed for role, licence, and
provenance before use (per the data-governance spec, Phase 0–1).

- **Zenodo record 7057666** — https://zenodo.org/records/7057666 — candidate maritime dataset (content/licence to verify before use).
- **Kaggle — Ship Fuel Consumption & CO2 Emissions** — https://www.kaggle.com/datasets/jeleeladekunlefijabi/ship-fuel-consumption-and-co2-emissions-analysis — assessed as **synthetic** (120 ships × 12 months, Nigerian routes, no speed); role = scenario/synthetic only, not a measured label.
- **Copernicus Climate Data Store (CDS)** — https://cds.climate.copernicus.eu/ — source of the ERA5 wind/wave reanalysis (weather scenarios).
- **Equasis** — https://www.equasis.org/EquasisWeb/public/HomePage?fs=About — free per-IMO vessel particulars (GT/DWT/type); web lookup only, no bulk API — role = metadata (manual enrichment for demo vessels).
- **Sustainable Ships database** — https://www.sustainable-ships.org/tools/sustainable-ships-database — candidate vessel/fuel/emissions reference data (content/licence to verify before use).
