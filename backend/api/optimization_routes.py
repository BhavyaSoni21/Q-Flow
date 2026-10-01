"""Optimization routes (frontend contract): POST /api/optimize/fleet (+ run lookup)."""
from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from api import compat, engine_state as es
from experiments import results_store
from prediction import registry

router = APIRouter(prefix="/api/optimize", tags=["optimization"])

_ALGO = {"QPSO": "MO-QPSO", "MO-QPSO": "MO-QPSO", "NSGA-II": "NSGA-II",
         "Classical PSO": "MOPSO", "MOPSO": "MOPSO", "auto": "auto"}


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
    out = await run_in_threadpool(es.fe.optimize_fleet, req, None, algo, pop, iters, seed)
    if out.get("status") == "ok":
        out["feasibility_rate"] = _feasibility_rate(out)
        meta = registry.load_metadata("engine_calibration") or {}
        out["run_id"] = results_store.save_run(dict(
            algorithm=out.get("algorithm"), seed=seed, population_size=pop, iterations=iters,
            objective_set=["fuel", "cost", "wtw_ghg"], dataset_version="fleet_scenario_v1",
            model_version=meta.get("model_version", "physics-mrv-cal-v1"),
            runtime_seconds=out.get("runtime_s"), result_count=len(out.get("pareto", [])),
            feasibility_rate=out["feasibility_rate"], hypervolume=(out.get("convergence") or [[0, None]])[-1][1]))
    return compat.optimize_result_to_frontend(out, cfg)


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
