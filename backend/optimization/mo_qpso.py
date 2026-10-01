"""Multi-objective quantum-behaved PSO (master doc §7.6) and the classical MOPSO
control, sharing one external Pareto archive and leader-selection logic.

update="qpso" (quantum-behaved, Sun et al.):
    p = phi*pbest + (1-phi)*gbest ;  x' = p +/- alpha*|mbest - x|*ln(1/u)
    alpha contracts alpha_hi -> alpha_lo; no velocity term (delta-potential-well sampling).
update="pso" (classical MOPSO):
    v' = w*v + c1*r1*(pbest-x) + c2*r2*(gbest-x), w: 0.9 -> 0.4, c1=c2=1.5
"""
import time
import numpy as np

from archive import nondominated_mask, crowding_distance, update_archive


def run_qpso(problem, pop=100, iters=100, archive_size=100, seed=0, alpha_hi=1.0, alpha_lo=0.5,
             update="qpso", smart=True, mutation=0.0, lamarck=False, leader="crowd"):
    """Multi-objective swarm optimiser with an external Pareto archive.
    mutation: per-dimension probability of re-sampling a coordinate uniformly (0 = off)."""
    rng = np.random.default_rng(seed)
    n = problem.n_var
    lamarck = bool(lamarck)
    problem.lamarckian = lamarck
    X = problem.sample(rng, pop, smart)
    if lamarck:
        X = problem.repair_pop(X)
    F = np.array([problem.evaluate(x) for x in X])
    PX, PF = X.copy(), F.copy()
    m = nondominated_mask(F)
    AX, AF = X[m].copy(), F[m].copy()
    V = rng.uniform(-0.1, 0.1, (pop, n))
    W = rng.dirichlet(np.ones(3), size=pop)       # fixed preference direction per particle (decomposition-style leaders)
    hist = [(pop, AF.copy())]
    t0 = time.perf_counter()
    for t in range(iters):
        frac = t / max(iters - 1, 1)
        if leader == "tcheby" and len(AX) > 1:
            # each particle follows the archive member that best matches ITS weight vector
            # (weighted Tchebycheff on archive-normalised objectives) -> particles stay in their own front region
            lo, hi = AF.min(0), AF.max(0)
            An = (AF - lo) / np.maximum(hi - lo, 1e-12)
            idx = np.argmin(np.max(W[:, None, :] * An[None, :, :], axis=2), axis=1)
            G = AX[idx]
        else:   # binary tournament on crowding distance
            cd = crowding_distance(AF)
            a, b = rng.integers(len(AX), size=pop), rng.integers(len(AX), size=pop)
            G = AX[np.where(cd[a] >= cd[b], a, b)]
        if update == "qpso":
            alpha = alpha_hi - (alpha_hi - alpha_lo) * frac
            mbest = PX.mean(0)
            phi = rng.random((pop, n))
            p = phi * PX + (1 - phi) * G
            u = np.clip(rng.random((pop, n)), 1e-12, 1.0)
            sign = np.where(rng.random((pop, n)) < 0.5, -1.0, 1.0)
            Xn = p + sign * alpha * np.abs(mbest - X) * np.log(1.0 / u)
        else:
            w = 0.9 - 0.5 * frac
            V = np.clip(w * V + 1.5 * rng.random((pop, n)) * (PX - X) + 1.5 * rng.random((pop, n)) * (G - X), -0.5, 0.5)
            Xn = X + V
        Xn = np.clip(Xn, 0, 1)
        if mutation > 0:
            mm = rng.random((pop, n)) < mutation
            Xn = np.where(mm, rng.random((pop, n)), Xn)
        if lamarck:
            Xn = problem.repair_pop(Xn)
        Fn = np.array([problem.evaluate(x) for x in Xn])
        dom_new = np.all(Fn <= PF, axis=1) & np.any(Fn < PF, axis=1)
        dom_old = np.all(PF <= Fn, axis=1) & np.any(PF < Fn, axis=1)
        upd = dom_new | (~dom_new & ~dom_old & (rng.random(pop) < 0.5))
        PX[upd], PF[upd] = Xn[upd], Fn[upd]
        X = Xn
        AX, AF = update_archive(AX, AF, Xn, Fn, archive_size)
        hist.append((pop * (t + 2), AF.copy()))
    return dict(X=AX, F=AF, history=hist, runtime=time.perf_counter() - t0,
                algo="MO-QPSO" if update == "qpso" else "MOPSO")
