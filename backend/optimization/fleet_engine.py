"""
fleet_engine.py  --  Q-GreenFleet: Green Fleet Optimization Engine (SIH26138, Module B)

Self-contained, NumPy-only core (+ pymoo for the NSGA-II baseline and hypervolume).

Decision vector x in [0,1]^(4N), for N candidate vessels:
    x[0:N]    -> vessel ON/OFF      (> 0.5)
    x[N:2N]   -> cruising speed     (scaled to [min_speed, max_speed])
    x[2N:3N]  -> fuel pathway index (bucketed)
    x[3N:4N]  -> shore power ON/OFF (> 0.5)

Objectives (all minimised):
    [0] fuel energy (GJ)            main engine + auxiliary
    [1] operating cost (USD)        fuel + charter/time + shore electricity + carbon price
    [2] lifecycle GHG (tCO2e)       Well-to-Wake: fuel energy * EF_WtW + grid electricity * grid EF

Lifecycle factors are defined and sourced in emissions/factors.py (WtW grounded in
IMO MEPC.391(81) LCA / FuelEU conventions; prices are indicative scenario values).
The deterministic emissions/cost math lives in the emissions/ package (energy,
shore_power, lifecycle, cost, compliance) and is unit-tested independently.

The fuel predictor is pluggable (see `set_predictor` / `make_xgb_predictor`).
"""
from __future__ import annotations
import json, time
import numpy as np

# Deterministic emissions/cost engine (master doc §6), split into audited modules.
from emissions.factors import (
    DEFAULT_FUELS, REF_FUEL, WEATHER, AUX_SFOC_KG_PER_KWH, DEFAULT_GRID_EF_G_PER_KWH,
)
from emissions import energy as _energy
from emissions import shore_power as _shore
from emissions import lifecycle as _life
from emissions import cost as _cost

# ----------------------------------------------------------------------------
# 1. Reference data -- sourced lifecycle factors are imported from
#    emissions/factors.py (DEFAULT_FUELS, REF_FUEL, WEATHER, AUX_SFOC_KG_PER_KWH).
# ----------------------------------------------------------------------------


def default_route(**kw):
    r = dict(route_id="R1", distance_nm=600.0, cargo_demand_t=90000.0, deadline_h=72.0,
             port_time_h=8.0, buffer_h=4.0, weather="normal",
             fuel_available=[1] * len(DEFAULT_FUELS),      # bunkering availability per fuel
             port_ops_available=1.0,                        # share of berth time with shore power (0..1)
             grid_ef_g_per_kwh=DEFAULT_GRID_EF_G_PER_KWH,   # sourced grid factor (emissions/factors.py)
             shore_price_usd_per_kwh=0.12,
             carbon_price_usd_per_t=0.0)
    r.update(kw)
    return r


def make_vessel_pool(n=10, seed=0):
    """Transparent SYNTHETIC vessel pool (label as synthetic in provenance table)."""
    rng = np.random.default_rng(seed)
    types = [  # name, capacity_t, design_kn, min_kn, max_kn, power_kw, charter_usd_day
        ("Coaster", 8000, 12.0, 7, 15, 3500, 6500),
        ("Feeder", 15000, 13.0, 8, 16, 6000, 9500),
        ("Handy", 30000, 14.0, 8, 17, 9000, 14000),
        ("Midsize", 50000, 14.5, 9, 18, 13000, 20000),
        ("Large", 75000, 15.0, 9, 18, 18000, 27000),
    ]
    rows = []
    for i in range(n):
        t = types[rng.integers(len(types))]
        j = rng.uniform(0.92, 1.08)  # individual variation
        compat = np.zeros(len(DEFAULT_FUELS), dtype=int)
        compat[0] = 1
        compat[1] = rng.random() < 0.55                     # dual-fuel LNG
        compat[2] = compat[3] = int(rng.random() < 0.45)    # methanol-ready (both pathways)
        compat[4] = int(rng.random() < 0.20)                # ammonia-ready
        compat[5] = int(rng.random() < 0.10)                # hydrogen-ready
        rows.append(dict(
            vessel_id=f"V{i+1:03d}", vessel_type=t[0], type_code=types.index(t),
            capacity_t=round(t[1] * j), design_speed_kn=t[2], min_speed_kn=t[3], max_speed_kn=t[4],
            engine_power_kw=round(t[5] * j), charter_usd_day=round(t[6] * j),
            fuel_compatibility=compat.tolist(), shore_power_compatible=int(rng.random() < 0.6),
            availability=1))
    return rows


