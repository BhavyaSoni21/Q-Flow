"""Model registry (master doc §16, §17): persist/load trained models + metadata
so the API loads an artifact instead of retraining on every start.

joblib is used for the fitted sklearn pipelines (TransformedTargetRegressor wrapping
XGBoost/RF). Artifacts are version-sensitive — load only under matching
scikit-learn / xgboost versions, and only load files we produced.
"""
import json
import hashlib
import os
import time
import shutil

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


def describe_model(name):
    """Return auditable metadata without loading the model into memory."""
    meta = load_metadata(name) or {}
    path = model_path(name)
    digest = None
    if os.path.exists(path):
        h = hashlib.sha256()
        with open(path, "rb") as fh:
            for block in iter(lambda: fh.read(1024 * 1024), b""):
                h.update(block)
        digest = h.hexdigest()
    return dict(name=name, artifact_exists=os.path.exists(path), artifact_sha256=digest, metadata=meta)


def archive_model(name):
    """Copy an active model and metadata into a timestamped rollback archive."""
    path = model_path(name)
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    archive_dir = os.path.join(MODELS_DIR, "archive", name)
    os.makedirs(archive_dir, exist_ok=True)
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    target = os.path.join(archive_dir, f"{stamp}.joblib")
    shutil.copy2(path, target)
    with open(f"{target}.json", "w", encoding="utf-8") as fh:
        json.dump(describe_model(name), fh, indent=2)
    return dict(name=name, archive_path=target, metadata_path=f"{target}.json")


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
