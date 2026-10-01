# SIH26138 — Q-GreenFleet Master Implementation Document

## Quantum-Inspired Fuel Prediction and Green Fleet Optimization

**Purpose:** This document converts the SIH26138 research dossier into an implementation blueprint that the team can directly use for architecture, coding, experiments, benchmarking, demonstration, and submission.

**Recommended product name:** Q-GreenFleet  
**Product type:** Software decision-support platform  
**Primary users:** Fleet planners, logistics managers, sustainability officers, port and operations planners  
**Core principle:** Build a scientifically credible optimization engine with a clear dashboard, not a dashboard with an unproven algorithm hidden behind it.

---

## 1. What the final system must do

A user enters a route, cargo demand, delivery deadline, available vessels, fuel options, fuel prices, weather scenario, and shore-power availability. The platform then:

1. validates and normalizes the inputs;
2. predicts fuel consumption for candidate vessel operating states;
3. calculates operating cost and lifecycle emissions;
4. searches for feasible vessel, speed, fuel, and shore-power combinations;
5. produces a Pareto set of trade-off solutions;
6. compares the proposed quantum-inspired optimizer with a conventional baseline;
7. explains the selected recommendation and verifies every constraint;
8. records the data sources, assumptions, model versions, seed, and experiment configuration.

The final demo should answer one practical question:

> **Given this cargo demand and deadline, which vessels should be deployed, at what speeds, using which fuel pathways and shore-power choices, to minimize fuel, cost, and lifecycle GHG while remaining feasible?**

---

## 2. Recommended scope: three specialized models, not one overloaded model

Do not build one large model that tries to predict fuel, select vessels, estimate emissions, and optimize the fleet simultaneously. That would be difficult to validate and difficult to explain.

Use three focused components:

### Model 1 — Fuel Consumption Prediction Model

**Recommended implementation:** XGBoost Regressor.

**Purpose:** Predict fuel consumption for a vessel and operating condition.

**Inputs:**

- vessel type;
- vessel capacity/deadweight;
- load factor or cargo mass;
- speed;
- draft or a draft proxy;
- engine power or design power;
- route distance;
- voyage duration;
- wind and wave features when available;
- operating mode;
- fuel pathway or fuel adjustment factor.

**Output:**

- predicted fuel mass for the voyage, or fuel rate multiplied by voyage duration;
- optional error interval;
- feature contribution explanation.

**Baselines:**

- physics baseline using a simplified speed-power relationship;
- linear regression;
- random forest;
- untuned XGBoost.

**Quantum-inspired role:** Use QPSO only for hyperparameter search or feature-selection support. Do not describe this as quantum machine learning.

Recommended statement:

> “XGBoost performs the fuel prediction, while a quantum-inspired search method tunes the model under a fixed validation protocol.”

### Model 2 — Lifecycle Emissions and Cost Engine

This should initially be a deterministic calculation engine, not a machine-learning model.

**Purpose:** Convert a candidate plan into:

- fuel quantity;
- energy consumed;
- fuel cost;
- shore-power cost;
- Well-to-Tank emissions;
- Tank-to-Wake emissions;
- Well-to-Wake emissions;
- optional carbon cost;
- compliance indicators.

This separation reduces model load and makes the system auditable. The emissions engine must not learn values that should come from documented factors.

### Model 3 — Quantum-Inspired Multi-Objective Fleet Optimizer

**Recommended implementation:** Multi-objective QPSO with a mixed-variable decoder, constraint repair, and external Pareto archive.

**Purpose:** Search over:

- vessel assignment;
- vessel activation;
- cargo allocation;
- cruising speed;
- fuel pathway;
- shore-power choice.

**Baseline:** NSGA-II under the same scenario and approximately the same number of objective evaluations.

**Outputs:**

- feasible Pareto solutions;
- best fuel solution;
- best cost solution;
- best lifecycle-GHG solution;
- balanced recommendation;
- convergence history;
- runtime and feasibility statistics.

This decomposition limits complexity:

```text
Prediction model       → estimates fuel
Emissions/cost engine  → evaluates consequences
Optimizer              → searches decisions
Dashboard              → explains results
```

---

## 3. High-level architecture pipeline

```text
┌──────────────────────────────────────────────────────────┐
│ 1. User Scenario Input                                   │
│ Route, demand, deadline, fleet, fuel, price, weather, OPS │
└──────────────────────────────┬───────────────────────────┘
                               │
                               v
┌──────────────────────────────────────────────────────────┐
│ 2. Input Validation and Scenario Builder                 │
│ Units, ranges, compatibility, availability, completeness │
└──────────────────────────────┬───────────────────────────┘
                               │
                               v
┌──────────────────────────────────────────────────────────┐
│ 3. Data and Feature Layer                                │
│ Vessel data, AIS, MRV, weather, fuel factors, scenarios   │
└──────────────────────────────┬───────────────────────────┘
                               │
                               v
┌──────────────────────────────────────────────────────────┐
│ 4. Fuel Prediction Engine                                │
│ Physics baseline | XGBoost | QPSO-tuned XGBoost          │
└──────────────────────────────┬───────────────────────────┘
                               │ predicted fuel
                               v
┌──────────────────────────────────────────────────────────┐
│ 5. Emissions and Cost Engine                             │
│ Fuel cost | energy | WtT | TtW | WtW | shore power       │
└──────────────────────────────┬───────────────────────────┘
                               │ objective values
                               v
┌──────────────────────────────────────────────────────────┐
│ 6. Constraint and Feasibility Engine                     │
│ Cargo | deadline | speed | availability | compatibility  │
│ bunkering | shore power | emissions/compliance           │
└──────────────────────────────┬───────────────────────────┘
                               │ feasible candidate score
                               v
┌──────────────────────────────────────────────────────────┐
│ 7. Optimization Engine                                   │
│ Proposed multi-objective QPSO                            │
│ Baseline NSGA-II                                         │
└──────────────────────────────┬───────────────────────────┘
                               │ Pareto solutions
                               v
┌──────────────────────────────────────────────────────────┐
│ 8. Results and Explainability Layer                      │
│ Pareto frontier | baseline comparison | SHAP | audit log │
└──────────────────────────────┬───────────────────────────┘
                               │
                               v
┌──────────────────────────────────────────────────────────┐
│ 9. Dashboard and Report                                  │
│ Recommendation, KPIs, constraints, provenance, export    │
└──────────────────────────────────────────────────────────┘
```

