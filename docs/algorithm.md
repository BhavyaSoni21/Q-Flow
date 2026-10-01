# Q-Flow — Algorithm (MO-QPSO)

The proposed optimizer is a **multi-objective quantum-behaved PSO** (QPSO, Sun et al.)
with an external Pareto archive, mixed-variable decoder, and constraint repair.
Implementation: `optimization/mo_qpso.py` (+ `archive.py`, `selection.py`), problem
model in `optimization/fleet_engine.py`. This is **quantum-inspired**, classical
hardware, **no quantum-speedup claim**.

## Decision vector
Latent `x ∈ [0,1]^(4N)` for N candidate vessels, decoded in four segments:
```
x[0:N]    → vessel ON/OFF        (> 0.5)
x[N:2N]   → cruising speed       (scaled to [min_speed, max_speed])
x[2N:3N]  → fuel pathway index   (bucketed to a valid fuel)
x[3N:4N]  → shore power ON/OFF   (> 0.5)
```

## Quantum-behaved update (the core)
Per iteration, for each particle:
```
alpha = alpha_hi − (alpha_hi − alpha_lo)·(t/iters)     # contraction–expansion coefficient
mbest = mean(personal_best positions)                   # mean best / mainstream thought
phi   ~ U(0,1);  p = phi·pbest + (1−phi)·gbest          # local attractor
u     ~ U(0,1);  sign = ±1 w.p. 0.5
x'    = p ± alpha·|mbest − x|·ln(1/u)                    # delta-potential-well sample
```
No velocity term — `x'` is **sampled** from a quantum potential well around the
attractor `p`. That is what distinguishes QPSO from classical PSO. The leader `gbest`
is drawn from the archive by crowding-distance binary tournament (or weighted
Tchebycheff). Classical **MOPSO** (`update="pso"`, velocity-based) is the control.

## Decoder → repair (feasibility by construction)
Repair order (`fleet_engine.decode` + `repair_x`):
1. drop unavailable / schedule-infeasible vessels;
2. clamp speed to `[s_req, max]` (schedule-feasible, ≤ max);
3. invalid/unbunkerable fuel → reference fuel;
4. shore power → only where ship-OPS & port-OPS compatible;
5. greedily add largest eligible vessels until cargo demand is met.
Lamarckian option writes repaired genes back into `x`.

## Objective evaluation
For active vessels: call predictor → `main_gj`, aux/shore split, fuel mass, then
objectives `[fuel energy GJ, operating cost USD, WtW GHG tCO2e]`. Optional **GHG-cap
penalty** (soft, master doc §7.5): `J ← J·(1 + v/cap) + v` when the cap is exceeded.

## Archive & selection
- External non-dominated archive, deduplicated, trimmed by crowding distance
  (`archive.update_archive`, size-bounded).
- Balanced recommendation = TOPSIS-style min normalized distance to the ideal point
  (`selection.select_balanced`); plus min-fuel / min-cost / min-GHG extremes.

## Termination & reproducibility
Fixed iteration budget (`iters`); fixed `(request, seed, vessels)` → identical output
(verified by test). Convergence history (hypervolume vs evaluations) recorded.

## How it differs from the baselines
| | MO-QPSO | Classical MOPSO | NSGA-II |
|---|---|---|---|
| Move | quantum potential-well sample (no velocity) | velocity update | crossover + mutation |
| Diversity | crowding archive + α schedule | crowding archive | crowding distance |
| Role | proposed | control | established baseline |
Benchmarked under identical scenario, objectives, constraints, evaluation budget, and
seeds (`experiments/run_optimizer_benchmark.py`).
