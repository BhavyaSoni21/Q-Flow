"""VED (Vehicle Energy Dataset) loader + road feature contract — ROAD mode.

Real-world OBD driving data, 383 vehicles (ICE/HEV/EV), Ann Arbor, Apache-2.0.
Target = instantaneous Fuel Rate [L/hr] (ICE/HEV). Features are decision-relevant /
environmental (speed, acceleration, outside temp, vehicle weight/type/class) — we
deliberately EXCLUDE MAF (≈ fuel, leakage) and RPM/Absolute-Load (downstream of speed,
not independently settable by the optimizer), mirroring the ship speed→power model.
Entity key = VehId (for leave-one-vehicle-out, like FuelCast).
"""
import glob
import os

import numpy as np
import pandas as pd

VED_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Datasets", "VED"))
DYN_DIR = os.path.join(VED_DIR, "dynamic")

_SPEED = "Vehicle Speed[km/h]"
_FUEL = "Fuel Rate[L/hr]"
_MAF = "MAF[g/sec]"
_OAT = "OAT[DegC]"
_USECOLS = ["DayNum", "VehId", "Trip", "Timestamp(ms)", _SPEED, _MAF, _OAT, _FUEL]

# VED's Fuel Rate PID is sparse; most ICE vehicles log MAF. Derive fuel from MAF by
# stoichiometry when Fuel Rate is absent: fuel[L/hr] = MAF[g/s] / AFR / density * 3600.
_AFR = 14.7            # stoichiometric air-fuel ratio (gasoline)
_FUEL_DENSITY = 737.0  # g/L (gasoline)


def _fuel_rate_lhr(fuel_rate, maf):
    """Reported Fuel Rate where > 0, else MAF-derived fuel rate (L/hr)."""
    fr = pd.to_numeric(fuel_rate, errors="coerce")
    maf_lhr = pd.to_numeric(maf, errors="coerce") / _AFR / _FUEL_DENSITY * 3600.0
    return fr.where(fr > 0, maf_lhr)


FEATURES = ["speed_kmh", "accel_ms2", "oat_c", "weight_lb", "veh_type", "veh_class"]
NUMERIC = ["speed_kmh", "accel_ms2", "oat_c", "weight_lb"]
TARGET = "fuel_rate_lhr"


def _static_map():
    """VehId -> (type, class, weight) from the two static Excel files."""
    frames = []
    for f in glob.glob(os.path.join(VED_DIR, "Data", "VED_Static_Data_*.xlsx")):
        d = pd.read_excel(f)
        d.columns = [str(c).strip() for c in d.columns]
        keep = {"VehId": "VehId", "Vehicle Type": "veh_type", "Vehicle Class": "veh_class",
                "Generalized_Weight": "weight_lb"}
        cols = [c for c in keep if c in d.columns]
        frames.append(d[cols].rename(columns=keep))
    s = pd.concat(frames, ignore_index=True).drop_duplicates("VehId")
    s["weight_lb"] = pd.to_numeric(s["weight_lb"], errors="coerce")
    return s


def load_sample(n_files=8, seed=0):
    """Load a sample of weekly dynamic files, derive features, join static metadata.
    Returns a cleaned DataFrame with FEATURES + TARGET + VehId."""
    files = sorted(glob.glob(os.path.join(DYN_DIR, "**", "*.csv"), recursive=True))
    if not files:
        raise FileNotFoundError(f"No VED dynamic CSVs in {DYN_DIR} (extract the 7z first)")
    rng = np.random.default_rng(seed)
    pick = sorted(rng.choice(len(files), size=min(n_files, len(files)), replace=False))
    df = pd.concat([pd.read_csv(files[i], usecols=lambda c: c in _USECOLS) for i in pick],
                   ignore_index=True)
    df = df.rename(columns={_SPEED: "speed_kmh", _OAT: "oat_c", _FUEL: "fuel_raw"})
    df = df.apply(lambda s: pd.to_numeric(s, errors="coerce") if s.name != "VehId" else s)
    df[TARGET] = _fuel_rate_lhr(df["fuel_raw"], df[_MAF])   # reported, else MAF-derived

    # acceleration (m/s^2) within each (VehId, Trip), from speed + timestamp deltas
    df = df.sort_values(["VehId", "Trip", "Timestamp(ms)"])
    g = df.groupby(["VehId", "Trip"], sort=False)
    dv = g["speed_kmh"].diff() / 3.6                       # km/h -> m/s
    dt = g["Timestamp(ms)"].diff() / 1000.0               # ms -> s
    df["accel_ms2"] = (dv / dt).replace([np.inf, -np.inf], np.nan)

    df = df.merge(_static_map(), on="VehId", how="left")
    # ICE/HEV fuel rows only, plausible ranges
    df = df[df[TARGET].notna() & (df[TARGET] >= 0) & (df[TARGET] < 100)
            & df["speed_kmh"].between(0, 200) & df["accel_ms2"].between(-8, 8)]
    df["oat_c"] = df["oat_c"].fillna(df["oat_c"].median())
    df["weight_lb"] = df["weight_lb"].fillna(df["weight_lb"].median())
    df["veh_type"] = df["veh_type"].fillna("ICE")
    df["veh_class"] = df["veh_class"].fillna("Car")
    return df.reset_index(drop=True)


