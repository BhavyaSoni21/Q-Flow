# Q-Flow

> **Quantum-Inspired Fuel Prediction and Green Fleet Optimization**
> SIH26138 · Software decision-support platform for maritime fleet planning.

Q-Flow is an auditable decision-support platform that predicts vessel fuel
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

## Quick start (reproduce)

```bash
make install      # backend (pip) + frontend (npm) deps
make train        # train + persist prediction models (intensity + power)  -> models/
make benchmark    # prediction + optimizer benchmarks                        -> results/metrics/
make test         # backend test suite (48 tests)
make run          # FastAPI backend on http://localhost:8000
```
Then, in a second terminal, start the live dashboard:
```bash
make run-frontend     # React dev server on :5173, proxied to the backend
```

No `make`? Run the same steps directly (Windows PowerShell):
```powershell
cd backend;  python -m pip install -r requirements.txt;  python -m pytest -q
python experiments/train_models.py;  python experiments/run_prediction_benchmark.py
python -m uvicorn app:app --port 8000
# frontend (new terminal):  cd frontend;  npm install;  npm run dev
```
The dashboard reads live data when `frontend/.env.local` has `VITE_USE_MOCK=false` (default here).

---

## Status

Backend complete and verified (master-doc Phases 1–6); **48 tests green**. The three
models are built, tested, and wired; the React dashboard runs on the live API.

- **Prediction:** MRV fleet-intensity model (XGBoost + QPSO) *and* a speed-resolved
  **power model (R² ≈ 0.98, real-data validated on FuelCast)**.
- **Emissions & cost:** deterministic, unit-tested, sourced lifecycle factors + GHG cap.
- **Optimizer:** MO-QPSO vs NSGA-II / MOPSO, independent constraint verification, multi-seed benchmarks.

Docs: [implementation plan](docs/implementation-plan.md) · [dataset layers](docs/dataset-layers.md)
· [model versions & accuracy](docs/model-versions.md) · [data sources](docs/references.md)
· full blueprint in [`SIH26138_Master_Implementation_Document.md`](SIH26138_Master_Implementation_Document.md).

Remaining: Phase-7 packaging (clean-start demo capture, screenshots, final freeze).

## Data integrity commitments

- Every data field is labeled `measured`, `derived`, or `synthetic` with its source and formula.
- Every fuel/emissions factor is sourced and versioned.
- Every reported metric is traceable to a recorded experiment (seed, dataset hash, model version).
- Benchmarks use multiple seeds — no claims from a single lucky run.
