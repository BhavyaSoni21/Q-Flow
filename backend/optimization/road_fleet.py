"""Road fleet optimization problem (ROAD mode) — the road analog of FleetProblem.

Reuses the SAME MO-QPSO / NSGA-II optimizers (they call problem.evaluate/decode/
sample/repair_pop). Decision vector x in [0,1]^(3N): activation, speed, fuel.
In-loop fuel/energy uses a fast physics-informed road surrogate calibrated to VED
magnitudes (the trained VED ML model is the validated predictor / benchmark, just
as ships use the physics predictor in-loop). Vehicles are light/commercial (car/van
class), within the VED domain.
"""
from __future__ import annotations
import numpy as np

from emissions import factors
from emissions import lifecycle as _life
from emissions import cost as _cost

ROAD_FUELS = factors.ROAD_FUELS                      # diesel, gasoline, electricity
_FUEL_IDS = [f["fuel_id"] for f in ROAD_FUELS]
_DENSITY = {"diesel": 835.0, "gasoline": 737.0}      # g/L
_GRID_EF = factors.DEFAULT_GRID_EF_G_PER_KWH         # gCO2/kWh (EV)


class RoadInputError(ValueError):
    pass


def make_vehicle_pool(n=10, seed=0):
    """Transparent SYNTHETIC light/commercial vehicle pool (label as synthetic)."""
    rng = np.random.default_rng(seed)
    types = [  # name, cargo_cap_kg, min_kmh, max_kmh, weight_lb, cost_INR_day, range_km, fuels(idx into _FUEL_IDS)
        ("Car", 400, 40, 130, 3500, 6640, 500, [1, 2]),            # gasoline, electricity
        ("Hybrid Car", 400, 40, 130, 3700, 7885, 700, [1, 2]),
        ("Small Van", 1200, 40, 120, 5000, 11620, 550, [0, 1, 2]),  # diesel, gasoline, electricity
        ("Large Van", 2500, 40, 110, 6500, 15770, 500, [0, 2]),     # diesel, electricity
    ]
    rows = []
    for i in range(n):
        t = types[rng.integers(len(types))]
        j = rng.uniform(0.92, 1.08)
        compat = np.zeros(len(_FUEL_IDS), int)
        for fi in t[7]:
            compat[fi] = 1
        rows.append(dict(vehicle_id=f"R{i+1:03d}", vehicle_type=t[0],
                         capacity_kg=round(t[1] * j), min_speed_kmh=t[2], max_speed_kmh=t[3],
                         weight_lb=round(t[4] * j), cost_usd_day=round(t[5] * j),
                         range_km=round(t[6] * j), fuel_compatibility=compat.tolist(), availability=1))
    return rows


def default_road_route(**kw):
    r = dict(route_id="RD1", distance_km=300.0, cargo_demand_kg=4000.0, deadline_h=8.0,
             stop_time_h=1.0, buffer_h=0.5, carbon_price_usd_per_t=0.0,
             elec_price_usd_per_kwh=10.0)      # INR/kWh (key name legacy; value is INR)
    r.update(kw)
    return r


def _liquid_fpk(speed_kmh, weight_lb):
    """Fast road fuel surrogate: L/km rises with aero drag (v^2) and vehicle mass."""
    return (0.045 + 0.030 * (speed_kmh / 100.0) ** 2) * (weight_lb / 3500.0)


def _ev_kwh_per_km(speed_kmh, weight_lb):
    """Fast EV energy surrogate: kWh/km rises with speed and mass."""
    return (0.14 + 0.06 * (speed_kmh / 100.0) ** 2) * (weight_lb / 3500.0)


