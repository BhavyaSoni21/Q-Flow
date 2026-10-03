"""Metadata, provenance, scenarios, experiment-log, and compliance routes."""
import glob
import os
from fastapi import APIRouter, HTTPException

from api import compat, engine_state as es
from data import fleet_db as fleet_store, provenance, scenario_store
from emissions import pathways
from experiments import results_store
from optimization import corridor
from prediction import digital_twin
from prediction import registry
from security.auth import require_role

router = APIRouter(prefix="/api", tags=["metadata"])


def _configured_secret(name):
    if os.environ.get(name):
        return True
    env_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if not os.path.exists(env_path):
        return False
    with open(env_path, encoding="utf-8") as fh:
        return any(line.strip().startswith(f"{name}=") and line.strip().split("=", 1)[1] for line in fh)

@router.get("/vessels")
def get_vessels(_role=require_role("viewer")):
    return [compat.vessel_to_frontend(v) for v in fleet_store.list_vessels()]


@router.post("/vessels")
def create_vessel(vessel: dict, _role=require_role("admin")):
    if fleet_store.get(vessel.get("vessel_id", "")) is not None:
        raise HTTPException(status_code=409, detail="vessel_id already exists")
    try:
        row = es.fe.validate_vessels([vessel])[0]
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    es.POOL.append(row)
    return fleet_store.save(row)


@router.put("/vessels/{vessel_id}")
def update_vessel(vessel_id: str, vessel: dict, _role=require_role("admin")):
    if fleet_store.get(vessel_id) is None:
        raise HTTPException(status_code=404, detail=f"Unknown vessel_id {vessel_id}")
    row = dict(vessel, vessel_id=vessel_id)
    try:
        row = es.fe.validate_vessels([row])[0]
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    for i, current in enumerate(es.POOL):
        if current["vessel_id"] == vessel_id:
            es.POOL[i] = row
            break
    return fleet_store.save(row)


@router.delete("/vessels/{vessel_id}")
def delete_vessel(vessel_id: str, _role=require_role("admin")):
    if fleet_store.get(vessel_id) is None:
        raise HTTPException(status_code=404, detail=f"Unknown vessel_id {vessel_id}")
    es.POOL[:] = [v for v in es.POOL if v["vessel_id"] != vessel_id]
    fleet_store.delete(vessel_id)
    return {"deleted": vessel_id}

@router.get("/vessels/{vessel_id}/availability-history")
def get_availability_history(vessel_id: str, limit: int = 100, _role=require_role("viewer")):
    if fleet_store.get(vessel_id) is None: raise HTTPException(status_code=404, detail=f"Unknown vessel_id {vessel_id}")
    return fleet_store.availability_history(vessel_id, limit)

@router.post("/vessels/{vessel_id}/availability")
def set_vessel_availability(vessel_id: str, payload: dict, _role=require_role("operator")):
    if "available" not in payload and "availability" not in payload: raise HTTPException(status_code=422, detail="available or availability is required")
    row = fleet_store.set_availability(vessel_id, payload.get("available", payload.get("availability")), payload.get("reason", ""))
    if row is None: raise HTTPException(status_code=404, detail=f"Unknown vessel_id {vessel_id}")
    for i, current in enumerate(es.POOL):
        if current["vessel_id"] == vessel_id: es.POOL[i] = row; break
    return row


@router.get("/status")
def get_status():
    """Expose active model and data-status labels for the live dashboard."""
    return es.engine_metadata()

@router.get("/fleet/storage")
def fleet_storage_status(_role=require_role("viewer")):
    return fleet_store.storage_status()

@router.post("/fleet/backups")
def create_fleet_backup(_role=require_role("admin")):
    return fleet_store.backup_database()


@router.get("/models")
def get_model_registry():
    return [registry.describe_model(name) for name in ("engine_calibration", "synthetic_engine_xgb", "fuel_intensity_xgb", "power_shifts_xgb", "fuel_road_trip_xgb")]

@router.get("/models/health")
def get_model_health():
    rows = [registry.describe_model(name) for name in ("synthetic_engine_xgb", "fuel_intensity_xgb", "power_shifts_xgb", "fuel_road_trip_xgb")]
    for row in rows:
        metrics = row["metadata"].get("holdout_metrics") or row["metadata"].get("pooled_metrics") or row["metadata"].get("in_domain_metrics") or {}
        row["health"] = "healthy" if row["artifact_exists"] and (metrics.get("r2") is None or float(metrics["r2"]) >= 0) else "review"
    return dict(status="ok", models=rows)

