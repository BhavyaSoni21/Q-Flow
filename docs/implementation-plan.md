# Q-Flow — Implementation Plan (v2)

> **v2 update:** incorporates the `q_greenfleet_handoff` engine (Module B/C already
> built) and the real **EU MRV** datasets now in `Datasets/`. Supersedes v1's
> phase ordering. Still anchored to `SIH26138_Master_Implementation_Document.md`.
>
> **Dataset layers A/B/C status** is tracked separately in
> [`dataset-layers.md`](dataset-layers.md) (Layer A complete: MRV + AIS + IMO + Indian ERA5).

**Decisions locked:** API follows master doc §10 · the handoff engine is our
Module B/C core · frontend + dataset are provided by you · **Model 1 = Strategy A
(physics cubic law calibrated to MRV per ship type + XGBoost residual)** · **the
handoff engine will be restructured into the backend module tree (behaviour-
preserving, tests ported first).**

---

## 0. What we now have (big change from v1)

### The handoff engine (`fleet_engine.py`) already implements most of Modules B & C
A self-contained, NumPy + pymoo core — **working, with 8 tests**:

| Master doc requirement | Handoff status |
|------------------------|----------------|
| Mixed-variable decoder (§7.2) | ✅ `FleetProblem.decode` — on/off, speed, fuel index, shore power |
| 9-step constraint repair (§4.5) | ✅ availability→schedule→fuel compat→bunkering→shore→cargo greedy fill |
| Deterministic emissions + cost (§6) | ✅ inlined in `evaluate_plan` (energy GJ, WtW GHG, fuel/charter/shore/carbon cost) |
| MO-QPSO with quantum update (§7.6) | ✅ `run_qpso` — `x' = p ± α·|mbest−x|·ln(1/u)`, α schedule, archive |
| NSGA-II baseline (§7.7) | ✅ `run_nsga2` via pymoo |
| Extra baseline (classical PSO) | ✅ `run_qpso(update="pso")` = MOPSO |
| Pareto archive + crowding + HV + IGD+ | ✅ `_update_archive`, `hypervolume`, `benchmark` |
| Multi-seed benchmark harness (§14) | ✅ `benchmark()` → `benchmark_results.csv`, `scalability_results.csv` |
| Balanced selection (§7.4) | ✅ `select_balanced` (TOPSIS-style) |
| API entry + validation + infeasibility (§4.2, §10) | ✅ `optimize_fleet()` never raises, returns `error`/`infeasible`/`ok` |
| **Pluggable predictor hook** | ✅ `set_predictor(fn)` / `make_xgb_predictor(model, cols)` |

Benchmark evidence already produced (10 seeds, pop 100 × 100 iters): MO-QPSO
matches/beats NSGA-II through 50 vessels (HV 0.68 vs 0.65 at 50), loses at 100 —
honest, and `algo="auto"` switches to NSGA-II above 50. **This is a strong head start.**

### What the handoff deliberately leaves to us
- **Predictor is a `physics_predictor` stand-in** (cubic speed-power law). The real
  Model 1 (XGBoost) must be trained and plugged in via `set_predictor`.
- **Fuel factors + vessel pool are PLACEHOLDER / synthetic** (labelled as such).
- **No FastAPI, no persistence, no SHAP, no provenance layer, no frontend.**
- Emissions/cost math is inlined, not a separately unit-tested module (master doc §6 wants it split out).

---

## 1. The central technical decision — predictor vs. the MRV data ⚠️

This is the one thing to resolve before building Model 1.