### Important architectural rule

The optimizer must call the predictor and the emissions engine for every candidate plan. It must not optimize against hard-coded fuel values unrelated to the prediction model.

---

## 4. End-to-end execution flow

### Step 1 — Scenario creation

The user supplies:

- origin and destination;
- route distance;
- cargo demand in tonnes;
- delivery deadline in hours;
- available vessel IDs or vessel types;
- available fuel pathways;
- fuel price assumptions;
- weather scenario;
- port and shore-power availability;
- optional emissions cap or CII threshold.

### Step 2 — Input validation

Validate:

- positive distance;
- non-negative cargo demand;
- valid deadline;
- vessel availability;
- valid speed bounds;
- compatible fuel options;
- available port infrastructure;
- complete factor values;
- consistent units.

If no feasible fleet can satisfy demand, return a clear infeasibility message instead of producing a fake recommendation.

### Step 3 — Candidate generation

The optimizer creates a candidate decision vector. For example:

```text
[vessel_1_active,
 vessel_2_active,
 vessel_3_active,
 cargo_share_1,
 cargo_share_2,
 cargo_share_3,
 speed_1,
 speed_2,
 speed_3,
 fuel_choice_1,
 fuel_choice_2,
 fuel_choice_3,
 shore_power_origin,
 shore_power_destination]
```

### Step 4 — Candidate decoding

Convert the latent vector into valid business decisions:

- activation values → Boolean vessel selection;
- continuous cargo shares → normalized allocation;
- continuous speeds → vessel-specific speed ranges;
- fuel values → valid categorical fuel pathway;
- shore-power values → Boolean decision.

### Step 5 — Candidate repair

Repair in this order:

1. remove unavailable vessels;
2. clamp speed to vessel bounds;
3. replace incompatible fuel;
4. normalize cargo allocation;
5. add or replace vessels until cargo demand is met;
6. adjust speed until the deadline is met;
7. remove unavailable shore-power choices;
8. verify fuel availability and reserve;
9. apply a penalty or reject the candidate if it remains infeasible.

### Step 6 — Fuel prediction

For every active vessel and route leg, call the prediction model with the decoded operating state.

### Step 7 — Cost and emissions evaluation

Calculate fuel cost, energy consumption, lifecycle GHG, shore-power emissions, and compliance metrics.

### Step 8 — Constraint evaluation

Return a constraint vector such as:

```json
{
  "cargo_satisfied": true,
  "deadline_satisfied": true,
  "vessel_available": true,
  "speed_valid": true,
  "fuel_compatible": true,
  "fuel_available": true,
  "shore_power_valid": true,
  "emissions_cap_satisfied": true,
  "total_violation": 0.0
}
```

### Step 9 — Objective evaluation

Return normalized or raw objective values:

```json
{
  "fuel_tonnes": 42.7,
  "operating_cost": 183400.0,
  "wtw_ghg_tonnes_co2e": 119.3,
  "schedule_hours": 49.8,
  "cargo_delivered_tonnes": 45000.0
}
```

### Step 10 — Pareto selection

Maintain the non-dominated solution archive. Present:

- minimum-fuel plan;
- minimum-cost plan;
- minimum-GHG plan;
- balanced plan selected using normalized distance to the ideal point or user preferences.

---

## 5. Model 1 — Fuel-consumption prediction engine

### 5.1 Target definition

Choose one target for the first release.

**Recommended target:** voyage fuel consumption in tonnes.

If the available data is hourly or high-frequency, calculate:

\[
Fuel_{voyage} = \sum_{t=1}^{T} FuelRate_t \times \Delta t
\]

If the dataset already contains voyage fuel, use the reported voyage total directly.

Do not mix hourly fuel rate and voyage fuel mass in one target column.

### 5.2 Feature groups

#### Vessel features

- vessel type;
- gross tonnage or deadweight;
- capacity;
- design speed;
- engine power;
- length, beam, or draft if available;
- age or hull condition if available.

#### Operating features

- speed over ground or speed through water;
- load factor;
- cargo mass;
- draft;
- trim;
- engine load;
- operating mode;
- port or sailing status.

#### Route features

- route distance;
- voyage duration;
- route category;
- latitude and longitude summary;
- distance remaining;
- current direction if available.

#### Weather and ocean features

