"""Multi-objective archive utilities (master doc §7.4): dominance, crowding,
hypervolume, and the external non-dominated archive update. Pure NumPy
(+ pymoo only for the hypervolume indicator)."""
import numpy as np


def nondominated_mask(F):
    F = np.asarray(F)
    n = len(F)
    keep = np.ones(n, bool)
    for i in range(n):
        if not keep[i]:
            continue
        dom = np.all(F <= F[i], axis=1) & np.any(F < F[i], axis=1)
        if dom.any():
            keep[i] = False
    return keep


def crowding_distance(F):
    n, m = F.shape
    d = np.zeros(n)
    if n <= 2:
        return np.full(n, np.inf)
    for j in range(m):
        o = np.argsort(F[:, j])
        d[o[0]] = d[o[-1]] = np.inf
        span = F[o[-1], j] - F[o[0], j]
        if span > 0:
            d[o[1:-1]] += (F[o[2:], j] - F[o[:-2], j]) / span
    return d


def hypervolume(F, ideal, nadir, ref=1.1):
    from pymoo.indicators.hv import HV
    Fn = (np.asarray(F) - ideal) / np.maximum(nadir - ideal, 1e-12)
    Fn = Fn[np.all(Fn <= ref, axis=1)]
    return float(HV(ref_point=np.full(Fn.shape[1], ref))(Fn)) if len(Fn) else 0.0


def update_archive(AX, AF, Xn, Fn, archive_size):
    """Merge new points into the archive, keep the non-dominated unique set,
    and trim to `archive_size` by removing the most crowded members."""
    CX, CF = np.vstack([AX, Xn]), np.vstack([AF, Fn])
    m = nondominated_mask(CF)
    CX, CF = CX[m], CF[m]
    _, u_idx = np.unique(np.round(CF, 6), axis=0, return_index=True)   # drop duplicates
    CX, CF = CX[u_idx], CF[u_idx]
    while len(CX) > archive_size:
        k = int(np.argmin(crowding_distance(CF)))
        CX, CF = np.delete(CX, k, 0), np.delete(CF, k, 0)
    return CX, CF


# Backward-compatible alias (engine historically used the private name).
_update_archive = update_archive
