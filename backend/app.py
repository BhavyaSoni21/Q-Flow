"""Q-Flow backend API (FastAPI) — master doc §10 endpoints.

Routes: /api/predict/fuel, /api/optimize/fleet (+ runs), /api/benchmarks/*,
/api/vessels, /api/fuels, /api/provenance, /api/scenarios.

Run:  cd backend && uvicorn app:app --reload --port 8000

SECURITY NOTE: CORS defaults to open ("*") for local dev. For anything shared,
set CORS_ORIGINS to a comma-separated allow-list of frontend origins
(e.g. CORS_ORIGINS="https://app.example.com") and add authentication.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import engine_state as es
from api import benchmark_routes, metadata_routes, optimization_routes, prediction_routes, roadmap_routes

app = FastAPI(title="Q-Flow API", version="0.6.0")

# CORS allow-list: "*" (default, dev only) or a comma-separated list of origins.
_cors = os.environ.get("CORS_ORIGINS", "*").strip()
_allow_origins = ["*"] if _cors == "*" else [o.strip() for o in _cors.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
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
app.include_router(roadmap_routes.router)
