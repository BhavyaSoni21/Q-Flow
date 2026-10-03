"""Generate clearly labelled development-only datasets from repository context.

These files support prototype calibration and testing. They are not measured
telemetry, market data, port records, or regulatory evidence.
"""
import csv
import json
import math
import os
from datetime import date

import numpy as np

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "Datasets", "Synthetic")


def _write(name, rows, fields):
    with open(os.path.join(OUT, name), "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def generate(seed=20261003):
    rng = np.random.default_rng(seed)
    os.makedirs(OUT, exist_ok=True)

    fuels = [
        ("vlsfo", 50000), ("lng", 62000), ("methanol_grey", 70000),
        ("methanol_green", 92000), ("ammonia_green", 115000), ("hydrogen_green", 150000),
    ]
    prices, level = [], {fuel: base for fuel, base in fuels}
    for month in range(60):
        year, m = divmod(month, 12)
        stamp = f"{2021 + year:04d}-{m + 1:02d}"
        for fuel, _ in fuels:
            level[fuel] *= float(np.exp(rng.normal(0.002, 0.035)))
            prices.append(dict(month=stamp, fuel_id=fuel, price_inr_per_t=round(level[fuel], 2),
                               source_type="synthetic", source_basis="seeded_market_proxy", seed=seed))

    _write("fuel_prices_monthly.csv", prices, ["month", "fuel_id", "price_inr_per_t", "source_type", "source_basis", "seed"])

    delays = []
    ports = ["MUMBAI", "KOCHI", "CHENNAI", "KOLKATA", "SINGAPORE"]
    weather_states = [("normal", 1.0), ("adverse", 1.25), ("severe", 1.65)]
    for i in range(5000):
        weather, multiplier = weather_states[i % len(weather_states)]
        delay = max(0.0, float(rng.gamma(2.2, 1.1) * multiplier + rng.normal(0, 0.35)))
        delays.append(dict(record_id=f"D{i + 1:06d}", port=ports[i % len(ports)], weather=weather,
                           delay_hours=round(delay, 3), source_type="synthetic",
                           source_basis="seeded_weather_conditioned_proxy", seed=seed))
    _write("port_delays.csv", delays, ["record_id", "port", "weather", "delay_hours", "source_type", "source_basis", "seed"])

    telemetry = []
    for i in range(10000):
        vessel = f"SYN-V{i % 50 + 1:03d}"
        speed = float(np.clip(rng.normal(14, 1.8), 8, 19))
        load = float(np.clip(rng.normal(0.72, 0.12), 0.25, 1.0))
        power = float(np.clip(rng.normal(12000, 1800), 3500, 24000))
        weather_factor = float(np.clip(rng.normal(1.08, 0.12), 0.85, 1.5))
        fuel_rate = power * (speed / 14) ** 3 * (0.65 + 0.35 * load) * weather_factor * 180e-6
        fuel_rate *= float(np.exp(rng.normal(0, 0.045)))
        telemetry.append(dict(timestamp=f"2025-{i // 24 % 12 + 1:02d}-{i % 28 + 1:02d}T{ i % 24:02d}:00:00Z",
                              vessel_id=vessel, speed_kn=round(speed, 3), load_factor=round(load, 4),
                              engine_power_kw=round(power, 2), weather_factor=round(weather_factor, 4),
                              fuel_rate_tph=round(max(fuel_rate, 0), 6), source_type="synthetic",
                              source_basis="MRV-calibrated_physics_proxy", seed=seed))
    _write("vessel_telemetry.csv", telemetry,
            ["timestamp", "vessel_id", "speed_kn", "load_factor", "engine_power_kw", "weather_factor",
             "fuel_rate_tph", "source_type", "source_basis", "seed"])

    network = []
    corridor_pairs = [("MUMBAI", "SINGAPORE", 2100), ("KOCHI", "SINGAPORE", 1700),
                      ("CHENNAI", "SINGAPORE", 1450), ("KOLKATA", "SINGAPORE", 2300)]
    fuel_options = [("vlsfo", False, 1.0, 1.0), ("lng", True, 0.72, 1.12),
                    ("methanol_green", True, 0.34, 1.38)]
    for origin, destination, distance in corridor_pairs:
        for fuel_id, shore_power, emissions, cost in fuel_options:
            network.append(dict(origin=origin, destination=destination, distance_nm=distance,
                                fuel_id=fuel_id, shore_power=str(shore_power),
                                delay_hours=round(float(rng.gamma(2.0, 0.8)), 3),
                                emissions_index=emissions, total_cost_index=round(cost, 4),
                                source_type="synthetic", source_basis="seeded_corridor_proxy", seed=seed))
    _write("port_network.csv", network,
            ["origin", "destination", "distance_nm", "fuel_id", "shore_power", "delay_hours",
             "emissions_index", "total_cost_index", "source_type", "source_basis", "seed"])

    manifest = dict(dataset_type="synthetic_development_only", seed=seed,
                    generated=date.today().isoformat(),
                    files={"fuel_prices_monthly.csv": len(prices), "port_delays.csv": len(delays),
                           "vessel_telemetry.csv": len(telemetry), "port_network.csv": len(network)},
                    caveat="Not measured, market-authoritative, telemetry-authoritative, or regulatory data.")
    with open(os.path.join(OUT, "MANIFEST.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    generate()
