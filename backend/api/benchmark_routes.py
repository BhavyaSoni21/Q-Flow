"""Benchmark routes (frontend contract): prediction + optimization comparisons."""
import csv
import json
import os

from fastapi import APIRouter, HTTPException

from experiments import results_store

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])
_METRICS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))

_MODEL_LABEL = {"mean_floor": "Mean baseline", "linear": "Linear Regression",
                "random_forest": "Random Forest", "xgboost": "XGBoost", "qpso_xgboost": "QPSO-tuned XGBoost"}
_PROTOCOL = {"chronological": "Time holdout", "vessel": "Vessel holdout"}


def _opt_section(key):
    path = os.path.join(_METRICS, "optimization_benchmark.json")
    if not os.path.exists(path):
        return []
    with open(path) as fh:
        return json.load(fh).get(key, [])


@router.get("/prediction")
def prediction_benchmark():
    path = os.path.join(_METRICS, "prediction_benchmark.csv")
    if not os.path.exists(path):
        return []
    out = []
    with open(path, newline="") as fh:
        for r in csv.DictReader(fh):
            out.append(dict(model=_MODEL_LABEL.get(r["model"], r["model"]),
                            mae=float(r["mae"]), rmse=float(r["rmse"]), r2=float(r["r2"]), smape=float(r["smape"]),
                            trainTime=float(r["train_s"]) if r.get("train_s") else None,
                            inferTime=float(r["infer_s"]) if r.get("infer_s") else None,
                            protocol=_PROTOCOL.get(r.get("split"), r.get("split"))))
    return out


@router.get("/optimization")
def optimization_benchmark(seed: int = 42):
    return _opt_section("table")


@router.get("/hv-curves")
def hv_curves(seed: int = 42):
    return _opt_section("hv_curves")


@router.get("/scalability")
def scalability(seed: int = 42):
    return _opt_section("scalability")


@router.get("/boxplot")
def boxplot(seed: int = 42):
    return _opt_section("boxplot")


@router.get("/{run_id}")
def get_run(run_id: str):
    r = results_store.load_run(run_id)
    if r is None:
        raise HTTPException(status_code=404, detail=f"Unknown run_id {run_id}")
    return r
