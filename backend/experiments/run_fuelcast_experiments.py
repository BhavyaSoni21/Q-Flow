"""FuelCast multi-source experiments (governance spec Phase 9) on REAL vessel data.

Reports each protocol separately — never hides per-source weakness behind a pooled
average. For FuelCast the three vessels ARE the three sources/entities, so
leave-one-source-out and leave-one-entity-out coincide (E3):
  E1 source-specific      : train+test within each vessel (temporal 80/20)
  E2 pooled + vessel id   : all vessels together, temporal split
  E3 leave-one-vessel-out : train on 2 vessels, test on the unseen 3rd
(Shifts->FuelCast synthetic->real transfer is deferred: needs unit/feature
harmonization across the two schemas.)
"""
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from prediction import fuelcast as fc, models, validation

RESULTS = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))


def _temporal(d, frac=0.8):
    k = int(len(d) * frac)
    return d.iloc[:k], d.iloc[k:]


def _fit_eval(Xtr, ytr, Xte, yte):
    m = models.xgb()
    m.fit(Xtr, ytr)
    return {k: round(v, 4) for k, v in validation.regression_metrics(yte, m.predict(Xte)).items()}


def main():
    data = fc.load_all()
    names = list(data)
    print("vessels:", {n: len(data[n]) for n in names})
    rows = []

    # E1 — source-specific (temporal split per vessel)
    for n in names:
        tr, te = _temporal(data[n])
        met = _fit_eval(tr[fc.FEATURES], tr[fc.TARGET], te[fc.FEATURES], te[fc.TARGET])
        rows.append(dict(experiment="E1_source_specific", test_on=n, **met))

    # E2 — pooled + vessel id (temporal split within each, then concat)
    trs, tes = [], []
    for n in names:
        tr, te = _temporal(data[n]); trs.append(tr); tes.append(te)
    pool_tr, pool_te = pd.concat(trs), pd.concat(tes)
    Xtr = pd.get_dummies(pool_tr[fc.FEATURES + ["vessel"]], columns=["vessel"])
    Xte = pd.get_dummies(pool_te[fc.FEATURES + ["vessel"]], columns=["vessel"]).reindex(columns=Xtr.columns, fill_value=0)
    rows.append(dict(experiment="E2_pooled_id", test_on="all",
                     **_fit_eval(Xtr, pool_tr[fc.TARGET], Xte, pool_te[fc.TARGET])))

    # E3 — leave-one-vessel-out (unseen vessel)
    for held in names:
        tr = pd.concat([data[n] for n in names if n != held])
        te = data[held]
        met = _fit_eval(tr[fc.FEATURES], tr[fc.TARGET], te[fc.FEATURES], te[fc.TARGET])
        rows.append(dict(experiment="E3_leave_one_vessel_out", test_on=held, **met))

    for r in rows:
        print(f"  {r['experiment']:26} test={r['test_on']:14} R2={r['r2']:.3f} MAE={r['mae']:.1f} sMAPE={r['smape']:.1f}%")

    os.makedirs(RESULTS, exist_ok=True)
    out = os.path.join(RESULTS, "fuelcast_experiments.csv")
    keys = ["experiment", "test_on", "mae", "rmse", "r2", "smape", "n"]
    pd.DataFrame(rows)[keys].to_csv(out, index=False)
    print("wrote", out)


if __name__ == "__main__":
    main()
