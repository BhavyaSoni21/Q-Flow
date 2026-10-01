"""Shared engine state for the API: bootstraps imports, holds the vessel pool, and
installs the MRV-calibrated predictor (scale loaded from the model registry, so no
MRV reload at startup). Imported by app.py and the routers."""
import os
import sys

import numpy as np

_B = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _B not in sys.path:
    sys.path.insert(0, _B)                                   # data / prediction / emissions
_OPT = os.path.join(_B, "optimization")
if _OPT not in sys.path:
    sys.path.insert(0, _OPT)                                 # fleet_engine

import fleet_engine as fe                                    # noqa: E402
import road_fleet as rf                                      # noqa: E402
from prediction import physics_baseline as pb, registry      # noqa: E402

SCALE = 1.0
POOL = fe.make_vessel_pool(10, seed=0)              # ship fleet
ROAD_POOL = rf.make_vehicle_pool(10, seed=0)        # road fleet


def init_predictor():
    """Install the physics predictor scaled by the saved MRV calibration (default 1.0)."""
    global SCALE
    meta = registry.load_metadata("engine_calibration")
    SCALE = float((meta or {}).get("scale", 1.0))
    fe.set_predictor(lambda f: np.maximum(pb.physics_fuel_rate_tph(f) * SCALE, 0.0))
    return SCALE


def vessel_by_id(vessel_id):
    if vessel_id is None:
        return POOL[0]
    return next((v for v in POOL if v["vessel_id"] == vessel_id), None)
