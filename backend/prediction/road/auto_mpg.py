"""Auto-MPG (UCI) loader — ROAD mode fuel-economy baseline + vehicle archetypes.

398 cars: mpg vs cylinders, displacement, horsepower, weight, acceleration, model year,
origin. Static specs → fuel economy (a simple road baseline; not time-series).
"""
import os

import numpy as np
import pandas as pd

AUTO_MPG = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "..",
                                         "Datasets", "Auto_mpg", "auto-mpg.data"))
COLUMNS = ["mpg", "cylinders", "displacement", "horsepower", "weight",
           "acceleration", "model_year", "origin", "car_name"]
FEATURES = ["cylinders", "displacement", "horsepower", "weight", "acceleration", "model_year", "origin"]
TARGET = "mpg"


def load():
    """Return a cleaned Auto-MPG frame (horsepower '?' -> NaN -> median imputed)."""
    df = pd.read_csv(AUTO_MPG, sep=r"\s+", names=COLUMNS, na_values="?")
    df["horsepower"] = pd.to_numeric(df["horsepower"], errors="coerce")
    df["horsepower"] = df["horsepower"].fillna(df["horsepower"].median())
    return df.dropna(subset=[TARGET]).reset_index(drop=True)


def xy(df):
    return df[FEATURES].astype(float), df[TARGET].astype(float)
