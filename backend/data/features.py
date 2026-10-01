"""Layer B1 — per-ship derived features from MRV (master doc §8.2).

Each feature documents its formula (see data/provenance.py). These are the
annual-average, ship-level signals the Strategy-A predictor calibrates on; the
annual-average speed in particular is the only speed signal MRV exposes.
"""
import numpy as np

from emissions.factors import DEFAULT_FUELS, REF_FUEL

_LHV_REF = DEFAULT_FUELS[REF_FUEL]["lhv"]   # GJ/t, VLSFO reference


def add_features(df):
    """Return a copy of a cleaned MRV frame with Layer-B1 derived columns added."""
    out = df.copy()
    # distance from reported total fuel and fuel-per-distance intensity
    out["distance_nm"] = out["total_fuel_mt"] * 1000.0 / out["fuel_per_dist_kg_nm"]
    # annual-average speed (the predictor's speed signal)
    out["avg_speed_kn"] = out["distance_nm"] / out["time_at_sea_h"]
    # energy proxy using the reference-fuel LHV (mixed-fuel assumption; labelled derived)
    out["energy_gj"] = out["total_fuel_mt"] * _LHV_REF
    # fuel intensity passthrough (kg/nm) and emission factor sanity ratio
    out["fuel_intensity_kg_nm"] = out["fuel_per_dist_kg_nm"]
    out["co2_fuel_ratio"] = out["total_co2_mt"] / out["total_fuel_mt"]
    # leakage-free size proxy: DWT carried = (CO2/distance) / (CO2/(dwt·distance)) — total CO2 cancels
    if {"co2_per_dist_kg_nm", "co2_per_dwt_g"} <= set(out.columns):
        with np.errstate(divide="ignore", invalid="ignore"):
            dwt = out["co2_per_dist_kg_nm"] * 1000.0 / out["co2_per_dwt_g"]
        out["dwt_carried"] = dwt.where(np.isfinite(dwt) & (dwt > 0))
    else:
        out["dwt_carried"] = np.nan
    return out


DERIVED_COLUMNS = ["distance_nm", "avg_speed_kn", "energy_gj", "fuel_intensity_kg_nm",
                   "co2_fuel_ratio", "dwt_carried"]
