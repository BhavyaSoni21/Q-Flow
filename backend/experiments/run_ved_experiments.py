"""VED road-mode experiments (governance spec Phase 9), mirroring the ship FuelCast run.
Reports protocols separately on real multi-vehicle data:
  E1 pooled + vehicle id      : random 80/20 over all sampled rows
  E2 leave-one-vehicle-out    : hold out 20% of VehIds (unseen vehicles)
Plus an Auto-MPG fuel-economy baseline. All metrics -> results/metrics/ved_experiments.csv
"""
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from prediction import models, validation
from prediction.road import ved, auto_mpg

RESULTS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))


def _fit_eval(Xtr, ytr, Xte, yte):
    m = models.xgb()
    m.fit(Xtr, ytr)
    Xte = Xte.reindex(columns=Xtr.columns, fill_value=0)
    return {k: round(v, 4) for k, v in validation.regression_metrics(yte, m.predict(Xte)).items()}


def main():
    df = ved.load_sample(n_files=8, seed=0)
    print(f"VED sampled rows={len(df)} vehicles={df['VehId'].nunique()} types={sorted(df['veh_type'].unique())}")
    rows = []

    # E1 — pooled + vehicle id, random split
    X, y = ved.xy(df)
    rng = np.random.default_rng(0)
    idx = rng.permutation(len(X)); k = int(len(X) * 0.8)
    tr, te = idx[:k], idx[k:]
    rows.append(dict(experiment="E1_pooled_random", test_on="all",
                     **_fit_eval(X.iloc[tr], y.iloc[tr], X.iloc[te], y.iloc[te])))

    # E2 — leave-one-vehicle-out (unseen vehicles)
    vids = df["VehId"].dropna().unique().copy(); rng.shuffle(vids)
    test_vids = set(vids[:max(1, int(len(vids) * 0.2))])
    m_te = df["VehId"].isin(test_vids)
    Xtr, ytr = ved.xy(df[~m_te]); Xte, yte = ved.xy(df[m_te])
    rows.append(dict(experiment="E2_leave_vehicles_out", test_on=f"{len(test_vids)} vehicles",
                     **_fit_eval(Xtr, ytr, Xte, yte)))

    # Auto-MPG baseline (static specs -> mpg)
    a = auto_mpg.load(); Xa, ya = auto_mpg.xy(a)
    ia = rng.permutation(len(Xa)); ka = int(len(Xa) * 0.8)
    rows.append(dict(experiment="AutoMPG_baseline", test_on="mpg",
                     **_fit_eval(Xa.iloc[ia[:ka]], ya.iloc[ia[:ka]], Xa.iloc[ia[ka:]], ya.iloc[ia[ka:]])))

    for r in rows:
        print(f"  {r['experiment']:24} test={r['test_on']:14} R2={r['r2']:.3f} MAE={r['mae']:.3f} sMAPE={r['smape']:.1f}%")
    os.makedirs(RESULTS, exist_ok=True)
    out = os.path.join(RESULTS, "ved_experiments.csv")
    pd.DataFrame(rows)[["experiment", "test_on", "mae", "rmse", "r2", "smape", "n"]].to_csv(out, index=False)
    print("wrote", out)


if __name__ == "__main__":
    main()
