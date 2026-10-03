# QFlow / Q-GreenFleet audit against Smart India Hackathon problem statement SIH26138

**Target:** [https://q-flow-silk.vercel.app/](https://q-flow-silk.vercel.app/)  
**Audit basis:** synthesis of six specialist reviews, their cited public observations/probes, and an additional check of the official SIH portal.  
**Assessment posture:** evidence-led and conservative. Claims are separated into **observed**, **reported by the specialist probes**, **inferred**, and **not verified**. A product claim is not treated as a result merely because it is visible on the landing page.

## Executive verdict

QFlow presents a **credible prototype concept with strong topical alignment** to the SIH26138 title and the public mirror wording: fuel-consumption prediction, multi-objective vessel/fuel/speed planning, alternative-fuel and shore-power scenarios, lifecycle GHG, operational constraints, and comparison against conventional optimizers. The landing page also communicates a coherent pipeline—scenario input → fuel prediction → cost/lifecycle GHG → quantum-inspired optimizer → Pareto results—and names a substantial set of intended modules.

However, it is **not yet a judge-ready, evidence-ready, or operationally ready submission**. In a fresh public session, every substantive module is behind a login gate. The visible gate advertises preconfigured full-admin access, and the client bundle/API behavior described by the reviews indicates client-side/demo authentication, unauthenticated API access, and silent fallback to representative or synthetic data. The result is a serious verification problem: a reviewer may see a polished promise surface but cannot reliably inspect the claimed prediction, optimization, emissions, benchmark, constraint, or provenance outputs without using the demo path. Even when the demo path is used, evidence is currently too thin to establish model generalization, quantum-inspired optimization advantage, maritime feasibility, lifecycle-factor comparability, or compliance validity.

**Overall readiness score: 2.0/5 (approximately 40/100 on the maturity scale used in this report).** This is a prototype-readiness score, not a scientific score. The concept and feature coverage are ahead of the evidence, security, reliability, and demonstration readiness. QFlow can become compelling within 24 hours if the team prioritizes a deterministic public judge route, evidence labeling, one reproducible case, and removal of the exposed admin-style demo pattern. It should not present itself as an auditable operational or regulatory system until the model, constraints, lifecycle accounting, security, and compliance claims are independently substantiated.

### The single most important action

Create a **no-login, read-only, deterministic judge route** with one valid named scenario and visible baseline versus optimized outputs: fuel, cost, WtW GHG, ETA/schedule, vessel/fuel/speed/shore-power assignment, constraint pass/fail with slack, algorithm settings, seed, dataset mode/version, factor version, and downloadable JSON/CSV. Mark every value as **Measured**, **Derived**, **Representative**, or **Synthetic/Mock**. Keep write/admin controls behind real server-side authorization.

---

## 1. Problem-statement context: verified, corroborated, and uncertain

### 1.1 What is verified from the official SIH portal

The official [Smart India Hackathon portal](https://sih.gov.in/) describes SIH as a nationwide initiative in which ministries, departments, PSUs, industry, and other organizations publish real-world problem statements for student teams. Its process description says that finalized problem statements are published on the SIH portal and that teams submit ideas against those statements. The official portal links to the 2026 listing at [https://sih.gov.in/sih2026PS](https://sih.gov.in/sih2026PS).

The official listing is therefore the correct authority for the problem-statement ID, exact title, organization, department, category, theme, deadline, description, and expected solution. The landing-page label `SIH 2026 · Problem Statement SIH26138` should not be treated as proof of official affiliation by itself.

### 1.2 Official SIH26138 record verified in the full page source

The full raw HTML of the official [SIH 2026 problem-statement listing](https://sih.gov.in/sih2026PS) contains record **SIH26138**. It identifies the problem as **“Quantum-Inspired Fuel Consumption Prediction and Green Fleet Optimization,”** submitted by **Egreen Quanta**, in the **Software** category and **Clean & Green Technology** theme. The record’s description calls for fuel-consumption prediction across vessel types and operating conditions; optimization of vessel types, capacities, cruising speeds, alternative fuels including LNG, methanol, hydrogen, and ammonia, and shore power; minimization of fuel, operating cost, and lifecycle greenhouse-gas emissions; satisfaction of cargo demand, schedule reliability, and operational constraints; and benchmarking against conventional prediction and optimization methods for accuracy, convergence speed, solution quality, and scalability.

This verifies the core SIH-to-QFlow alignment. The earlier specialist probes had inconsistent access to the same dynamic listing: some extractors returned only early records and one direct request returned `403`, while a full raw-page retrieval in this audit exposed the SIH26138 record. The team should still archive the official detail-page HTML/PDF or screenshot, URL, and retrieval date so judges can reproduce the reference.

Two non-official mirrors independently show the same title and core scope: [Zaid Sayyed’s SIH26138 mirror](https://zaidsayyed.in/tools/sih-problem-statements/sih26138) and [SIH Buddy’s SIH26138 page](https://www.sihbuddy.in/ps/SIH26138). The mirrors disagree on the theme label, so they remain corroboration rather than authority.

### 1.3 Official scope used for this audit

The following scope is taken from the official SIH26138 record and used as the alignment baseline:

1. Predict fuel consumption under changing operating conditions and vessel types.
2. Optimize vessel deployment, capacities, cruising speeds, fuel choices, and shore-power decisions.
3. Consider LNG, methanol, hydrogen, ammonia, and shore power.
4. Minimize fuel consumption, operating cost, and lifecycle GHG while satisfying cargo demand, schedule reliability, and operational constraints.
5. Benchmark the proposed quantum-inspired approach against conventional prediction/optimization approaches on accuracy, convergence speed, solution quality, and scalability.

This scope is consistent with the QFlow claims visible at [https://q-flow-silk.vercel.app/](https://q-flow-silk.vercel.app/). The principal remaining evidence task is not problem-statement identity, but proving that the implementation actually satisfies the stated requirements with reproducible data, models, constraints, and benchmarks.

---

## 2. Audit method and evidence limits

### Evidence classes

- **Observed:** visible in the public QFlow landing page, route behavior, browser render, client bundle, or API probe as reported by the specialists.
- **Reported probe:** a specialist directly called a public endpoint or inspected a deployed bundle and recorded a response. It is evidence of the deployed behavior at probe time, not a guarantee of current production behavior.
- **Inferred:** a reasonable implication of an observed design or omission; it is not a measured fact.
- **Unverified:** not demonstrated by an accessible artifact, reproducible run, or authoritative source.

### Direct module-inspection limitation

The substantive routes—`/scenario`, `/prediction`, `/optimization`, `/emissions`, `/benchmarking`, and `/provenance`—were reported to return a common **“Welcome back”** gate when visited without authentication. The gate says credentials are preconfigured with full admin access and offers an instant-access path. No public credential should be assumed or reused as a security control.

Accordingly, this audit can assess the public landing page, route/gate behavior, reported API/bundle observations, and the product claims, but **direct visual inspection of module output is limited whenever the login gate cannot be passed**. The absence of a visible result is not proof that the underlying module does not exist; it is proof that an independent reviewer cannot verify it through the public journey. This distinction is central to the judging and evidence scores below.

### Key cited QFlow evidence

- Landing page and claims: [q-flow-silk.vercel.app](https://q-flow-silk.vercel.app/)
- Login gate: [q-flow-silk.vercel.app/login](https://q-flow-silk.vercel.app/login)
- Gated module routes: [Scenario](https://q-flow-silk.vercel.app/scenario), [Prediction](https://q-flow-silk.vercel.app/prediction), [Optimization](https://q-flow-silk.vercel.app/optimization), [Emissions](https://q-flow-silk.vercel.app/emissions), [Benchmarking](https://q-flow-silk.vercel.app/benchmarking), [Provenance](https://q-flow-silk.vercel.app/provenance)
- Public client bundle evidence cited by specialists: [index-BdvfOmhL.js](https://q-flow-silk.vercel.app/assets/index-BdvfOmhL.js) and [index-Btj7OxqL.js](https://q-flow-silk.vercel.app/assets/index-Btj7OxqL.js)
- Reported API surface: [OpenAPI](https://q-flow-0p9o.onrender.com/openapi.json), [health](https://q-flow-0p9o.onrender.com/api/health), [vessels](https://q-flow-0p9o.onrender.com/api/vessels), [fuels](https://q-flow-0p9o.onrender.com/api/fuels), [provenance](https://q-flow-0p9o.onrender.com/api/provenance), [prediction benchmarks](https://q-flow-0p9o.onrender.com/api/benchmarks/prediction), [experiments](https://q-flow-0p9o.onrender.com/api/experiments)

---

## 3. Feature inventory and operational purpose

The inventory below evaluates what each visible or reported feature is intended to do, how it maps to the reconstructed SIH need, and what evidence is still required before the feature can support a decision.

### 3.1 Discovery, navigation, and judge entry

**Observed/claimed:** QFlow/Q-GreenFleet landing page with a maritime hero, category search/filter, module navigation, and a high-level pipeline. Branding reportedly varies among QFlow, Q-GreenFleet, ShipOpt India, and Q-Flow.

**Operational purpose:** Orient a fleet planner, sustainability analyst, researcher, or judge to the decision workflow and route them to scenario setup, prediction, emissions, optimization, benchmarking, or provenance.

**SIH value:** Makes the complex technical solution legible and provides the entry point to the expected platform.

**Gap:** A fresh user is sent to a full-admin-style gate rather than a safe read-only sample. The product name and audience are not fully consolidated. The public landing page does not show one complete result.

### 3.2 Scenario Builder

**Observed/claimed inputs:** route presets, distance, deadline, port time, buffer, weather, cargo demand, vessel pool, fuel pathways, shore power/grid factor, algorithm, population, iterations, seed, number of runs, objectives, and carbon price. The route can reportedly toggle Ship/Waterway and Road/Vehicle modes.

**Operational purpose:** Define a reproducible planning case: what must be moved, by when, with which fleet, along which route, under which weather/fuel/shore-power assumptions and objective priorities.

**SIH fit:** Directly addresses scenario analysis, varying operating conditions, cargo demand, schedule reliability, and operational constraints.

**Evidence required:** Formal route graph and port identifiers; cargo type and split/shortfall policy; port/berth windows; draft/LOA/beam restrictions; bunkering inventory and availability; weather/current/wave provenance; hard versus soft constraint semantics; a fixed sample scenario and its expected answer; infeasible-case behavior.

### 3.3 Fuel Prediction Lab

**Observed/claimed inputs and methods:** vessel type, fuel type, load factor, speed, engine power, wind, wave height, sea state, draft, and distance; XGBoost with QPSO hyperparameter tuning; global/local SHAP and predicted-versus-actual/residual views are claimed.

**Operational purpose:** Estimate fuel burn before committing to a fleet/speed/fuel plan, and explain which operating variables drive the estimate.

**SIH fit:** Directly addresses fuel prediction across vessel types and operating conditions.

**Reported evidence:** A live fuel-prediction probe returned a numerical fuel value, error, physics expected value, and sanity status for one input. Reported benchmark responses included time-holdout XGBoost metrics and a weak vessel-holdout result (`R2 0.0216`, `RMSE 569.416` in the cited probe). These are not a complete validation report and the comparison protocols are not matched.

**Evidence required:** target definition and units; labeled-data snapshot; leakage-safe vessel/time/route split; row counts and joins; baselines; calibration and prediction intervals; error by vessel/weather/load regime; model artifact/version; reproducible code/config; comparison of tuned and untuned models on the same split.

### 3.4 Quantum/MO-QPSO fleet optimizer

**Observed/claimed behavior:** multi-objective Pareto search across fuel, cost, and GHG with decisions including vessel, speed, fuel, and shore power. Scenario outputs reportedly include a run ID, feasibility, Pareto count, hypervolume, and base-versus-optimized metrics.

**Operational purpose:** Generate feasible alternatives rather than one opaque answer, allowing a planner to choose a fuel/cost/emissions trade-off.

**SIH fit:** Directly addresses quantum-inspired multi-objective optimization and deployment planning.

**Reported evidence:** A probe reportedly returned `feasible=true`, `feasibilityRate=1.0`, two Pareto records, and `finalHypervolume=0.231`, with a flat hypervolume trace in that response. A browser run reportedly showed 33 Pareto points and a different HV value. The difference reinforces the need for versioned, reproducible run artifacts.

**Evidence required:** objective equations and units; normalization and hypervolume reference point; decision bounds; constraint equations and repair/penalty policy; stopping rule; seeds and evaluation budgets; complete nondominated archive; matched NSGA-II/PSO baselines; proof that any improvement is not simply tuning or a changed constraint treatment.

### 3.5 Benchmark Lab

**Observed/claimed behavior:** QPSO versus NSGA-II, multiple seeds, hypervolume, convergence, scalability, runtime, prediction benchmarks, and CSV/recompute controls. Reported UI text calls the data representative and identifies `mock-v1`.

**Operational purpose:** Establish whether the proposed optimizer and predictor are accurate, stable, fast, scalable, and better—or at least competitive—against credible conventional methods.

**SIH fit:** Directly addresses benchmarking against conventional methods.

**Gap:** The experiment endpoint was reportedly empty; representative/mock data and silent fallback make the result status ambiguous. Current evidence does not show matched compute budgets, tuned baselines, confidence intervals, or raw result archives. A QPSO label is not evidence of quantum advantage; it is a quantum-inspired classical method unless the team explicitly states otherwise.

### 3.6 Lifecycle Emissions Engine

**Observed/claimed behavior:** WtT, TtW, WtW, fuel pathways, shore-power/grid emissions, factor selectors, factor tables, CSV export, and an “indicative CII-style check.” Named factor families include IMO MEPC.391(81) 2024, Sphera/ICCT 2023, and CONCAWE/IEA 2024 in reported UI observations.

**Operational purpose:** Prevent tailpipe-only comparisons by calculating upstream fuel production, onboard use, and combined lifecycle GHG, then compare shore power and alternative fuels on a common functional basis.

**SIH fit:** Directly addresses lifecycle GHG minimization and alternative-fuel scenario analysis.

**Gap:** A valid comparison requires a defined functional unit, CO2/CH4/N2O treatment, GWP version, methane slip, N2O, fuel-chain transport/leakage, electricity boundary, geography, time, allocation, and sensitivity. Mixed vintages and pathway labels can invert rankings if not reconciled. The UI’s caution that CII is indicative is a positive safeguard, but it cannot substitute for an auditable formula.

**Relevant official context:** IMO describes WtW as WtT plus TtW and its lifecycle guidelines cover CO2, CH4, and N2O; see [IMO Lifecycle GHG / Carbon Intensity Guidelines](https://www.imo.org/en/ourwork/environment/pages/lifecycle-ghg---carbon-intensity-guidelines.aspx).

### 3.7 Data Provenance

**Observed/claimed fields:** AIS, MRV, ERA5, emission factors, source, unit, status, and version; reported provenance entries distinguish measured and synthetic/derived fields and name `mock-v1`.

**Operational purpose:** Let a reviewer trace a metric from source data and factors through transformations and model/optimizer configuration to the displayed result.

**SIH fit:** Supports data-driven prediction, case studies, auditability, and reproducibility.

**Gap:** A useful ledger needs source URL/dataset ID, license, retrieval time, coverage, spatial/temporal resolution, row counts, hashes, joins, missing-data and outlier policy, transformation version, factor version, and a signed/exportable run manifest. The words “Live mode” and “API may fall back to representative data” must never coexist with an unlabeled decision metric.

### 3.8 Vessel Scenarios / hydrodynamics, draft, and trim

**Operational purpose:** Represent vessel-specific resistance and operating conditions so fuel prediction and feasible speeds are not based on a generic fleet average.

**SIH fit:** Addresses different vessel types, capacities, and operating conditions.

**Gap:** The reported live vessel endpoint returned only a small generic catalog with capacity, speed range, allowed fuel, shore-power flag, and availability; it did not evidence IMO identity, draft, LOA, beam, engine curve, route history, or port compatibility. A physics-informed model needs measured or calibrated vessel-specific inputs and valid ranges.

### 3.9 Shore Power / OPS

**Operational purpose:** Decide whether a vessel should connect at berth, comparing connection feasibility, energy cost, and grid emissions against auxiliary-engine operation.

**SIH fit:** Directly addresses shore-power integration.

**Gap:** A generic switch is insufficient for a real port call. Required fields include berth/port availability, voltage/frequency, connection power, connection time, hotel and reefer load, tariff/demand charges, grid-factor vintage, renewable contract, and fallback logic.

**Relevant official context:** IMO OPS guidance emphasizes fleet/port-call analysis, grid characteristics, and energy/emissions analysis; see [IMO OPS feasibility context](https://www.imo.org/en/mediacentre/pages/WhatsNew-2021.aspx). EMSA also publishes shore-side electricity planning and technical/safety guidance at [EMSA shore-side electricity](https://www.emsa.europa.eu/we-do/digitalisation/maritime-monitoring/items.html?cid=2&id=4799).

### 3.10 CII and EEXI compliance concepts

**Operational purpose:** Translate voyage/fleet decisions into regulatory indicators and identify whether corrective action may be needed.

**SIH fit:** Supports the problem’s compliance/emissions decision-support framing, if included in the official scope.

**Gap:** CII and EEXI are not interchangeable. A credible module must bind a result to ship particulars, applicable vessel class/GT, reporting period, attained and required values, correction factors, formula/version, and verification status. The UI should say **decision support / estimate**, never certificate or verified compliance unless an authorized workflow exists.

**Relevant official context:** IMO’s [EEXI/CII FAQ](https://www.imo.org/en/mediacentre/hottopics/pages/eexi-cii-faq.aspx) explains distinct applicability and rating/corrective-action regimes. The specialists report the official thresholds as EEXI for ships of 400 GT and above and CII for ships of 5,000 GT and above; QFlow should verify the applicable current rules and show them with the calculation.

### 3.11 Pareto Front and decision selection

**Operational purpose:** Expose the trade-off among fuel, cost, and GHG so a planner can choose a plan using explicit priorities rather than accept a hidden weighted average.

**SIH fit:** Central to multi-objective optimization.

**Gap:** A Pareto count or HV value is not a decision. The user needs a chart/table, objective units, selected reference point, feasibility/slack, vessel/fuel/speed assignment, baseline comparison, preference controls, and “why this option” explanation. The reported run where fuel decreased while cost and WtW GHG increased is valuable as a trade-off example, but it needs explicit interpretation.

### 3.12 Constraint Audit

**Operational purpose:** Prove that a suggested deployment serves cargo, meets schedule, respects vessel/fuel/bunkering/port limits, and identify exactly what fails when no solution exists.

**SIH fit:** Directly addresses cargo demand, schedule reliability, and operational constraints.

**Gap:** Reported observations show pre-run cargo/deadline failures followed by a post-run `Feasible Yes` without explaining whether the optimizer repaired, relaxed, or ignored the failures. Every constraint needs a mathematical definition, units, tolerance, slack, source, hard/soft status, and reason code. All-infeasible cases must remain visibly infeasible.

### 3.13 Green Fuel Pathways

**Operational purpose:** Compare methanol, hydrogen, LNG, ammonia, and other pathway variants on fuel properties, compatibility, availability, cost, and lifecycle GHG.

**SIH fit:** Directly addresses the alternative-fuel scope.

**Gap:** “LNG,” “methanol,” “hydrogen,” and “ammonia” are not single lifecycle cases. Production route, origin, electricity mix, methane slip, N2O, tank/engine compatibility, safety, bunkering availability, and price date must be explicit. Fuel IDs must be unique; reported duplicate methanol IDs create joins and audit risk.

### 3.14 AIS tracking and route/speed intelligence

**Operational purpose:** Provide movement history and operating-condition context for model features and fleet visibility.

**SIH value:** Useful input infrastructure, but tracking alone is not the optimization deliverable.

**Gap:** The `1,420+ vessels tracked via AIS` claim needs coverage window, identity resolution, data license, freshness, source, and evidence. AIS is movement data, not a fuel-flow meter or navigational authorization. See [IMO AIS overview](https://www.imo.org/en/ourwork/safety/pages/ais.aspx).

### 3.15 Feedback, authentication, and recovery

**Operational purpose:** Allow user access, recovery, feedback, and perhaps later role separation.

**Gap:** A visible shared/preconfigured Fleet Admin account and client-side token/local-storage state are not production authorization. Feedback needs an owned endpoint, privacy notice, retention, confirmation, and audit trail. Recovery should explain token state and error handling.

---

## 4. Scored gap matrix

### Scoring scale

Each dimension is scored **0–5**: 0 absent; 1 claimed/labelled only; 2 partial or demonstrable only through a gated/demo path; 3 working and inspectable with limited evidence; 4 reproducible with documented validation; 5 independently evidenced, robust, and operationally governed. These are audit maturity scores, not claims about algorithm quality.

| Capability | Coverage | Evidence | Usability | Technical readiness | Judging/demo readiness | Key gap |
|---|---:|---:|---:|---:|---:|---|
| Scenario Builder | 4 | 1 | 2 | 2 | 1 | Rich inputs are claimed/reported, but no public seeded journey, formal port/route model, or explained infeasibility. |
| Fuel Prediction Lab | 4 | 1 | 1 | 2 | 1 | Prediction action/output is unclear; reported vessel-holdout performance is weak and validation artifacts are absent. |
| MO-QPSO optimizer | 4 | 1 | 2 | 2 | 1 | Pareto output is not independently inspectable; objectives, scaling, constraints, and baselines are not released. |
| Benchmark Lab | 4 | 1 | 2 | 2 | 1 | Representative/mock data, empty experiment listing, unmatched protocols, and missing uncertainty undermine claims. |
| Lifecycle Emissions | 4 | 1 | 2 | 2 | 1 | Factor boundaries, gases, vintage, geography, and sensitivity are not sufficiently exposed. |
| Data Provenance | 4 | 2 | 2 | 2 | 1 | Good conceptual fit and source labels, but no complete hash/license/coverage/manifest chain is visible. |
| Vessel scenarios | 3 | 1 | 1 | 1 | 1 | Generic vessel schema does not evidence draft, geometry, engine, port compatibility, or calibrated hydrodynamics. |
| Shore power / OPS | 3 | 1 | 1 | 1 | 1 | No port/berth connection feasibility, load profile, tariff, grid vintage, or fallback evidence. |
| CII / EEXI | 3 | 1 | 1 | 1 | 1 | Indicative warning is good; formula/version, ship particulars, attained/required values, and verification workflow are missing. |
| Pareto decision support | 4 | 1 | 2 | 2 | 1 | No clear recommended point, selection rationale, constraint margin, or plan handoff. |
| Constraint audit | 4 | 1 | 1 | 1 | 1 | Preflight Fail → post-run Feasible is unexplained; maritime constraints are shallow/unverified. |
| Green fuel pathways | 4 | 1 | 2 | 1 | 1 | Pathway assumptions, compatibility, safety, availability, unique IDs, and uncertainty are missing. |
| AIS intelligence | 3 | 1 | 1 | 2 | 1 | 1,420+ count, licensing, freshness, and fuel-label linkage are not evidenced. |
| Authentication / governance | 2 | 1 | 1 | 1 | 1 | Client/demo admin path and publicly callable API are unsuitable as production controls. |
| Public judge flow | 1 | 1 | 1 | 1 | 1 | A fresh visitor reaches a gate rather than a verifiable, deterministic result. |
| **Overall average** | **3.4** | **1.1** | **1.5** | **1.6** | **1.0** | **Concept/coverage is materially ahead of evidence and demonstration readiness.** |

### Dimension-level interpretation

- **Coverage (3.4/5):** The feature map is broad and substantively matches the reconstructed SIH scope. Coverage is mostly at the level of named modules and intended behavior, not proven end-to-end operational coverage.
- **Evidence (1.1/5):** The most serious gap. Specialists report `Synthetic/mock-v1`, representative benchmark values, limited experiments, missing manifests, and no public end-to-end artifact.
- **Usability (1.5/5):** The reported scenario UI is rich, but the login gate, unclear prediction action, route-state loss, blank/skeleton screens, acronym density, confusing constraint transition, and mobile overflow block adoption.
- **Technical readiness (1.6/5):** Public API behavior and a plausible REST architecture are positive, but missing security schemes, unauthenticated POSTs, client-side auth, silent fallback, 404 contracts, no durable job lifecycle, and no observability are material.
- **Judging/demo readiness (1.0/5):** This is the current gating factor. A judge must not need to discover credentials, trust an admin account, infer data mode, or wait through ambiguous loading states.

---

## 5. Bottlenecks, evidence, impact, and fixes

| Priority / severity | Bottleneck and evidence | Impact | Required fix |
|---|---|---|---|
| **P0 Critical — verification** | Six substantive routes reportedly resolve to the same login gate; no public read-only sample output is visible. | A judge can score the product as a marketing shell and cannot verify the claimed pipeline. | Ship `/demo` or `/judge` with a deterministic read-only scenario and exports; test in incognito. |
| **P0 Critical — security** | Reviews report a preconfigured full-admin instant-login path, hard-coded/demo client state, local/session storage token, and no OpenAPI security scheme; public POSTs reportedly return outputs. | Unauthorized access, data exposure, compute abuse, forged privilege, and reputational damage. | Remove shared/admin demo credentials from production; enforce server-side auth/RBAC on every API; rate-limit and negative-test anonymous requests. |
| **P0 Critical — truth in data** | Client/bundle/provenance evidence reportedly marks predicted fuel and Pareto HV as `Synthetic/mock-v1`; benchmark text calls data representative; API fallback can synthesize output. | Reviewers may mistake illustrative numbers for measured operational evidence. | Add per-result `data_mode`, source, version, timestamp, and fallback status; watermark synthetic data; fail closed for decision-critical production mode. |
| **P0 Critical — SIH source** | Official listing access was inconsistent in the supplied probes and this audit could not independently reproduce the SIH26138 record from the fetched segment; mirrors agree on core wording but differ in theme. | Incorrect official attribution or rubric alignment could invalidate the submission. | Archive authoritative SIH detail/PDF/screenshot with retrieval date; reconcile title, ID, organization, category, theme, deadline, and wording before publishing. |
| **P0 Critical — happy path** | Reported navigation loses the scenario run: Scenario shows a result, then Optimization returns “No optimization run yet.” | Live demo fails at the moment a judge asks to inspect or compare the result. | Persist a versioned `scenario/run` object across routes; add breadcrumbs and Edit/Compare/Export actions; add an incognito smoke test. |
| **P1 High — model validity** | Reported vessel-holdout XGBoost R² is 0.0216; QPSO-tuned metrics are only reported for a different time holdout; no calibration or uncertainty. | Fuel recommendations may not generalize to unseen vessels/routes and can create cost/emissions error. | Rerun blocked time plus leave-vessel/route-out tests; publish absolute-unit errors, confidence intervals, calibration, slices, and matched tuned/untuned baselines. |
| **P1 High — optimization validity** | Flat reported HV trace (0.231 at iteration 0 and 150), only two live Pareto records, no reference point or matched NSGA-II evidence. | Claimed convergence/quality/quantum advantage is not persuasive or reproducible. | Define scaling/reference point; publish full fronts, HV/IGD/epsilon/feasibility/runtime, equal budgets, multiple seeds, paired statistics, and cases where QPSO does not win. |
| **P1 High — operational realism** | Reported implementation mainly samples generic vessels/fuels and checks fuel allowance, capacity, and sailing time; no evidenced route graph, port geometry, bunkering, congestion, weather forecast, continuity, or multi-leg scheduling. | A mathematically feasible plan may be physically impossible, unsafe, or commercially unusable. | Add a bounded maritime constraint schema; show reason codes/slack; narrow claims to illustrative planning until real constraints are supported. |
| **P1 High — lifecycle accounting** | Mixed factor sources/years, pathway ambiguity, mixed-fuel LHV proxy, and no visible CH4/N2O/methane-slip/geography/sensitivity treatment. | Fuel ranking and “green” claims can reverse under different legitimate assumptions. | Versioned factor registry, unique fuel IDs, explicit functional units, CO2/CH4/N2O/GWP assumptions, pathway sensitivity, price/grid vintage, and exportable calculation. |
| **P1 High — constraint semantics** | Browser observation reportedly showed cargo/deadline Fail before a run and Feasible Yes after it, with no explanation of repair/relaxation. | Users cannot tell whether the result satisfies requirements or merely bypasses them. | Label hard/soft constraints, block invalid runs or show repair, expose every violation/slack/tolerance, and test known feasible/infeasible cases. |
| **P1 High — reliability/contracts** | Frontend-referenced endpoints reportedly return 404; generic fallbacks mask outages/schema drift; optimization has no evidenced queue/idempotency/cancellation. | Screens may look healthy while showing stale/mock data; long jobs may duplicate or exhaust resources. | Versioned OpenAPI contract, CI endpoint tests, explicit errors, bounded worker queue, job IDs, retries/timeouts/cancellation, quotas, and deploy rollback runbook. |
| **P1 High — mobile/accessibility** | Specialist Lighthouse/render observations report horizontal overflow at 390px, LCP 16.8s in one run, contrast/label/target-size findings, and no clear mobile menu. | Judge on a phone/projector or user with assistive technology may not complete the flow. | Responsive navigation/layout, 44px targets, labels and accessible names, contrast/focus/live status, reduced motion, image/bundle optimization, and automated checks. |
| **P2 Medium — compliance boundary** | CII/EEXI and ISO 19030 badges are visible but formulas, scope, ship inputs, verification, and measurement conditions are not exposed. | Users may treat decision support as certification or claim unsupported compliance. | Split EEXI/CII calculators, show applicability/formula/version/attained-required/verification, and use explicit “not certification” language. |
| **P2 Medium — governance/adoption** | No visible least-privilege roles, audit trail, privacy/retention policy, licenses, human approval, or integration path. | Fleet operators cannot safely adopt or defend a decision to management, class, flag, port, or auditor. | Define planner/analyst/compliance/admin roles; add audit log, retention/deletion, licensing, approval, export, and integration roadmap. |
| **P2 Medium — SEO/operational correctness** | Reviews report `/robots.txt`, `/sitemap.xml`, and `/manifest.json` serving the SPA shell, unknown paths returning HTTP 200, and missing route metadata. | Poor discovery, monitoring, installability, and false health/404 signals. | Serve valid machine files and MIME types, true 404 at the edge or documented SPA strategy, canonical/OG metadata, and route smoke tests. |

---

## 6. Phased optimization plan

### Phase 1: next 24 hours — make the concept judgeable and honest

**Outcome target:** A judge can complete the full happy path in under 90 seconds from an incognito window, without a shared admin secret, and can download one reproducible run package.

1. **Publish a public read-only judge route.** Use one fixed, named scenario with a reset button. Include route, cargo, deadline, fleet, fuel, shore-power choice, objectives, seed, and data mode before the run.
2. **Show one complete baseline-versus-optimized case.** Display fuel, cost, WtW GHG, schedule/ETA, selected vessel/fuel/speed/shore power, feasibility, constraint slack, runtime, algorithm, and seed. If values are synthetic or representative, make that unavoidable.
3. **Fix cross-route state.** Persist the run object and make Scenario → Predict → Emissions → Optimize → Compare → Provenance a working, clickable path. Do not add modules until this path survives a hard refresh.
4. **Remove the unsafe demo pattern.** Rotate/remove visible credentials, stop calling a demo account “full admin,” create a read-only viewer role, and enforce server-side authorization. If a temporary demo login is retained, label it as a sandbox and rate-limit it.
5. **Replace silent fallback with an explicit status.** Add `LIVE`, `REPRESENTATIVE`, `SYNTHETIC`, or `MOCK` badges to every chart/table/export, plus source/version/time and a fallback notice.
6. **Resolve or disclose the SIH source discrepancy.** Add an Evidence page linking [official SIH](https://sih.gov.in/sih2026PS) and the archived detail artifact. Until verified, state “official detail not independently reproduced in this environment; mirror wording used for provisional alignment.”
7. **Explain constraint semantics.** Before Run, show the failing cargo/deadline checks; after Run, show exactly what changed, whether the constraint was repaired/relaxed, and the final slack. Never silently convert Fail to Feasible.
8. **Add the minimum accessibility/demo fixes.** Fix category-select label, Optimize accessible name, contrast, keyboard focus, 44px targets, loading/error/retry/live status, and mobile overflow at 320/390/768px.
9. **Add a compact assumptions card.** Link factor version, model version, baseline definition, synthetic-data boundary, and “decision support, not certification.”

**24-hour exit criteria:** incognito happy-path test passes; no privileged credentials appear in public UI/source; every displayed metric has truth status; one JSON/CSV run artifact is downloadable; no hard constraint is silently bypassed; mobile has no horizontal overflow; core action is keyboard reachable.

### Phase 2: next 7 days — make evidence reproducible and the benchmark defensible

**Outcome target:** An independent technical reviewer can reproduce the demo result and understand exactly what has and has not been validated.

1. **Release a reproducibility package.** Include scenario JSON, dataset manifest/hashes, source/license, row counts, join keys, feature schema, preprocessing, train/validation/test splits, model hyperparameters, QPSO settings, seeds, objective scaling, HV reference point, code commit, environment lockfile, and raw nondominated archives.
2. **Rerun prediction evaluation.** Use blocked time splits plus leave-vessel-out and, where applicable, leave-route-out tests. Report MAE/RMSE/sMAPE/R² in clear units, bootstrap intervals, calibration/coverage, error slices, and a physics/naval-architecture baseline.
3. **Run matched optimizer benchmarks.** Compare MO-QPSO, NSGA-II, classical PSO, and a documented baseline under equal evaluation budgets, population sizes, stopping rules, constraint handling, and seeds. Report HV, IGD, epsilon, feasibility, runtime, evaluations-to-target, and seed-wise confidence intervals.
4. **Implement transparent objective/constraint equations.** Publish fuel, cost, WtT/TtW/WtW, shore power, cargo, deadline, bunker, speed, compatibility, and Pareto definitions with units and tolerances.
5. **Build a versioned factor and fuel registry.** Remove duplicate fuel IDs; distinguish fossil/bio/e-methanol and production routes; record factor date, geography, electricity basis, CH4/N2O/methane slip, price date, and uncertainty.
6. **Add reviewer-friendly decision selection.** Let the user select a Pareto point, see trade-offs to baseline, see binding constraints, understand “why this option,” and export an approval/audit packet.
7. **Add operational test fixtures.** Include known-feasible, known-infeasible, port-unavailable, bunkering-unavailable, weather-window, and all-infeasible cases with expected pass/fail outputs.
8. **Harden deployment.** Add API security schemes, rate limits, payload bounds, CORS tests, request/trace IDs, structured logs, readiness checks, latency/error dashboards, and explicit 4xx/5xx handling. Protect or disable production Swagger/OpenAPI.
9. **Automate browser regression tests.** Test anonymous viewer, viewer, analyst, admin, route refresh, API failure, fallback labeling, accessibility, mobile widths, and deep links.

**7-day exit criteria:** a clean reviewer can reproduce the fixed result from the package; prediction and optimization protocols are matched; raw outputs are downloadable; known infeasible tests stay infeasible or explain their repair; no silent fallback; p95 API/run latency and error rates are measured; roles and authorization are tested server-side.

### Phase 3: next 30 days — move from prototype to controlled pilot

**Outcome target:** A bounded pilot can support human-reviewed planning decisions for one vessel class/trade lane without representing itself as a certified navigation or compliance system.

1. **Collect/validate voyage-linked labels.** Join licensed AIS/MRV/telemetry/engine data with explicit spatial-temporal alignment, speed-through-water/SOG distinction, load/draft, weather/current/wave, and missingness policy. Use vessel/time leakage controls.
2. **Add real maritime feasibility.** Implement route graph, depth/under-keel/squat limits, port/berth windows, draft/LOA/beam, cargo compatibility, bunkering inventory, fuel/engine compatibility, weather forecast uncertainty, congestion/disruption, reserve fuel, and multi-leg continuity. Require human approval.
3. **Separate regulatory calculators.** Implement EEXI technical attained/required and annual operational CII attained/required/rating with scope, ship particulars, correction factors, reporting period, formula/version, verification state, and SEEMP/corrective-action notes. Retain “not certification” boundary.
4. **Make OPS port-specific.** Add berth availability, connection rating, voltage/frequency, load profile, tariff/demand charges, marginal/average grid factors, connection time, renewable contract, and fallback.
5. **Add uncertainty, robustness, and drift.** Provide calibrated prediction intervals, scenario sensitivity/robust optimization for price/weather/demand/delay/carbon price, monitoring, drift alerts, and a human override/audit trail.
6. **Establish governance and integrations.** Define RBAC, tenant isolation, retention/deletion, licensed-source handling, audit exports, incident response, backup/restore, class/flag/verifier review, port and bunker feeds, noon/engine data, and service-level targets.
7. **Improve public delivery quality.** Reduce large bundle/image payloads; fix LCP; add valid robots/sitemap/manifest, route metadata, canonical/OG tags, true 404 handling, CSP/security headers, and accessibility regression gates.
8. **Run a blinded pilot.** Compare historical post-voyage fuel and schedule outcomes against baseline planning for one class/lane. Publish limitations and cases where the optimizer does not win.

**30-day exit criteria:** documented pilot scope; independent voyage-level backtest; calibrated uncertainties; port/fuel/route compatibility tests; role/audit controls; signed provenance packets; measured latency/SLOs; and an explicit statement that results are decision support pending maritime, regulatory, and human review.

---

## 7. Measurable acceptance tests and KPIs

These are proposed acceptance criteria, not claims that QFlow currently satisfies them.

| ID | Area | Test | Proposed pass criterion |
|---|---|---|---|
| AT-01 | Public access | Open the public URL in a clean incognito session and execute the fixed judge scenario. | Complete Scenario → Result → Provenance → Export with no secret, shared-admin credential, or manual developer action; 10/10 clean runs pass. |
| AT-02 | Demo latency | Measure first meaningful judge content and seeded result on a throttled but realistic connection. | Landing meaningful content ≤3s; seeded result ≤10s p95 or show progress/status with a bounded async job. Current specialist Lighthouse LCP 16.8s is the baseline to beat, not a field percentile. |
| AT-03 | Truth labeling | Inspect each chart, table, tooltip, and export. | Every metric includes data mode, source, version, timestamp, model/algorithm version, and fallback status; 0 unlabeled synthetic/representative values. |
| AT-04 | State continuity | Run a scenario, navigate to Optimization/Benchmarking/Provenance, hard refresh, then return. | Same immutable run ID/config/output is restored 10/10 times; no “No optimization run yet” after a completed run. |
| AT-05 | Constraint semantics | Execute known feasible, known infeasible, and repair-required fixtures. | Hard constraints never silently pass; each output lists pass/fail, slack/violation, units, tolerance, and reason; 100% expected fixture agreement. |
| AT-06 | Prediction validity | Evaluate time-blocked and leave-vessel/route-out holdouts, with no vessel leakage. | Publish MAE/RMSE/sMAPE/R² in absolute units, 95% bootstrap intervals, calibration/coverage, and per-regime slices; set domain-specific thresholds before measuring. Current reported vessel-holdout R²=0.0216 fails any claim of demonstrated generalization until improved or honestly qualified. |
| AT-07 | Prediction reproducibility | Re-run the published scenario/config/seed from the package. | Same prediction within documented numerical tolerance and same feature/preprocessing versions; 3 independent environments agree. |
| AT-08 | Optimizer fairness | Compare MO-QPSO, NSGA-II, classical PSO, and baseline on identical cases, budgets, seeds, and constraints. | Publish HV, IGD, epsilon, feasibility, runtime, evaluations, and seed-wise intervals; no “QPSO wins” claim without predeclared comparison and statistical evidence. |
| AT-09 | Hypervolume integrity | Recompute HV from the raw nondominated archive. | Reference point, normalization, direction, and archive are documented; independent recomputation matches within 1% relative tolerance. Investigate any flat trace such as the reported 0.231 at iterations 0 and 150. |
| AT-10 | Lifecycle accounting | Recompute one fuel/shore-power case from the factor registry. | WtT + TtW = WtW under documented units; CO2/CH4/N2O, GWP, methane slip, electricity basis, geography, vintage, and uncertainty are visible; independent calculation matches within 1%. |
| AT-11 | Fuel data integrity | Validate fuel catalog and joins. | Unique stable ID per pathway; no duplicate identifiers for fossil/bio/e-methanol; pathway, compatibility, price date, factor version, and availability are explicit. |
| AT-12 | Maritime feasibility | Test port draft/geometry, berth window, bunker/OPS availability, weather window, reserve, and fuel compatibility. | Infeasible cases are rejected or clearly flagged with reason/slack; no recommendation bypasses a hard safety/compatibility rule. |
| AT-13 | Compliance boundary | Compare EEXI/CII outputs with a reviewed reference calculator for fixed ship inputs. | Formula/version and attained/required values agree within a predeclared tolerance; output says estimate/decision support and shows verification status. |
| AT-14 | Access control | Call every API endpoint as anonymous, viewer, analyst, and admin; tamper with client storage. | Decision endpoints enforce server-side role authorization; forged local storage cannot elevate privilege; anonymous POSTs are denied or limited to a clearly isolated demo sandbox. |
| AT-15 | Abuse resistance | Send oversized/invalid requests and concurrent optimization calls. | Schema validation, payload limits, rate limits, quotas, timeout/cancellation, and bounded compute prevent resource exhaustion; errors are explicit and do not return plausible mock decisions. |
| AT-16 | Contract reliability | Run CI against all frontend-referenced API paths and OpenAPI. | 100% expected paths have versioned schemas and smoke tests; no silent fallback for contract errors; 4xx/5xx states are visible and actionable. |
| AT-17 | Provenance | Export a run packet and trace metric → feature/factor → model/config → result. | Packet contains immutable run ID, config, dataset/factor hashes, source/license, timestamp, seed, output, and human approval metadata; independent reviewer can trace every displayed result. |
| AT-18 | Accessibility | Keyboard-only and screen-reader smoke test; mobile at 320/390/768px; automated WCAG checks. | No horizontal overflow; all controls have labels/names; visible focus; 44×44px touch targets; sufficient contrast; live loading/errors; reduced-motion support; zero critical automated violations. |
| AT-19 | Performance/delivery | Run Lighthouse/Playwright on landing and judge routes, plus asset/header/route checks. | Track LCP/INP/CLS and p95 API latency; set release gates (for example LCP ≤2.5s target, CLS ≤0.1, no console errors); valid robots.txt, sitemap.xml, manifest.json, metadata, and true 404 semantics. |
| AT-20 | Human review | Have a maritime operator review the selected Pareto plan and assumptions. | Reviewer can identify binding constraints, uncertainty, source/factor vintage, trade-offs, and approve/reject with an audit record; no autonomous navigation or fuel transition execution. |

### Suggested headline KPI card for judging

For the one public scenario, show:

- **Prediction:** MAE/RMSE/sMAPE, holdout type, uncertainty/coverage, and baseline.
- **Optimization:** feasible-solution rate, fuel/cost/WtW deltas, HV/IGD, runtime, evaluations, seed, and baseline algorithm.
- **Operations:** cargo served, deadline/ETA, port/bunker/OPS status, reserve, and every constraint margin.
- **Data trust:** source, coverage date, data mode, factor/model/algorithm versions, and run hash.
- **Decision value:** selected Pareto point plus at least two alternatives and the trade-off explanation.

---

## 8. Risk register

### Security and privacy

- **Critical:** Client-side/demo admin state and publicly visible/preconfigured credentials are not authorization. Tokens in local/session storage can be copied or forged; APIs must enforce roles server-side.
- **Critical:** Reported unauthenticated API GET and POST access could expose vessel/model data and enable compute abuse. Add authentication, authorization, rate limits, payload bounds, audit logs, tenant isolation, and abuse monitoring.
- **High:** Public OpenAPI/Swagger without a security scheme reveals attack surface and stale contracts. Protect or deliberately expose a redacted, versioned specification.
- **High:** AIS and fleet records may have commercial/security sensitivity. Follow licensed data use, minimization, retention, access logs, and the [IMO AIS security caution](https://www.imo.org/en/ourwork/safety/pages/ais.aspx).
- **Medium:** Add CSP/frame-ancestor, `nosniff`, Referrer-Policy, Permissions-Policy, secure cookies or short-lived tokens, CSRF protection where applicable, dependency scanning, and secret rotation.

### Data and provenance

- **High:** AIS is movement/speed context, not fuel truth. MRV may be aggregate/regulated-scope data; ERA5 is retrospective reanalysis, not a live high-resolution forecast. Joins, time alignment, missingness, and leakage must be documented.
- **High:** The 1,420+ AIS vessel claim is not independently evidenced by the reported API response of ten generic vessel records. Add coverage definition, date, identity resolution, license, and snapshot/hash.
- **High:** Synthetic/mock-v1 and representative values must be visually and programmatically distinct from measured/derived outputs.
- **Medium:** Factor and fuel versioning, duplicate IDs, mixed-fuel LHV proxy, and missing geographic/time assumptions can corrupt comparison. Use a governed registry and immutable manifests.
- **Medium:** Add update cadence, data quality flags, source owner, retention/deletion, and signed provenance export.

### Algorithmic/model risk

- **High:** Reported vessel-holdout R² 0.0216 is weak evidence of transfer to unseen vessels; time-holdout QPSO metrics are not a like-for-like comparison. Do not claim generalization or tuning benefit until matched evaluation is released.
- **High:** A flat HV curve, only two returned Pareto records, and no reference point make optimizer quality unassessable. Publish raw fronts and convergence diagnostics.
- **High:** QPSO is quantum-inspired classical optimization, not quantum hardware or quantum advantage. Claims must distinguish inspiration, implementation, and measured superiority.
- **High:** Silent fallback can produce plausible but stale results. Fail closed for operational recommendations and show explicit data mode.
- **Medium:** Add uncertainty, calibration, drift monitoring, regime slices, sensitivity/robust optimization, human override, and a model card.

### Maritime safety and operational risk

- **Critical if used autonomously:** AIS/reanalysis-based recommendations without charts, depth, traffic, COLREGS, restricted areas, under-keel clearance, squat, currents, forecast uncertainty, or human approval may be unsafe or legally unusable. Position QFlow as planning decision support, not autonomous navigation.
- **High:** Generic port/distance inputs omit draft/LOA/beam, berth windows, pilots/tugs, congestion, bunkering, fuel reserves, route disruptions, multi-leg continuity, and cargo compatibility.
- **High:** Alternative fuels have distinct safety, quality, engine, tank, bunkering, and regulatory requirements. Availability and compatibility must be hard constraints, not labels.
- **High:** Shore-power plans can be infeasible without berth availability, voltage/frequency, connection rating, connection time, load profile, tariff, grid factor, and fallback.
- **Medium:** ERA5’s reported hourly/coarse reanalysis and multi-day latency are useful for historical context, not sufficient alone for live route decisions. See [Copernicus ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview).

### Lifecycle and regulatory risk

- **High:** WtT/TtW/WtW rankings depend on functional unit, GWP, CO2/CH4/N2O, methane slip, leakage, electricity mix, allocation, geography, timestamp, and production route. Unqualified “greenest” output risks greenwashing.
- **High:** CII and EEXI have different purposes, applicability, inputs, and reporting/verification regimes. A generic “indicative CII-style check” must not be presented as compliance.
- **High:** ISO 19030 has a defined scope and default measurement method for hull/propeller performance; a platform badge is not evidence of compliance. See [ISO 19030-2](https://www.iso.org/standard/63775.html).
- **Medium:** Use current IMO factor/formula versions, show applicability, and obtain naval-architecture/class/flag/verifier review before regulatory marketing.

### Accessibility and user experience

- **High:** Specialist observations report horizontal overflow on 390px, clipped navigation, small controls, contrast and label/name issues, unclear prediction action, and skeletons that can look broken.
- **High:** A login gate, route-state loss, unclear data mode, and unexplained Fail→Feasible transition create demo and decision errors.
- **Medium:** Acronyms (MO-QPSO, HV, WtT/TtW/WtW, SHAP, CII, EEXI, OPS, sMAPE) need tooltips/glossary and “why this matters” text.
- **Medium:** Add keyboard and screen-reader semantics, visible focus, status announcements, reduced motion, clear errors/retry, and responsive layouts.

### Deployment, reliability, and delivery

- **High:** Separate Vercel/Render/Cloudflare services create cold-start, CORS, origin, rollback, and contract-drift failure modes. Reported API latency was approximately 2.7–3.1s in sampled probes; measure p95/p99 under load.
- **High:** No evidenced queue/idempotency/cancellation for expensive optimization can cause duplicate work or resource exhaustion. Use bounded jobs and deterministic caching.
- **High:** 404 endpoints plus fallback logic can conceal deployment drift. Add OpenAPI-generated clients and CI contract tests.
- **Medium:** Reported robots/sitemap/manifest SPA shells, HTTP-200 soft 404s, missing route metadata, and large assets (including a roughly 1.59MB logo) reduce discovery and performance.
- **Medium:** Add readiness/liveness, trace IDs, structured logs, error taxonomy, SLOs, alerts, backups, rollback, security headers, and performance budgets.

---

## 9. Evidence package QFlow should publish before judging

A compact public `/evidence` or `/methodology` page should include:

1. **Official SIH artifact:** official URL, archived detail capture/PDF, retrieval date, exact ID/title/organization/category/theme/deadline, and a note if inaccessible.
2. **Claim register:** every badge/headline metric mapped to source, owner, date, scope, evidence artifact, and limitation.
3. **Data manifest:** dataset IDs, licensed sources, coverage window, spatial/temporal resolution, row counts, join keys, hashes, missingness, synthetic/representative boundaries, and update cadence.
4. **Model card:** target, units, features, splits, leakage controls, baselines, metrics, uncertainty/calibration, regime slices, known failure modes, model commit/version.
5. **Optimizer card:** variables, equations, constraints, repair/penalty, budgets, stopping rule, seeds, normalization, HV reference point, complete fronts, baselines, and statistical tests.
6. **Lifecycle factor registry:** WtT/TtW/WtW definitions, gases/GWP, methane slip/N2O, electricity and pathway assumptions, geography/vintage, price date, sensitivity.
7. **Maritime assumptions:** route/port/bunker/OPS/weather/reserve/compatibility boundaries and a firm “not autonomous navigation” statement.
8. **Compliance boundary:** separate CII/EEXI explanation, formula/version, inputs, verification state, and “not statutory certification.”
9. **Run packet:** one seeded scenario with JSON/CSV outputs, selected Pareto point, provenance hash, screenshots, and expected values.
10. **Security and governance:** roles, data retention, access audit, license use, incident contact, human approval, and demo-versus-production separation.

---

## 10. Final decision

**Recommendation: proceed as a prototype demonstrator, but do not claim production, regulatory, or independently validated optimization readiness yet.**

QFlow should preserve its strongest story: a focused maritime decision-support workflow that brings fuel prediction, lifecycle accounting, multi-objective fleet planning, and alternative-fuel scenarios into one judgeable product. The current weakness is not lack of ideas; it is lack of **publicly verifiable evidence, reproducibility, operational constraint depth, secure access, and a deterministic demo path**.

If the team completes the 24-hour actions—especially the public read-only run, truth labels, state continuity, security boundary, and SIH evidence artifact—it can turn an inaccessible but promising prototype into a credible hackathon demonstration. The 7-day package should then substantiate the algorithmic claims. The 30-day plan is the minimum path toward a controlled maritime pilot with human review, not a guarantee of regulatory or navigational certification.

---

## Sources

### Official SIH

- [Smart India Hackathon official portal](https://sih.gov.in/)
- [Official SIH 2026 problem-statement listing](https://sih.gov.in/sih2026PS)

### QFlow public surface and reported API

- [QFlow landing page](https://q-flow-silk.vercel.app/)
- [QFlow login](https://q-flow-silk.vercel.app/login)
- [Scenario](https://q-flow-silk.vercel.app/scenario), [Prediction](https://q-flow-silk.vercel.app/prediction), [Optimization](https://q-flow-silk.vercel.app/optimization), [Emissions](https://q-flow-silk.vercel.app/emissions), [Benchmarking](https://q-flow-silk.vercel.app/benchmarking), [Provenance](https://q-flow-silk.vercel.app/provenance)
- [QFlow OpenAPI](https://q-flow-0p9o.onrender.com/openapi.json), [health](https://q-flow-0p9o.onrender.com/api/health), [vessels](https://q-flow-0p9o.onrender.com/api/vessels), [fuels](https://q-flow-0p9o.onrender.com/api/fuels), [provenance](https://q-flow-0p9o.onrender.com/api/provenance), [prediction benchmarks](https://q-flow-0p9o.onrender.com/api/benchmarks/prediction), [experiments](https://q-flow-0p9o.onrender.com/api/experiments)
- [QFlow client bundle cited in reviews](https://q-flow-silk.vercel.app/assets/index-BdvfOmhL.js) and [alternate deployed bundle cited in reviews](https://q-flow-silk.vercel.app/assets/index-Btj7OxqL.js)

### Non-official SIH corroboration

- [Zaid Sayyed SIH26138 mirror](https://zaidsayyed.in/tools/sih-problem-statements/sih26138)
- [SIH Buddy SIH26138 mirror](https://www.sihbuddy.in/ps/SIH26138)

### Maritime, lifecycle, and standards context

- [IMO EEXI/CII FAQ](https://www.imo.org/en/mediacentre/hottopics/pages/eexi-cii-faq.aspx)
- [IMO Lifecycle GHG / Carbon Intensity Guidelines](https://www.imo.org/en/ourwork/environment/pages/lifecycle-ghg---carbon-intensity-guidelines.aspx)
- [IMO AIS](https://www.imo.org/en/ourwork/safety/pages/ais.aspx)
- [IMO OPS feasibility context](https://www.imo.org/en/mediacentre/pages/WhatsNew-2021.aspx)
- [EMSA shore-side electricity guidance](https://www.emsa.europa.eu/we-do/digitalisation/maritime-monitoring/items.html?cid=2&id=4799)
- [Copernicus ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview)
- [ISO 19030-2](https://www.iso.org/standard/63775.html)
- [EU MRV official context](https://climate.ec.europa.eu/areas-action/transport-decarbonisation/reducing-emissions-shipping-sector/faq-monitoring-reporting-and-verification-maritime-transport-emissions_en)
