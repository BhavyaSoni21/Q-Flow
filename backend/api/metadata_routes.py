"""Metadata, provenance, scenarios, experiment-log routes (frontend contract)."""
from fastapi import APIRouter, HTTPException

from api import compat, engine_state as es
from data import provenance
from experiments import results_store

router = APIRouter(prefix="/api", tags=["metadata"])

_SCENARIOS = {}


@router.get("/vessels")
def get_vessels():
    return [compat.vessel_to_frontend(v) for v in es.POOL]


@router.get("/fuels")
def get_fuels():
    return compat.fuels_to_frontend()


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
    sid = scenario.get("scenario_id") or f"SCN{len(_SCENARIOS) + 1:03d}"
    scenario["scenario_id"] = sid
    _SCENARIOS[sid] = scenario
    return scenario


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    s = _SCENARIOS.get(scenario_id)
    if s is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario_id {scenario_id}")
    return s
