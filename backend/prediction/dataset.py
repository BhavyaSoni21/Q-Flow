"""Build the MRV machine-learning task (master doc §5.1-5.2, Strategy A).

TASK (leakage-safe): predict annual **fuel-per-distance intensity** (kg/n mile)
from design/operational features that are INDEPENDENT of the target —
ship type, technical efficiency (EEDI/EIV), reporting year, time at sea.

Why not predict fuel-rate from derived avg-speed? In MRV, distance and avg-speed
are themselves derived from reported fuel, so avg-speed is entangled with a
fuel-rate target (circularity). Fuel-per-distance vs. {type, efficiency} is a
clean, non-circular regression on reported quantities.
"""
import re

import numpy as np
import pandas as pd

TARGET = "fuel_per_dist_kg_nm"
# Strategy C: GFW gross tonnage (gt) is a leakage-free size feature (~79% coverage),
# unlike the MRV-derived DWT (10% coverage) that was tried and reverted in m2.
NUMERIC_FEATURES = ["tech_efficiency_num", "year", "time_at_sea_h", "gt", "log_gt"]
CATEGORICAL_FEATURES = ["ship_type"]


def parse_tech_efficiency(series):
    """Extract the numeric gCO2/t·nm value from strings like 'EIV (82.46 gCO₂/t·nm)'."""
    def _num(v):
        m = re.search(r"[-+]?\d*\.?\d+", str(v))
        return float(m.group()) if m else np.nan
    return series.map(_num)


def build_xy(df, dropna=True):
    """Return (X, y, feature_names) for the fuel-intensity task from a featured MRV frame.

    Numeric features are median-imputed (so ships with a sparse metric aren't dropped).
    """
    d = df.copy()
    d["tech_efficiency_num"] = parse_tech_efficiency(d["tech_efficiency"])
    if "gt" in d.columns:
        d["log_gt"] = np.log1p(pd.to_numeric(d["gt"], errors="coerce"))

    for c in NUMERIC_FEATURES:
        if c not in d.columns:
            d[c] = np.nan
        d[c] = pd.to_numeric(d[c], errors="coerce")
        med = d[c].median()
        d[c] = d[c].fillna(med if pd.notna(med) else 0.0)

    X = d[NUMERIC_FEATURES].copy()
    dummies = pd.get_dummies(d["ship_type"].astype(str), prefix="type")
    X = pd.concat([X.reset_index(drop=True), dummies.reset_index(drop=True)], axis=1)
    y = d[TARGET].reset_index(drop=True)
    if dropna:
        keep = X.notna().all(axis=1) & y.notna()
        X, y = X[keep].reset_index(drop=True), y[keep].reset_index(drop=True)
    return X.astype(float), y.astype(float), list(X.columns)
