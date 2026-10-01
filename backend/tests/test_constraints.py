"""Independent constraint-verifier + GHG-cap wiring tests (master doc §4 Step 8, §6.6, §15)."""
import numpy as np
import fleet_engine as fe
from constraints import constraint_report


def _prob(**route):
    return fe.FleetProblem(fe.make_vessel_pool(10, 0), fe.default_route(**route))


def test_constraint_report_feasible_plans_all_true():
    p = _prob()
    rng = np.random.default_rng(0)
    for x in rng.random((50, p.n_var)):
        plan = p.decode(x, count=False)
        rep = constraint_report(p, plan, ghg_total_t=100.0)
        assert all(rep[k] for k in ("cargo_satisfied", "deadline_satisfied", "speed_valid",
                                    "vessel_available", "fuel_compatible", "fuel_available",
                                    "shore_power_valid", "emissions_cap_satisfied"))
        assert rep["total_violation"] == 0.0


def test_ghg_cap_penalizes_evaluation():
    base = _prob()
    x = np.random.default_rng(3).random(base.n_var)
    f_nocap = base.evaluate_plan(base.decode(x, count=False))
    capped = _prob(ghg_cap_tonnes_co2e=1.0)          # absurdly tight -> always violated
    f_cap = capped.evaluate_plan(capped.decode(x, count=False))
    assert (f_cap >= f_nocap).all() and f_cap[2] > f_nocap[2]


def test_ghg_cap_report_flag_both_ways():
    p = _prob(ghg_cap_tonnes_co2e=1.0)
    plan = p.decode(np.random.default_rng(1).random(p.n_var), count=False)
    assert constraint_report(p, plan, ghg_total_t=500.0)["emissions_cap_satisfied"] is False
    assert constraint_report(p, plan, ghg_total_t=0.5)["emissions_cap_satisfied"] is True


def test_optimize_fleet_includes_per_solution_constraints():
    out = fe.optimize_fleet(dict(cargo_demand_tonnes=45000, deadline_hours=72), iters=20, pop=40)
    assert out["status"] == "ok"
    bal = out["pareto"][out["balanced_index"]]
    assert "constraints" in bal and bal["constraints"]["cargo_satisfied"]
