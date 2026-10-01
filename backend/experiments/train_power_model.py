"""Train & benchmark the speed-resolved power model (Shifts marine data).

Reports in-domain (dev_in) AND distribution-shifted (dev_out) metrics — the whole
point of the Shifts benchmark — plus a QPSO-tuned XGBoost. Persists the artifact.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "optimization"))

from prediction import power_model as pm, models, validation, tune_qpso, registry


def _metrics(model, X, y):
    return {k: round(v, 4) for k, v in validation.regression_metrics(y, model.predict(X)).items()}


def main():
    tr, din, dout = pm.load_split()
    Xtr, ytr = pm.xy(tr)
    Xin, yin = pm.xy(din)
    Xout, yout = pm.xy(dout)
    print(f"rows: train={len(Xtr)} dev_in={len(Xin)} dev_out={len(Xout)} | features={len(pm.FEATURES)}")

    # baselines + untuned XGBoost (raw target: power has small negatives, so no log)
    from sklearn.linear_model import LinearRegression
    from sklearn.dummy import DummyRegressor
    lineup = {"mean_floor": DummyRegressor(strategy="mean"), "linear": LinearRegression(),
              "xgboost": models.xgb()}
    for name, mdl in lineup.items():
        mdl.fit(Xtr, ytr)
        print(f"  {name:11} in-domain {_metrics(mdl, Xin, yin)} | shifted {_metrics(mdl, Xout, yout)}")

    # QPSO-tuned XGBoost (tune against in-domain dev; raw target — power has small negatives)
    tune = tune_qpso.tune_xgb(Xtr, ytr, Xin, yin, pop=8, iters=8, seed=0, log_target=False)
    best = models.xgb(**tune["params"])
    best.fit(Xtr, ytr)
    m_in, m_out = _metrics(best, Xin, yin), _metrics(best, Xout, yout)
    print(f"  qpso_xgb    in-domain {m_in} | shifted {m_out}")

    registry.save_model(best, "power_shifts_xgb", dict(
        model_version="power_shifts_xgb_v1", task="power_kw", data="Shifts marine (synthetic subset)",
        features=pm.FEATURES, in_domain_metrics=m_in, shifted_metrics=m_out,
        qpso_params=tune["params"], sfoc_g_per_kwh=pm.SFOC_G_PER_KWH))
    print("saved -> models/power_shifts_xgb.joblib")


if __name__ == "__main__":
    main()
