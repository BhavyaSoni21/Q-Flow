"""NSGA-II baseline (master doc §7.7) via pymoo, wrapping the shared FleetProblem
(same decision vector, objectives, constraints, repair and evaluation budget as
MO-QPSO for a fair comparison)."""
import time
import numpy as np

from archive import nondominated_mask


def run_nsga2(problem, pop=100, iters=100, seed=0, smart=True, lamarck=False):
    from pymoo.algorithms.moo.nsga2 import NSGA2
    from pymoo.core.problem import ElementwiseProblem
    from pymoo.core.repair import Repair
    from pymoo.core.sampling import Sampling
    from pymoo.optimize import minimize

    problem.lamarckian = bool(lamarck)

    class _P(ElementwiseProblem):
        def __init__(s):
            super().__init__(n_var=problem.n_var, n_obj=3, xl=0.0, xu=1.0)

        def _evaluate(s, x, out, *a, **k):
            out["F"] = problem.evaluate(x)

    init_rng = np.random.default_rng(seed)

    class _Samp(Sampling):
        def _do(s, prob, n_samples, **k):
            X = problem.sample(init_rng, n_samples, smart)    # own seeded generator -> reproducible on any pymoo version
            return problem.repair_pop(X) if lamarck else X

    class _Rep(Repair):
        def _do(s, prob, X, **k):
            return problem.repair_pop(X)

    t0 = time.perf_counter()
    algo = NSGA2(pop_size=pop, sampling=_Samp(), repair=_Rep() if lamarck else None)
    res = minimize(_P(), algo, ("n_gen", iters + 1), seed=seed, save_history=True, verbose=False)
    rt = time.perf_counter() - t0
    hist = [(h.evaluator.n_eval, h.opt.get("F").copy()) for h in res.history]
    F, X = np.atleast_2d(res.F), np.atleast_2d(res.X)
    m = nondominated_mask(F)
    return dict(X=X[m], F=F[m], history=hist, runtime=rt, algo="NSGA-II")
