"""Small operational contracts that close the remaining prototype roadmap gaps."""
import csv
import math
import os
from statistics import mean, stdev

from fastapi import APIRouter, HTTPException

from emissions import compliance, pathways
from prediction import digital_twin, registry

router = APIRouter(prefix="/api", tags=["roadmap"])


def _root():
    return os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))


@router.get("/digital-twins")
def list_digital_twins():
    path = os.path.join(_root(), "Datasets", "Synthetic", "vessel_telemetry.csv")
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as fh:
        ids = sorted({row["vessel_id"] for row in csv.DictReader(fh)})
    return [digital_twin.vessel_report(_root(), vessel_id) for vessel_id in ids]


@router.post("/fuels/sensitivity")
def fuel_sensitivity(payload: dict):
    requested_fuel = str(payload.get("fuel_id", ""))
    record = next((row for row in pathways.records() if str(row["fuel_id"]).lower() == requested_fuel.lower()), None)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Unknown fuel pathway: {requested_fuel}")
    fuel_id = record["fuel_id"]
    price_factor = float(payload.get("price_factor", 1.0))
    wtw_factor = float(payload.get("wtw_factor", 1.0))
    if price_factor <= 0 or wtw_factor <= 0:
        raise HTTPException(status_code=422, detail="sensitivity factors must be positive")
    return dict(fuel_id=fuel_id, baseline=record, scenarios=[
        dict(name="baseline", price_factor=1.0, wtw_factor=1.0,
             price=record.get("price"), wtw=record["wtw"]),
        dict(name="configured", price_factor=price_factor, wtw_factor=wtw_factor,
             price=round(float(record.get("price", 0)) * price_factor, 4),
             wtw=round(float(record["wtw"]) * wtw_factor, 4)),
    ], status="indicative_sensitivity")


@router.post("/compliance/annual")
def annual_compliance(payload: dict):
    rows = payload.get("years") or [payload]
    results = []
    for row in rows:
        ghg = float(row.get("ghg_tonnes", 0)); capacity = float(row.get("capacity_tonnes", 0)); distance = float(row.get("distance_nm", 0))
        if ghg < 0 or capacity <= 0 or distance <= 0:
            raise HTTPException(status_code=422, detail="each year requires non-negative ghg and positive capacity/distance")
        attained = ghg * 1_000_000 / (capacity * distance)
        limit = row.get("cii_limit")
        results.append(dict(year=row.get("year"), attained_cii=round(attained, 4), cii_limit=limit,
                            violation=round(compliance.cii_violation(attained, limit), 4),
                            satisfied=compliance.cii_satisfied(attained, limit)))
    return dict(results=results, status="indicative_only", unit="gCO2e/dwt-nm")


@router.post("/eacf/evaluate")
def evaluate_eacf(payload: dict):
    """Explicit prototype mapping: Explainability, Accounting, Constraints, Feasibility."""
    explanation = payload.get("explanation") or []
    ghg = float(payload.get("ghg_tonnes", 0)); cap = payload.get("ghg_cap_tonnes")
    violations = payload.get("constraint_violations") or []
    feasible = bool(payload.get("feasible", not violations)) and not violations
    accounting = dict(ghg_tonnes=ghg, cap_tonnes=cap,
                      cap_satisfied=compliance.ghg_cap_satisfied(ghg, cap))
    return dict(name="EACF", definition="Explainability, Accounting, Constraints, and Feasibility",
                explainability=dict(available=bool(explanation), drivers=explanation),
                accounting=accounting, constraints=dict(violations=violations, count=len(violations)),
                feasibility=dict(feasible=feasible), status="prototype_contract")