# ----------------------------------------------------------------------------
# 2. Pluggable fuel predictor
# ----------------------------------------------------------------------------
def physics_predictor(f):
    """Stand-in predictor: main-engine fuel rate (tonnes/h of REFERENCE fuel).
    f is a dict of equal-length arrays: engine_power_kw, capacity_t, design_speed_kn,
    speed_kn, load_factor, weather_factor, type_code.  Cubic speed-power law (dossier s.12)."""
    power = 0.85 * f["engine_power_kw"] * (f["speed_kn"] / f["design_speed_kn"]) ** 3 \
            * (0.65 + 0.35 * f["load_factor"]) * f["weather_factor"]
    sfoc_g_kwh = 175.0 * (1.0 + 0.10 * (1.0 - np.clip(power / (0.85 * f["engine_power_kw"]), 0, 1)))  # part-load penalty
    return power * sfoc_g_kwh * 1e-6


_PREDICTOR = physics_predictor


def set_predictor(fn):
    """Plug in the teammate's trained model. fn(features_dict_of_arrays) -> tonnes/hour array."""
    global _PREDICTOR
    _PREDICTOR = fn


def make_xgb_predictor(model, feature_cols, transform=None):
    """Wrap a fitted sklearn/XGBoost regressor. feature_cols must be names present in the
    feature dict (engine_power_kw, capacity_t, design_speed_kn, speed_kn, load_factor,
    weather_factor, type_code). `transform` may map the dict -> DataFrame if you need engineering.
    The model must predict tonnes/hour of reference fuel; adapt the scale here if it does not."""
    import pandas as pd

    def _pred(f):
        df = transform(f) if transform else pd.DataFrame({c: f[c] for c in feature_cols})
        return np.maximum(np.asarray(model.predict(df[feature_cols] if transform else df), float), 0.0)
    return _pred


# ----------------------------------------------------------------------------
# 2b. Input validation + fuel-name aliases (dossier s.50 uses "reference" / "methanol")
# ----------------------------------------------------------------------------
FUEL_ALIASES = {"reference": ["vlsfo"], "vlsfo": ["vlsfo"], "lng": ["lng"],
                "methanol": ["methanol_grey", "methanol_green"], "ammonia": ["ammonia_green"],
                "hydrogen": ["hydrogen_green"]}
_VESSEL_KEYS = ["vessel_id", "capacity_t", "design_speed_kn", "min_speed_kn", "max_speed_kn",
                "engine_power_kw", "charter_usd_day", "fuel_compatibility", "shore_power_compatible"]


class InputError(ValueError):
    pass


def validate_vessels(vessels, n_fuels=len(DEFAULT_FUELS)):
    """Fail early with a readable message; fill optional fields (availability, type_code, vessel_type)."""
    if not vessels:
        raise InputError("No vessels supplied.")
    out, seen = [], set()
    for k, v in enumerate(vessels):
        miss = [c for c in _VESSEL_KEYS if c not in v]
        if miss:
            raise InputError(f"Vessel #{k} missing fields: {miss}")
        v = dict(v)
        if v["vessel_id"] in seen:
            raise InputError(f"Duplicate vessel_id {v['vessel_id']}")
        seen.add(v["vessel_id"])
        for c in ["capacity_t", "design_speed_kn", "min_speed_kn", "max_speed_kn", "engine_power_kw", "charter_usd_day"]:
            if not np.isfinite(v[c]) or v[c] <= 0:
                raise InputError(f"{v['vessel_id']}: {c} must be > 0")
        if v["min_speed_kn"] > v["max_speed_kn"]:
            raise InputError(f"{v['vessel_id']}: min_speed_kn > max_speed_kn")
        if len(v["fuel_compatibility"]) != n_fuels:
            raise InputError(f"{v['vessel_id']}: fuel_compatibility needs {n_fuels} entries")
        v.setdefault("availability", 1); v.setdefault("type_code", 0); v.setdefault("vessel_type", "Custom")
        out.append(v)
    return out


