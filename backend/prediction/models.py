"""Prediction models for the MRV fuel-intensity benchmark (master doc §5.3, Exp. A).

Baselines + the final XGBoost. (The physics speed-power baseline lives in
physics_baseline.py; it belongs to the engine predictor, not this intensity task.)

Fuel-per-distance is heavy-tailed, so every model trains on a **log1p target**
(predict log kg/nm, invert to original units for metrics) — this keeps RMSE/R²
from being dominated by a few extreme ships.
"""
import numpy as np
from sklearn.compose import TransformedTargetRegressor
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from xgboost import XGBRegressor


def log_wrap(estimator):
    """Wrap an estimator to train on log1p(target) and predict in original units."""
    return TransformedTargetRegressor(regressor=estimator, func=np.log1p, inverse_func=np.expm1)


def xgb(**overrides):
    """Factory for an XGBoost regressor with sensible defaults (QPSO tunes these)."""
    params = dict(n_estimators=300, max_depth=6, learning_rate=0.1, subsample=0.9,
                  colsample_bytree=0.9, min_child_weight=1.0, reg_alpha=0.0, reg_lambda=1.0,
                  random_state=0, n_jobs=-1)
    params.update(overrides)
    return XGBRegressor(**params)


def make_models():
    """The benchmark lineup (log-target): naive mean floor, linear, random forest, untuned XGBoost."""
    base = {
        "mean_floor": DummyRegressor(strategy="mean"),
        "linear": LinearRegression(),
        "random_forest": RandomForestRegressor(n_estimators=200, random_state=0, n_jobs=-1),
        "xgboost": xgb(),
    }
    return {name: log_wrap(est) for name, est in base.items()}
