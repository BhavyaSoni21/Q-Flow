"""MRV cleaning & validation (master doc §5.4 leakage-safety prep, §2 input checks).

Drops ship-years that cannot yield a usable training row and clips to physically
plausible ranges. Every rule is explicit so the filtered count is auditable.
"""
import numpy as np

REQUIRED_POSITIVE = ["total_fuel_mt", "time_at_sea_h", "fuel_per_dist_kg_nm"]

# plausibility windows for derived annual-average speed (knots)
MIN_SPEED_KN = 1.0
MAX_SPEED_KN = 40.0


def clean_mrv(df, report=False):
    """Return a cleaned copy: valid required fields, positive, speed-plausible.

    If report=True also returns a dict of how many rows each rule removed.
    """
    n0 = len(df)
    out = df.copy()
    counts = {"start": n0}

    # 1. required fields present & positive
    mask = np.ones(len(out), bool)
    for c in REQUIRED_POSITIVE:
        step = out[c].notna() & (out[c] > 0)
        counts[f"drop_{c}"] = int((~step & mask).sum())
        mask &= step
    out = out[mask]

    # 2. plausible derived speed = distance / time at sea
    dist = out["total_fuel_mt"] * 1000.0 / out["fuel_per_dist_kg_nm"]
    speed = dist / out["time_at_sea_h"]
    plausible = speed.between(MIN_SPEED_KN, MAX_SPEED_KN)
    counts["drop_implausible_speed"] = int((~plausible).sum())
    out = out[plausible].reset_index(drop=True)

    counts["kept"] = len(out)
    return (out, counts) if report else out