def validate_route(r, n_fuels=len(DEFAULT_FUELS)):
    for c in ["distance_nm", "cargo_demand_t", "deadline_h"]:
        if not (np.isfinite(r[c]) and r[c] > 0):
            raise InputError(f"{c} must be > 0 (got {r[c]})")
    for c in ["port_time_h", "buffer_h", "carbon_price_usd_per_t"]:
        if r[c] < 0:
            raise InputError(f"{c} must be >= 0")
    if isinstance(r["weather"], str) and r["weather"] not in WEATHER:
        raise InputError(f"weather must be one of {list(WEATHER)} or a number (got {r['weather']!r})")
    if len(r["fuel_available"]) != n_fuels or not any(r["fuel_available"]):
        raise InputError("fuel_available must have one 0/1 entry per fuel, at least one available")
    if not 0 <= r["port_ops_available"] <= 1:
        raise InputError("port_ops_available must be in [0,1]")
    return r


# ----------------------------------------------------------------------------
# 3. Problem: decoder + repair + evaluator
# ----------------------------------------------------------------------------
class FleetProblem:
    def __init__(self, vessels, route=None, fuels=None):
        self.fuels = fuels or DEFAULT_FUELS
        self.V = validate_vessels(vessels, len(self.fuels))
        vessels = self.V
        self.route = validate_route(route or default_route(), len(self.fuels))
        self.lamarckian = False
        self.N, self.F = len(vessels), len(self.fuels)
        self.n_var, self.n_obj = 4 * self.N, 3
        g = lambda k: np.array([v[k] for v in vessels], float)
        self.cap, self.power, self.design = g("capacity_t"), g("engine_power_kw"), g("design_speed_kn")
        self.smin, self.smax, self.charter = g("min_speed_kn"), g("max_speed_kn"), g("charter_usd_day")
        self.tcode = g("type_code")
        self.avail = g("availability") > 0
        self.compat = np.array([v["fuel_compatibility"] for v in vessels], int)
        self.ops_ok = g("shore_power_compatible") > 0
        self.lhv = np.array([f["lhv"] for f in self.fuels], float)
        self.price = np.array([f["price"] for f in self.fuels], float)
        self.wtw = np.array([f["wtw"] for f in self.fuels], float)
        r = self.route
        self.fuel_av = np.array(r["fuel_available"], int)
        self.wf = WEATHER[r["weather"]] if isinstance(r["weather"], str) else float(r["weather"])
        sail_window = r["deadline_h"] - r["port_time_h"] - r["buffer_h"]
        self.s_req = r["distance_nm"] / sail_window if sail_window > 0 else np.inf   # schedule constraint
        self.eligible = self.avail & (self.smax >= self.s_req)
        self.max_capacity = self.cap[self.eligible].sum()
        self.demand_ok = self.max_capacity >= r["cargo_demand_t"]
        self.n_evals = self.n_repaired = self.n_cargo_repaired = 0

    # -- decode + repair -------------------------------------------------
    def decode(self, x, count=True):
        N, F = self.N, self.F
        x = np.clip(x, 0, 1)
        on = x[:N] > 0.5
        speed = self.smin + x[N:2 * N] * (self.smax - self.smin)
        fuel = np.minimum((x[2 * N:3 * N] * F).astype(int), F - 1)
        ops = x[3 * N:] > 0.5
        raw = (on.copy(), speed.copy(), fuel.copy(), ops.copy())
        # 1 availability + schedule eligibility
        on &= self.eligible
        # 2 speed: clamp up to schedule-feasible minimum, never above max
        speed = np.clip(np.maximum(speed, self.s_req), self.smin, self.smax)
        # 3 fuel compatibility + bunkering availability -> fall back to reference
        ok = (self.compat[np.arange(N), fuel] > 0) & (self.fuel_av[fuel] > 0)
        fuel = np.where(ok, fuel, REF_FUEL)
        # 4 shore power compatibility
        ops &= self.ops_ok & (self.route["port_ops_available"] > 0)
        # 5 cargo demand: greedily add eligible vessels (largest first) until covered
        d = self.route["cargo_demand_t"]
        if self.cap[on].sum() < d:
            for i in np.argsort(-self.cap):
                if self.eligible[i] and not on[i]:
                    on[i] = True
                    if self.cap[on].sum() >= d:
                        break
        # repair rate counts only changes that affect deployed vessels (a fair 'constraint pressure' metric)
        a = on
        cargo_fix = (on & ~raw[0]).any()
        changed = cargo_fix or (fuel[a] != raw[2][a]).any() or (speed[a] > raw[1][a] + 1e-9).any() or (ops[a] != raw[3][a]).any()
        self.n_repaired += int(changed and count)
        self.n_cargo_repaired += int(cargo_fix and count)
        feasible = bool(self.cap[on].sum() >= d) and on.any()
        return dict(on=on, speed=speed, fuel=fuel, ops=ops, feasible=feasible)

    # -- evaluation ------------------------------------------------------
    def evaluate_plan(self, p, detail=False):
        r, on = self.route, p["on"]
        if not p["feasible"] or not on.any():
            return (np.array([1e9, 1e9, 1e9]), None) if detail else np.array([1e9, 1e9, 1e9])
        idx = np.where(on)[0]
        lf = min(1.0, r["cargo_demand_t"] / self.cap[idx].sum())      # uniform load factor
        spd, fu, ops = p["speed"][idx], p["fuel"][idx], p["ops"][idx]
        feats = dict(engine_power_kw=self.power[idx], capacity_t=self.cap[idx], design_speed_kn=self.design[idx],
                     speed_kn=spd, load_factor=np.full(len(idx), lf), weather_factor=np.full(len(idx), self.wf),
                     type_code=self.tcode[idx])
        rate = np.maximum(np.asarray(_PREDICTOR(feats), float), 0.0)            # t/h reference-fuel equivalent
        sail_h = r["distance_nm"] / spd
        lhv_ref = self.lhv[REF_FUEL]
        main_gj = _energy.main_engine_energy_gj(rate, sail_h, lhv_ref)           # main engine energy (GJ)
        # auxiliary at berth: shore power replaces aux fuel where the vessel uses OPS
        berth_kwh = _shore.berth_energy_kwh(self.power[idx], r["port_time_h"])
        shore_kwh, aux_kwh = _shore.shore_and_aux_kwh(berth_kwh, ops, r["port_ops_available"])
        aux_gj = _energy.aux_energy_gj(aux_kwh, lhv_ref, AUX_SFOC_KG_PER_KWH)
        # main engine runs on chosen fuel (same energy demand); aux on reference fuel
        fuel_t = _energy.fuel_mass_t(main_gj, self.lhv[fu])
        aux_t = _energy.fuel_mass_t(aux_gj, lhv_ref)
        cost_fuel = _cost.fuel_cost(fuel_t, self.price[fu], aux_t, self.price[REF_FUEL])
        hours = sail_h + r["port_time_h"]
        cost_time = _cost.time_cost(self.charter[idx], hours)
        cost_shore = _cost.shore_cost(shore_kwh, r["shore_price_usd_per_kwh"])
        ghg_t = _life.wtw_ghg_t(main_gj, self.wtw[fu], aux_gj, self.wtw[REF_FUEL],
                                shore_kwh, r["grid_ef_g_per_kwh"])
        cost = _cost.operating_cost(cost_fuel, cost_time, cost_shore,
                                    _cost.carbon_cost(ghg_t, r["carbon_price_usd_per_t"]))
        objs = np.array([(main_gj + aux_gj).sum(), cost.sum(), ghg_t.sum()])
        if not detail:
            return objs
        rows = [dict(vessel_id=self.V[i]["vessel_id"], vessel_type=self.V[i]["vessel_type"],
                     cargo_t=round(float(self.cap[i] * lf), 1), load_factor=round(float(lf), 3),
                     speed_kn=round(float(spd[k]), 2), fuel=self.fuels[fu[k]]["fuel_id"],
                     shore_power=bool(ops[k]), sail_hours=round(float(sail_h[k]), 1),
                     pred_fuel_rate_tph=round(float(rate[k]), 3), fuel_energy_gj=round(float(main_gj[k] + aux_gj[k]), 1),
                     cost_usd=round(float(cost[k]), 0), wtw_ghg_t=round(float(ghg_t[k]), 1))
                for k, i in enumerate(idx)]
        return objs, rows

    def evaluate(self, x):
        self.n_evals += 1
        # when Lamarckian repair already ran on x, do not count the (idempotent) second repair
        return self.evaluate_plan(self.decode(x, count=not self.lamarckian))

    # -- demand-aware initial sampling ------------------------------------
    def sample(self, rng, n, smart=True):
        """Random population. smart=True biases vessel ON-probability toward the fleet size the demand
        needs (a random 50%-ON fleet is ~2x oversized and starts the search far from feasible-good space)."""
        X = rng.random((n, self.n_var))
        if smart and self.max_capacity > 0:
            base = np.clip(self.route["cargo_demand_t"] / self.max_capacity, 0.03, 0.9)
            p_on = np.clip(base * rng.uniform(0.7, 2.0, size=(n, 1)), 0.03, 0.95)
            X[:, :self.N] = np.where(rng.random((n, self.N)) < p_on, rng.uniform(0.5, 1.0, (n, self.N)),
                                     rng.uniform(0.0, 0.5, (n, self.N)))
        return X

    # -- Lamarckian repair: write the repaired values back into the genotype ----
    def repair_x(self, x):
        N, F = self.N, self.F
        x = np.clip(np.asarray(x, float), 0, 1).copy()
        raw_on, raw_o = x[:N] > 0.5, x[3 * N:] > 0.5
        raw_f = np.minimum((x[2 * N:3 * N] * F).astype(int), F - 1)
        p = self.decode(x, count=True)
        xs, xf, xo = x[:N], x[2 * N:3 * N], x[3 * N:]
        xs[p["on"] & ~raw_on] = 0.75
        xs[~p["on"] & raw_on] = 0.25
        x[N:2 * N] = (p["speed"] - self.smin) / np.maximum(self.smax - self.smin, 1e-9)
        ch = p["fuel"] != raw_f
        xf[ch] = (p["fuel"][ch] + 0.5) / F
        ch = p["ops"] != raw_o
        xo[ch] = np.where(p["ops"][ch], 0.75, 0.25)
        return np.clip(x, 0, 1)

    def repair_pop(self, X):
        return np.array([self.repair_x(x) for x in X])

    # -- baselines / reporting --------------------------------------------
    def baseline_plan(self):
        """Case A: conventional fuel, design speed (raised only if the schedule demands),
        no shore power, cheapest-per-tonne vessels added until demand is met."""
        N = self.N
        order = [i for i in np.argsort(self.charter / self.cap) if self.eligible[i]]
        on = np.zeros(N, bool)
        for i in order:
            on[i] = True
            if self.cap[on].sum() >= self.route["cargo_demand_t"]:
                break
        speed = np.clip(np.maximum(self.design, self.s_req), self.smin, self.smax)
        return dict(on=on, speed=speed, fuel=np.zeros(N, int), ops=np.zeros(N, bool),
                    feasible=bool(self.cap[on].sum() >= self.route["cargo_demand_t"]))

    def plan_of(self, x):
        return self.decode(np.asarray(x, float))

    def describe(self, x):
        return self.evaluate_plan(self.decode(np.asarray(x, float)), detail=True)


