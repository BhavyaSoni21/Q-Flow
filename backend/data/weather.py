"""Layer B2 — ERA5 weather features and data-grounded weather scenarios
(master doc §8.2 weather, §8.3 scenarios). Point time-series for the Indian
coasts (west = Arabian Sea off Mumbai, east = Bay of Bengal off Chennai).

ERA5 is NOT joined to MRV ship-rows (MRV has no position/time); these features
parameterise the optimizer's weather SCENARIOS, replacing the hand-set
normal/adverse/severe multipliers with distribution-derived ones.
"""
import glob
import os

import numpy as np
import pandas as pd

# repo-root/Datasets/ERA5, resolved from this file so it works regardless of cwd
ERA5_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "Datasets", "ERA5"))


def wind_speed_dir(u10, v10):
    """Wind speed (m/s) and direction (deg clockwise from north, toward which it blows)."""
    speed = np.sqrt(np.asarray(u10, float) ** 2 + np.asarray(v10, float) ** 2)
    direction = (np.degrees(np.arctan2(u10, v10)) + 360.0) % 360.0
    return speed, direction


def load_era5_point(side, folder=None):
    """Load one coast ('west' or 'east'): merge surface + wave CSVs on valid_time."""
    base = os.path.join(folder or ERA5_DIR, side)
    sfc_f = glob.glob(os.path.join(base, "*sfc*.csv"))
    wav_f = glob.glob(os.path.join(base, "*wav*.csv"))
    if not sfc_f or not wav_f:
        raise FileNotFoundError(f"ERA5 {side}: need one *sfc* and one *wav* csv in {base}")
    sfc = pd.read_csv(sfc_f[0])
    wav = pd.read_csv(wav_f[0])
    df = sfc.merge(wav, on=["valid_time", "latitude", "longitude"], how="inner")
    df["wind_speed_ms"], df["wind_dir_deg"] = wind_speed_dir(df["u10"], df["v10"])
    df["side"] = side
    return df


def weather_scenarios(df, sensitivity=0.15):
    """Derive normal/adverse/severe power multipliers from the swh distribution.

    Baseline (normal) = median sea state → multiplier 1.0. Added resistance scales
    with wave height via a documented sensitivity k: mult = max(1, 1 + k·(swh/swh_med − 1)).
    adverse = 90th pct, severe = 99th pct. Percentiles are data-grounded; k=0.15 is a
    stated assumption chosen so the rougher coast's p99 sea ≈ +35% power (≈ the
    handoff's severe=1.35), tunable against trials.
    """
    swh = df["swh"].dropna()
    wind = df["wind_speed_ms"].dropna()
    ref = float(swh.quantile(0.50))
    bands = {"normal": 0.50, "adverse": 0.90, "severe": 0.99}
    out = {}
    for name, q in bands.items():
        s = float(swh.quantile(q))
        mult = max(1.0, 1.0 + sensitivity * (s / ref - 1.0)) if ref > 0 else 1.0
        out[name] = dict(swh_m=round(s, 2), wind_ms=round(float(wind.quantile(q)), 2),
                         power_multiplier=round(mult, 3))
    return out
