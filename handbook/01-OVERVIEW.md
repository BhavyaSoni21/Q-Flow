# 01 · Overview

## The problem `PS-FACT`

Fleet operators (maritime and road) must decide **how to run a fleet** — which
units to deploy, at what speed, on which fuel, with shore power or not — under
tightening decarbonization pressure (IMO GHG strategy, FuelEU Maritime, India's
net-zero path). Fuel, operating cost, and well-to-wake GHG genuinely conflict:
the cheapest plan is rarely the greenest.

## The solution

Q-Flow (SIH26138) is an **auditable decision-support platform** with three
cooperating components:

1. **Fuel prediction** — predict voyage fuel for a unit + operating state.
2. **Emissions & cost engine** — price each plan's lifecycle GHG and INR cost.
3. **Fleet optimizer** — a quantum-inspired multi-objective search over
   activation / speed / fuel / shore-power that returns a Pareto frontier.

## Guiding principles `DESIGN`

- **Engine first, dashboard second.** A credible optimization engine behind a
  clear UI — not a UI hiding an unproven algorithm.
- **Predictor-in-the-loop.** Every candidate plan is scored by the real predictor
  and emissions engine; **no hard-coded fuel values**.
- **Honest about method.** QPSO is a *classical* metaheuristic inspired by quantum
  mechanics. No quantum ML, no quantum-speedup claim.
- **Auditability as a feature.** Sourced factors, labeled data (measured / derived
  / synthetic), reproducible seed-pinned runs, recorded experiments.
- **Benchmark fairly.** MO-QPSO is measured against NSGA-II and classical PSO over
  multiple seeds — wins *and* losses reported.

## What's built `IMPLEMENTED`

- Ship **and** road optimization sharing one optimizer core.
- Deterministic, unit-tested emissions/cost engine with sourced factors (INR).
- MRV fleet-intensity model + a strong operational power model (see [05](05-MODELS.md)).
- FastAPI backend, React dashboard, 53 passing tests, live recomputable benchmarks.

See [02 · Architecture](02-ARCHITECTURE.md) next.
