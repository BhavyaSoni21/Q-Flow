"""Experiment C — optimizer benchmark (master doc §14): NSGA-II vs Classical PSO
(MOPSO) vs QPSO over multiple seeds + a scalability sweep, written in the frontend's
shapes to results/metrics/optimization_benchmark.json. Also writes a predicted-vs-
actual scatter for the prediction screen. All numbers come from real engine runs.
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "optimization"))

import fleet_engine as fe

METRICS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))
FE_NAME = {"NSGA-II": "NSGA-II", "MOPSO": "Classical PSO", "MO-QPSO": "QPSO"}
ALGOS = ("NSGA-II", "MOPSO", "MO-QPSO")


def _problem(n, demand):
    return lambda: fe.FleetProblem(fe.make_vessel_pool(n, 0), fe.default_route(cargo_demand_t=demand))


def compute(seeds=5, pop=60, iters=60, scalability_sizes=(10, 25, 50), scal_seeds=3):
    """Run the real optimizer benchmark and return the frontend-shaped dict
    (table / boxplot / hv_curves / scalability). All numbers come from live engine runs."""
    out = {}
    # main scenario (10 vessels) — table, hv curves, boxplot
    runs, rows, _ = fe.benchmark(_problem(10, 90000), seeds=range(seeds), pop=pop, iters=iters,
                                 algos=ALGOS, verbose=False)
    out["table"] = [dict(algorithm=FE_NAME[r["algorithm"]], hypervolumeMean=round(r["hv_mean"], 3),
                         hypervolumeStd=round(r["hv_std"], 3), median=round(r["hv_median"], 3),
                         best=round(r["hv_best"], 3), worst=round(r["hv_worst"], 3),
                         feasibleRate=round(100 * (1 - r["cargo_repair_rate"]), 1),
                         itersTo95=round(r["evals_to_95pct_hv"] / pop, 1),
                         runtime=round(r["runtime_s"], 2)) for r in rows]
    # boxplot from per-seed final hypervolume
    out["boxplot"] = []
    for a in ALGOS:
        vals = sorted(rr["hv_final"] for rr in runs[a])
        q = np.quantile(vals, [0, 0.25, 0.5, 0.75, 1.0])
        out["boxplot"].append(dict(algorithm=FE_NAME[a], min=round(q[0], 3), q1=round(q[1], 3),
                                   median=round(q[2], 3), q3=round(q[3], 3), max=round(q[4], 3), outliers=[]))
    # hv curves — mean across seeds, x = generation
    curves = {}
    for a in ALGOS:
        mats = [rr["hv_curve"] for rr in runs[a]]
        L = min(len(m) for m in mats)
        mean = np.mean([m[:L] for m in mats], axis=0)
        curves[a] = mean
    out["hv_curves"] = [dict(iteration=i, **{FE_NAME[a]: round(float(curves[a][i]), 4) for a in ALGOS})
                        for i in range(min(len(curves[a]) for a in ALGOS))]
    # scalability sweep
    out["scalability"] = []
    for n in scalability_sizes:
        _, rr, _ = fe.benchmark(_problem(n, 90000), seeds=range(scal_seeds), pop=pop, iters=iters,
                                algos=ALGOS, verbose=False)
        by = {FE_NAME[x["algorithm"]]: x for x in rr}
        out["scalability"].append(dict(vessels=n, **{k: dict(runtime=round(v["runtime_s"], 1),
                                                             hv=round(v["hv_mean"], 3)) for k, v in by.items()}))
    return out


def main(seeds=5, pop=60, iters=60):
    out = compute(seeds, pop, iters)
    os.makedirs(METRICS, exist_ok=True)
    with open(os.path.join(METRICS, "optimization_benchmark.json"), "w") as fh:
        json.dump(out, fh, indent=2)
    print("optimizer benchmark ->", {r["algorithm"]: r["hypervolumeMean"] for r in out["table"]})
    _scatter()


def _scatter():
    """Predicted-vs-actual on the prediction holdout (uses the saved model if present)."""
    try:
        from data import dataset as dd
        from prediction import dataset as pdata, registry, models
        feat, _ = dd.build_training_frame()
        ty = sorted(int(y) for y in feat["year"].unique())[-1]
        te = feat[feat["year"] == ty]
        Xte, yte, _ = pdata.build_xy(te)
        if registry.has_model("fuel_intensity_xgb"):
            cols = registry.load_metadata("fuel_intensity_xgb")["features"]
            Xte = Xte.reindex(columns=cols, fill_value=0.0)
            model = registry.load_model("fuel_intensity_xgb")
        else:
            tr = feat[feat["year"] != ty]
            Xtr, ytr, cols = pdata.build_xy(tr)
            Xte = Xte.reindex(columns=cols, fill_value=0.0)
            model = models.log_wrap(models.xgb()); model.fit(Xtr, ytr)
        pred = model.predict(Xte)
        idx = np.random.default_rng(0).choice(len(yte), size=min(80, len(yte)), replace=False)
        pts = [dict(actual=round(float(yte.iloc[i]), 1), predicted=round(float(pred[i]), 1),
                    residual=round(float(pred[i] - yte.iloc[i]), 1)) for i in idx]
        with open(os.path.join(METRICS, "prediction_scatter.json"), "w") as fh:
            json.dump(pts, fh, indent=2)
        print("scatter points:", len(pts))
    except Exception as e:
        print("scatter skipped:", e)


if __name__ == "__main__":
    main()
