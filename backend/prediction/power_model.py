"""Speed-resolved operational power/fuel predictor (Shifts marine benchmark).

Learns power (kW) from operating + weather features (speed-through-water, drafts,
wind, current, waves, hull fouling) — the fuel-vs-speed response the fleet
optimizer needs. Power converts to reference-fuel rate via SFOC.

Data: Shifts 2.0 Marine Cargo Vessel Power Consumption (arXiv:2206.15407),
synthetic subset (labelled synthetic). Real multi-vessel data (FuelCast) can be
swapped in via the same FEATURES contract.
"""
import os

import numpy as np
import pandas as pd

FEATURES = ["draft_aft_telegram", "draft_fore_telegram", "stw", "diff_speed_overground",
            "awind_vcomp_provider", "awind_ucomp_provider", "rcurrent_vcomp", "rcurrent_ucomp",
            "comb_wind_swell_wave_height", "timeSinceDryDock"]
TARGET = "power"

SHIFTS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..",
                                           "Datasets", "power_consumption_upload", "synthetic_data"))
SFOC_G_PER_KWH = 180.0   # reference-fuel specific consumption for power->fuel conversion


def load_split(folder=None):
    """Return (train, dev_in, dev_out) DataFrames from the Shifts synthetic subset."""
    folder = folder or SHIFTS_DIR
    read = lambda n: pd.read_csv(os.path.join(folder, n))
    return read("train.csv"), read("dev_in.csv"), read("dev_out.csv")


def xy(df):
    return df[FEATURES].astype(float), df[TARGET].astype(float)


def power_to_fuel_tph(power_kw, sfoc_g_per_kwh=SFOC_G_PER_KWH):
    """Convert predicted power (kW) to reference-fuel rate (tonnes/hour)."""
    return np.maximum(np.asarray(power_kw, float), 0.0) * sfoc_g_per_kwh * 1e-6