class RoadFleetProblem:
    def __init__(self, vehicles, route=None):
        if not vehicles:
            raise RoadInputError("No vehicles supplied.")
        self.V = vehicles
        self.route = route or default_road_route()
        self.lamarckian = False
        self.N, self.F = len(vehicles), len(_FUEL_IDS)
        self.n_var, self.n_obj = 3 * self.N, 3
        g = lambda k: np.array([v[k] for v in vehicles], float)
        self.cap, self.weight, self.cost_day = g("capacity_kg"), g("weight_lb"), g("cost_usd_day")
        self.smin, self.smax, self.range_km = g("min_speed_kmh"), g("max_speed_kmh"), g("range_km")
        self.avail = g("availability") > 0
        self.compat = np.array([v["fuel_compatibility"] for v in vehicles], int)
        r = self.route
        drive_window = r["deadline_h"] - r["stop_time_h"] - r["buffer_h"]
        self.s_req = r["distance_km"] / drive_window if drive_window > 0 else np.inf   # min km/h for schedule
        self.eligible = self.avail & (self.smax >= self.s_req)
        self.max_capacity = self.cap[self.eligible].sum()
        self.demand_ok = self.max_capacity >= r["cargo_demand_kg"]
        self.n_evals = self.n_repaired = self.n_cargo_repaired = 0

    def decode(self, x, count=True):
        N, F, r = self.N, self.F, self.route
        x = np.clip(x, 0, 1)
        on = (x[:N] > 0.5) & self.eligible
        speed = np.clip(np.maximum(self.smin + x[N:2 * N] * (self.smax - self.smin), self.s_req), self.smin, self.smax)
        fuel = np.minimum((x[2 * N:3 * N] * F).astype(int), F - 1)
        # fuel compatibility -> fall back to the vehicle's first compatible fuel
        ok = self.compat[np.arange(N), fuel] > 0
        first_compat = np.argmax(self.compat, axis=1)
        fuel = np.where(ok, fuel, first_compat)
        # EV range: if electricity (index 2) chosen but distance > range, switch to a compatible liquid
        ev = fuel == 2
        too_far = ev & (r["distance_km"] > self.range_km)
        for i in np.where(too_far)[0]:
            liq = [k for k in (0, 1) if self.compat[i, k] > 0]
            if liq:
                fuel[i] = liq[0]
            else:
                on[i] = False
        # cargo demand: greedily add eligible vehicles (largest first) until covered
        d = r["cargo_demand_kg"]
        if self.cap[on].sum() < d:
            for i in np.argsort(-self.cap):
                if self.eligible[i] and not on[i]:
                    on[i] = True
                    if self.cap[on].sum() >= d:
                        break
        if count:
            self.n_evals += 0
        feasible = bool(self.cap[on].sum() >= d) and on.any()
        return dict(on=on, speed=speed, fuel=fuel, feasible=feasible)

    def repair_x(self, x):
        N, F = self.N, self.F
        x = np.clip(np.asarray(x, float), 0, 1).copy()
        p = self.decode(x, count=False)
        x[N:2 * N] = (p["speed"] - self.smin) / np.maximum(self.smax - self.smin, 1e-9)
        xf = x[2 * N:3 * N]
        xf[:] = (p["fuel"] + 0.5) / F
        x[:N] = np.where(p["on"], np.maximum(x[:N], 0.75), np.minimum(x[:N], 0.25))
        return np.clip(x, 0, 1)

    def repair_pop(self, X):
        return np.array([self.repair_x(x) for x in X])

    def sample(self, rng, n, smart=True):
        X = rng.random((n, self.n_var))
        if smart and self.max_capacity > 0:
            base = np.clip(self.route["cargo_demand_kg"] / self.max_capacity, 0.03, 0.9)
            p_on = np.clip(base * rng.uniform(0.7, 2.0, size=(n, 1)), 0.03, 0.95)
            X[:, :self.N] = np.where(rng.random((n, self.N)) < p_on, rng.uniform(0.5, 1.0, (n, self.N)),
                                     rng.uniform(0.0, 0.5, (n, self.N)))
        return X

    def evaluate_plan(self, p, detail=False):
        r, on = self.route, p["on"]
        if not p["feasible"] or not on.any():
            return (np.array([1e12, 1e12, 1e12]), None) if detail else np.array([1e12, 1e12, 1e12])
        idx = np.where(on)[0]
        dist = r["distance_km"]
        spd, fu, w = p["speed"][idx], p["fuel"][idx], self.weight[idx]
        energy_mj = np.zeros(len(idx)); ghg_t = np.zeros(len(idx)); cost_fuel = np.zeros(len(idx))
        fuel_qty = np.zeros(len(idx))
        for k in range(len(idx)):
            fid, f = _FUEL_IDS[fu[k]], ROAD_FUELS[fu[k]]
            if fid == "electricity":
                kwh = _ev_kwh_per_km(spd[k], w[k]) * dist
                energy_mj[k] = kwh * 3.6; ghg_t[k] = kwh * _GRID_EF / 1e6
                cost_fuel[k] = kwh * r["elec_price_usd_per_kwh"]; fuel_qty[k] = kwh
            else:
                fuel_l = _liquid_fpk(spd[k], w[k]) * dist
                mass_t = fuel_l * _DENSITY[fid] / 1e6
                energy_mj[k] = mass_t * 1000.0 * f["lhv"]; ghg_t[k] = energy_mj[k] * f["wtw"] / 1e6
                cost_fuel[k] = fuel_l * f["price"]; fuel_qty[k] = fuel_l
        hours = dist / spd + r["stop_time_h"]
        cost = cost_fuel + self.cost_day[idx] * hours / 24.0 + ghg_t * r["carbon_price_usd_per_t"]
        objs = np.array([energy_mj.sum(), cost.sum(), ghg_t.sum()])
        if not detail:
            return objs
        lf = min(1.0, r["cargo_demand_kg"] / self.cap[idx].sum())
        rows = [dict(vehicle_id=self.V[i]["vehicle_id"], vehicle_type=self.V[i]["vehicle_type"],
                     cargo_kg=round(float(self.cap[i] * lf), 1), speed_kmh=round(float(spd[k]), 1),
                     fuel=_FUEL_IDS[fu[k]], fuel_qty=round(float(fuel_qty[k]), 2),
                     energy_mj=round(float(energy_mj[k]), 1), cost_usd=round(float(cost[k]), 0),
                     wtw_ghg_t=round(float(ghg_t[k]), 4)) for k, i in enumerate(idx)]
        return objs, rows

    def evaluate(self, x):
        self.n_evals += 1
        return self.evaluate_plan(self.decode(x, count=not self.lamarckian))

    def plan_of(self, x):
        return self.decode(np.asarray(x, float))

    def describe(self, x):
        return self.evaluate_plan(self.decode(np.asarray(x, float)), detail=True)

    def baseline_plan(self):
        """Cheapest-per-kg eligible vehicles, min schedule speed, first compatible liquid fuel."""
        N = self.N
        order = [i for i in np.argsort(self.cost_day / np.maximum(self.cap, 1)) if self.eligible[i]]
        on = np.zeros(N, bool)
        for i in order:
            on[i] = True
            if self.cap[on].sum() >= self.route["cargo_demand_kg"]:
                break
        speed = np.clip(np.maximum(self.smin, self.s_req), self.smin, self.smax)
        fuel = np.argmax(self.compat, axis=1)
        return dict(on=on, speed=speed, fuel=fuel,
                    feasible=bool(self.cap[on].sum() >= self.route["cargo_demand_kg"]))


