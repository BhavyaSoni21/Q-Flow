"""Train once, persist artifacts (master doc §16). Trains the QPSO-tuned XGBoost
fuel-intensity model on the in-scope MRV years, records honest held-out metrics,
and saves: (1) the deployable model (refit on all in-scope years) to the registry,
(2) the engine physics->MRV calibration scale. The API then loads these instead of
retraining.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "optimization"))

from data import dataset as dd
from prediction import dataset as pdata, tune_qpso, models, validation, physics_baseline as pb, registry
import fleet_engine as fe


def main():
    feat, _ = dd.build_training_frame()                      # in-scope years 2020–2025
    years = sorted(int(y) for y in feat["year"].unique())
    test_year = years[-1]

    tr = feat[feat["year"] != test_year]
    te = feat[feat["year"] == test_year]
    Xtr, ytr, cols = pdata.build_xy(tr)
    Xte, yte, _ = pdata.build_xy(te)
    Xte = Xte.reindex(columns=cols, fill_value=0.0)

    m = int(len(Xtr) * 0.8)
    tune = tune_qpso.tune_xgb(Xtr.iloc[:m], ytr.iloc[:m], Xtr.iloc[m:], ytr.iloc[m:], pop=10, iters=10, seed=0)
    holdout = models.log_wrap(models.xgb(**tune["params"]))
    holdout.fit(Xtr, ytr)
    metrics = validation.regression_metrics(yte, holdout.predict(Xte))

    # deployable model: refit on ALL in-scope years with the tuned params
    Xall, yall, cols_all = pdata.build_xy(feat)
    deploy = models.log_wrap(models.xgb(**tune["params"]))
    deploy.fit(Xall, yall)
    registry.save_model(deploy, "fuel_intensity_xgb", dict(
        model_version="fuel_intensity_xgb_v1", task="fuel_per_dist_kg_nm",
        features=cols_all, train_years=years, holdout_year=test_year,
        holdout_metrics={k: round(v, 4) for k, v in metrics.items()},
        qpso_params=tune["params"], qpso_evals=tune["evaluations"]))

    scale = pb.calibrate_scale(feat, fe.make_vessel_pool(10, 0))
    registry.save_metadata("engine_calibration", dict(
        scale=round(float(scale), 4), model_version="physics-mrv-cal-v1",
        basis="physics fuel/dist scaled to MRV fleet median"))

    print("holdout metrics:", {k: round(v, 4) for k, v in metrics.items()})
    print("calibration scale:", round(float(scale), 4))
    print("saved -> models/fuel_intensity_xgb.joblib + metadata.json")


if __name__ == "__main__":
    main()
