"""Model registry (master doc §16, §17): persist/load trained models + metadata
so the API loads an artifact instead of retraining on every start.

joblib is used for the fitted sklearn pipelines (TransformedTargetRegressor wrapping
XGBoost/RF). Artifacts are version-sensitive — load only under matching
scikit-learn / xgboost versions, and only load files we produced.
"""
import json
import os
import time

import joblib

MODELS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))
_META = os.path.join(MODELS_DIR, "metadata.json")


def _ensure():
    os.makedirs(MODELS_DIR, exist_ok=True)


def model_path(name):
    return os.path.join(MODELS_DIR, f"{name}.joblib")


def save_model(model, name, metadata=None):
    """Dump a fitted model to models/<name>.joblib and merge its metadata."""
    _ensure()
    joblib.dump(model, model_path(name))
    meta = dict(metadata or {})
    meta.setdefault("saved_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    save_metadata(name, meta)
    return model_path(name)


def load_model(name):
    """Load a fitted model artifact (raises FileNotFoundError if missing)."""
    return joblib.load(model_path(name))


def has_model(name):
    return os.path.exists(model_path(name))


def save_metadata(name, meta):
    """Merge `meta` into models/metadata.json under key `name`."""
    _ensure()
    allm = load_metadata()
    allm[name] = meta
    with open(_META, "w") as fh:
        json.dump(allm, fh, indent=2)


def load_metadata(name=None):
    """Return the whole metadata dict, or one model's entry."""
    if not os.path.exists(_META):
        return {} if name is None else None
    with open(_META) as fh:
        allm = json.load(fh)
    return allm if name is None else allm.get(name)
