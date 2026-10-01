"""Quantum-inspired (QPSO) single-objective hyperparameter tuner for XGBoost
(master doc §5.3). Same quantum-behaved update as the fleet MO-QPSO (Sun et al.),
here minimising a single fitness = validation RMSE over a bounded hyperparameter box.
This is the "quantum-inspired search tunes the model under a fixed validation
protocol" claim — NOT quantum machine learning.
"""
import numpy as np

from prediction import models, validation

# bounded hyperparameter search space (master doc §5.3)
BOUNDS = {
    "max_depth": (3, 10),
    "learning_rate": (0.01, 0.3),
    "n_estimators": (100, 500),
    "min_child_weight": (1, 10),
    "subsample": (0.6, 1.0),
    "colsample_bytree": (0.6, 1.0),
    "reg_alpha": (0.0, 1.0),
    "reg_lambda": (0.5, 3.0),
}
_INT = {"max_depth", "n_estimators", "min_child_weight"}
_KEYS = list(BOUNDS)


def decode(x):
    """Map a latent vector in [0,1]^8 to an XGBoost hyperparameter dict."""
    p = {}
    for i, k in enumerate(_KEYS):
        lo, hi = BOUNDS[k]
        v = lo + float(np.clip(x[i], 0, 1)) * (hi - lo)
        p[k] = int(round(v)) if k in _INT else float(v)
    return p


def tune_xgb(X_tr, y_tr, X_val, y_val, pop=12, iters=15, seed=0, alpha_hi=1.0, alpha_lo=0.5,
             log_target=True):
    """QPSO over the hyperparameter box; fitness = validation RMSE. Fixed budget = pop*(iters+1).
    log_target=True trains on log1p(target) (heavy-tailed targets like fuel intensity); set
    False for targets with non-positive values (e.g. power with sensor noise near zero)."""
    rng = np.random.default_rng(seed)
    n = len(_KEYS)

    def fitness(x):
        est = models.xgb(**decode(x))
        m = models.log_wrap(est) if log_target else est
        m.fit(X_tr, y_tr)
        return validation.rmse(y_val, m.predict(X_val))

    X = rng.random((pop, n))
    F = np.array([fitness(x) for x in X])
    PX, PF = X.copy(), F.copy()
    gi = int(np.argmin(F))
    GX, GF = X[gi].copy(), float(F[gi])
    history = [GF]
    for t in range(iters):
        alpha = alpha_hi - (alpha_hi - alpha_lo) * (t / max(iters - 1, 1))
        mbest = PX.mean(0)
        for i in range(pop):
            phi = rng.random(n)
            p = phi * PX[i] + (1 - phi) * GX
            u = np.clip(rng.random(n), 1e-12, 1.0)
            sign = np.where(rng.random(n) < 0.5, -1.0, 1.0)
            xi = np.clip(p + sign * alpha * np.abs(mbest - X[i]) * np.log(1.0 / u), 0.0, 1.0)
            fi = fitness(xi)
            X[i] = xi
            if fi < PF[i]:
                PX[i], PF[i] = xi, fi
            if fi < GF:
                GX, GF = xi.copy(), fi
        history.append(GF)
    return dict(params=decode(GX), rmse=float(GF), history=history,
                evaluations=pop * (iters + 1))
