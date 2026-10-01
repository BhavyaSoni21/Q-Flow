"""Run store (master doc §16): persist every optimization/benchmark run with its
reproducibility manifest so no reported chart comes from an unrecorded experiment."""
import json
import os
import time
import uuid

RUNS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "runs"))


def new_run_id(prefix="OPT"):
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def save_run(manifest):
    """Persist a run manifest to results/runs/<run_id>.json (run_id generated if absent)."""
    os.makedirs(RUNS_DIR, exist_ok=True)
    rid = manifest.get("run_id") or new_run_id()
    manifest["run_id"] = rid
    manifest.setdefault("recorded_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    with open(os.path.join(RUNS_DIR, f"{rid}.json"), "w") as fh:
        json.dump(manifest, fh, indent=2, default=float)
    return rid


def load_run(run_id):
    path = os.path.join(RUNS_DIR, f"{run_id}.json")
    if not os.path.exists(path):
        return None
    with open(path) as fh:
        return json.load(fh)


def list_runs():
    if not os.path.isdir(RUNS_DIR):
        return []
    return sorted(f[:-5] for f in os.listdir(RUNS_DIR) if f.endswith(".json"))
