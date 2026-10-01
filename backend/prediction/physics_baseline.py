"""Physics speed-power baseline + MRV magnitude calibration (master doc §5.3, Strategy A).

The cubic speed-power law is the engine's inference-time predictor (it consumes
engine-side features the optimizer varies: power, speed, design speed, load,
weather). MRV grounds its MAGNITUDE: we scale the model so the synthetic fleet's
implied fuel-per-distance matches the MRV fleet median. (Per-type / vessel-register
calibration — Strategy C — is a later refinement; MRV lacks power/DWT to key on.)
"""
import numpy as np


def physics_fuel_rate_tph(f):
    """Main-engine fuel rate (t/h of reference fuel). Cubic speed-power + part-load SFOC.
    f: dict of equal-length arrays — engine_power_kw, design_speed_kn, speed_kn,
    load_factor, weather_factor."""
    power = (0.85 * f["engine_power_kw"] * (f["speed_kn"] / f["design_speed_kn"]) ** 3
             * (0.65 + 0.35 * f["load_factor"]) * f["weather_factor"])
    part = np.clip(power / (0.85 * f["engine_power_kw"]), 0, 1)
    sfoc_g_kwh = 175.0 * (1.0 + 0.10 * (1.0 - part))
    return power * sfoc_g_kwh * 1e-6


def _fleet_physics_fpd(pool):
    """Median physics fuel-per-distance (kg/nm) for a vessel pool at design speed, load 0.7."""
    g = lambda k: np.array([v[k] for v in pool], float)
    feats = dict(engine_power_kw=g("engine_power_kw"), design_speed_kn=g("design_speed_kn"),
                 speed_kn=g("design_speed_kn"), load_factor=np.full(len(pool), 0.7),
                 weather_factor=np.ones(len(pool)))
    rate_tph = physics_fuel_rate_tph(feats)                 # t/h
    fpd_kg_nm = rate_tph * 1000.0 / g("design_speed_kn")    # kg per nautical mile
    return float(np.median(fpd_kg_nm))


def calibrate_scale(mrv_featured, pool):
    """Global scale so the synthetic fleet's physics fuel-per-distance ≈ MRV fleet median."""
    mrv_median = float(mrv_featured["fuel_per_dist_kg_nm"].median())
    phys_median = _fleet_physics_fpd(pool)
    return mrv_median / phys_median if phys_median > 0 else 1.0