# ----------------------------------------------------------------------------
# 4. Multi-objective utilities
# ----------------------------------------------------------------------------
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


def select_balanced(F, weights=(1 / 3, 1 / 3, 1 / 3)):
    """TOPSIS-style pick: smallest weighted distance to the ideal point (normalised objectives)."""
    F = np.asarray(F, float)
    Fn = (F - F.min(0)) / np.maximum(F.max(0) - F.min(0), 1e-12)
    return int(np.argmin(np.sqrt((np.asarray(weights) * Fn ** 2).sum(1))))


# ----------------------------------------------------------------------------
# 5. Optimisers  (all share: demand-aware init + Lamarckian repair when smart=True)
# ----------------------------------------------------------------------------
def _update_archive(AX, AF, Xn, Fn, archive_size):
    CX, CF = np.vstack([AX, Xn]), np.vstack([AF, Fn])
    m = nondominated_mask(CF)
    CX, CF = CX[m], CF[m]
    _, u_idx = np.unique(np.round(CF, 6), axis=0, return_index=True)   # drop duplicates
    CX, CF = CX[u_idx], CF[u_idx]
    while len(CX) > archive_size:
        k = int(np.argmin(crowding_distance(CF)))
        CX, CF = np.delete(CX, k, 0), np.delete(CF, k, 0)
    return CX, CF


