"""Provenance ledger (master doc §8.5): every field tagged measured / derived /
synthetic with its source and transformation formula. Emitted alongside any
training frame so the dashboard's Provenance panel is auditable."""

# field_name -> (source_type, source, unit, formula/notes)
LEDGER = {
    # --- Layer A: measured (EMSA THETIS-MRV, reported & verified) ---
    "imo":                 ("measured", "EMSA THETIS-MRV", "-", "reported IMO number"),
    "name":                ("measured", "EMSA THETIS-MRV", "-", "reported ship name"),
    "ship_type":           ("measured", "EMSA THETIS-MRV", "-", "reported ship type"),
    "reporting_period":    ("measured", "EMSA THETIS-MRV", "year", "reporting year"),
    "tech_efficiency":     ("measured", "EMSA THETIS-MRV", "-", "EEDI/EIV where reported"),
    "total_fuel_mt":       ("measured", "EMSA THETIS-MRV", "m tonnes", "annual total fuel consumption"),
    "total_co2_mt":        ("measured", "EMSA THETIS-MRV", "m tonnes", "annual total CO2 emissions"),
    "fuel_per_dist_kg_nm": ("measured", "EMSA THETIS-MRV", "kg/n mile", "annual avg fuel per distance"),
    "time_at_sea_h":       ("measured", "EMSA THETIS-MRV", "hours", "annual time spent at sea"),
    "co2_per_dist_kg_nm":  ("measured", "EMSA THETIS-MRV", "kg CO2/n mile", "annual avg CO2 per distance"),
    "co2_per_dwt_g":       ("measured", "EMSA THETIS-MRV", "g CO2/dwt·nm", "annual avg CO2 per dwt transport work"),
    # --- Layer B1: derived (formula-documented) ---
    "distance_nm":         ("derived", "MRV", "n mile", "total_fuel_mt*1000 / fuel_per_dist_kg_nm"),
    "avg_speed_kn":        ("derived", "MRV", "knots", "distance_nm / time_at_sea_h"),
    "energy_gj":           ("derived", "MRV + VLSFO LHV", "GJ", "total_fuel_mt * LHV_ref (mixed-fuel proxy)"),
    "fuel_intensity_kg_nm":("derived", "MRV", "kg/n mile", "= fuel_per_dist_kg_nm (passthrough)"),
    "co2_fuel_ratio":      ("derived", "MRV", "tCO2/t fuel", "total_co2_mt / total_fuel_mt (sanity ~3.1)"),
    "dwt_carried":         ("derived", "MRV", "dwt", "co2_per_dist*1000 / co2_per_dwt (total CO2 cancels → deadweight; leakage-free size proxy)"),
    "gt":                  ("measured", "Global Fishing Watch registry", "gross tonnes", "external per-IMO gross tonnage (leakage-free size feature)"),
    # --- Layer B2: derived weather (ERA5) ---
    "wind_speed_ms":       ("derived", "ERA5 single-levels (India points)", "m/s", "sqrt(u10^2 + v10^2)"),
    "wind_dir_deg":        ("derived", "ERA5", "deg", "atan2(u10, v10) in [0,360)"),
    "swh":                 ("measured", "ERA5", "m", "significant wave height (reanalysis)"),
}


def provenance_records(fields=None):
    """Return provenance rows (master doc §8.5 schema) for the given fields (all by default)."""
    keys = fields if fields is not None else list(LEDGER)
    rows = []
    for k in keys:
        if k not in LEDGER:
            continue
        st, src, unit, formula = LEDGER[k]
        rows.append(dict(field_name=k, source_type=st, source_name=src, unit=unit,
                         transformation_formula=formula))
    return rows
