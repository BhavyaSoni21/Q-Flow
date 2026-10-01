"""Road predictor pipeline (trip-level) — the road analog of train_power_model.py.

Trains fuel-per-km from trip features (avg speed, speed variability, moving fraction,
distance, outside temp, vehicle weight/type/class) on VED trips. Reports pooled +
leave-one-vehicle-out, QPSO-tunes, and persists the artifact + metadata.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from prediction import models, validation, tune_qpso, registry
from prediction.road import ved

RESULTS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))


def _metrics(m, Xte, yte, cols):
    return {k: round(v, 4) for k, v in validation.regression_metrics(yte, m.predict(Xte.reindex(columns=cols, fill_value=0))).items()}


def main():
    trips = ved.load_trips(n_files=20, seed=0)
    print(f"VED trips={len(trips)} vehicles={trips['VehId'].nunique()} types={sorted(trips['veh_type'].unique())}")
    X, y = ved.trip_xy(trips)
    rng = np.random.default_rng(0)

    # pooled random split
    idx = rng.permutation(len(X)); k = int(len(X) * 0.8)
    xgb = models.xgb(); xgb.fit(X.iloc[idx[:k]], y.iloc[idx[:k]])
    m_pool = _metrics(xgb, X.iloc[idx[k:]], y.iloc[idx[k:]], X.columns)

    # leave-one-vehicle-out (unseen vehicles)
    vids = trips["VehId"].dropna().unique().copy(); rng.shuffle(vids)
    test_vids = set(vids[:max(1, int(len(vids) * 0.2))])
    m_te = trips["VehId"].isin(test_vids)
    Xtr, ytr = ved.trip_xy(trips[~m_te]); Xte, yte = ved.trip_xy(trips[m_te])
    lvo = models.xgb(); lvo.fit(Xtr, ytr)
    m_lvo = _metrics(lvo, Xte, yte, Xtr.columns)

    # QPSO-tuned on the pooled split
    tune = tune_qpso.tune_xgb(X.iloc[idx[:k]], y.iloc[idx[:k]], X.iloc[idx[k:]], y.iloc[idx[k:]],
                              pop=8, iters=8, seed=0, log_target=False)
    best = models.xgb(**tune["params"]); best.fit(X.iloc[idx[:k]], y.iloc[idx[:k]])
    m_qpso = _metrics(best, X.iloc[idx[k:]], y.iloc[idx[k:]], X.columns)

    print(f"  pooled            R2={m_pool['r2']:.3f} MAE={m_pool['mae']:.4f} sMAPE={m_pool['smape']:.1f}%")
    print(f"  leave-vehicle-out R2={m_lvo['r2']:.3f} MAE={m_lvo['mae']:.4f} sMAPE={m_lvo['smape']:.1f}%")
    print(f"  qpso_xgb (pooled) R2={m_qpso['r2']:.3f} MAE={m_qpso['mae']:.4f} sMAPE={m_qpso['smape']:.1f}%")

    # deploy model: refit on all trips with tuned params
    deploy = models.xgb(**tune["params"]); deploy.fit(X, y)
    registry.save_model(deploy, "fuel_road_trip_xgb", dict(
        model_version="fuel_road_trip_xgb_v1", mode="road", task="fuel_per_km (L/km)",
        data="VED trips (Apache-2.0)", features=list(X.columns),
        pooled_metrics=m_pool, leave_vehicle_out_metrics=m_lvo, qpso_params=tune["params"]))

    import csv
    os.makedirs(RESULTS, exist_ok=True)
    with open(os.path.join(RESULTS, "road_trip_benchmark.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["protocol", "mae", "rmse", "r2", "smape", "n"])
        w.writeheader()
        for name, m in [("pooled", m_pool), ("leave_vehicle_out", m_lvo), ("qpso_pooled", m_qpso)]:
            w.writerow(dict(protocol=name, **{k: m[k] for k in ["mae", "rmse", "r2", "smape", "n"]}))
    print("saved -> models/fuel_road_trip_xgb.joblib + results/metrics/road_trip_benchmark.csv")


if __name__ == "__main__":
    main()
