"""Prediction benchmark — Experiment A (master doc §14): compare models on the
MRV fuel-intensity task under a leakage-safe split, reporting MAE/RMSE/R²/sMAPE
and train/infer time. Columns are aligned train→test so unseen ship-type dummies
don't break inference.
"""
from data import splits
from prediction import dataset, models, validation


def _aligned_xy(df_train, df_test):
    Xtr, ytr, cols = dataset.build_xy(df_train)
    Xte, yte, _ = dataset.build_xy(df_test)
    Xte = Xte.reindex(columns=cols, fill_value=0.0)   # match train's one-hot columns
    return Xtr, ytr, Xte, yte, cols


def run_prediction_benchmark(featured_df, split="chronological", test_years=None, frac=0.2, seed=0,
                             extra_models=None):
    """Fit each model on train, score on the held-out set. Returns a list of metric rows."""
    if split == "chronological":
        tr, te = splits.chronological_split(featured_df, test_years or [featured_df["year"].max()])
    else:
        tr, te = splits.vessel_holdout_split(featured_df, frac, seed)
    Xtr, ytr, Xte, yte, cols = _aligned_xy(tr, te)

    lineup = dict(models.make_models())
    if extra_models:
        lineup.update(extra_models)

    rows = []
    for name, mdl in lineup.items():
        with validation.Timer() as tfit:
            mdl.fit(Xtr, ytr)
        with validation.Timer() as tinf:
            pred = mdl.predict(Xte)
        m = validation.regression_metrics(yte, pred)
        rows.append(dict(model=name, split=split, n_train=len(ytr), n_test=len(yte),
                         train_s=round(tfit.seconds, 3), infer_s=round(tinf.seconds, 4),
                         **{k: round(v, 4) for k, v in m.items()}))
    return rows