**What the engine's predictor needs:** `rate(speed, load, weather, engine_power,
capacity, design_speed, type) → tonnes/hour of reference fuel`. It is **speed-
dependent** — that's what makes speed optimization meaningful.

**What EU MRV actually gives us** (confirmed by inspecting `Datasets/2020…xlsx`,
12,118 rows × 62 cols, one row = **one ship-year aggregate**):
- `Ship type`, `Technical efficiency` (EEDI/EIV, sparse), `Ice class`
- `Total fuel consumption [m tonnes]`, `Total CO₂ [m tonnes]`
- `Annual average fuel consumption per distance [kg/n mile]`
- `Time spent at sea [hours]`, laden-voyage variants, transport-work intensities
- **No speed. No per-voyage rows. No engine power. No DWT/capacity. No weather.**

So we **cannot** train a speed-resolved per-voyage predictor directly from MRV.
Three honest options (recommended first):

| Option | Approach | Trade-off |
|--------|----------|-----------|
| **A. Physics-informed, MRV-calibrated** *(recommended)* | Keep the cubic speed-power form; fit its coefficients (k, SFOC) **per ship type** to real MRV fuel-per-distance. Derive an annual-average speed per ship = distance ÷ time-at-sea. XGBoost learns a correction/residual over `(type, size proxy, derived speed, EEDI)`. | Scientifically defensible, uses real data for calibration + validation, preserves speed-dependence. More design work. Matches master doc §5.3 (physics baseline + ML) + §8.1 (MRV as validation context). |
| **B. Pure-MRV aggregate model** | XGBoost predicts `fuel-per-distance` from `(type, EEDI, ice class, derived avg speed)`. Convert to t/h via distance & speed. | Simpler, fully data-driven, but speed signal is weak (one avg point/ship) and no engine-power feature → speed optimization less credible. |
| **C. Enrich MRV with a vessel register** | Join IMO→DWT/engine-power from an external register (e.g. a ship particulars dataset) to recover the engine features. | Best features, but needs another dataset you'd have to supply; licensing/time risk. |

**Either way:** MRV is also our **real-data benchmark** for the prediction report
(master doc §5.5) and for honest provenance (§8.1) regardless of which training
path we pick. The synthetic vessel pool stays for the *optimizer* scenarios
(labelled synthetic), while MRV grounds the *predictor*.

👉 **I need your pick (A/B/C)** before writing Model 1. I recommend **A**.

---

## 2. Revised remaining work

### Phase 0 — Scaffold & absorb the handoff ⬜
- Create `backend/` tree (master doc §11). Move `fleet_engine.py` → split into
  `optimization/` (decoder, repair, archive, mo_qpso, nsga2, selection, objectives)
  and `emissions/` (energy, lifecycle, shore_power, cost, compliance) **without
  changing behaviour** — port the handoff tests first so refactors stay green.
- `requirements.txt` (numpy, pandas, pymoo, scikit-learn, xgboost, shap, fastapi, uvicorn, openpyxl), `Makefile`, pytest + ruff, CI.
- Port `config_default.json` → `configs/{fuels,vessels,routes,scenarios}.json`.
- **Done when:** `make install` works and the 8 handoff tests pass from the new layout.

### Phase 1 — Harden the deterministic engine (split from handoff) ⬜
- Extract the inlined `evaluate_plan` math into tested `emissions/*` modules; add the
  unit tests master doc §15 lists (energy, lifecycle, shore-power, cost, compliance cap).
- Replace PLACEHOLDER fuel factors with **sourced** IMO/scenario values + version tag; keep the source label in provenance.
- Add explicit compliance constraint (GHG cap / CII) as a first-class, togglable check.
- **Done when:** emissions/cost/compliance each have passing unit tests with hand-checked numbers.

### Phase 2 — Data & provenance layer (MRV) ⬜
- `data/loaders.py` — read the 7 MRV `.xlsx` (header row 2, sheet = year), concat years, normalize the 62 columns.
- `data/validation.py` + `data/provenance.py` — label every field `measured`(MRV)/`derived`/`synthetic`, with source (`EMSA THETIS-MRV <year> <version>`) + formula.
- `data/feature_engineering.py` — derived avg speed (distance÷time-at-sea), size/efficiency proxies, laden ratios; document each formula.
- Splits (master doc §5.4): by **year** (chronological) and by **vessel/IMO holdout** — no random-only.
- **Done when:** a clean, documented, split training frame + provenance table are produced from `Datasets/`.

### Phase 3 — Model 1: fuel predictor (the real gap) ⬜
- Implement the chosen strategy (A/B/C). Baselines: physics (handoff's), linear, random forest, untuned XGBoost.
- `prediction/tune_qpso.py` — reuse the handoff QPSO to tune XGBoost hyperparameters (fixed eval budget).
- `prediction/validation.py` — MAE/RMSE/R²/sMAPE + train/infer time + sample/ship counts; `explainability.py` — SHAP.
- Guardrails (§5.6): no negative fuel (engine already clamps), out-of-domain flag, uncertainty band.
- **Plug into the engine** via `fe.set_predictor(make_xgb_predictor(model, cols))` and re-run a scenario to confirm the optimizer now uses the trained model.
- **Done when:** prediction benchmark table is generated from a recorded run and the optimizer consumes the trained predictor end-to-end.

### Phase 4 — FastAPI backend (wrap, don't rebuild) ⬜
- Routes per master doc §10: `POST /api/predict/fuel`, `POST /api/optimize/fleet`
  (thin wrapper over `optimize_fleet`, run **in a thread/background** per the handoff note), `GET /api/benchmarks/{run_id}`, scenarios + metadata routes.
- `experiments/results_store.py` — persist each run with the full §16 manifest (seed, dataset hash, model version, budget, metrics). Reshape engine output to the §10 response schema (pareto_solutions, balanced_solution, feasibility_rate, runtime).
- Flag: these endpoints are unauthenticated — fine for a local hackathon demo; note it, don't expose publicly without auth.
- **Done when:** the five frontend screens' data can be served from live endpoints.

### Phase 5 — Integration, benchmark freeze & demo ⬜
- Wire the provided frontend to the API; smoke-test the §13 screens.
- Re-run experiments A–E (§14) with the **trained** predictor (not the stand-in); regenerate `benchmark_results.csv`, scalability, case studies, convergence.
- Provenance panel, limitations doc, clean-start `make install/train/benchmark/run`, screenshots per §21.
- **Done when:** every master doc §20 Definition-of-Done item is true.

---

## 3. Repo & data hygiene
- Raw `Datasets/*.xlsx` and the handoff `.zip` are **git-ignored** (large/binary, reproducible public data); documented in README with the EMSA source + how to place them.
- Processed/feature files go to `data/processed/` (also ignored); only small configs + provenance CSV are committed.

## 4. What I need from you
1. **Predictor strategy A/B/C** (§1) — I recommend **A**. *(blocks Phase 3)*
2. Confirm it's fine to **restructure the handoff** into the backend tree (behaviour-preserving, tests ported). *(blocks Phase 0)*
3. Which **fuel-factor source** to cite for Phase 1 (IMO MEPC.391(81) defaults vs. a scenario table you provide).
4. The **frontend** repo/location + the API base URL it expects, when ready. *(Phase 5)*

---

*Recommended next action once you confirm §1 + §2: Phase 0 (scaffold + port tests)
and Phase 2 (MRV loader) in parallel — neither needs the predictor decision resolved.*
