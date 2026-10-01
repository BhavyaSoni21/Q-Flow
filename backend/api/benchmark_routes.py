"""Benchmark routes (frontend contract): prediction + optimization comparisons.

Numbers are produced live by the real engine/model code via ``benchmark_service``
(cached in memory; ``?force=true`` recomputes). The prediction benchmark falls back
to the committed real results file on hosts where the training datasets are absent.
"""
from fastapi import APIRouter, HTTPException

from experiments import benchmark_service as bs
from experiments import results_store

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])

_MODEL_LABEL = {"mean_floor": "Mean baseline", "linear": "Linear Regression",
                "random_forest": "Random Forest", "xgboost": "XGBoost", "qpso_xgboost": "QPSO-tuned XGBoost"}
_PROTOCOL = {"chronological": "Time holdout", "vessel": "Vessel holdout"}


def _f(v):
    return float(v) if v not in (None, "", "None") else None


def _prediction_rows(force=False):
    res = bs.get_prediction(force)
    out = []
    for r in res["data"] or []:
        out.append(dict(model=_MODEL_LABEL.get(r["model"], r["model"]),
                        mae=float(r["mae"]), rmse=float(r["rmse"]), r2=float(r["r2"]), smape=float(r["smape"]),
                        trainTime=_f(r.get("train_s")), inferTime=_f(r.get("infer_s")),
                        protocol=_PROTOCOL.get(r.get("split"), r.get("split"))))
    return out, res["source"]


@router.get("/prediction")
def prediction_benchmark(force: bool = False):
    rows, _ = _prediction_rows(force)
    return rows


@router.get("/optimizer")
def optimizer_all(force: bool = False):
    """Combined optimizer benchmark (one compute): table + hv curves + scalability + boxplot."""
    res = bs.get_optimizer(force)
    d = res["data"] or {}
    pred, pred_src = _prediction_rows(force)
    return dict(table=d.get("table", []), hvCurves=d.get("hv_curves", []),
                scalability=d.get("scalability", []), boxplot=d.get("boxplot", []),
                prediction=pred, source=res["source"], predictionSource=pred_src)


def _opt_data(force=False):
    return bs.get_optimizer(force)["data"] or {}


@router.get("/optimization")
def optimization_benchmark(seed: int = 42):
    return _opt_data().get("table", [])


@router.get("/hv-curves")
def hv_curves(seed: int = 42):
    return _opt_data().get("hv_curves", [])


@router.get("/scalability")
def scalability(seed: int = 42):
    return _opt_data().get("scalability", [])


@router.get("/boxplot")
def boxplot(seed: int = 42):
    return _opt_data().get("boxplot", [])


@router.get("/{run_id}")
def get_run(run_id: str):
    r = results_store.load_run(run_id)
    if r is None:
        raise HTTPException(status_code=404, detail=f"Unknown run_id {run_id}")
    return r
