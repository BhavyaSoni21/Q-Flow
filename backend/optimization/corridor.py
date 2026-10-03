"""Small synthetic green-corridor selector for the prototype UI/API."""
import csv
import os


def _routes(root):
    path = os.path.join(root, "Datasets", "Synthetic", "port_network.csv")
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def select_routes(root, origin, destination, preferred_fuel=None):
    rows = [r for r in _routes(root) if r["origin"] == origin and r["destination"] == destination]
    if preferred_fuel:
        rows.sort(key=lambda r: (0 if r["fuel_id"] == preferred_fuel else 1, float(r["total_cost_index"])))
    else:
        rows.sort(key=lambda r: float(r["total_cost_index"]))
    return [{
        "origin": r["origin"], "destination": r["destination"], "distance_nm": float(r["distance_nm"]),
        "fuel_id": r["fuel_id"], "shore_power": r["shore_power"].lower() == "true",
        "delay_hours": float(r["delay_hours"]), "emissions_index": float(r["emissions_index"]),
        "total_cost_index": float(r["total_cost_index"]), "status": "development_only_synthetic_network",
    } for r in rows]