- wind speed;
- wind direction relative to vessel;
- wave height;
- wave period;
- wave direction relative to vessel;
- current speed and direction;
- sea state.

#### Fuel features

- fuel type;
- fuel pathway;
- lower heating value;
- engine technology;
- fuel-specific efficiency adjustment.

### 5.3 Prediction models

#### Baseline 1 — Physics sanity model

Use a simplified relationship such as:

\[
P = k v^3
\]

and:

\[
Fuel = \frac{P \times T}{\eta \times LHV}
\]

This is not the final predictor. It is used to detect impossible ML behavior and generate transparent synthetic data when measured labels are unavailable.

#### Baseline 2 — Linear regression

Use as an interpretable lower-complexity baseline.

#### Baseline 3 — Random forest

Use as a nonlinear ensemble baseline.

#### Final model — XGBoost

Use for the primary tabular prediction model because it is fast, strong on mixed nonlinear features, and easy to integrate.

#### Quantum-inspired tuner — QPSO

Use QPSO to search a bounded hyperparameter space:

```text
max_depth
learning_rate
n_estimators
min_child_weight
subsample
colsample_bytree
reg_alpha
reg_lambda
```

Use the validation RMSE or MAE as the fitness function. Keep the evaluation budget fixed for fair comparison.

### 5.4 Data split

Never rely only on a random row-wise split.

Use the strongest split available:

1. chronological split for future-like prediction;
2. voyage-group split to avoid adjacent rows leaking;
3. vessel-group holdout to test unseen-vessel generalization.

Report the split in the dashboard and README.

### 5.5 Prediction metrics

Report:

- MAE in tonnes or tonnes/hour;
- RMSE in tonnes or tonnes/hour;
- R²;
- optional sMAPE;
- training time;
- inference time;
- number of training samples;
- number of vessels and voyages;
- validation protocol.

Do not report a percentage accuracy without explaining how it was calculated.

### 5.6 Prediction guardrails

The predictor must:

- reject missing required features;
- avoid negative fuel output;
- flag out-of-range speed, load, or weather;
- return an uncertainty interval or residual-based error band;
- expose the training data range;
- warn when the optimizer queries an out-of-domain state.

A candidate with high prediction uncertainty should receive a risk penalty.

---

## 6. Model 2 — Lifecycle emissions and cost engine

This engine should be deterministic, versioned, and independently unit-tested.

### 6.1 Fuel energy

For each fuel:

\[
Energy_{MJ} = FuelMass_{kg} \times LHV_{MJ/kg}
\]

If fuel is predicted in tonnes:

\[
Energy_{MJ} = FuelTonnes \times 1000 \times LHV_{MJ/kg}
\]

### 6.2 Fuel cost

\[
Cost_{fuel} = FuelQuantity \times Price_{fuel}
\]

Ensure the price unit matches the quantity unit.

### 6.3 Lifecycle emissions

Use a pathway-specific factor convention:

\[
GHG_{WtW} = EnergyConsumed \times EF_{WtW}
\]

where:

\[
EF_{WtW} = EF_{WtT} + EF_{TtW}
\]

Track CO2, CH4, and N2O where the selected factor source provides them.

The UI must show whether each factor is:

- official default;
- verified actual factor;
- literature-derived assumption;
- synthetic scenario factor.

### 6.4 Shore power

For port stay:

\[
GHG_{shore} = ElectricityConsumed_{kWh} \times GridEF_{kgCO2e/kWh}
\]

\[
Cost_{shore} = ElectricityConsumed_{kWh} \times GridPrice
\]

Shore power is not automatically zero-emission. Its result depends on grid intensity.

### 6.5 Cost objective

A practical initial cost formulation is:

\[
Cost_{total} = Cost_{fuel} + Cost_{shore} + Cost_{vessel} + Cost_{time} + Cost_{carbon}
\]

Use scenario inputs for carbon price and time penalty rather than hiding them as constants.

### 6.6 Compliance metrics

Add at least one explicit cap:

\[
GHG_{WtW} \leq GHG_{cap}
\]

or an operational carbon-intensity constraint:

\[
CII_{route} \leq CII_{limit}
\]

Keep operational CII and lifecycle GHG separate in the UI.

---

## 7. Model 3 — Quantum-inspired multi-objective optimizer

### 7.1 Decision variables

For a simple one-route prototype:

\[
x_v \in \{0,1\}
\]

Vessel activation.

\[
s_v \in [s_v^{min},s_v^{max}]
\]

Vessel speed.

\[
f_v \in \{reference,LNG,methanol,hydrogen,ammonia\}
\]

Fuel pathway.

\[
z_v \in \{0,1\}
\]

Shore-power choice.

\[
a_v \in [0,1]
\]

Cargo allocation share.

### 7.2 Recommended QPSO representation

Use a continuous latent vector. Decode each segment differently:

```text
activation segment → threshold at 0.5
speed segment      → scale to vessel min/max speed
fuel segment       → map to valid categorical index
shore segment      → threshold at 0.5
cargo segment      → non-negative normalization
```

### 7.3 Candidate evaluation

For each candidate:

1. decode;
2. repair;
3. call the fuel predictor;
4. call the cost/emissions engine;
5. calculate constraint violations;
6. return objectives and feasibility status;
7. update the Pareto archive.

### 7.4 Multi-objective handling

Maintain an external archive of non-dominated feasible candidates.

The primary result should be a Pareto front, not only a weighted sum.

