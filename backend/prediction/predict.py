"""Engine predictor bridge (master doc §3 architectural rule): install an
MRV-calibrated predictor into the fleet engine via `set_predictor`, so the
optimizer evaluates every candidate with a data-grounded fuel model rather than
hard-coded values.
"""
import os
import sys

import numpy as np

# make the engine importable regardless of caller cwd (until packaging is finalised)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "optimization"))
import fleet_engine as fe
from prediction import physics_baseline as pb


def make_scaled_physics_predictor(scale=1.0):
    """Return an engine-compatible predictor: physics fuel rate × MRV calibration scale."""
    def _pred(f):
        return np.maximum(pb.physics_fuel_rate_tph(f) * scale, 0.0)
    return _pred


def install_calibrated_predictor(mrv_featured, pool=None, seed=0):
    """Calibrate the physics predictor to MRV magnitudes and plug it into the engine.
    Returns the scale used."""
    pool = pool if pool is not None else fe.make_vessel_pool(10, seed)
    scale = pb.calibrate_scale(mrv_featured, pool)
    fe.set_predictor(make_scaled_physics_predictor(scale))
    return scale
