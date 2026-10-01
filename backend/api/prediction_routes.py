"""Prediction routes (frontend contract): POST /api/predict/fuel, GET /api/predict/scatter."""
import json
import os

from fastapi import APIRouter

from api import compat

router = APIRouter(prefix="/api/predict", tags=["prediction"])
_METRICS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))


@router.post("/fuel")
def predict_fuel(inp: dict):
    """React shape: {speed, loadFactor, enginePower, waveHeight, wind, seaState, draft, distance}."""
    return compat.predict_fuel_frontend(inp)


@router.get("/scatter")
def prediction_scatter(seed: int = 42):
    """Predicted-vs-actual points from the recorded holdout (empty until train_models runs)."""
    path = os.path.join(_METRICS, "prediction_scatter.json")
    if os.path.exists(path):
        with open(path) as fh:
            return json.load(fh)
    return []
