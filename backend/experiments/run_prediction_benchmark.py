"""Experiment A — prediction benchmark on the in-scope MRV years (2020–2025).

Trains the model lineup on earlier years, tests on the latest (chronological),
plus a vessel-holdout generalization run and a QPSO-tuned XGBoost. Writes a
results CSV with the run manifest (master doc §14, §16).
"""
import os
import sys
import csv
import hashlib
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "optimization"))

from data import dataset as dd
from prediction import benchmark, dataset as pdata, tune_qpso, models, validation

RESULTS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "results", "metrics"))


def compute():
    """Train the model lineup on the real in-scope MRV data and return (rows, manifest).
    Raises if the training datasets are not present (handled by the caller)."""
    feat, _ = dd.build_training_frame()          # in-scope years 2020–2025 (+ GFW GT if fetched)
    years = sorted(int(y) for y in feat["year"].unique())
    test_year = years[-1]
    gt_cov = float(feat["gt"].notna().mean()) if "gt" in feat.columns else 0.0
    print(f"rows={len(feat)} years={years} chronological test={test_year} | GT coverage={gt_cov*100:.1f}%")

    rows = []
    rows += benchmark.run_prediction_benchmark(feat, split="chronological", test_years=[test_year])
    rows += benchmark.run_prediction_benchmark(feat, split="vessel", frac=0.2, seed=0)

    # QPSO-tuned XGBoost on the chronological split
    tr = feat[feat["year"] != test_year]
    te = feat[feat["year"] == test_year]
    Xtr, ytr, cols = pdata.build_xy(tr)
    Xte, yte, _ = pdata.build_xy(te)
    Xte = Xte.reindex(columns=cols, fill_value=0.0)
    m = int(len(Xtr) * 0.8)
    tune = tune_qpso.tune_xgb(Xtr.iloc[:m], ytr.iloc[:m], Xtr.iloc[m:], ytr.iloc[m:], pop=10, iters=10, seed=0)
    tuned = models.log_wrap(models.xgb(**tune["params"]))
    tuned.fit(Xtr, ytr)
    mt = validation.regression_metrics(yte, tuned.predict(Xte))
    rows.append(dict(model="qpso_xgboost", split="chronological", n_train=len(ytr), n_test=len(yte),
                     train_s=None, infer_s=None, evaluations=tune["evaluations"],
                     **{k: round(v, 4) for k, v in mt.items()}))

    manifest = dict(years=years, test_year=test_year, n_rows=len(feat),
                    qpso_params=tune["params"], qpso_evals=tune["evaluations"])
    return rows, manifest


def main():
    rows, manifest = compute()
    for r in rows:
        print(f"  {r['model']:14} {r['split']:13} MAE={r['mae']:.3f} RMSE={r['rmse']:.3f} "
              f"R2={r['r2']:.3f} sMAPE={r['smape']:.1f}%")

    os.makedirs(RESULTS_DIR, exist_ok=True)
    out = os.path.join(RESULTS_DIR, "prediction_benchmark.csv")
    keys = sorted({k for r in rows for k in r})
    with open(out, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)
    with open(os.path.join(RESULTS_DIR, "prediction_benchmark_manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
    print("wrote", out)


if __name__ == "__main__":
    main()