For visual selection, use:

- minimum-fuel point;
- minimum-cost point;
- minimum-GHG point;
- knee point;
- balanced point based on normalized distance to the ideal.

### 7.5 Constraint handling

Use hard repair where possible. Use penalties only for residual infeasibility.

A penalty function can be:

\[
J_i^{penalized} = J_i + \lambda \times Violation
\]

where `Violation` is normalized across constraints.

Always preserve a separate feasibility flag. Do not hide infeasible solutions in a chart without labeling them.

### 7.6 Quantum-inspired specificity

The final technical document must show:

- particle representation;
- quantum-inspired update rule;
- mean-best or attractor calculation;
- contraction-expansion coefficient schedule;
- random sampling rule;
- archive update rule;
- categorical decoder;
- repair procedure;
- termination condition.

The team should be able to explain exactly where the proposed algorithm differs from ordinary PSO, random search, or NSGA-II.

### 7.7 Fair benchmark design

Compare:

- NSGA-II;
- classical PSO or a simple evolutionary baseline;
- proposed QPSO.

Keep consistent:

- same scenario;
- same decision variables;
- same objective functions;
- same constraints;
- same evaluation budget;
- same stopping condition;
- multiple random seeds.

Report:

- hypervolume;
- feasible-solution rate;
- best balanced score;
- runtime;
- iterations to convergence threshold;
- objective values;
- standard deviation across seeds.

Do not claim superiority from one lucky run.

---

## 8. Dataset strategy

No single open dataset will contain vessel telemetry, fuel consumption, weather, alternative-fuel pathways, prices, and fleet-assignment decisions. Use a layered strategy.

### 8.1 Dataset layer A — Real public data

#### EMSA THETIS-MRV

Use for:

- reported fuel consumption;
- CO2 emissions;
- distance and time at sea;
- vessel-level or annual validation context;
- realistic fleet comparisons.

Limitation: it is not a high-frequency sensor dataset.

#### NOAA Marine Cadastre AIS

Use for:

- vessel movement;
- timestamps;
- speed profiles;
- route and voyage examples;
- vessel traffic patterns.

Limitation: AIS does not directly provide ground-truth fuel consumption.

#### Copernicus ERA5

Use for:

- wind;
- wave height;
- wave period;
- atmospheric pressure;
- environmental features joined to vessel tracks.

Limit the geographic and time range so the data pipeline remains manageable.

#### IMO sources

Use for:

- lifecycle definitions;
- official factor conventions;
- DCS and CII context;
- regulatory terminology.

Do not assume confidential ship-level IMO DCS data is available for training.

### 8.2 Dataset layer B — Derived data

Create transparent derived features:

- distance traveled;
- voyage duration;
- average and maximum speed;
- speed bins;
- load factor;
- weather exposure;
- route category;
- fuel intensity;
- estimated energy consumption;
- operational carbon intensity.

Every derived field must document its formula.

### 8.3 Dataset layer C — Physics-informed synthetic scenarios

Use synthetic data only where real labels are unavailable.

Synthetic fields can include:

- vessel capacity;
- speed bounds;
- fuel price;
- fuel availability;
- fuel compatibility;
- cargo demand;
- route deadline;
- alternative-fuel lifecycle factors;
- shore-power grid factor;
- weather scenarios.

Every synthetic field must be labeled `synthetic` and must include its generation rule.

Do not present synthetic fuel consumption as measured operational data.

### 8.4 Recommended MVP dataset

For the first working demo, use:

- one curated prediction dataset or one transparent physics-informed dataset;
- 5–20 vessel profiles;
- one or two routes;
- three weather scenarios;
- five fuel pathways including a reference fuel;
- one shore-power configuration;
- three cargo-demand scenarios.

A small, traceable dataset is better than a large unverified dataset.

### 8.5 Data provenance schema

```text
field_name
value
unit
source_name
source_url
source_date
source_version
measured / derived / synthetic
transformation_formula
quality_flag
```

---

## 9. Core data entities

### Vessel

```json
{
  "vessel_id": "V001",
  "vessel_type": "container",
  "capacity_tonnes": 18000,
  "deadweight_tonnes": 22000,
  "design_speed_knots": 18.0,
  "min_speed_knots": 8.0,
  "max_speed_knots": 19.0,
  "engine_power_kw": 12000,
  "fuel_compatibility": ["reference", "lng", "methanol"],
  "shore_power_compatible": true,
  "available": true,
  "source_type": "synthetic_scenario"
}
```

### Route

```json
{
  "route_id": "R001",
  "origin": "Port A",
  "destination": "Port B",
  "distance_nm": 600,
  "port_time_hours": 4,
  "deadline_hours": 52,
  "weather_scenario": "normal",
  "shore_power_origin": true,
  "shore_power_destination": false
}
```

### Fuel pathway

```json
{
  "fuel_id": "green_methanol",
  "name": "Methanol",
  "pathway": "renewable_e_methanol",
  "lhv_mj_per_kg": 20.0,
  "price_per_tonne": 850.0,
  "wtt_kgco2e_per_mj": 0.0,
  "ttw_kgco2e_per_mj": 0.0,
  "ch4_factor": 0.0,
  "n2o_factor": 0.0,
  "factor_source": "scenario_assumption",
  "factor_version": "v1",
  "available_ports": ["Port A", "Port B"]
}
```

### Scenario

