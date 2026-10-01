"""Road fleet optimizer tests — mirrors the ship engine tests on the road mode."""
import numpy as np
import road_fleet as rf


def _prob(n=10, demand=3500.0, **route):
    return rf.RoadFleetProblem(rf.make_vehicle_pool(n, 0), rf.default_road_route(cargo_demand_kg=demand, **route))


def test_decoded_plans_satisfy_constraints():
    p = _prob()
    rng = np.random.default_rng(1)
    for x in rng.random((200, p.n_var)):
        d = p.decode(x); on = d["on"]
        assert d["feasible"] and p.cap[on].sum() >= p.route["cargo_demand_kg"] - 1e-9      # cargo
        assert (d["speed"][on] >= p.s_req - 1e-9).all() and (d["speed"][on] <= p.smax[on] + 1e-9).all()
        assert (p.compat[np.arange(p.N), d["fuel"]][on] > 0).all()                          # fuel compatibility


def test_objectives_finite_positive():
    p = _prob()
    F = np.array([p.evaluate(x) for x in np.random.default_rng(2).random((100, p.n_var))])
    assert np.isfinite(F).all() and (F > 0).all()


def test_optimize_ok_shape_and_reproducible():
    a = rf.optimize_road_fleet(dict(cargo_demand_kg=3000, deadline_hours=8), iters=15, pop=30, seed=7)
    b = rf.optimize_road_fleet(dict(cargo_demand_kg=3000, deadline_hours=8), iters=15, pop=30, seed=7)
    assert a["status"] == "ok" and a["mode"] == "road" and a["pareto"]
    assert len(a["pareto"]) == len(b["pareto"])                                             # reproducible
    sol = a["pareto"][a["balanced_index"]]
    assert sol["plan"] and {"vehicle_id", "speed_kmh", "fuel", "wtw_ghg_t", "cost_usd"} <= set(sol["plan"][0])


def test_optimize_infeasible_message():
    out = rf.optimize_road_fleet(dict(cargo_demand_kg=4000, deadline_hours=0.5), iters=5, pop=20)
    assert out["status"] == "infeasible" and "reason" in out


def test_ev_range_respected():
    # feasible long route beyond EV range: any active EV must actually have the range
    p = _prob(distance_km=2000.0, deadline_h=40.0)
    x = np.zeros(p.n_var); x[:p.N] = 1.0; x[2 * p.N:3 * p.N] = 0.95   # push fuel toward electricity
    d = p.decode(x)
    for i in np.where(d["on"])[0]:
        if d["fuel"][i] == 2:                                        # electricity index
            assert p.range_km[i] >= 2000.0
