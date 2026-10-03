"""Frontend-contract mappers (Phase 5). Translate between the React app's shapes
(src/data/mock.js) and the real engine so the dashboard runs on live data with
USE_MOCK=false. The frontend's shapes are the contract we serve."""
import numpy as np
import pandas as pd

from api import engine_state as es
from prediction import physics_baseline as pb

# frontend fuel id -> optimize_fleet alias (engine understands these)
FE_TO_ENGINE_FUEL = {"HFO": "reference", "VLSFO": "vlsfo", "LNG": "lng",
                     "METHANOL": "methanol", "HYDROGEN": "hydrogen", "AMMONIA": "ammonia"}
# engine fuel_id -> frontend id (for display)
ENGINE_TO_FE_FUEL = {"vlsfo": "VLSFO", "lng": "LNG", "methanol_grey": "METHANOL",
                     "methanol_green": "METHANOL", "ammonia_green": "AMMONIA", "hydrogen_green": "HYDROGEN"}
_LHV_REF = es.fe.DEFAULT_FUELS[es.fe.REF_FUEL]["lhv"]      # GJ/t, for GJ->tonnes display


def vessel_to_frontend(v):
    compat = v["fuel_compatibility"]
    allowed = sorted({ENGINE_TO_FE_FUEL[es.fe.DEFAULT_FUELS[i]["fuel_id"]]
                      for i, ok in enumerate(compat) if ok})
    return dict(id=v["vessel_id"], name=f'{v["vessel_type"]} {v["vessel_id"]}', type=v["vessel_type"],
                capacity=v["capacity_t"], minSpeed=v["min_speed_kn"], maxSpeed=v["max_speed_kn"],
                allowedFuels=allowed, shorePower=bool(v["shore_power_compatible"]), available=bool(v["availability"]))


def fuels_to_frontend():
    out = []
    for f in es.fe.DEFAULT_FUELS:
        out.append(dict(id=ENGINE_TO_FE_FUEL.get(f["fuel_id"], f["fuel_id"].upper()), name=f["name"],
                        pathway=f.get("wtw_source", ""), price=f["price"], lhv=f["lhv"],
                        wtt=round(f["wtw"] * 0.15, 1), ttw=round(f["wtw"] * 0.85, 1), wtw=f["wtw"],
                        source=f.get("wtw_source", ""), version="qflow-factors-v1"))
    return out


def _gj_to_t(gj):
    return gj / _LHV_REF


def optimize_config_to_request(cfg):
    """React optimize config -> optimize_fleet request dict."""
    weather = {"Normal": "normal", "Adverse": "adverse", "Severe": "severe"}.get(cfg.get("weather", "Normal"), "normal")
    fuels = cfg.get("selectedFuels") or []
    allowed = sorted({FE_TO_ENGINE_FUEL.get(f, f.lower()) for f in fuels}) or None
    return dict(route_distance_nm=cfg.get("distance", 600), cargo_demand_tonnes=cfg.get("cargoDemand", 45000),
                deadline_hours=cfg.get("deadline", 52), vessel_ids=cfg.get("selectedVessels") or None,
                allowed_fuels=allowed, shore_power=bool(cfg.get("shorePowerEnabled", False)),
                weather=weather, carbon_price_usd_per_t=cfg.get("carbonPrice", 0))


def _deployment_rows(sol):
    rows = []
    for p in sol["plan"]:
        rows.append(dict(vesselId=p["vessel_id"], speed=p["speed_kn"],
                         fuelId=ENGINE_TO_FE_FUEL.get(p["fuel"], p["fuel"].upper()),
                         shorePower=p["shore_power"], cargo=p["cargo_t"], sailingTime=p["sail_hours"],
                         fuel=round(_gj_to_t(p["fuel_energy_gj"]), 1), fuelError=round(_gj_to_t(p["fuel_energy_gj"]) * 0.045, 1),
                         cost=p["cost_usd"], wtw=p["wtw_ghg_t"],
                         feasible=sol.get("constraints", {}).get("total_violation", 0) == 0))
    return rows


