"""Train the prototype optimizer predictor from Datasets/Synthetic telemetry."""
import os
import sys

import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from prediction import models, registry

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA = os.path.join(ROOT, "Datasets", "Synthetic", "vessel_telemetry.csv")
FEATURES = ["speed_kn", "load_factor", "engine_power_kw", "weather_factor"]


def train():
    df = pd.read_csv(DATA)
    X, y = df[FEATURES], df["fuel_rate_tph"]
    cut = int(len(df) * 0.8)
    model = models.xgb(n_estimators=220, max_depth=6, learning_rate=0.08, random_state=20261003)
    model.fit(X.iloc[:cut], y.iloc[:cut])
    pred = model.predict(X.iloc[cut:])
    metrics = dict(mae=round(float(mean_absolute_error(y.iloc[cut:], pred)), 6),
                   r2=round(float(r2_score(y.iloc[cut:], pred)), 6),
                   holdout_rows=int(len(y) - cut))
    path = registry.save_model(model, "synthetic_engine_xgb", dict(
        model_version="synthetic-engine-xgb-v1", task="fuel_rate_tph",
        features=FEATURES, dataset="Datasets/Synthetic/vessel_telemetry.csv",
        dataset_type="synthetic_development_only", holdout_metrics=metrics,
        seed=20261003))
    print(dict(path=path, metrics=metrics))
    return metrics


if __name__ == "__main__":
    train()