# ---------------------------------------------------------------------------
# API-style entry point — reuses the shared MO-QPSO / NSGA-II optimizers
# ---------------------------------------------------------------------------
from mo_qpso import run_qpso            # noqa: E402
from nsga2_baseline import run_nsga2    # noqa: E402
from selection import select_balanced   # noqa: E402


def _run_algo(name, pr, pop, iters, seed):
    if name == "NSGA-II":
        return run_nsga2(pr, pop, iters, seed)
    return run_qpso(pr, pop, iters, seed=seed, update="qpso" if name == "MO-QPSO" else "pso")


def optimize_road_fleet(request: dict, vehicles=None, algo="auto", pop=100, iters=100, seed=0,
                        weights=(1 / 3, 1 / 3, 1 / 3)):
    """Road counterpart of optimize_fleet. Never raises on bad user input."""
    try:
        pool = vehicles if vehicles is not None else make_vehicle_pool(10)
        if request.get("vehicle_ids"):
            want = set(request["vehicle_ids"])
            unknown = [w for w in want if w not in {v["vehicle_id"] for v in pool}]
            if unknown:
                raise RoadInputError(f"Unknown vehicle_ids: {unknown}")
            pool = [v for v in pool if v["vehicle_id"] in want]
        route = default_road_route(
            distance_km=request.get("route_distance_km", 300.0),
            cargo_demand_kg=request.get("cargo_demand_kg", 4000.0),
            deadline_h=request.get("deadline_hours", 8.0),
            carbon_price_usd_per_t=request.get("carbon_price_usd_per_t", 0.0))
        pr = RoadFleetProblem(pool, route)
    except RoadInputError as e:
        return dict(status="error", reason=str(e))
    if not pr.demand_ok:
        return dict(status="infeasible",
                    reason=f"Road demand/deadline infeasible: need >= {pr.s_req:.0f} km/h and the vehicles able to "
                           f"drive that fast carry {pr.max_capacity:.0f} kg < demand {route['cargo_demand_kg']:.0f} kg.")
    if algo == "auto":
        algo = "MO-QPSO" if pr.N <= 50 else "NSGA-II"
    res = _run_algo(algo, pr, pop, iters, seed)
    base_f = pr.evaluate_plan(pr.baseline_plan())
    sols = []
    for x, f in zip(res["X"], res["F"]):
        _, rows = pr.describe(x)
        actual_cost = float(sum(row["cost_usd"] for row in rows or []))
        actual_ghg = float(sum(row["wtw_ghg_t"] for row in rows or []))
        sols.append((dict(objectives=dict(energy_mj=float(f[0]), cost_usd=actual_cost, wtw_ghg_t=actual_ghg),
                          plan=rows), np.asarray(f, float)))
    _, baseline_rows = pr.evaluate_plan(pr.baseline_plan(), detail=True)
    baseline_cost = float(sum(row["cost_usd"] for row in baseline_rows or []))
    baseline_ghg = float(sum(row["wtw_ghg_t"] for row in baseline_rows or []))
    improving = [(solution, objective) for solution, objective in sols
                 if solution["objectives"]["cost_usd"] < baseline_cost - 1e-9
                 and solution["objectives"]["wtw_ghg_t"] < baseline_ghg - 1e-9]
    if not improving:
        return dict(status="infeasible", mode="road",
                    reason="No feasible plan in this optimization run reduces both operating cost and WtW emissions versus the baseline. Adjust the fleet, fuels, deadline, or run budget.",
                    baseline=dict(energy_mj=float(base_f[0]), cost_usd=baseline_cost, wtw_ghg_t=baseline_ghg),
                    pareto=[])
    sols = [solution for solution, _ in improving]
    k = select_balanced(np.vstack([objective for _, objective in improving]), weights)
    return dict(status="ok", mode="road", algorithm=res["algo"], seed=seed, runtime_s=res["runtime"],
                baseline=dict(energy_mj=float(base_f[0]), cost_usd=baseline_cost, wtw_ghg_t=baseline_ghg),
                balanced_index=k, pareto=sols,
                units=dict(energy="MJ", cost="INR", ghg="tCO2e (well-to-wake)"))


if __name__ == "__main__":
    out = optimize_road_fleet(dict(cargo_demand_kg=4000), iters=30)
    print(out["status"], len(out.get("pareto", [])), out.get("baseline"))