```json
{
  "scenario_id": "SCN001",
  "route_id": "R001",
  "cargo_demand_tonnes": 45000,
  "deadline_hours": 52,
  "available_vessels": ["V001", "V002", "V003"],
  "allowed_fuels": ["reference", "lng", "methanol"],
  "shore_power_enabled": true,
  "ghg_cap_tonnes_co2e": null,
  "carbon_price": 0,
  "weather_scenario": "normal"
}
```

### Optimization run

```json
{
  "run_id": "OPT-QPSO-001",
  "algorithm": "MO-QPSO",
  "seed": 42,
  "population_size": 60,
  "iterations": 150,
  "objective_set": ["fuel", "cost", "wtw_ghg"],
  "dataset_version": "fleet_scenario_v1",
  "model_version": "fuel_xgb_v3",
  "runtime_seconds": 0,
  "result_count": 0
}
```

---

## 10. Recommended API structure

### Prediction API

```text
POST /api/predict/fuel
```

Request:

```json
{
  "vessel_id": "V001",
  "speed_knots": 14.5,
  "cargo_tonnes": 12000,
  "distance_nm": 600,
  "weather_scenario": "normal",
  "fuel_id": "reference"
}
```

Response:

```json
{
  "predicted_fuel_tonnes": 42.7,
  "lower_bound_tonnes": 40.8,
  "upper_bound_tonnes": 45.1,
  "model_version": "fuel_xgb_v3",
  "out_of_domain": false,
  "feature_contributions": {
    "speed_knots": 8.2,
    "cargo_tonnes": 3.4,
    "weather_scenario": 1.7
  }
}
```

### Optimization API

```text
POST /api/optimize/fleet
```

Request:

```json
{
  "route_distance_nm": 600,
  "cargo_demand_tonnes": 45000,
  "deadline_hours": 52,
  "vessel_ids": ["V001", "V002", "V003"],
  "allowed_fuels": ["reference", "lng", "methanol"],
  "shore_power": true,
  "objectives": ["fuel", "cost", "wtw_ghg"],
  "algorithm": "MO-QPSO",
  "seed": 42,
  "iterations": 150
}
```

Response:

```json
{
  "run_id": "OPT-QPSO-001",
  "status": "completed",
  "pareto_solutions": [],
  "balanced_solution": {},
  "benchmark_reference": "NSGA-II-001",
  "runtime_seconds": 18.4,
  "feasibility_rate": 0.91
}
```

### Benchmark API

```text
GET /api/benchmarks/{run_id}
```

Return:

- prediction comparison;
- optimization comparison;
- convergence history;
- hypervolume;
- runtime;
- feasibility rate;
- seed statistics;
- dataset and model versions.

### Scenario API

```text
POST /api/scenarios
GET  /api/scenarios/{scenario_id}
```

### Metadata APIs

```text
GET /api/vessels
GET /api/fuels
GET /api/routes
GET /api/provenance
```

---

## 11. Backend module structure

```text
backend/
├── app.py
├── config.py
├── api/
│   ├── prediction_routes.py
│   ├── optimization_routes.py
│   ├── scenario_routes.py
│   └── benchmark_routes.py
├── schemas/
│   ├── vessel.py
│   ├── route.py
│   ├── fuel.py
│   ├── scenario.py
│   └── optimization.py
├── data/
│   ├── loaders.py
│   ├── validation.py
│   ├── provenance.py
│   └── feature_engineering.py
├── prediction/
│   ├── physics_baseline.py
│   ├── train_xgb.py
│   ├── predict.py
│   ├── tune_qpso.py
│   ├── validation.py
│   └── explainability.py
├── emissions/
│   ├── energy.py
│   ├── lifecycle.py
│   ├── shore_power.py
│   ├── cost.py
│   └── compliance.py
├── optimization/
│   ├── decoder.py
│   ├── repair.py
│   ├── objectives.py
│   ├── constraints.py
│   ├── mo_qpso.py
│   ├── nsga2_baseline.py
│   ├── archive.py
│   └── selection.py
├── experiments/
│   ├── run_prediction_benchmark.py
│   ├── run_optimizer_benchmark.py
│   ├── metrics.py
│   └── results_store.py
└── tests/
    ├── test_energy.py
    ├── test_lifecycle.py
    ├── test_constraints.py
    ├── test_decoder.py
    ├── test_repair.py
    ├── test_prediction.py
    └── test_optimizer.py
```

### Frontend structure

```text
frontend/
├── pages/
│   ├── ScenarioBuilder
│   ├── PredictionAnalysis
│   ├── OptimizationResults
│   ├── BenchmarkLab
│   └── Provenance
├── components/
│   ├── KPI cards
│   ├── ParetoChart
│   ├── ConvergenceChart
│   ├── BenchmarkTable
│   ├── FleetPlanTable
│   ├── ConstraintStatus
│   └── ProvenancePanel
└── services/
    ├── predictionApi.ts
    ├── optimizationApi.ts
    └── benchmarkApi.ts
```

---

## 12. Mathematical formulation

Let:

- \(v\) denote a vessel;
- \(r\) denote a route or service;
- \(f\) denote a fuel pathway.

### Decision variables

\[
x_{v,r} \in \{0,1\}
\]

Vessel assignment.

\[
s_{v,r} \in [s_v^{min},s_v^{max}]
\]

Cruising speed.

\[
y_{v,r,f} \in \{0,1\}
\]

