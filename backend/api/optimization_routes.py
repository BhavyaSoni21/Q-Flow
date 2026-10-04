"""Optimization routes (frontend contract): POST /api/optimize/fleet (+ run lookup)."""
from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from api import compat, engine_state as es
from experiments import results_store
from prediction import registry
from optimization import uncertainty
import os

router = APIRouter(prefix="/api/optimize", tags=["optimization"])

_ALGO = {"QPSO": "MO-QPSO", "MO-QPSO": "MO-QPSO", "NSGA-II": "NSGA-II",
         "Classical PSO": "MOPSO", "MOPSO": "MOPSO", "auto": "auto"}
_WEATHER = {"Normal": "normal", "Adverse": "adverse", "Severe": "severe"}


def _feasibility_rate(out):
    pareto = out.get("pareto", [])
    if not pareto:
        return 0.0
    ok = sum(1 for s in pareto if s.get("constraints", {}).get("total_violation", 1) == 0)
    return round(ok / len(pareto), 3)


@router.post("/fleet")
async def optimize(cfg: dict):
    req = compat.optimize_config_to_request(cfg)
    pop = int(cfg.get("population", 100))
    iters = int(cfg.get("iterations", 100))
    seed = int(cfg.get("seed", 42))
    algo = _ALGO.get(cfg.get("algorithm", "QPSO"), "auto")
    out = await run_in_threadpool(es.fe.optimize_fleet, req, es.POOL, algo, pop, iters, seed)
    if out.get("status") == "ok":
        out["feasibility_rate"] = _feasibility_rate(out)
        meta = registry.load_metadata("engine_calibration") or {}
        out["engine_metadata"] = es.engine_metadata()
        out["run_id"] = results_store.save_run(dict(
            algorithm=out.get("algorithm"), seed=seed, population_size=pop, iterations=iters,
            objective_set=["fuel", "cost", "wtw_ghg"], dataset_version="fleet_scenario_v1",
            model_version=meta.get("model_version", "physics-mrv-cal-v1"),
            runtime_seconds=out.get("runtime_s"), result_count=len(out.get("pareto", [])),
            feasibility_rate=out["feasibility_rate"], hypervolume=(out.get("convergence") or [[0, None]])[-1][1],
            origin_port=cfg.get("originPort"), destination_port=cfg.get("destinationPort")))
    return compat.optimize_result_to_frontend(out, cfg)


@router.post("/robustness")
async def robustness(cfg: dict):
    """Stress-test one scenario across fixed weather states and seeds."""
    req = compat.optimize_config_to_request(cfg)
    pop = max(10, int(cfg.get("population", 40)))
    iters = max(5, int(cfg.get("iterations", 20)))
    seed = int(cfg.get("seed", 42))
    algo = _ALGO.get(cfg.get("algorithm", "QPSO"), "auto")
    states = cfg.get("weatherScenarios") or ["Normal", "Adverse", "Severe"]
    rows = []
    mc_samples = int(cfg.get("monteCarloSamples", 500))
    root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
    calibrated = uncertainty.calibrated_parameters(root)
    delay_buffer = float(cfg.get("bufferTime", 2))
    delay_std = float(cfg.get("delayStdHours", calibrated["delay_std"]))
    price_std = float(cfg.get("fuelPriceStd", calibrated["fuel_price_std"]))
    prediction_std = float(cfg.get("predictionStd", calibrated["prediction_std"]))
    weather_mean = {"Normal": 1.0, "Adverse": 1.15, "Severe": 1.35}
    for offset, label in enumerate(states):
        weather = _WEATHER.get(label, str(label).lower())
        scenario_req = dict(req, weather=weather)
        out = await run_in_threadpool(es.fe.optimize_fleet, scenario_req, es.POOL, algo, pop, iters, seed + offset)
        if out.get("status") != "ok":
            rows.append(dict(name=label, status=out.get("status"), feasible=False, reason=out.get("reason")))
            continue
        balanced = out["pareto"][out.get("balanced_index", 0)]
        obj = balanced["objectives"]
        mc = uncertainty.monte_carlo_objectives(
            obj, samples=mc_samples, seed=seed + offset,
            weather_mean=weather_mean.get(label, 1.0),
            weather_std=float(cfg.get("weatherStd", 0.05)),
            prediction_std=prediction_std, fuel_price_std=price_std,
            delay_std=delay_std, delay_buffer=delay_buffer,
            delay_cost_per_hour=float(cfg.get("delayCostPerHour", 1000)))
        rows.append(dict(name=label, status="ok", feasible=True,
                         fuel_energy_gj=round(obj["fuel_energy_gj"], 3),
                         cost_inr=round(obj["cost_usd"], 2),
                         wtw_ghg_t=round(obj["wtw_ghg_t"], 3),
                         feasibility_rate=_feasibility_rate(out), monte_carlo=mc))
    valid = [r for r in rows if r["status"] == "ok"]
    probabilities = [r["monte_carlo"]["feasibility_probability"] for r in valid]
    return dict(status="ok", robust=bool(valid) and all(p >= float(cfg.get("minimumFeasibilityProbability", 0.95)) for p in probabilities),
                scenarios=rows, assumptions=dict(weather_states=states, seeds=[seed + i for i in range(len(states))],
                                                  population=pop, iterations=iters, monte_carlo_samples=mc_samples,
                                                  minimum_feasibility_probability=float(cfg.get("minimumFeasibilityProbability", 0.95)),
                                                  delay_buffer=delay_buffer, delay_std=delay_std,
                                                  fuel_price_std=price_std, prediction_std=prediction_std,
                                                  calibration=calibrated),
                worst_case={"cost_inr": max((r["cost_inr"] for r in valid), default=None),
                            "wtw_ghg_t": max((r["wtw_ghg_t"] for r in valid), default=None),
                            "p95_cost_inr": max((r["monte_carlo"]["confidence_intervals"]["cost_inr"]["p95"] for r in valid), default=None),
                            "p95_wtw_ghg_t": max((r["monte_carlo"]["confidence_intervals"]["wtw_ghg_t"]["p95"] for r in valid), default=None)})


@router.post("/road")
async def optimize_road(cfg: dict):
    """Road-mode optimization — same contract as /fleet, mapped to the frontend shape."""
    req = compat.optimize_road_config_to_request(cfg)
    pop = int(cfg.get("population", 100))
    iters = int(cfg.get("iterations", 100))
    seed = int(cfg.get("seed", 42))
    algo = _ALGO.get(cfg.get("algorithm", "QPSO"), "auto")
    out = await run_in_threadpool(es.rf.optimize_road_fleet, req, None, algo, pop, iters, seed)
    if out.get("status") == "ok":
        out["run_id"] = results_store.save_run(dict(
            mode="road", algorithm=out.get("algorithm"), seed=seed, population_size=pop, iterations=iters,
            objective_set=["energy", "cost", "wtw_ghg"], dataset_version="road_scenario_v1",
            model_version="road-surrogate-v1", runtime_seconds=out.get("runtime_s"),
            result_count=len(out.get("pareto", []))))
    return compat.optimize_road_result_to_frontend(out, cfg)


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    r = results_store.load_run(run_id)
    if r is None:
        raise HTTPException(status_code=404, detail=f"Unknown run_id {run_id}")
    return r
