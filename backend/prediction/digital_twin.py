"""Development-only telemetry summaries for adaptive vessel twin views."""
import csv
import os
from statistics import mean


def _rows(root):
    path = os.path.join(root, "Datasets", "Synthetic", "vessel_telemetry.csv")
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def vessel_report(root, vessel_id):
    rows = [r for r in _rows(root) if r.get("vessel_id") == vessel_id]
    if not rows:
        return None
    rates = [float(r["fuel_rate_tph"]) for r in rows]
    midpoint = max(1, len(rates) // 2)
    first, recent = rates[:midpoint], rates[midpoint:]
    baseline = mean(first)
    current = mean(recent or first)
    drift = (current - baseline) / baseline if baseline else 0.0
    return {
        "vessel_id": vessel_id, "sample_count": len(rows),
        "mean_speed_kn": round(mean(float(r["speed_kn"]) for r in rows), 3),
        "mean_fuel_rate_tph": round(mean(rates), 6),
        "baseline_fuel_rate_tph": round(baseline, 6),
        "recent_fuel_rate_tph": round(current, 6), "drift_pct": round(drift * 100, 3),
        "drift_detected": abs(drift) >= 0.10,
        "status": "development_only_synthetic_telemetry",
    }
