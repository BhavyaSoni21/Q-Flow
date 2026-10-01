"""Vessel-registry join (Strategy C): attach external per-IMO size (GFW gross
tonnage) onto the MRV frame. GT is sourced from Global Fishing Watch, independent
of MRV's reported fuel, so it is a leakage-free size feature (unlike MRV-derived DWT).
"""
import os

import pandas as pd

_GFW = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..",
                                     "Datasets", "vessel_registry", "gfw_particulars.csv"))


def load_registry(path=None):
    """Return a DataFrame[imo, gt] of fetched GFW gross tonnage (empty if not fetched yet)."""
    path = path or _GFW
    if not os.path.exists(path):
        return pd.DataFrame(columns=["imo", "gt"])
    df = pd.read_csv(path)
    if "gt" not in df.columns or "imo" not in df.columns:
        return pd.DataFrame(columns=["imo", "gt"])
    df = df[["imo", "gt"]].copy()
    df["imo"] = pd.to_numeric(df["imo"], errors="coerce").astype("Int64")
    df["gt"] = pd.to_numeric(df["gt"], errors="coerce")
    return df.dropna(subset=["imo"]).drop_duplicates("imo")


def attach_gt(frame, path=None):
    """Left-join GFW GT onto an MRV frame by IMO. Adds a `gt` column (NaN where unknown)."""
    reg = load_registry(path)
    if reg.empty:
        out = frame.copy()
        out["gt"] = pd.NA
        return out
    out = frame.copy()
    out["imo"] = pd.to_numeric(out["imo"], errors="coerce").astype("Int64")
    return out.merge(reg, on="imo", how="left")


def coverage(frame, path=None):
    """Fraction of frame rows that get a GT from the registry."""
    out = attach_gt(frame, path)
    return float(out["gt"].notna().mean())