Fuel pathway assignment.

\[
z_{v,r} \in \{0,1\}
\]

Shore-power selection.

\[
a_{v,r} \geq 0
\]

Cargo allocation.

### Fuel objective

\[
F_{total} = \sum_{v,r} \hat{F}_{v,r}(s,load,weather,fuel)
\]

where \(\hat{F}\) is produced by the prediction engine.

### Cost objective

\[
C_{total} = C_{fuel} + C_{vessel} + C_{time} + C_{shore} + C_{carbon}
\]

### Lifecycle GHG objective

\[
G_{WtW} = \sum_{v,r,f} Energy_{v,r,f} \times EF^{WtW}_f
\]

### Cargo constraint

\[
\sum_v a_{v,r} \geq Demand_r
\]

and:

\[
a_{v,r} \leq Capacity_v \times x_{v,r}
\]

### Schedule constraint

\[
\frac{Distance_r}{Speed_{v,r}} + PortTime_r + Buffer_r \leq Deadline_r
\]

### Availability constraint

\[
x_{v,r} \leq Availability_v
\]

### Fuel compatibility constraint

\[
y_{v,r,f} \leq Compatible_{v,f}
\]

### Bunkering constraint

\[
FuelRequired_{r,f} \leq FuelAvailable_{r,f}
\]

### Shore-power constraint

\[
z_{v,r} \leq ShipOPSCompatible_v
\]

\[
z_{v,r} \leq PortOPSAvailable_r
\]

### Compliance constraint

\[
G_{WtW} \leq GHGCap
\]

or an operational CII-style threshold where the scenario defines one.

---

## 13. Dashboard design

The dashboard should have five primary screens.

### Screen 1 — Scenario Builder

Display:

- route;
- distance;
- demand;
- deadline;
- available vessels;
- fuel options;
- fuel prices;
- weather scenario;
- shore power;
- emissions cap.

### Screen 2 — Fuel Prediction

Display:

- predicted fuel;
- model version;
- uncertainty interval;
- feature contributions;
- physics sanity comparison;
- out-of-domain warning.

### Screen 3 — Optimization Results

Display:

- Pareto frontier;
- fuel/cost/GHG trade-offs;
- selected balanced solution;
- selected vessels;
- speeds;
- cargo allocation;
- fuel pathways;
- shore-power choices.

### Screen 4 — Feasibility and Audit

Display:

- cargo satisfied;
- schedule satisfied;
- vessel availability;
- fuel compatibility;
- bunkering;
- shore power;
- emissions cap;
- total constraint violation;
- data and factor provenance.

### Screen 5 — Benchmark Lab

Display:

- XGBoost versus baselines;
- QPSO-tuned versus untuned prediction;
- QPSO versus NSGA-II;
- runtime;
- hypervolume;
- convergence;
- multiple-seed statistics;
- scalability.

The dashboard should explain the selected point. It should not only display a green number.

---

## 14. Required experiment plan

### Experiment A — Prediction benchmark

Compare:

- physics baseline;
- linear regression;
- random forest;
- XGBoost;
- QPSO-tuned XGBoost.

Record:

- MAE;
- RMSE;
- R²;
- training time;
- inference time;
- split method;
- sample count;
- vessel and voyage count.

### Experiment B — Generalization

Train on earlier voyages and test later voyages. If possible, train on some vessels and test on held-out vessels.

### Experiment C — Optimization benchmark

Compare:

- NSGA-II;
- classical PSO or genetic baseline;
- proposed MO-QPSO.

Record over at least 10 seeds where computationally practical:

- hypervolume;
- feasible rate;
- runtime;
- best balanced score;
- convergence iteration;
- objective values;
- mean and standard deviation.

### Experiment D — Scenario analysis

Use three primary scenarios:

1. reference fuel and normal conditions;
2. speed optimization with cost and deadline trade-off;
3. alternative fuel and shore power with lifecycle accounting.

Optional:

4. adverse weather;
5. fuel price shock;
6. emissions-cap scenario.

### Experiment E — Scalability

Start with:

- 5 vessels;
- 10 vessels;
- 25 vessels;
- 50 vessels.

Measure runtime and solution quality. Do not promise 100-vessel scalability if the software cannot complete it reliably.

---

## 15. Testing plan

### Unit tests

- fuel mass-to-energy conversion;
- lifecycle emissions calculation;
- shore-power emissions;
- cost calculation;
- speed bounds;
- cargo constraint;
- deadline constraint;
- vessel availability;
- fuel compatibility;
- bunkering availability;
- compliance cap;
- categorical decoder;
- cargo normalization;
- repair function.

### Model tests

- no NaN predictions;
- no negative fuel predictions;
- required features enforced;
- unseen category handling;
- out-of-domain detection;
- model version returned;
- uncertainty interval returned.

### Optimizer tests

- fixed seed produces reproducible output;
- all returned solutions are decoded correctly;
- all displayed solutions are checked for dominance;
- all selected solutions pass constraints;
- infeasible input produces a useful error;
- runtime stays below demo limit;
- Pareto archive does not contain duplicate or invalid solutions.

### Frontend tests

- empty state;
- invalid scenario;
- API failure;
- optimization loading state;
- chart rendering;
- constraint failure display;
- provenance display;
- report export.

---

## 16. Reproducibility requirements

Every prediction or optimization run must store:

```text
run_id
git_commit
dataset_version
dataset_hash
model_version
optimizer_version
seed
population_size
iterations
evaluation_budget
objective_set
constraint_set
fuel_factor_version
runtime
metrics
```

Example:

```text
run_id: OPT-QPSO-017
seed: 42
population_size: 60
iterations: 150
evaluation_budget: 9000
dataset: fleet_scenario_v1
model: fuel_xgb_v3
objective_set: fuel-cost-wtw
factor_version: IMO-LCA-v1
runtime_s: 18.4
hypervolume: 0.81
feasible_rate: 0.91
```

No chart in the final presentation should be generated from an unrecorded experiment.

---

## 17. Recommended technology stack

### Backend

- Python;
- FastAPI;
- NumPy;
- Pandas or Polars;
- scikit-learn;
- XGBoost;
- SHAP;
- pymoo for NSGA-II and Pareto utilities;
- custom QPSO implementation.

### Data

- CSV or Parquet for the hackathon dataset;
- JSON for scenario configuration;
- SQLite if persistence is needed;
- PostgreSQL only if the team already has it working.

### Frontend

- React;
- TypeScript;
- Recharts, Plotly, or ECharts;
- Leaflet or MapLibre only if a map is genuinely useful.

### Deployment

For the hackathon, use one reproducible start command:

```bash
make install
make train
make benchmark
make run
```

The demo should work from a clean checkout with a preloaded scenario.

---

## 18. Team decomposition

### Member 1 — Data and prediction

- acquire and clean dataset;
- engineer features;
- train baselines and XGBoost;
- run validation;
- generate SHAP results.

### Member 2 — Quantum-inspired algorithm

- implement MO-QPSO;
- implement decoder;
- implement archive;
- implement repair;
- record convergence;
- write algorithm explanation.

### Member 3 — Classical optimization and formulation

- formulate objectives and constraints;
- implement NSGA-II baseline;
- verify Pareto logic;
- run fair comparisons.

### Member 4 — Emissions, cost, and domain validation

- maintain fuel-factor table;
- implement energy and lifecycle calculations;
- implement shore-power calculations;
- implement compliance checks;
- verify units and assumptions.

### Member 5 — Backend and integration

- create APIs;
- connect prediction, emissions, and optimization;
- store runs;
- implement error handling.

### Member 6 — Frontend, QA, and submission

- build dashboard;
- create benchmark views;
- test end-to-end flow;
- capture screenshots;
- prepare video and presentation.

Every member should understand the one-sentence system pitch and the basic algorithm flow.

---

## 19. Execution plan

### Phase 1 — Freeze scope and data

Deliver:

- final target definition;
- dataset version;
- vessel schema;
- fuel-factor schema;
- route scenario;
- mathematical notation;
- algorithm choice;
- acceptance criteria.

### Phase 2 — Build the deterministic foundation

Deliver:

- input validation;
- fuel and energy calculations;
- emissions engine;
- cost engine;
- constraints;
- physics baseline;
- synthetic scenario generator.

### Phase 3 — Build the prediction engine

Deliver:

- data cleaning;
- baseline models;
- XGBoost;
- validation split;
- metrics;
- model serialization;
- prediction API;
- prediction benchmark chart.

### Phase 4 — Build optimization baselines first

Deliver:

- candidate decoder;
- repair function;
- NSGA-II baseline;
- feasibility validator;
- Pareto archive;
- one working scenario.

### Phase 5 — Build the quantum-inspired optimizer

Deliver:

- exact QPSO update;
- mixed-variable decoder;
- external archive;
- convergence log;
- repeatable seeds;
- comparison against NSGA-II.

### Phase 6 — Integrate the platform

Deliver:

- prediction called inside candidate evaluation;
- lifecycle engine connected;
- results API;
- Pareto dashboard;
- constraint audit;
- provenance panel.

### Phase 7 — Benchmark and freeze

Deliver:

- final metrics;
- repeated seeds;
- case studies;
- scalability results;
- screenshots;
- limitations;
- README;
- clean-start demo.

Do not add new algorithms after benchmark freeze.

---

## 20. Definition of done

The project is complete only when all of the following are true:

- the prediction API works;
- the prediction dataset and split are documented;
- baseline metrics exist;
- QPSO-tuned prediction results exist;
- the emissions engine is unit-tested;
- the NSGA-II baseline works;
- the proposed QPSO optimizer works;
- constraints are validated independently;
- at least one alternative-fuel scenario works;
- shore power is calculated rather than assumed zero;
- a lifecycle GHG result is shown;
- a compliance constraint is shown;
- a Pareto front renders;
- a balanced recommendation is explainable;
- benchmark results use real experiment outputs;
- multiple seeds are recorded;
- the demo works from a clean start;
- synthetic data is labeled;
- every percentage is traceable;
- limitations are visible;
- no quantum-speedup claim is made.

---

## 21. Demo script

### 0:00–0:30 — Problem

Show cargo demand, deadline, fuel cost, and lifecycle-emissions trade-off.

### 0:30–1:00 — Scenario

Enter route, demand, available vessels, fuels, and shore-power availability.

### 1:00–1:30 — Prediction

Show predicted fuel and explain the contribution of speed, cargo, and weather.

### 1:30–2:15 — Optimization

Run QPSO and show the Pareto frontier.

### 2:15–2:45 — Recommendation

Select the balanced plan and show:

