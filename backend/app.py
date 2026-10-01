"""Q-Flow backend API (FastAPI) — master doc §10 endpoints.

Routes: /api/predict/fuel, /api/optimize/fleet (+ runs), /api/benchmarks/*,
/api/vessels, /api/fuels, /api/provenance, /api/scenarios.

Run:  cd backend && uvicorn app:app --reload --port 8000

SECURITY NOTE: CORS is open and there is NO authentication — this is a local
hackathon/demo server. Do not expose it publicly without adding auth + locking CORS.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import engine_state as es
from api import benchmark_routes, metadata_routes, optimization_routes, prediction_routes

app = FastAPI(title="Q-Flow API", version="0.6.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev only — lock to the frontend origin for anything shared
    allow_methods=["*"],
    allow_headers=["*"],
)

# install the MRV-calibrated predictor into the engine (scale from the model registry)
CALIBRATION_SCALE = es.init_predictor()


@app.get("/api/health")
def health():
    return {"status": "ok", "calibration_scale": es.SCALE, "vessels": len(es.POOL)}


app.include_router(prediction_routes.router)
app.include_router(optimization_routes.router)
app.include_router(benchmark_routes.router)
app.include_router(metadata_routes.router)
