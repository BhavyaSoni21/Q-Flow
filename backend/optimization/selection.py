"""Pareto-point selection (master doc §7.4): pick a single balanced recommendation."""
import numpy as np


def select_balanced(F, weights=(1 / 3, 1 / 3, 1 / 3)):
    """TOPSIS-style pick: smallest weighted distance to the ideal point (normalised objectives)."""
    F = np.asarray(F, float)
    Fn = (F - F.min(0)) / np.maximum(F.max(0) - F.min(0), 1e-12)
    return int(np.argmin(np.sqrt((np.asarray(weights) * Fn ** 2).sum(1))))
