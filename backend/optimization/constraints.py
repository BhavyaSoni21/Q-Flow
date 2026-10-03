"""Independent feasibility verifier (master doc §4 Step 8, §22).

Re-checks a decoded plan against every constraint — separate from the repair that
produced it — and reports the §4 Step 8 constraint vector plus a normalized total
violation. The GHG cap is the one constraint repair does not enforce, so it is
checked here (and penalised during search in objectives).
"""
import numpy as np

from emissions import compliance


def constraint_report(problem, plan, ghg_total_t=None, cost_total=None):
    """Return the §4 Step 8 feasibility vector for a decoded plan."""
    r = problem.route
    on = plan["on"]
    spd, fu, ops = plan["speed"], plan["fuel"], plan["ops"]
    any_on = bool(on.any())
    demand = r["cargo_demand_t"]
    cargo = float(problem.cap[on].sum())

    cargo_ok = bool(any_on and cargo >= demand - 1e-9)
    deadline_ok = bool(any_on and np.all(spd[on] >= problem.s_req - 1e-9))
    speed_ok = bool(not any_on or (np.all(spd[on] >= problem.smin[on] - 1e-9)
                                   and np.all(spd[on] <= problem.smax[on] + 1e-9)))
    avail_ok = bool(any_on and problem.eligible[on].all())
    compat_ok = bool(not any_on or np.all(problem.compat[np.arange(problem.N), fu][on] > 0))
    bunker_ok = bool(not any_on or np.all(problem.fuel_av[fu][on] > 0))
    shore_ok = bool(np.all(~ops[on] | problem.ops_ok[on]) and (r["port_ops_available"] > 0 or not ops.any()))

    cap = getattr(problem, "ghg_cap", None)
    cap_ok = bool(ghg_total_t is None or compliance.ghg_cap_satisfied(ghg_total_t, cap))
    cost_ceiling = getattr(problem, "max_operating_cost_inr", None)
    profit_ok = bool(cost_ceiling is None or cost_total is None or cost_total <= cost_ceiling + 1e-6)

    viol = 0.0
    if not cargo_ok and demand > 0:
        viol += max(0.0, (demand - cargo) / demand)
    if any_on:
        viol += float(np.sum(np.maximum(0.0, problem.s_req - spd[on]))) / max(problem.s_req, 1e-9)
    if ghg_total_t is not None and cap is not None:
        viol += compliance.ghg_cap_violation(ghg_total_t, cap) / max(cap, 1e-9)
    if cost_ceiling is not None and cost_total is not None and cost_total > cost_ceiling:
        viol += (cost_total - cost_ceiling) / max(cost_ceiling, 1e-9)

    return dict(cargo_satisfied=cargo_ok, deadline_satisfied=deadline_ok, vessel_available=avail_ok,
                speed_valid=speed_ok, fuel_compatible=compat_ok, fuel_available=bunker_ok,
                shore_power_valid=shore_ok, emissions_cap_satisfied=cap_ok,
                profit_preserved=profit_ok,
                total_violation=round(float(viol), 6))
