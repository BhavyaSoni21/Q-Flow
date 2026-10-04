"""On-demand benchmark compute with in-memory caching + committed-file fallback.

Optimizer benchmarks recompute live from the real engine (pure compute, no external
data). Prediction benchmarks recompute when the MRV training datasets are present
(local dev); on a deployment where the datasets are not shipped, they fall back to
the committed real results file. A process-wide lock serializes recomputes so a
burst of requests triggers at most one run per benchmark.
"""
import csv
import json
import os
import threading
import time

from api import engine_state as es  # noqa: F401  (ensures sys.path for fleet_engine/data/prediction)
from experiments import run_optimizer_benchmark as _opt
from experiments import run_prediction_benchmark as _pred

_METRICS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))
_LOCK = threading.Lock()
_CACHE = {}

# Live-compute settings — lighter than the offline run so an HTTP request returns
# promptly while still being real engine output. Tune down further for slow hosts.
_OPT_SEEDS, _OPT_POP, _OPT_ITERS = 4, 50, 50
_OPT_SCAL_SIZES, _OPT_SCAL_SEEDS = (10, 25, 50), 2


def _optimizer_from_file():
    path = os.path.join(_METRICS, "optimization_benchmark.json")
    if not os.path.exists(path):
        return None
    with open(path) as fh:
        return json.load(fh)


def _prediction_from_file():
    path = os.path.join(_METRICS, "prediction_benchmark.csv")
    if not os.path.exists(path):
        return None
    with open(path, newline="") as fh:
        return list(csv.DictReader(fh))


def get_optimizer(force=False):
    """Return {data, source, computed_at}. data is the frontend-shaped optimizer dict.

    Default serves the committed real results (fast, instant load). ``force`` recomputes
    live from the engine when explicitly requested by the user.
    """
    with _LOCK:
        cached = _CACHE.get("optimizer")
        if cached and not force:
            return cached
        if force:
            try:
                data = _opt.compute(seeds=_OPT_SEEDS, pop=_OPT_POP, iters=_OPT_ITERS,
                                    scalability_sizes=_OPT_SCAL_SIZES, scal_seeds=_OPT_SCAL_SEEDS)
                source = "computed"
            except Exception as e:
                data = _optimizer_from_file()
                source = f"file (compute failed: {e})"
        else:
            data = _optimizer_from_file()
            source = "file"
            if data is None:
                try:
                    data = _opt.compute(seeds=_OPT_SEEDS, pop=_OPT_POP, iters=_OPT_ITERS,
                                        scalability_sizes=_OPT_SCAL_SIZES, scal_seeds=_OPT_SCAL_SEEDS)
                    source = "computed"
                except Exception as e:
                    source = f"unavailable: {e}"
        res = dict(data=data, source=source, computed_at=time.time())
        if data is not None:
            _CACHE["optimizer"] = res
        return res


def get_prediction(force=False):
    """Return {data, source, computed_at}. data is a list of raw benchmark rows.

    Default serves the committed real results (fast, deterministic). ``force`` retrains
    live when the MRV datasets are present; if they are not (e.g. on the deployed host)
    it falls back to the committed file. Retraining is heavy, so it is never triggered
    implicitly on a page load — only on an explicit refresh.
    """
    with _LOCK:
        cached = _CACHE.get("prediction")
        if cached and not force:
            return cached
        if force:
            try:
                rows, _ = _pred.compute()
                source = "computed"
            except Exception as e:
                rows = _prediction_from_file()
                source = f"file (datasets not present: {e})"
        else:
            rows = _prediction_from_file()
            source = "file"
            if rows is None:  # no committed file — compute as a last resort
                try:
                    rows, _ = _pred.compute()
                    source = "computed"
                except Exception as e:  # pragma: no cover
                    source = f"unavailable: {e}"
        res = dict(data=rows, source=source, computed_at=time.time())
        if rows is not None:
            _CACHE["prediction"] = res
        return res
