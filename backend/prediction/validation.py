"""Prediction metrics (master doc §5.5): MAE, RMSE, R², sMAPE + timing. Pure NumPy."""
import time

import numpy as np


def mae(y, yhat):
    return float(np.mean(np.abs(np.asarray(y) - np.asarray(yhat))))


def rmse(y, yhat):
    return float(np.sqrt(np.mean((np.asarray(y) - np.asarray(yhat)) ** 2)))


def r2(y, yhat):
    y = np.asarray(y, float)
    ss_res = np.sum((y - np.asarray(yhat, float)) ** 2)
    ss_tot = np.sum((y - y.mean()) ** 2)
    return float(1.0 - ss_res / ss_tot) if ss_tot > 0 else 0.0


def smape(y, yhat):
    y, yhat = np.asarray(y, float), np.asarray(yhat, float)
    denom = (np.abs(y) + np.abs(yhat))
    mask = denom > 0
    return float(np.mean(2.0 * np.abs(yhat[mask] - y[mask]) / denom[mask]) * 100.0) if mask.any() else 0.0


def regression_metrics(y, yhat):
    return dict(mae=mae(y, yhat), rmse=rmse(y, yhat), r2=r2(y, yhat), smape=smape(y, yhat), n=int(len(y)))


class Timer:
    """Context manager returning elapsed seconds via .seconds."""
    def __enter__(self):
        self._t0 = time.perf_counter()
        return self

    def __exit__(self, *a):
        self.seconds = time.perf_counter() - self._t0
