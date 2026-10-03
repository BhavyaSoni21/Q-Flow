"""Shared engine state for the API: bootstraps imports, holds the vessel pool, and
installs the MRV-calibrated predictor (scale loaded from the model registry, so no
MRV reload at startup). Imported by app.py and the routers."""
import os
import sys
import hashlib

import numpy as np
import pandas as pd

_B = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _B not in sys.path:
    sys.path.insert(0, _B)                                   # data / prediction / emissions
_OPT = os.path.join(_B, "optimization")
if _OPT not in sys.path:
    sys.path.insert(0, _OPT)                                 # fleet_engine

import fleet_engine as fe                                    # noqa: E402
import road_fleet as rf                                      # noqa: E402
from prediction import physics_baseline as pb, registry      # noqa: E402
from data import fleet_db as fleet_store                       # noqa: E402

SCALE = 1.0
PREDICTOR_MODE = "physics_baseline_calibrated"
ACTIVE_MODEL = None
POOL = fleet_store.load_or_seed(fe.make_vessel_pool(10, seed=0))  # persistent synthetic ship fleet
ROAD_POOL = rf.make_vehicle_pool(10, seed=0)        # road fleet


def init_predictor():
    """Install the synthetic telemetry model when available, else physics fallback."""
    global SCALE, PREDICTOR_MODE, ACTIVE_MODEL
    meta = registry.load_metadata("engine_calibration")
    SCALE = float((meta or {}).get("scale", 1.0))
    if registry.has_model("synthetic_engine_xgb"):
        model = registry.load_model("synthetic_engine_xgb")
        ACTIVE_MODEL = model
        cols = ["speed_kn", "load_factor", "engine_power_kw", "weather_factor"]
        def transform(f):
            return pd.DataFrame({c: f[c] for c in cols})
        fe.set_predictor(fe.make_xgb_predictor(model, cols, transform=transform))
        PREDICTOR_MODE = "synthetic_telemetry_xgb"
    else:
        ACTIVE_MODEL = None
        fe.set_predictor(lambda f: np.maximum(pb.physics_fuel_rate_tph(f) * SCALE, 0.0))
        PREDICTOR_MODE = "physics_baseline_calibrated"
    return SCALE


def engine_metadata():
    """Return the predictor and data state used by live API calculations."""
    calibration = registry.load_metadata("engine_calibration") or {}
    model = registry.describe_model("synthetic_engine_xgb")
    root = os.path.normpath(os.path.join(_B, ".."))
    dataset_hashes = {}
    for rel in ("Datasets/Synthetic/MANIFEST.json", "models/metadata.json"):
        path = os.path.join(root, rel)
        if os.path.exists(path):
            digest = hashlib.sha256()
            with open(path, "rb") as fh:
                for block in iter(lambda: fh.read(1024 * 1024), b""):
                    digest.update(block)
            dataset_hashes[rel] = digest.hexdigest()
    return dict(
        predictor=PREDICTOR_MODE,
        model_version=(registry.load_metadata("synthetic_engine_xgb") or {}).get("model_version",
                       calibration.get("model_version", "physics-mrv-cal-v1")),
        calibration_scale=SCALE,
        calibration_basis=calibration.get("basis", "physics baseline default"),
        fleet_data_status="persistent_synthetic_pool",
        fuel_factor_status="versioned_representative_factors",
        scenario_storage_status="persistent_file",
        model_artifact_exists=model["artifact_exists"],
        model_artifact_sha256=model["artifact_sha256"],
        holdout_metrics=model["metadata"].get("holdout_metrics"),
        provenance_hashes=dataset_hashes,
    )


def vessel_by_id(vessel_id):
    if vessel_id is None:
        return POOL[0]
    return next((v for v in POOL if v["vessel_id"] == vessel_id), None)
