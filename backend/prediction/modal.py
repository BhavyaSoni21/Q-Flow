"""Multi-modal glue: mode-aware fuel/energy prediction + deterministic leg evaluation.

Routes a transport leg to the right predictor + emission/cost factors by `mode`:
- ship: physics/power predictor + ship DEFAULT_FUELS (handled in optimization/fleet_engine)
- road: trained VED fuel-per-km model + GLEC ROAD_FUELS (here)

The emissions math is mode-agnostic (energy → WtW GHG → cost); only the factors and
the predictor differ. This lets ship and road share one evaluation contract.
"""
import pandas as pd

from emissions import factors
from prediction import registry

_ROAD_FUELS = {f["fuel_id"]: f for f in factors.ROAD_FUELS}
_DENSITY_G_PER_L = {"diesel": 835.0, "gasoline": 737.0}   # fuel density for L↔mass


def predict_road_fuel_per_km(trip_df):
    """Predict fuel-per-km (L/km) for road trips via the persisted VED model.
    trip_df must contain the road trip features (see prediction.road.ved.TRIP_FEATURES)."""
    from prediction.road import ved
    model = registry.load_model("fuel_road_trip_xgb")
    meta = registry.load_metadata("fuel_road_trip_xgb") or {}
    X = pd.get_dummies(trip_df[ved.TRIP_FEATURES], columns=["veh_type", "veh_class"])
    X = X.reindex(columns=meta.get("features", X.columns), fill_value=0).astype(float)
    return model.predict(X)


def evaluate_road_leg(distance_km, fuel_per_km, fuel_id="diesel", price_per_unit=None, carbon_price=0.0):
    """Deterministic road leg → fuel, energy, WtW GHG, cost (liquid fuels).
    EV (electricity) uses an energy path, not this liquid-fuel evaluator."""
    if fuel_id not in _ROAD_FUELS:
        raise ValueError(f"Unknown road fuel {fuel_id}; valid: {sorted(_ROAD_FUELS)}")
    f = _ROAD_FUELS[fuel_id]
    fuel_l = float(fuel_per_km) * float(distance_km)
    mass_t = fuel_l * _DENSITY_G_PER_L.get(fuel_id, 800.0) / 1e6      # L → tonnes
    energy_mj = mass_t * 1000.0 * f["lhv"]                            # t·1000·LHV(MJ/kg)
    ghg_t = energy_mj * f["wtw"] / 1e6                                # gCO2e/MJ → tonnes
    price = f["price"] if price_per_unit is None else price_per_unit
    cost = fuel_l * price + ghg_t * carbon_price
    return dict(fuel_l=round(fuel_l, 3), energy_mj=round(energy_mj, 1),
                wtw_ghg_t=round(ghg_t, 4), cost_usd=round(cost, 2), mode="road", fuel_id=fuel_id)