def run_qpso(problem, pop=100, iters=100, archive_size=100, seed=0, alpha_hi=1.0, alpha_lo=0.5,
             update="qpso", smart=True, mutation=0.0, lamarck=False, leader="crowd"):
    """Multi-objective swarm optimiser with an external Pareto archive.
    update="qpso" (quantum-behaved, Sun et al.):
        p = phi*pbest + (1-phi)*gbest ;  x' = p +/- alpha*|mbest - x|*ln(1/u),  alpha: alpha_hi -> alpha_lo
        (no velocity term; x is sampled from a delta-potential-well distribution centred on p)
    update="pso"  (classical MOPSO control, same archive/leader logic):
        v' = w*v + c1*r1*(pbest-x) + c2*r2*(gbest-x), w: 0.9 -> 0.4, c1=c2=1.5
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
        AX, AF = _update_archive(AX, AF, Xn, Fn, archive_size)
        hist.append((pop * (t + 2), AF.copy()))
    return dict(X=AX, F=AF, history=hist, runtime=time.perf_counter() - t0,
                algo="MO-QPSO" if update == "qpso" else "MOPSO")


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


def run_algo(name, problem, pop, iters, seed, smart=True, lamarck=False, **kw):
    if name == "NSGA-II":
        return run_nsga2(problem, pop, iters, seed, smart, lamarck)
    return run_qpso(problem, pop, iters, seed=seed, update="qpso" if name == "MO-QPSO" else "pso",
                    smart=smart, lamarck=lamarck, **kw)


# ----------------------------------------------------------------------------
# 6. Benchmark helpers
# ----------------------------------------------------------------------------
def benchmark(make_problem, seeds=range(10), pop=100, iters=100, algos=("NSGA-II", "MOPSO", "MO-QPSO"),
              smart=True, lamarck=False, verbose=True, algo_kwargs=None):
    """Same problem, same evaluation budget, same seeds for every algorithm.
    Normalisation: ideal/nadir come from the NON-DOMINATED union of all final fronts (dominated points
    would inflate the nadir). Metrics: hypervolume (higher better), IGD+ vs that union front (lower better)."""
    from pymoo.indicators.igd_plus import IGDPlus
    runs = {a: [] for a in algos}
    for s in seeds:
        for a in algos:
            pr = make_problem()
            r = run_algo(a, pr, pop, iters, s, smart, lamarck, **((algo_kwargs or {}).get(a, {})))
            r["repair_rate"] = pr.n_repaired / max(pr.n_evals, 1)
            r["cargo_repair_rate"] = pr.n_cargo_repaired / max(pr.n_evals, 1)
            runs[a].append(r)
        if verbose:
            print(f"seed {s} done")
    allF = np.vstack([r["F"] for a in algos for r in runs[a]])
    refF = allF[nondominated_mask(allF)]
    ideal, nadir = refF.min(0), refF.max(0)
    refN = (refF - ideal) / np.maximum(nadir - ideal, 1e-12)
    rows = []
    for a in algos:
        hv_final, igd, conv = [], [], []
        for r in runs[a]:
            curve = np.array([hypervolume(F, ideal, nadir) for _, F in r["history"]])
            evals = np.array([e for e, _ in r["history"]])
            r["hv_curve"], r["evals"] = curve, evals
            hv_final.append(curve[-1])
            conv.append(int(evals[np.argmax(curve >= 0.95 * curve[-1])]))
            igd.append(float(IGDPlus(refN)((r["F"] - ideal) / np.maximum(nadir - ideal, 1e-12))))
        rows.append(dict(algorithm=a, hv_mean=np.mean(hv_final), hv_std=np.std(hv_final), hv_median=np.median(hv_final),
                         hv_best=np.max(hv_final), hv_worst=np.min(hv_final), igd_plus_mean=np.mean(igd),
                         runtime_s=np.mean([r["runtime"] for r in runs[a]]),
                         evals_to_95pct_hv=float(np.mean(conv)), front_size=float(np.mean([len(r["F"]) for r in runs[a]])),
                         repair_rate=float(np.mean([r["repair_rate"] for r in runs[a]])),
                         cargo_repair_rate=float(np.mean([r["cargo_repair_rate"] for r in runs[a]]))))
        for r, h in zip(runs[a], hv_final):
            r["hv_final"] = h
    return runs, rows, (ideal, nadir)


# ----------------------------------------------------------------------------
# 7. API-style entry point (matches dossier s.50 request shape)
# ----------------------------------------------------------------------------
def optimize_fleet(request: dict, vessels=None, algo="auto", pop=100, iters=100, seed=0,
                   weights=(1 / 3, 1 / 3, 1 / 3)):
    """request example (dossier s.50 names accepted: reference, lng, methanol, ammonia, hydrogen):
      {"route_distance_nm":600,"cargo_demand_tonnes":90000,"deadline_hours":72,
       "vessel_ids":["V001","V002"],"allowed_fuels":["reference","lng","methanol"],
       "shore_power":true,"weather":"normal","carbon_price_usd_per_t":0}
    Never raises for bad user input: returns {"status":"error","reason":...} instead.
    Returns JSON-serialisable dict with the Pareto set, balanced pick and baseline."""
    try:
        pool = vessels if vessels is not None else make_vessel_pool(10)
        if request.get("vessel_ids"):
            want = list(request["vessel_ids"])
            have = {v["vessel_id"] for v in pool}
            unknown = [w for w in want if w not in have]
            if unknown:
                raise InputError(f"Unknown vessel_ids: {unknown}")
            pool = [v for v in pool if v["vessel_id"] in set(want)]
        ids = [f["fuel_id"] for f in DEFAULT_FUELS]
        allowed_in = request.get("allowed_fuels") or ids
        allowed = set()
        for a in allowed_in:
            if a not in FUEL_ALIASES and a not in ids:
                raise InputError(f"Unknown fuel '{a}'. Valid: {sorted(set(FUEL_ALIASES) | set(ids))}")
            allowed.update(FUEL_ALIASES.get(a, [a]))
        allowed.add("vlsfo")   # the reference fuel is always bunkerable
        route = default_route(
            distance_nm=request.get("route_distance_nm", 600.0), cargo_demand_t=request.get("cargo_demand_tonnes", 90000.0),
            deadline_h=request.get("deadline_hours", 72.0), weather=request.get("weather", "normal"),
            fuel_available=[int(i in allowed) for i in ids],
            port_ops_available=1.0 if request.get("shore_power", True) else 0.0,
            carbon_price_usd_per_t=request.get("carbon_price_usd_per_t", 0.0))
        pr = FleetProblem(pool, route)
    except InputError as e:
        return dict(status="error", reason=str(e))
    if not pr.demand_ok:
        need = round(pr.s_req, 2)
        return dict(status="infeasible",
                    reason=f"Cargo demand/deadline cannot be met: schedule needs >= {need} kn and the vessels able to "
                           f"sail that fast carry {pr.max_capacity:.0f} t < demand {route['cargo_demand_t']:.0f} t.")
    if algo == "auto":   # benchmark-driven: MO-QPSO matches or beats NSGA-II through 50 vessels but loses at 100 (see notebook s.8)
        algo = "MO-QPSO" if pr.N <= 50 else "NSGA-II"
    if algo not in ("MO-QPSO", "NSGA-II", "MOPSO"):
        return dict(status="error", reason=f"Unknown algo {algo}")
    res = run_algo(algo, pr, pop, iters, seed)
    k = select_balanced(res["F"], weights)
    base_f = pr.evaluate_plan(pr.baseline_plan())
    sols = []
    for x, f in zip(res["X"], res["F"]):
        _, rows = pr.describe(x)
        sols.append(dict(objectives=dict(fuel_energy_gj=float(f[0]), cost_usd=float(f[1]), wtw_ghg_t=float(f[2])), plan=rows))
    return dict(status="ok", algorithm=res["algo"], seed=seed, runtime_s=res["runtime"],
                baseline=dict(fuel_energy_gj=float(base_f[0]), cost_usd=float(base_f[1]), wtw_ghg_t=float(base_f[2])),
                balanced_index=k, pareto=sols,
                constraints=dict(cargo_demand_t=route["cargo_demand_t"], deadline_h=route["deadline_h"],
                                 min_speed_for_schedule_kn=round(pr.s_req, 2)),
                units=dict(fuel_energy="GJ", cost="USD", ghg="tCO2e (well-to-wake)"),
                warnings=["Fuel prices are indicative scenario assumptions; WtW factors are IMO-LCA-based representatives (see emissions/factors.py)."] if any(
                    "scenario_assumption" in str(f.get("price_source", "")) for f in pr.fuels) else [])


if __name__ == "__main__":
    out = optimize_fleet(dict(cargo_demand_tonnes=90000), iters=30)
    print(out["status"], len(out["pareto"]), out["baseline"], out["pareto"][out["balanced_index"]]["objectives"])
