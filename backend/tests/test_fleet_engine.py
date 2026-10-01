"""Run:  python test_fleet_engine.py   (or pytest).  Covers dossier s.65 constraint/model/optimizer tests."""
import numpy as np, fleet_engine as fe

def _prob(n=10, demand=90000.0, **route):
    return fe.FleetProblem(fe.make_vessel_pool(n, 0), fe.default_route(cargo_demand_t=demand, **route))

def test_decoded_plans_satisfy_all_constraints():
    rng = np.random.default_rng(1)
    for kw in [dict(), dict(fuel_available=[1, 1, 0, 0, 0, 0]), dict(port_ops_available=0.0), dict(deadline_h=56.0)]:
        p = _prob(**kw)
        for x in rng.random((300, p.n_var)):
            d = p.decode(x); on = d["on"]
            assert d["feasible"] and p.cap[on].sum() >= p.route["cargo_demand_t"] - 1e-9          # cargo
            assert (d["speed"][on] >= p.s_req - 1e-9).all() and (d["speed"][on] <= p.smax[on] + 1e-9).all()  # schedule + max speed
            assert (d["speed"][on] >= p.smin[on] - 1e-9).all()
            assert (p.compat[np.arange(p.N), d["fuel"]][on] > 0).all()                             # fuel compatibility
            assert (p.fuel_av[d["fuel"]][on] > 0).all()                                            # bunkering availability
            assert (~d["ops"][on] | p.ops_ok[on]).all()                                            # shore-power compatibility
            if p.route["port_ops_available"] == 0: assert not d["ops"].any()
            assert p.eligible[on].all()

def test_objectives_finite_positive_and_deterministic():
    p = _prob(); X = np.random.default_rng(2).random((200, p.n_var))
    F = np.array([p.evaluate(x) for x in X]); assert np.isfinite(F).all() and (F > 0).all()
    a = fe.run_qpso(_prob(), 30, 15, seed=7)["F"]; b = fe.run_qpso(_prob(), 30, 15, seed=7)["F"]
    assert np.allclose(a, b)
    a = fe.run_nsga2(_prob(), 30, 15, seed=7)["F"]; b = fe.run_nsga2(_prob(), 30, 15, seed=7)["F"]
    assert np.allclose(a, b)

def test_returned_fronts_are_nondominated_and_reproducible():
    for fn in (fe.run_qpso, fe.run_nsga2):
        p = _prob(); r = fn(p, 40, 20, seed=3)
        assert fe.nondominated_mask(r["F"]).all()
        for x, f in zip(r["X"][:10], r["F"][:10]):
            assert np.allclose(_prob().evaluate(x), f)       # stored genotype re-evaluates to stored objectives

def test_unavailable_fuel_never_selected():
    p = _prob(fuel_available=[1, 1, 1, 1, 0, 0]); r = fe.run_qpso(p, 40, 20, seed=0)
    for x in r["X"]:
        _, rows = p.describe(x); assert all(row["fuel"] not in ("ammonia_green", "hydrogen_green") for row in rows)

def test_speed_slower_saves_fuel_but_not_below_schedule():
    p = _prob(); y = fe.physics_predictor(dict(engine_power_kw=np.full(5, 9000.), capacity_t=np.full(5, 3e4), design_speed_kn=np.full(5, 14.),
                 speed_kn=np.linspace(9, 17, 5), load_factor=np.full(5, .8), weather_factor=np.ones(5), type_code=np.zeros(5)))
    assert (np.diff(y) > 0).all() and (y > 0).all()
    assert np.isclose(p.s_req, 10.0)

def test_validation_and_aliases():
    assert fe.optimize_fleet(dict(weather="stormy"), iters=2)["status"] == "error"
    assert fe.optimize_fleet(dict(route_distance_nm=-5), iters=2)["status"] == "error"
    assert fe.optimize_fleet(dict(vessel_ids=["NOPE"]), iters=2)["status"] == "error"
    assert fe.optimize_fleet(dict(allowed_fuels=["plutonium"]), iters=2)["status"] == "error"
    assert fe.optimize_fleet(dict(deadline_hours=5), iters=2)["status"] == "infeasible"
    ok = fe.optimize_fleet(dict(route_distance_nm=600, cargo_demand_tonnes=45000, deadline_hours=72, allowed_fuels=["reference", "methanol"]), iters=15, pop=40)
    assert ok["status"] == "ok"
    used = {row["fuel"] for s in ok["pareto"] for row in s["plan"]}
    assert used <= {"vlsfo", "methanol_grey", "methanol_green"}

def test_pluggable_predictor_changes_result_and_negative_is_clamped():
    p = _prob(); x = np.random.default_rng(0).random(p.n_var); base = p.evaluate(x)
    fe.set_predictor(lambda f: -np.ones(len(f["speed_kn"])))        # nonsense model -> clamped to 0 fuel, no negatives
    try: assert (p.evaluate(x) >= 0).all()
    finally: fe.set_predictor(fe.physics_predictor)
    assert np.allclose(p.evaluate(x), base)

def test_lamarckian_repair_idempotent():
    p = _prob(); x = np.random.default_rng(5).random(p.n_var); xr = p.repair_x(x); d1, d2 = p.decode(x, False), p.decode(xr, False)
    assert all(np.array_equal(d1[k], d2[k]) for k in ("on", "fuel", "ops")) and np.allclose(d1["speed"], d2["speed"])

if __name__ == "__main__":
    ts = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in ts: t(); print("PASS", t.__name__)
    print(f"{len(ts)}/{len(ts)} passed")
