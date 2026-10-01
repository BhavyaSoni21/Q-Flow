# Q-GreenFleet — Implementation Plan

**Scope of this plan:** everything *except* the two pieces you are providing —
the **training dataset(s)** and the **frontend**. This covers the backend
engine, the three models, the API (per master doc §10), experiments,
reproducibility, and the glue that connects your dataset and frontend.

**Status key:** ⬜ not started · 🟨 in progress · ✅ done
**Decisions locked:** API strictly follows master doc §10 · coding starts only
after the dataset arrives.

---

## 0. What you provide vs. what I build

| You provide | I build |
|-------------|---------|
| Training dataset(s) (fuel/vessel/voyage/weather) | Data loader, validation, provenance, feature engineering |
| React/TypeScript frontend | FastAPI backend matching §10 contract |
| — | Fuel prediction (XGBoost + baselines + QPSO tuner) |
| — | Deterministic emissions & cost engine |
| — | MO-QPSO optimizer + NSGA-II baseline |
| — | Experiments, benchmarks, reproducibility store |

**Integration boundaries:**
- **Dataset →** a documented loader + a dataset schema spec (I'll define the
  columns I need; you map your data to it, or I write the adapter once I see it).
- **Frontend →** the API in §10. The frontend consumes those exact routes/shapes.

---

## 1. Build order (deterministic-first)

This follows the master doc's §24 rule: build the credible engine first, UI last.
Each phase ends with runnable tests before the next begins.

```
Phase 0  Scaffold          repo skeleton, config, CI, Makefile
Phase 1  Deterministic core energy · cost · emissions · constraints · physics baseline
Phase 2  Data layer        loader · validation · provenance · features  (needs your data)
Phase 3  Prediction        baselines · XGBoost · QPSO tuner · validation · /predict API
Phase 4  Optimizer base    decoder · repair · archive · NSGA-II · one scenario
Phase 5  MO-QPSO           quantum-inspired update · mixed decoder · convergence log
Phase 6  Integration       wire predictor+emissions into optimizer · /optimize API · runs store
Phase 7  Benchmark & freeze multi-seed experiments · provenance report · clean-start demo
```

Phases 0–1 need **no dataset** (physics baseline + deterministic engine). Phase 2
onward needs your data. Frontend plugs in at Phase 6 against the live API.

---

## 2. Phase detail, deliverables, and acceptance

### Phase 0 — Scaffold ⬜
- `backend/` package tree per master doc §11, `config.py`, `requirements.txt`, `Makefile`.
- `configs/` with `fuels.json`, `vessels.json`, `routes.json`, `scenarios.json` (MVP scenario).
- pytest + ruff/black set up; GitHub Actions running tests on push.
- **Done when:** `make install` works and an empty `pytest` run is green from a clean checkout.

### Phase 1 — Deterministic emissions, cost & constraints ⬜ *(no dataset needed)*
- `emissions/energy.py` — fuel mass → MJ (`Energy = tonnes·1000·LHV`).
- `emissions/lifecycle.py` — WtT + TtW = WtW; tracks CO₂/CH₄/N₂O when the factor source has them.
- `emissions/shore_power.py` — grid-intensity-based (never auto-zero).
- `emissions/cost.py` — fuel + shore + vessel + time + carbon.
- `emissions/compliance.py` — GHG cap / CII threshold.
- `optimization/constraints.py` — cargo, deadline, speed, availability, compatibility, bunkering, shore-power, emissions cap → violation vector.
- `prediction/physics_baseline.py` — `P = k·v³`, `Fuel = P·T/(η·LHV)` (sanity model + synthetic generator).
- **Done when:** `test_energy`, `test_lifecycle`, `test_constraints` pass with hand-checked values; factor table versioned and unit-tested.

### Phase 2 — Data & feature layer ⬜ *(needs your dataset)*
- Define **dataset schema** I need: vessel features, operating, route, weather, fuel columns (master doc §5.2).
- `data/loaders.py` — read CSV/Parquet → typed frames; `data/validation.py` — ranges, units, completeness.
- `data/provenance.py` — enforce the `measured/derived/synthetic` label + source + formula per field (§8.5).
- `data/feature_engineering.py` — derived features (distance, duration, load factor, speed bins, fuel intensity), each with a documented formula.
- Split strategy: chronological / voyage-group / vessel-holdout (§5.4) — **not** plain random.
- **Done when:** your dataset loads, validates, and produces a train/val/test split with no leakage; provenance table generated.