def xy(df):
    """Return (X, y) with one-hot vehicle type/class."""
    X = pd.get_dummies(df[FEATURES], columns=["veh_type", "veh_class"])
    return X.astype(float), df[TARGET].astype(float)


# ---------------------------------------------------------------------------
# Trip-level aggregation (the decision-relevant target: fuel per km per trip)
# ---------------------------------------------------------------------------
TRIP_FEATURES = ["avg_speed_kmh", "speed_std", "moving_frac", "dist_km", "oat_c",
                 "weight_lb", "veh_type", "veh_class"]
TRIP_NUMERIC = ["avg_speed_kmh", "speed_std", "moving_frac", "dist_km", "oat_c", "weight_lb"]
TRIP_TARGET = "fuel_per_km"


def load_trips(n_files=20, seed=0):
    """Aggregate 1 Hz samples to one row per (VehId, Trip): fuel-per-km + trip features.
    Smoother and route-relevant (what the optimizer needs) vs noisy per-second rate."""
    files = sorted(glob.glob(os.path.join(DYN_DIR, "**", "*.csv"), recursive=True))
    if not files:
        raise FileNotFoundError(f"No VED dynamic CSVs in {DYN_DIR} (extract the 7z first)")
    rng = np.random.default_rng(seed)
    pick = sorted(rng.choice(len(files), size=min(n_files, len(files)), replace=False))
    df = pd.concat([pd.read_csv(files[i], usecols=lambda c: c in _USECOLS) for i in pick],
                   ignore_index=True)
    df = df.rename(columns={_SPEED: "speed_kmh", _OAT: "oat_c", _FUEL: "fuel_raw"})
    for c in ["speed_kmh", "oat_c", "Timestamp(ms)", "Trip"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df["fuel_lhr"] = _fuel_rate_lhr(df["fuel_raw"], df[_MAF])   # reported, else MAF-derived
    df = df.sort_values(["VehId", "Trip", "Timestamp(ms)"])
    dt_hr = (df.groupby(["VehId", "Trip"], sort=False)["Timestamp(ms)"].diff() / 3.6e6).clip(0, 0.02)
    df["fuel_l"] = (df["fuel_lhr"] * dt_hr).fillna(0.0)
    df["dist_km"] = (df["speed_kmh"] * dt_hr).fillna(0.0)
    g = df.groupby(["VehId", "Trip"], sort=False)
    trips = g.agg(fuel_l=("fuel_l", "sum"), dist_km=("dist_km", "sum"),
                  avg_speed_kmh=("speed_kmh", "mean"), speed_std=("speed_kmh", "std"),
                  moving_frac=("speed_kmh", lambda s: float((s > 5).mean())),
                  oat_c=("oat_c", "mean")).reset_index()
    trips = trips.merge(_static_map(), on="VehId", how="left")
    trips[TRIP_TARGET] = trips["fuel_l"] / trips["dist_km"]
    trips = trips[(trips["dist_km"] > 1.0) & (trips["fuel_l"] > 0) & trips[TRIP_TARGET].between(0.01, 1.0)]
    for c, d in [("oat_c", trips["oat_c"].median()), ("weight_lb", trips["weight_lb"].median()),
                 ("speed_std", 0.0)]:
        trips[c] = trips[c].fillna(d)
    trips["veh_type"] = trips["veh_type"].fillna("ICE")
    trips["veh_class"] = trips["veh_class"].fillna("Car")
    return trips.reset_index(drop=True)


def trip_xy(df):
    X = pd.get_dummies(df[TRIP_FEATURES], columns=["veh_type", "veh_class"])
    return X.astype(float), df[TRIP_TARGET].astype(float)

