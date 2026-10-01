"""Leakage-safe train/test splits (master doc §5.4). Never a plain random split.

* chronological_split — train on earlier years, test on held-out later year(s).
* vessel_holdout_split — hold out whole vessels (by IMO) to test unseen-ship generalization.
"""
import numpy as np


def chronological_split(df, test_years):
    """Split by reporting year: rows in `test_years` are the test set."""
    test_years = set(test_years if hasattr(test_years, "__iter__") else [test_years])
    test = df[df["year"].isin(test_years)].reset_index(drop=True)
    train = df[~df["year"].isin(test_years)].reset_index(drop=True)
    return train, test


def vessel_holdout_split(df, frac=0.2, seed=0):
    """Hold out a fraction of distinct vessels (by IMO) — no IMO appears in both sets."""
    imos = df["imo"].dropna().unique().copy()
    rng = np.random.default_rng(seed)
    rng.shuffle(imos)
    n_test = int(len(imos) * frac)
    test_imos = set(imos[:n_test])
    test = df[df["imo"].isin(test_imos)].reset_index(drop=True)
    train = df[~df["imo"].isin(test_imos)].reset_index(drop=True)
    return train, test
