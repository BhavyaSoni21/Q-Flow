# Q-Flow — Mathematical Model

Formulation implemented by `optimization/fleet_engine.py` + `emissions/` (master doc §12).
One route/service, N candidate vessels `v`, fuel pathways `f`.

## Decision variables
- `x_v ∈ {0,1}` — vessel activation
- `s_v ∈ [s_v^min, s_v^max]` — cruising speed (knots)
- `f_v ∈ {reference, lng, methanol, ammonia, hydrogen}` — fuel pathway
- `z_v ∈ {0,1}` — shore-power use
- cargo allocation implied by activation × capacity (uniform load factor)

## Objectives (all minimised)
```
F1 fuel energy (GJ) = Σ_v [ main_gj(v) + aux_gj(v) ]
F2 operating cost (USD) = fuel + charter/time + shore electricity + carbon
F3 lifecycle GHG (tCO2e, Well-to-Wake) = Σ_v [ (main_gj·EF_f + aux_gj·EF_ref)/1000 + shore_kWh·gridEF/1e6 ]
```
where `main_gj = rate_v · sail_h · LHV_ref`, `rate_v = Predictor(speed, load, weather, power, …)`.
Fuel objective is energy (GJ), not mass — fuels of different energy density are never
compared by mass alone (both stored).

## Energy & cost terms (deterministic, `emissions/`)
```
Energy_MJ   = FuelTonnes · 1000 · LHV                 (energy.py)
Cost_fuel   = fuel_t·price_f + aux_t·price_ref          (cost.py)
Cost_time   = charter_usd_day · hours / 24              (cost.py)
Cost_shore  = shore_kWh · shore_price                   (cost.py)
GHG_WtW     = fuel term + grid term                     (lifecycle.py)
EF_WtW      = EF_WtT + EF_TtW                            (factors.py, sourced)
```

## Constraints (verified by `optimization/constraints.py`)
```
cargo:        Σ_v cap_v · x_v ≥ Demand
schedule:     Distance / s_v + PortTime + Buffer ≤ Deadline     ⇒ s_v ≥ s_req
speed bounds: s_v^min ≤ s_v ≤ s_v^max
availability: x_v ≤ Availability_v
fuel compat:  y_{v,f} ≤ Compatible_{v,f}
bunkering:    chosen fuel ∈ FuelAvailable_r
shore power:  z_v ≤ ShipOPS_v  and  z_v ≤ PortOPS_r
compliance:   GHG_WtW ≤ GHG_cap   (optional; soft-penalised)   (compliance.py)
```
Feasibility is enforced by **repair** (hard where possible) and a soft **penalty** for
residual infeasibility: `J_i ← J_i·(1 + violation/cap) + violation`. A separate
feasibility flag is always preserved — infeasible solutions are labelled, never hidden.

## Multi-objective solution
Non-dominated Pareto archive; recommendation points: min-fuel, min-cost, min-GHG, and a
**balanced** point = argmin of normalized weighted distance to the ideal point.

## Units (canonical)
energy GJ · power kW · fuel t and GJ · speed knots · distance n mile · GHG tCO2e ·
cost USD · WtW factor gCO2e/MJ. Conversions are explicit and unit-tested.
