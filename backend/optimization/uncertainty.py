"""Transparent Monte Carlo uncertainty layer for optimizer summaries.

This does not pretend to be a calibrated risk model. Its assumptions are
returned with every result and are the upgrade point for empirical
distributions when more telemetry and port-delay data are available.
"""
import numpy as np
import os
import pandas as pd


def calibrated_parameters(root):
    """Estimate uncertainty defaults from the generated prototype datasets."""
    synthetic = os.path.join(root, "Datasets", "Synthetic")
    delays = pd.read_csv(os.path.join(synthetic, "port_delays.csv"))
    prices = pd.read_csv(os.path.join(synthetic, "fuel_prices_monthly.csv"))
    telemetry = pd.read_csv(os.path.join(synthetic, "vessel_telemetry.csv"))
    price_series = prices.groupby("fuel_id")["price_inr_per_t"].mean()
    price_cv = float(prices.groupby("fuel_id")["price_inr_per_t"].std().mean() / price_series.mean())
    return dict(delay_std=round(float(delays["delay_hours"].std()), 4),
                fuel_price_std=round(max(price_cv, 0.01), 4),
                prediction_std=round(float(telemetry["fuel_rate_tph"].std() / telemetry["fuel_rate_tph"].mean() * 0.25), 4),
                source="Datasets/Synthetic", dataset_type="synthetic_development_only")


def _interval(values):
    q = np.percentile(values, [5, 50, 95])
    return dict(p05=round(float(q[0]), 4), median=round(float(q[1]), 4), p95=round(float(q[2]), 4))


def monte_carlo_objectives(base, samples=500, seed=42, weather_mean=1.0,
                           weather_std=0.05, prediction_std=0.045,
                           fuel_price_std=0.10, delay_mean=0.0,
                           delay_std=1.5, delay_buffer=2.0,
                           delay_cost_per_hour=1000.0):
    """Sample objective ranges and delay feasibility around one plan.

    Cost is split into a 65% fuel/operations component and a 35% price-sensitive
    component because the prototype objective does not yet persist cost
    decomposition. This assumption is explicit in the returned metadata.
    """
    n = max(20, min(int(samples), 5000))
    rng = np.random.default_rng(seed)
    weather = np.maximum(rng.normal(weather_mean, weather_std, n), 0.1)
    prediction = np.maximum(rng.normal(1.0, prediction_std, n), 0.5)
    fuel_price = np.maximum(rng.normal(1.0, fuel_price_std, n), 0.5)
    delay = np.maximum(rng.normal(delay_mean, delay_std, n), 0.0)
    demand_factor = weather * prediction
    fuel = float(base["fuel_energy_gj"]) * demand_factor
    ghg = float(base["wtw_ghg_t"]) * demand_factor
    cost = float(base["cost_usd"]) * (0.65 * demand_factor + 0.35 * fuel_price) + delay * delay_cost_per_hour
    feasible = delay <= float(delay_buffer)
    return dict(samples=n, confidence_intervals=dict(fuel_energy_gj=_interval(fuel),
                                                       cost_inr=_interval(cost),
                                                       wtw_ghg_t=_interval(ghg),
                                                       delay_hours=_interval(delay)),
                feasibility_probability=round(float(np.mean(feasible)), 4),
                assumptions=dict(weather_mean=weather_mean, weather_std=weather_std,
                                 prediction_std=prediction_std, fuel_price_std=fuel_price_std,
                                 delay_mean=delay_mean, delay_std=delay_std,
                                 delay_buffer=delay_buffer, delay_cost_per_hour=delay_cost_per_hour,
                                 cost_split_fuel_operations=0.65,
                                 cost_split_fuel_price=0.35))