- vessels;
- cargo allocation;
- speeds;
- fuel pathways;
- shore power;
- fuel consumption;
- cost;
- lifecycle GHG;
- schedule;
- constraint status.

### 2:45–3:30 — Benchmark

Show QPSO versus NSGA-II:

- hypervolume;
- runtime;
- convergence;
- feasible rate.

### 3:30–4:00 — Provenance and limitations

Show data sources, synthetic labels, factor versions, and model limitations.

The demo should not spend most of its time on login screens, maps, or generic UI animation.

---

## 22. Common failure modes and fixes

### Failure: “Quantum” is only a label

**Fix:** show the update equation, encoding, pseudocode, and benchmark.

### Failure: prediction is not used by optimization

**Fix:** candidate evaluation must call the predictor.

### Failure: optimizer violates cargo demand

**Fix:** independent constraint validator plus repair and tests.

### Failure: fuel factors are arbitrary

**Fix:** source and version every factor, and label assumptions.

### Failure: synthetic data is presented as measured data

**Fix:** provenance labels on every field and a dedicated synthetic-data note.

### Failure: model has impossible accuracy

**Fix:** time/voyage/vessel-aware holdouts and leakage audit.

### Failure: optimizer exploits model error

**Fix:** out-of-domain guard, uncertainty penalty, and physics sanity checks.

### Failure: too many features, no working core

**Fix:** remove live feeds, maps, extra fuel pathways, and advanced extensions until the core benchmark works.

### Failure: only one optimizer run is shown

**Fix:** use multiple seeds and show variability.

### Failure: low-GHG solution violates schedule or capacity

**Fix:** display all constraints beside every selected result.

---

## 23. Final recommended implementation package

The final submission should contain:

1. working web dashboard;
2. prediction service;
3. lifecycle emissions and cost engine;
4. quantum-inspired multi-objective optimizer;
5. NSGA-II baseline;
6. scenario configuration;
7. benchmark module;
8. provenance file;
9. mathematical formulation document;
10. algorithm pseudocode;
11. reproducibility README;
12. case-study results;
13. screenshots and demo video;
14. concise presentation of no more than 12 slides in the current submission environment.

### Suggested repository

```text
q-greenfleet/
├── README.md
├── requirements.txt
├── Makefile
├── configs/
│   ├── fuels.json
│   ├── vessels.json
│   ├── routes.json
│   └── scenarios.json
├── data/
│   ├── raw/
│   ├── processed/
│   ├── synthetic/
│   └── provenance.csv
├── models/
│   ├── fuel_xgb_v3.json
│   └── metadata.json
├── backend/
├── frontend/
├── experiments/
│   ├── prediction/
│   └── optimization/
├── results/
│   ├── metrics/
│   ├── plots/
│   └── runs/
├── docs/
│   ├── architecture.md
│   ├── mathematical-model.md
│   ├── algorithm.md
│   ├── data-provenance.md
│   └── benchmark-protocol.md
└── tests/
```

---

## 24. The most practical way to pull this out

Build in this exact order:

```text
1. Create one scenario JSON
2. Implement deterministic energy, cost, emissions, and constraints
3. Create a physics-informed prediction baseline
4. Train XGBoost and save the model
5. Implement candidate decoding and repair
6. Implement NSGA-II baseline
7. Implement MO-QPSO
8. Run both optimizers on the same scenario
9. Record Pareto and benchmark results
10. Connect the APIs
11. Build only the dashboard views needed to explain those results
12. Freeze the evidence and prepare the presentation
```

The project is pulled out successfully when the following loop works end-to-end:

```text
scenario input
   ↓
validated candidate
   ↓
fuel prediction
   ↓
cost and lifecycle emissions
   ↓
constraint check
   ↓
QPSO / NSGA-II search
   ↓
Pareto solutions
   ↓
explainable recommendation
   ↓
benchmark and provenance report
```

Do not begin with the dashboard. Begin with the deterministic evaluator and the benchmarkable optimizer. Once those work, the user interface becomes a presentation layer over a credible engineering system.

---

## 25. Final system pitch

> **Q-GreenFleet is an auditable decision-support platform that predicts vessel fuel consumption, evaluates fuel-pathway lifecycle emissions and operating cost, and uses a quantum-inspired multi-objective optimizer to select feasible vessel, speed, fuel, and shore-power decisions. Its recommendations are returned as a Pareto frontier and benchmarked against NSGA-II under reproducible scenarios.**

## References

[1]: https://drive.google.com/file/d/1h0pt48eJAq-wAHUf5-gFA9PIibOxVyk0/view?usp=drive_link "SIH26138 public supporting problem-statement PDF"

[2]: https://www.imo.org/en/ourwork/environment/pages/lifecycle-ghg---carbon-intensity-guidelines.aspx "IMO framework on life cycle GHG intensity of marine fuels"

[3]: https://www.imo.org/en/ourwork/environment/pages/2023-imo-strategy-on-reduction-of-ghg-emissions-from-ships.aspx "2023 IMO Strategy on Reduction of GHG Emissions from Ships"

[4]: https://www.imo.org/en/ourwork/environment/pages/data-collection-system.aspx "IMO Data Collection System"

[5]: https://link.springer.com/article/10.1007/s10732-010-9136-0 "Quantum-inspired evolutionary algorithms: a survey and empirical study"

[6]: https://sih.decodex.live/sih2026/SIH26138 "SIH26138 problem statement portal page"