def optimize_result_to_frontend(out, cfg):
    """optimize_fleet result -> runMockOptimization shape."""
    if out.get("status") == "infeasible":
        return dict(pareto=[], deployment=[], feasible=False, violated=out.get("reason"), progress=[])
    if out.get("status") != "ok":
        return dict(pareto=[], deployment=[], feasible=False, violated=out.get("reason", "error"), progress=[])

    pareto = []
    for sol in out["pareto"]:
        o = sol["objectives"]
        fuel_t = round(_gj_to_t(o["fuel_energy_gj"]), 1)
        dep = _deployment_rows(sol)
        pareto.append(dict(fuel=fuel_t, cost=round(o["cost_usd"]), wtw=round(o["wtw_ghg_t"], 2),
                           fuelId=dep[0]["fuelId"] if dep else None, deployment=dep,
                           feasible=sol.get("constraints", {}).get("total_violation", 0) == 0, tag=""))
    # tags: the balanced recommendation wins its point, then extremes fill untagged points
    if pareto:
        bi = out.get("balanced_index", 0)
        if not (0 <= bi < len(pareto)):
            bi = 0
        pareto[bi]["tag"] = "Balanced"
        for key, label in (("cost", "Minimum cost"), ("wtw", "Minimum GHG"), ("fuel", "Minimum fuel")):
            p = min(pareto, key=lambda s: s[key])
            if not p["tag"]:
                p["tag"] = label
    b = out.get("baseline", {})
    baseline = dict(vesselId="baseline", speed=None, fuelId="VLSFO", shorePower=False, cargo=cfg.get("cargoDemand"),
                    sailingTime=None, fuel=round(_gj_to_t(b.get("fuel_energy_gj", 0)), 1),
                    fuelError=0.0, cost=round(b.get("cost_usd", 0)), wtw=round(b.get("wtw_ghg_t", 0), 2), feasible=True)
    progress = [dict(iteration=i, hypervolume=hv) for i, hv in out.get("convergence", [])]
    bi = out.get("balanced_index", 0)
    deployment = pareto[bi]["deployment"] if pareto and 0 <= bi < len(pareto) else []
    return dict(pareto=pareto, baseline=baseline, deployment=deployment, feasible=bool(pareto),
                violated=None, progress=progress,
                finalHypervolume=progress[-1]["hypervolume"] if progress else None,
                runId=out.get("run_id"), feasibilityRate=out.get("feasibility_rate"),
                engineMetadata=out.get("engine_metadata"))


def predict_fuel_frontend(inp):
    """React predict input {speed,loadFactor,enginePower,waveHeight,wind,seaState,distance} -> {fuel,error,sanity,physicsExpected}."""
    speed = inp.get("speed", 14.0)
    weather = 1.0 + (inp.get("waveHeight", 1.5) * 0.03 + (inp.get("wind", 8) - 8) * 0.005 + (inp.get("seaState", 3) - 3) * 0.015)
    feats = dict(engine_power_kw=np.array([inp.get("enginePower", 12000)], float),
                 design_speed_kn=np.array([14.0], float), speed_kn=np.array([speed], float),
                 load_factor=np.array([inp.get("loadFactor", 0.7)], float),
                 weather_factor=np.array([max(weather, 0.5)], float))
    rate = float(pb.physics_fuel_rate_tph(feats)[0] * es.SCALE)
    hours = inp.get("distance", 600) / speed
    fuel = max(rate * hours, 0.0)
    physics_expected = float(pb.physics_fuel_rate_tph({**feats, "weather_factor": np.array([1.0])})[0] * es.SCALE) * hours
    sanity = "pass" if physics_expected > 0 and abs(fuel - physics_expected) / physics_expected < 0.3 else "flag"
    speed_term = (speed / 14.0) ** 3
    engine_term = float(inp.get("enginePower", 12000)) / 12000.0
    load_term = 0.8 + float(inp.get("loadFactor", 0.7)) * 0.4
    weather_term = max(weather, 0.5)
    draft_term = 1.0 + (float(inp.get("draft", 12)) - 12.0) * 0.01
    drivers = [
        ("Speed (kn)", physics_expected * (speed_term - 1.0)),
        ("Engine power (kW)", physics_expected * speed_term * (engine_term - 1.0)),
        ("Load factor", physics_expected * speed_term * engine_term * (load_term - 1.0)),
        ("Weather", physics_expected * speed_term * engine_term * load_term * (weather_term - 1.0)),
        ("Draft (m)", physics_expected * speed_term * engine_term * load_term * weather_term * (draft_term - 1.0)),
    ]
    explanation = [dict(feature=k, value=round(float(v), 4), method="physics_counterfactual") for k, v in drivers]
    if es.ACTIVE_MODEL is not None:
        cols = ["speed_kn", "load_factor", "engine_power_kw", "weather_factor"]
        current = pd.DataFrame([{ "speed_kn": speed, "load_factor": inp.get("loadFactor", 0.7),
                                  "engine_power_kw": inp.get("enginePower", 12000), "weather_factor": max(weather, 0.5)}])
        base = current.iloc[0].to_dict()
        base.update(speed_kn=14.0, load_factor=0.7, engine_power_kw=12000, weather_factor=1.0)
        current_rate = float(es.ACTIVE_MODEL.predict(current[cols])[0])
        for col in cols:
            counter = current.copy(); counter.loc[0, col] = base[col]
            delta = (current_rate - float(es.ACTIVE_MODEL.predict(counter[cols])[0])) * hours
            explanation.append(dict(feature=col, value=round(delta, 4), method="tree_counterfactual",
                                    model_version=es.engine_metadata()["model_version"]))
        try:
            import shap
            values = shap.TreeExplainer(es.ACTIVE_MODEL)(current[cols]).values[0]
            for col, value in zip(cols, values):
                explanation.append(dict(feature=col, value=round(float(value * hours), 4), method="shap_local",
                                        model_version=es.engine_metadata()["model_version"]))
        except Exception:
            pass
    return dict(fuel=round(fuel, 2), error=round(fuel * 0.045, 2), sanity=sanity,
                physicsExpected=round(physics_expected, 2),
                explanation=explanation, explanation_source="tree_counterfactual+physics" if es.ACTIVE_MODEL is not None else "physics_counterfactual")