@router.post("/models/{name}/archive")
def archive_model(name: str, _role=require_role("admin")):
    try:
        return registry.archive_model(name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Model artifact not found: {name}")


@router.get("/data/status")
def get_data_status():
    """Report local dataset availability and optional live-ingestion configuration."""
    root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
    datasets = os.path.join(root, "Datasets")
    checks = {
        "mrv": bool(glob.glob(os.path.join(datasets, "MRV", "*.xlsx"))),
        "era5": bool(glob.glob(os.path.join(datasets, "ERA5", "*", "*.csv"))),
        "ais": bool(glob.glob(os.path.join(datasets, "AIS_stream", "*.csv"))),
        "gfw": os.path.exists(os.path.join(datasets, "vessel_registry", "gfw_particulars.csv")),
        "synthetic_extensions": os.path.exists(os.path.join(datasets, "Synthetic", "MANIFEST.json")),
    }
    return dict(datasets=checks, registry_artifact=os.path.exists(os.path.join(root, "artifacts", "data_registry.csv")),
                live_sources=dict(aisstream=_configured_secret("AISSTREAM_API_KEY"),
                                  global_fishing_watch=_configured_secret("GFW_API_TOKEN")))


@router.get("/digital-twins/{vessel_id}")
def get_digital_twin(vessel_id: str):
    root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
    report = digital_twin.vessel_report(root, vessel_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"No telemetry found for {vessel_id}")
    return report


@router.post("/corridors/optimize")
def optimize_corridor(payload: dict):
    root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
    origin, destination = payload.get("origin"), payload.get("destination")
    if not origin or not destination:
        raise HTTPException(status_code=422, detail="origin and destination are required")
    routes = corridor.select_routes(root, origin, destination, payload.get("preferred_fuel"))
    return {"origin": origin, "destination": destination, "routes": routes,
            "status": "development_only_synthetic_network"}


@router.post("/compliance/cii")
def calculate_cii(payload: dict):
    """Calculate an indicative operational CII-style intensity and cap result."""
    from emissions import compliance
    ghg_t = float(payload.get("ghg_tonnes", 0))
    capacity_t = float(payload.get("capacity_tonnes", 0))
    distance_nm = float(payload.get("distance_nm", 0))
    limit = payload.get("cii_limit")
    if ghg_t < 0 or capacity_t <= 0 or distance_nm <= 0:
        raise HTTPException(status_code=422, detail="ghg_tonnes must be non-negative; capacity and distance must be positive")
    attained = ghg_t * 1_000_000.0 / (capacity_t * distance_nm)
    return dict(attained_cii=round(attained, 4), cii_limit=limit,
                violation=round(compliance.cii_violation(attained, limit), 4),
                satisfied=compliance.cii_satisfied(attained, limit),
                status="indicative_only", unit="gCO2e/dwt-nm")


@router.get("/fuels")
def get_fuels():
    return compat.fuels_to_frontend()


@router.get("/fuels/pathways")
def get_fuel_pathways():
    return pathways.records()


@router.get("/road/vehicles")
def get_road_vehicles():
    return [compat.road_vehicle_to_frontend(v) for v in es.ROAD_POOL]


@router.get("/road/fuels")
def get_road_fuels():
    return compat.road_fuels_to_frontend()


@router.get("/provenance")
def get_provenance():
    rows = []
    for r in provenance.provenance_records():
        rows.append(dict(field=r["field_name"], type=r["source_name"], source=r["source_name"],
                         unit=r["unit"], status=r["source_type"].capitalize(), version="2024",
                         formula=r["transformation_formula"]))
    return rows


@router.get("/experiments")
def experiment_log(limit: int = 20):
    out = []
    for rid in results_store.list_runs()[-limit:]:
        m = results_store.load_run(rid) or {}
        out.append(dict(runId=m.get("run_id"), algorithm=m.get("algorithm"), seed=m.get("seed"),
                        population=m.get("population_size"), iterations=m.get("iterations"),
                        datasetVersion=m.get("dataset_version"), runtime=m.get("runtime_seconds"),
                        hypervolume=m.get("hypervolume"), feasibleRate=m.get("feasibility_rate"),
                        timestamp=m.get("recorded_at"),
                        config=dict(algorithm=m.get("algorithm"), objectives=m.get("objective_set"))))
    return out


@router.post("/scenarios")
def create_scenario(scenario: dict):
    return scenario_store.save(scenario)


@router.get("/scenarios")
def list_scenarios():
    return scenario_store.list_scenarios()


@router.post("/scenarios/compare")
def compare_scenarios(payload: dict):
    ids = payload.get("scenario_ids") or []
    rows = [scenario_store.get(sid) for sid in ids]
    found = [row for row in rows if row is not None]
    return dict(scenario_ids=ids, found=len(found), missing=[sid for sid, row in zip(ids, rows) if row is None], scenarios=found)


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    s = scenario_store.get(scenario_id)
    if s is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario_id {scenario_id}")
    return s