### Phase 3 — Fuel prediction engine ⬜
- Baselines: linear regression, random forest, untuned XGBoost (vs. physics baseline).
- `prediction/train_xgb.py` — final XGBoost; `prediction/tune_qpso.py` — QPSO over the §5.3 hyperparameter box with fixed eval budget.
- `prediction/validation.py` — MAE, RMSE, R², sMAPE, train/infer time, sample/vessel/voyage counts.
- `prediction/explainability.py` — SHAP feature contributions.
- Guardrails: reject missing features, no negative fuel, out-of-domain flag, uncertainty band (§5.6).
- `POST /api/predict/fuel` returning the exact §10 response (incl. bounds, `out_of_domain`, contributions).
- **Done when:** benchmark table (physics→LR→RF→XGB→QPSO-XGB) is generated from a recorded experiment; API passes model tests (§15).

### Phase 4 — Optimizer baseline first ⬜
- `optimization/decoder.py` — latent vector → activation/speed/fuel/shore/cargo (§7.2).
- `optimization/repair.py` — the 9-step repair order (§4 Step 5).
- `optimization/objectives.py` — calls predictor + emissions engine (**no hard-coded fuel**).
- `optimization/archive.py` — non-dominated feasible archive; `optimization/selection.py` — min-fuel/cost/GHG, knee, balanced.
- `optimization/nsga2_baseline.py` — NSGA-II via pymoo on the one MVP scenario.
- **Done when:** NSGA-II returns a feasible Pareto front on the MVP scenario; `test_decoder`, `test_repair`, optimizer feasibility tests pass.

### Phase 5 — MO-QPSO ⬜
- `optimization/mo_qpso.py` — explicit quantum-inspired update: attractor/mean-best, contraction-expansion coefficient schedule, sampling rule (§7.6).
- Mixed-variable decoder reuse, external archive, convergence log, seed reproducibility.
- **Done when:** fixed seed → reproducible output; MO-QPSO runs the same scenario/budget/constraints as NSGA-II; we can state exactly how it differs from plain PSO/NSGA-II.

### Phase 6 — Integration ⬜ *(frontend plugs in here)*
- `POST /api/optimize/fleet`, `GET /api/benchmarks/{run_id}`, `POST/GET /api/scenarios`, metadata routes — all per §10.
- `experiments/results_store.py` — persist each run with the full §16 manifest (seed, dataset hash, model version, budget, metrics).
- Wire predictor + lifecycle engine inside candidate evaluation; error handling + infeasibility messages.
- Hand the frontend the live API; smoke-test the five screens' data needs (§13).
- **Done when:** end-to-end loop runs from a scenario POST to a Pareto + benchmark response; frontend renders against it.

### Phase 7 — Benchmark & freeze ⬜
- Experiments A–E (§14): prediction benchmark, generalization, optimizer benchmark (≥10 seeds), scenario analysis, scalability (5/10/25/50 vessels).
- Reports: hypervolume, feasible rate, runtime, convergence, mean±std; provenance + limitations docs.
- Clean-start demo (`make install/train/benchmark/run`) + screenshots per the §21 demo script.
- **Done when:** every DoD item in master doc §20 is true; no chart comes from an unrecorded run.

---

## 3. Things I need from you (to unblock each phase)

1. **Dataset (unblocks Phase 2+):** files + a short note on columns, units, and whether fuel is per-voyage or hourly. I'll confirm it against the schema I define in Phase 2.
2. **Frontend (plugs in at Phase 6):** repo/location and the API base URL it expects. Since we locked §10, it should target those routes — flag any mismatch early.
3. **Factor sources:** confirm which fuel/emissions factor source to cite (IMO LCA defaults vs. scenario assumptions), so provenance labels are honest.

## 4. Risks the plan actively guards against (master doc §22)

- *Quantum as a label only* → ship the update equation, pseudocode, and benchmark.
- *Prediction not used by optimizer* → objectives.py calls the predictor; enforced by test.
- *Optimizer exploits model error* → out-of-domain guard + uncertainty penalty + physics sanity check.
- *Synthetic shown as measured* → provenance label on every field.
- *One lucky run* → multi-seed benchmarks with std dev.

---

*Next action: you send the dataset → I start Phase 0 scaffold + Phase 1 deterministic
core (which need no data) in parallel while I define the Phase 2 dataset schema.*

