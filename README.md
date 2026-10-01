# Q-Flow — Q-GreenFleet

> **Quantum-Inspired Fuel Prediction and Green Fleet Optimization**
> SIH26138 · Software decision-support platform for maritime fleet planning.

Q-GreenFleet is an auditable decision-support platform that predicts vessel fuel
consumption, evaluates fuel-pathway lifecycle emissions and operating cost, and
uses a quantum-inspired multi-objective optimizer to select feasible vessel,
speed, fuel, and shore-power decisions. Recommendations are returned as a Pareto
frontier and benchmarked against NSGA-II under reproducible scenarios.

---

## The question it answers

> Given a cargo demand and deadline, which vessels should be deployed, at what
> speeds, using which fuel pathways and shore-power choices, to minimize fuel,
> cost, and lifecycle GHG while remaining feasible?

## Core principle

Build a scientifically credible optimization engine with a clear dashboard — not
a dashboard with an unproven algorithm hidden behind it. The optimizer **always**
calls the predictor and the emissions engine for every candidate plan; it never
optimizes against hard-coded fuel values.

---

## Three focused components

| # | Component | Implementation | Role |
|---|-----------|----------------|------|
| 1 | **Fuel Consumption Prediction** | XGBoost regressor (QPSO tunes hyperparameters) | Predict voyage fuel for a vessel + operating state |
| 2 | **Lifecycle Emissions & Cost Engine** | Deterministic, versioned, unit-tested | WtT / TtW / WtW GHG, fuel + shore-power cost, compliance |
| 3 | **Multi-Objective Fleet Optimizer** | MO-QPSO with mixed-variable decoder, constraint repair, Pareto archive | Search vessel / speed / fuel / shore-power decisions |

> QPSO is used only for hyperparameter search and multi-objective optimization.
> This is **not** quantum machine learning, and **no quantum-speedup claim** is made.

## Pipeline

```
Scenario input → validation → feature layer → fuel prediction
   → cost & lifecycle emissions → constraint check
   → QPSO / NSGA-II search → Pareto solutions
   → explainable recommendation → benchmark & provenance report
```

---

## Tech stack

- **Backend:** Python, FastAPI, NumPy, Pandas/Polars, scikit-learn, XGBoost, SHAP, pymoo (NSGA-II baseline), custom QPSO
- **Data:** CSV/Parquet, JSON scenario configs, SQLite if persistence is needed
- **Frontend:** React, TypeScript, Recharts/Plotly/ECharts

## Quick start

```bash
make install
make train
make benchmark
make run
```

The demo runs from a clean checkout with a preloaded scenario.

---

## Status

🚧 Early scaffolding. See
[`SIH26138_Master_Implementation_Document.md`](SIH26138_Master_Implementation_Document.md)
for the full architecture, mathematical formulation, API design, experiment plan,
and execution phases.

## Data integrity commitments

- Every data field is labeled `measured`, `derived`, or `synthetic` with its source and formula.
- Every fuel/emissions factor is sourced and versioned.
- Every reported metric is traceable to a recorded experiment (seed, dataset hash, model version).
- Benchmarks use multiple seeds — no claims from a single lucky run.