# ---------------------------------------------------------------------------
# ROAD mode mappers (reuse the ship frontend shape so the Optimization UI renders
# road results too; the 'fuel' axis carries energy MJ for road, flagged by mode).
# ---------------------------------------------------------------------------
_ROAD_FUEL_FE = {"diesel": "DIESEL", "gasoline": "GASOLINE", "electricity": "ELECTRICITY"}


def road_vehicle_to_frontend(v):
    import road_fleet as rf
    ids = [f["fuel_id"] for f in rf.ROAD_FUELS]
    allowed = sorted({_ROAD_FUEL_FE[ids[i]] for i, ok in enumerate(v["fuel_compatibility"]) if ok})
    return dict(id=v["vehicle_id"], name=f'{v["vehicle_type"]} {v["vehicle_id"]}', type=v["vehicle_type"],
                capacity=v["capacity_kg"], minSpeed=v["min_speed_kmh"], maxSpeed=v["max_speed_kmh"],
                allowedFuels=allowed, shorePower=False, available=bool(v["availability"]), rangeKm=v["range_km"])


def road_fuels_to_frontend():
    import road_fleet as rf
    return [dict(id=_ROAD_FUEL_FE[f["fuel_id"]], name=f["name"], price=f["price"],
                 lhv=f.get("lhv"), wtt=round(f["wtw"] * 0.2, 1), ttw=round(f["wtw"] * 0.8, 1),
                 wtw=f["wtw"], source=f.get("wtw_source", ""), version="glec") for f in rf.ROAD_FUELS]


def optimize_road_config_to_request(cfg):
    return dict(route_distance_km=cfg.get("distance", 300), cargo_demand_kg=cfg.get("cargoDemand", 4000),
                deadline_hours=cfg.get("deadline", 8), vehicle_ids=cfg.get("selectedVessels") or None,
                carbon_price_usd_per_t=cfg.get("carbonPrice", 0))


def _road_deploy(sol):
    rows = []
    for p in sol["plan"]:
        rows.append(dict(vesselId=p["vehicle_id"], speed=p["speed_kmh"],
                         fuelId=_ROAD_FUEL_FE.get(p["fuel"], p["fuel"].upper()), cargo=p["cargo_kg"],
                         fuel=round(p["energy_mj"], 1), fuelError=round(p["energy_mj"] * 0.05, 1),
                         cost=p["cost_usd"], wtw=p["wtw_ghg_t"], feasible=True))
    return rows


def optimize_road_result_to_frontend(out, cfg):
    if out.get("status") != "ok":
        return dict(pareto=[], deployment=[], feasible=False, violated=out.get("reason"), progress=[], mode="road")
    pareto = []
    for sol in out["pareto"]:
        o = sol["objectives"]
        dep = _road_deploy(sol)
        pareto.append(dict(fuel=round(o["energy_mj"], 1), cost=round(o["cost_usd"]), wtw=round(o["wtw_ghg_t"], 3),
                           fuelId=dep[0]["fuelId"] if dep else None, deployment=dep, feasible=True, tag=""))
    if pareto:
        bi = out.get("balanced_index", 0)
        bi = bi if 0 <= bi < len(pareto) else 0
        pareto[bi]["tag"] = "Balanced"
        for key, label in (("cost", "Minimum cost"), ("wtw", "Minimum GHG"), ("fuel", "Minimum energy")):
            p = min(pareto, key=lambda s: s[key])
            if not p["tag"]:
                p["tag"] = label
    b = out.get("baseline", {})
    baseline = dict(vesselId="baseline", speed=None, fuelId="DIESEL", cargo=cfg.get("cargoDemand"),
                    fuel=round(b.get("energy_mj", 0), 1), fuelError=0.0, cost=round(b.get("cost_usd", 0)),
                    wtw=round(b.get("wtw_ghg_t", 0), 3), feasible=True)
    bi = out.get("balanced_index", 0)
    deployment = pareto[bi]["deployment"] if pareto and 0 <= bi < len(pareto) else []
    return dict(pareto=pareto, baseline=baseline, deployment=deployment, feasible=bool(pareto),
                violated=None, progress=[], runId=out.get("run_id"), mode="road",
                units=dict(fuel="MJ", cost="INR", ghg="tCO2e"))
