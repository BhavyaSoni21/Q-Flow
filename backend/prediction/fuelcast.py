"""FuelCast real multi-vessel data loader + common feature contract.

Three ships (Poseidon, Triton, Ceto). We use the columns common to all three so
the multi-source / leave-one-vessel-out experiments are apples-to-apples.
Target = total momentary fuel. Source: Viga et al. 2026 (see docs/references.md),
CC-BY-NC-ND-4.0 — non-commercial research use, not redistributed.
"""
import glob
import os

import pandas as pd

FUELCAST_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "Datasets", "FuelCast"))

# predictive columns common to all three vessels (speed + weather/ocean state)
FEATURES = ["Ship_SpeedOverGround", "Weather_WindSpeed10M", "Weather_WindDirection10M",
            "Weather_WindGusts10M", "Weather_OceanCurrentVelocity", "Weather_OceanCurrentDirection",
            "Weather_WaveHeight", "Weather_WavePeriod", "Weather_WaveDirection",
            "Weather_SwellWaveHeight", "Weather_WindWaveHeight", "Weather_Temperature2M",
            "Weather_SurfacePressure", "Environment_SeaFloorDepth"]
TARGET = "Consumer_Total_MomentaryFuel"


def load_vessel(name):
    """Load one vessel's frame (features + target + vessel label), cleaned."""
    path = glob.glob(os.path.join(FUELCAST_DIR, f"{name}*.parquet"))[0]
    df = pd.read_parquet(path)
    cols = FEATURES + [TARGET]
    d = df[cols].apply(pd.to_numeric, errors="coerce")
    d = d[d[TARGET].notna() & (d[TARGET] >= 0) & d[FEATURES].notna().all(axis=1)].reset_index(drop=True)
    d["vessel"] = name
    return d


def load_all():
    """Return {vessel_name: DataFrame} for the three vessels."""
    names = [os.path.basename(f).split(".")[0] for f in sorted(glob.glob(os.path.join(FUELCAST_DIR, "*.parquet")))]
    return {n: load_vessel(n) for n in names}
