
import { createRng, gaussian, randRange, randInt, pick } from "@/lib/prng";

// Mock by default; set VITE_USE_MOCK=false to call the live FastAPI backend.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

export const VESSELS = [
    {
        id: "V001",
        name: "EcoMax Panamax",
        type: "Panamax",
        capacity: 75000,
        minSpeed: 10,
        maxSpeed: 22,
        allowedFuels: ["HFO", "VLSFO", "LNG", "METHANOL"],
        shorePower: true,
        available: true,
    },
    {
        id: "V002",
        name: "Poseidon Aframax",
        type: "Aframax",
        capacity: 110000,
        minSpeed: 9,
        maxSpeed: 20,
        allowedFuels: ["HFO", "VLSFO", "LNG"],
        shorePower: false,
        available: true,
    },
    {
        id: "V003",
        name: "Alpha Capesize",
        type: "Capesize",
        capacity: 180000,
        minSpeed: 8,
        maxSpeed: 18,
        allowedFuels: ["HFO", "VLSFO", "AMMONIA"],
        shorePower: false,
        available: true,
    },
];

// Fuel pathways. WtW = WtT + TtW. No fuel is labelled "green" / "zero emission".
export const FUELS = [
    { id: "HFO", name: "Conventional marine fuel", pathway: "Reference (HFO)", price: 43160, lhv: 40.5, wtt: 13.5, ttw: 77.3, wtw: 90.8, source: "IMO MEPC.391(81)", version: "2024" },
    { id: "VLSFO", name: "VLSFO", pathway: "Fossil (VLSFO)", price: 50630, lhv: 42.0, wtt: 14.1, ttw: 73.0, wtw: 87.1, source: "IMO MEPC.391(81)", version: "2024" },
    { id: "LNG", name: "LNG", pathway: "Fossil (methane slip)", price: 56440, lhv: 50.0, wtt: 24.5, ttw: 56.0, wtw: 80.5, source: "Sphera / ICCT", version: "2023" },
    { id: "METHANOL", name: "Methanol", pathway: "Bio", price: 61420, lhv: 19.9, wtt: 18.0, ttw: 67.0, wtw: 85.0, source: "CONCAWE / IEA", version: "2024" },
    { id: "HYDROGEN", name: "Hydrogen", pathway: "Renewable electrolysis", price: 120350, lhv: 120.0, wtt: 5.0, ttw: 0.0, wtw: 5.0, source: "JRC Well-to-Tank", version: "2023" },
    { id: "AMMONIA", name: "Ammonia", pathway: "Blue", price: 81340, lhv: 18.6, wtt: 22.0, ttw: 0.0, wtw: 22.0, source: "IEA / IRENA", version: "2024" },
];

export const FUEL_PATHWAY_OPTIONS = {
    METHANOL: ["Fossil", "Bio", "e-Methanol"],
    HYDROGEN: ["Grey", "Blue", "Renewable electrolysis"],
    AMMONIA: ["Grey", "Blue", "Renewable"],
    LNG: ["Fossil (methane slip)"],
};

// Pathway-adjusted WtW factors (gCO2e/MJ)
export const PATHWAY_WTW = {
    METHANOL: { Fossil: 95.0, Bio: 28.0, "e-Methanol": 12.0 },
    HYDROGEN: { Grey: 90.0, Blue: 32.0, "Renewable electrolysis": 5.0 },
    AMMONIA: { Grey: 78.0, Blue: 30.0, Renewable: 8.0 },
};

export const PROVENANCE_LEDGER = [
    { field: "Vessel speed", type: "Operational", source: "NOAA AIS", unit: "kn", status: "Measured", version: "2025-Q3" },
    { field: "Wave height", type: "Environmental", source: "Copernicus ERA5", unit: "m", status: "Reanalysis", version: "ERA5 v5.0" },
    { field: "Wind speed", type: "Environmental", source: "Copernicus ERA5", unit: "m/s", status: "Reanalysis", version: "ERA5 v5.0" },
    { field: "Sea state", type: "Environmental", source: "Copernicus ERA5", unit: "Douglas", status: "Derived", version: "ERA5 v5.0" },
    { field: "Route distance", type: "Scenario", source: "Internal routing", unit: "nm", status: "Reported", version: "v2.1" },
    { field: "Fuel consumption (target)", type: "Target", source: "EU THETIS-MRV", unit: "t", status: "Reported", version: "2024" },
    { field: "WtW emission factor", type: "Lifecycle", source: "IMO MEPC.391(81)", unit: "gCO2e/MJ", status: "Reported", version: "2024" },
    { field: "Fuel price", type: "Scenario", source: "Market index", unit: "INR/t", status: "Reported", version: "2025-09" },
    { field: "Cargo demand", type: "Scenario", source: "Operator schedule", unit: "t", status: "Reported", version: "v1.0" },
    { field: "Engine power", type: "Operational", source: "Vessel telemetry", unit: "kW", status: "Measured", version: "2025-Q3" },
    { field: "Predicted fuel (model)", type: "Derived", source: "Q-GreenFleet model", unit: "t", status: "Synthetic", version: "mock-v1" },
    { field: "Pareto hypervolume", type: "Derived", source: "Optimizer run", unit: "—", status: "Synthetic", version: "mock-v1" },
];

// ---------------------------------------------------------------------------
// Deterministic mock optimization
// ---------------------------------------------------------------------------

const FUEL_BY_ID = Object.fromEntries(FUELS.map((f) => [f.id, f]));
const VESSEL_BY_ID = Object.fromEntries(VESSELS.map((v) => [v.id, v]));

function fuelForRoute(rng, vessel, weather, distance, speed, fuelId) {
    // Cubic speed-power approximation, weather penalty, returns tonnes.
    const base = (distance / speed) * (vessel.capacity / 100000) * 1.6;
    const speedFactor = Math.pow(speed / 14, 3);
    const weatherMult = weather === "Severe" ? 1.22 : weather === "Adverse" ? 1.12 : 1.0;
    const noise = 1 + gaussian(rng) * 0.02;
    return Math.max(20, base * speedFactor * weatherMult * noise);
}

function costOf(fuelT, fuelId, fuelPrices) {
    const fuel = FUEL_BY_ID[fuelId];
    const price = fuelPrices?.[fuelId] ?? fuel.price;
    return fuelT * price;
}

function wtwOf(fuelT, fuelId, pathway) {
    const fuel = FUEL_BY_ID[fuelId];
    let wtw = fuel.wtw;
    if (PATHWAY_WTW[fuelId] && pathway && PATHWAY_WTW[fuelId][pathway] != null) {
        wtw = PATHWAY_WTW[fuelId][pathway];
    }
    // tCO2e = fuelT * lhv(MJ/kg)*1000 * wtw(g/MJ) / 1e6
    return (fuelT * fuel.lhv * 1000 * wtw) / 1e6;
}

export function runMockOptimization(config) {
    const {
        seed = 42,
        distance = 600,
        deadline = 52,
        portTime = 8,
        bufferTime = 2,
        weather = "Normal",
        cargoDemand = 45000,
        selectedVessels = VESSELS.map((v) => v.id),
        selectedFuels = FUELS.map((f) => f.id),
        fuelPrices = {},
        fuelPathways = {},
        shorePowerEnabled = false,
        gridEmissionFactor = 380,
        population = 80,
        iterations = 150,
        algorithm = "QPSO",
        carbonPrice = 0,
    } = config;

    const rng = createRng(seed);
    const vessels = selectedVessels.map((id) => VESSEL_BY_ID[id]).filter(Boolean);
    const fuels = selectedFuels.map((id) => FUEL_BY_ID[id]).filter(Boolean);

    if (vessels.length === 0 || fuels.length === 0) {
        return { pareto: [], deployment: [], feasible: false, violated: "At least one vessel and one fuel required", progress: [] };
    }

    // Baseline: single vessel, mid speed, cheapest available fuel.
    const baseVessel = vessels[0];
    const baseFuel = fuels.reduce((a, b) => (FUEL_BY_ID[a.id].price < FUEL_BY_ID[b.id].price ? a : b));
    const baseSpeed = Math.min(14, baseVessel.maxSpeed);
    const baseSailing = distance / baseSpeed + portTime;
    const baseFuelT = fuelForRoute(rng, baseVessel, weather, distance, baseSpeed, baseFuel.id);
    const baseline = {
        vesselId: baseVessel.id,
        speed: baseSpeed,
        fuelId: baseFuel.id,
        shorePower: false,
        cargo: Math.min(cargoDemand, baseVessel.capacity),
        sailingTime: baseSailing,
        fuel: baseFuelT,
        fuelError: baseFuelT * 0.04,
        cost: costOf(baseFuelT, baseFuel.id, fuelPrices) + carbonPrice * wtwOf(baseFuelT, baseFuel.id),
        wtw: wtwOf(baseFuelT, baseFuel.id, fuelPathways[baseFuel.id]),
        feasible: baseSailing <= deadline + bufferTime && baseVessel.capacity >= cargoDemand,
    };

    // Generate a Pareto set by sampling speed/fuel/vessel combinations.
    const pareto = [];
    const totalPoints = Math.max(12, Math.min(40, population / 2));
    for (let i = 0; i < totalPoints; i++) {
        const vessel = pick(rng, vessels);
        const fuel = pick(rng, fuels);
        if (!vessel.allowedFuels.includes(fuel.id)) continue;
        const speed = randRange(rng, vessel.minSpeed, vessel.maxSpeed);
        const sailing = distance / speed + portTime;
        const fuelT = fuelForRoute(rng, vessel, weather, distance, speed, fuel.id);
        const wtw = wtwOf(fuelT, fuel.id, fuelPathways[fuel.id]);
        const cost = costOf(fuelT, fuel.id, fuelPrices) + carbonPrice * wtw;
        const cargo = Math.min(cargoDemand, vessel.capacity);
        const feasible = sailing <= deadline + bufferTime && cargo >= cargoDemand * 0.95 && vessel.available;
        const shorePower = shorePowerEnabled && vessel.shorePower;
        let berthEmissions = 0;
        if (shorePower) berthEmissions = (portTime * 1200 * gridEmissionFactor) / 1e6; // tCO2e
        pareto.push({
            fuel: fuelT,
            cost: Math.round(cost),
            wtw: +(wtw + berthEmissions).toFixed(2),
            fuelId: fuel.id,
            deployment: [
                {
                    vesselId: vessel.id,
                    speed: +speed.toFixed(1),
                    fuelId: fuel.id,
                    shorePower,
                    cargo,
                    sailingTime: +sailing.toFixed(1),
                    fuel: +fuelT.toFixed(1),
                    fuelError: +(fuelT * 0.045).toFixed(1),
                    cost: Math.round(cost),
                    wtw: +(wtw + berthEmissions).toFixed(2),
                    feasible,
                },
            ],
            feasible,
            tag: "",
        });
    }

    // Tag extremes + balanced (TOPSIS on normalised objectives).
    if (pareto.length) {
        const minCost = pareto.reduce((a, b) => (b.cost < a.cost ? b : a));
        const minGhg = pareto.reduce((a, b) => (b.wtw < a.wtw ? b : a));
        const minFuel = pareto.reduce((a, b) => (b.fuel < a.fuel ? b : a));
        minCost.tag = "Minimum cost";
        minGhg.tag = "Minimum GHG";
        minFuel.tag = "Minimum fuel";
        const cMax = Math.max(...pareto.map((p) => p.cost));
        const cMin = Math.min(...pareto.map((p) => p.cost));
        const gMax = Math.max(...pareto.map((p) => p.wtw));
        const gMin = Math.min(...pareto.map((p) => p.wtw));
        const fMax = Math.max(...pareto.map((p) => p.fuel));
        const fMin = Math.min(...pareto.map((p) => p.fuel));
        let best = null;
        let bestScore = -Infinity;
        for (const p of pareto) {
            const nCost = (p.cost - cMin) / ((cMax - cMin) || 1);
            const nGhg = (p.wtw - gMin) / ((gMax - gMin) || 1);
            const nFuel = (p.fuel - fMin) / ((fMax - fMin) || 1);
            const score = 1 - (nCost + nGhg + nFuel) / 3;
            if (score > bestScore) { bestScore = score; best = p; }
        }
        if (best && !best.tag) best.tag = "Balanced";
    }

    // Feasibility check
    const anyFeasible = pareto.some((p) => p.feasible);
    let violated = null;
    if (!anyFeasible) {
        if (deadline < distance / Math.max(...vessels.map((v) => v.maxSpeed)) + portTime) {
            violated = `Deadline ${deadline}h too tight for ${distance}nm at max fleet speed`;
        } else if (vessels.every((v) => v.capacity < cargoDemand)) {
            violated = `No single vessel meets cargo demand of ${cargoDemand}t`;
        } else {
            violated = "No feasible combination of selected vessels and fuels";
        }
    }

    // Progress curve (hypervolume vs iteration)
    const progress = [];
    const finalHv = randRange(rng, 0.62, 0.78);
    for (let it = 0; it <= iterations; it += Math.max(1, Math.floor(iterations / 20))) {
        const t = it / iterations;
        const hv = finalHv * (1 - Math.exp(-3.2 * t)) + gaussian(rng) * 0.004;
        progress.push({ iteration: it, hypervolume: +Math.max(0, hv).toFixed(4) });
    }

    return {
        pareto,
        baseline,
        deployment: anyFeasible ? pareto.find((p) => p.tag === "Balanced")?.deployment ?? pareto[0].deployment : [],
        feasible: anyFeasible,
        violated,
        progress,
        finalHypervolume: +finalHv.toFixed(4),
        runId: `RUN-${seed}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    };
}

// ---------------------------------------------------------------------------
// Benchmarking (mixed results — no fixed winner)
// ---------------------------------------------------------------------------

export function getPredictionBenchmarks() {
    return [
        { model: "Linear Regression", mae: 3.42, rmse: 4.61, r2: 0.812, smape: 11.4, trainTime: 0.4, inferTime: 0.2, protocol: "Time holdout" },
        { model: "Random Forest", mae: 2.18, rmse: 3.04, r2: 0.910, smape: 7.6, trainTime: 12.3, inferTime: 1.8, protocol: "Time holdout" },
        { model: "XGBoost", mae: 1.94, rmse: 2.71, r2: 0.929, smape: 6.8, trainTime: 8.1, inferTime: 0.6, protocol: "Vessel holdout" },
        { model: "QPSO-tuned XGBoost", mae: 1.71, rmse: 2.39, r2: 0.945, smape: 5.9, trainTime: 96.4, inferTime: 0.6, protocol: "Vessel holdout" },
        { model: "XGBoost (Random Search)", mae: 1.83, rmse: 2.55, r2: 0.938, smape: 6.3, trainTime: 142.7, inferTime: 0.6, protocol: "Vessel holdout" },
    ];
}

export function getOptimizationBenchmarks(seed = 42) {
    const rng = createRng(seed);
    const algos = [
        { algorithm: "NSGA-II", hvBase: 0.66, feasibleBase: 88, runtimeBase: 14.2, iters95: 96 },
        { algorithm: "Classical PSO", hvBase: 0.61, feasibleBase: 82, runtimeBase: 9.8, iters95: 120 },
        { algorithm: "QPSO", hvBase: 0.72, feasibleBase: 91, runtimeBase: 11.6, iters95: 78 },
    ];
    return algos.map((a) => {
        const std = +(randRange(rng, 0.012, 0.028)).toFixed(3);
        const mean = +(a.hvBase + gaussian(rng) * 0.005).toFixed(3);
        const best = +(mean + std * 1.6).toFixed(3);
        const worst = +(mean - std * 1.6).toFixed(3);
        const median = +(mean + gaussian(rng) * 0.002).toFixed(3);
        return {
            algorithm: a.algorithm,
            hypervolumeMean: mean,
            hypervolumeStd: std,
            median,
            best,
            worst,
            feasibleRate: +(a.feasibleBase + gaussian(rng) * 1.5).toFixed(1),
            itersTo95: a.iters95,
            runtime: +(a.runtimeBase + gaussian(rng) * 0.8).toFixed(2),
        };
    });
}

export function getHypervolumeCurves(seed = 42) {
    const rng = createRng(seed);
    const algos = ["NSGA-II", "Classical PSO", "QPSO"];
    const finals = { "NSGA-II": 0.66, "Classical PSO": 0.61, QPSO: 0.72 };
    const speeds = { "NSGA-II": 2.4, "Classical PSO": 1.9, QPSO: 3.1 };
    const curves = [];
    for (let it = 0; it <= 150; it += 5) {
        const row = { iteration: it };
        for (const a of algos) {
            const t = it / 150;
            row[a] = +(finals[a] * (1 - Math.exp(-speeds[a] * t)) + gaussian(rng) * 0.003).toFixed(4);
        }
        curves.push(row);
    }
    return curves;
}

export function getScalabilityData(seed = 42) {
    const rng = createRng(seed);
    const sizes = [10, 25, 50, 100];
    return sizes.map((n) => {
        const row = { vessels: n };
        row["NSGA-II"] = { runtime: +(n * 0.21 + gaussian(rng) * 0.4).toFixed(1), hv: +(0.66 - n * 0.0006 + gaussian(rng) * 0.004).toFixed(3) };
        row["Classical PSO"] = { runtime: +(n * 0.14 + gaussian(rng) * 0.3).toFixed(1), hv: +(0.61 - n * 0.0008 + gaussian(rng) * 0.004).toFixed(3) };
        row["QPSO"] = { runtime: +(n * 0.17 + gaussian(rng) * 0.35).toFixed(1), hv: +(0.72 - n * 0.0004 + gaussian(rng) * 0.004).toFixed(3) };
        return row;
    });
}

export function getBoxPlotData(seed = 42) {
    const rng = createRng(seed);
    const algos = ["NSGA-II", "Classical PSO", "QPSO"];
    const centers = { "NSGA-II": 0.66, "Classical PSO": 0.61, QPSO: 0.72 };
    return algos.map((a) => {
        const vals = Array.from({ length: 10 }, () => +(centers[a] + gaussian(rng) * 0.02).toFixed(3));
        const sorted = [...vals].sort((x, y) => x - y);
        return {
            algorithm: a,
            min: sorted[0],
            q1: sorted[2],
            median: sorted[5],
            q3: sorted[7],
            max: sorted[9],
            outliers: [],
        };
    });
}

// ---------------------------------------------------------------------------
// Prediction / SHAP
// ---------------------------------------------------------------------------

export function predictFuel(input) {
    const { speed = 14, loadFactor = 0.7, enginePower = 12000, waveHeight = 1.5, wind = 8, seaState = 3, draft = 12, distance = 600 } = input;
    // Cubic speed-power baseline
    const base = (distance / speed) * (enginePower / 10000) * 0.42;
    const speedTerm = Math.pow(speed / 14, 3);
    const loadTerm = 0.8 + loadFactor * 0.4;
    const weatherTerm = 1 + (waveHeight * 0.03 + (wind - 8) * 0.005 + (seaState - 3) * 0.015);
    const draftTerm = 1 + (draft - 12) * 0.01;
    const fuel = base * speedTerm * loadTerm * weatherTerm * draftTerm;
    const error = fuel * 0.045;
    const physicsExpected = base * Math.pow(speed / 14, 3);
    const sanity = Math.abs(fuel - physicsExpected) / physicsExpected < 0.15 ? "pass" : "flag";
    return { fuel: +fuel.toFixed(2), error: +error.toFixed(2), sanity, physicsExpected: +physicsExpected.toFixed(2) };
}

export const SHAP_GLOBAL = [
    { feature: "Speed (kn)", value: 0.34, unit: "t" },
    { feature: "Engine power (kW)", value: 0.21, unit: "t" },
    { feature: "Load factor", value: 0.16, unit: "t" },
    { feature: "Wave height (m)", value: 0.09, unit: "t" },
    { feature: "Draft (m)", value: 0.07, unit: "t" },
    { feature: "Wind speed (m/s)", value: 0.06, unit: "t" },
    { feature: "Sea state", value: 0.04, unit: "t" },
    { feature: "Fuel type", value: 0.03, unit: "t" },
];

export function getPredictionScatter(seed = 42) {
    const rng = createRng(seed);
    const pts = [];
    for (let i = 0; i < 60; i++) {
        const actual = +randRange(rng, 30, 140).toFixed(1);
        const predicted = +(actual + gaussian(rng) * actual * 0.06).toFixed(1);
        pts.push({ actual, predicted, residual: +(predicted - actual).toFixed(1) });
    }
    return pts;
}

// ---------------------------------------------------------------------------
// Experiment log
// ---------------------------------------------------------------------------

export function getExperimentLog(seed = 42) {
    const rng = createRng(seed);
    const algos = ["QPSO", "NSGA-II", "Classical PSO"];
    const log = [];
    for (let i = 0; i < 12; i++) {
        const a = pick(rng, algos);
        log.push({
            runId: `RUN-${(1000 + i).toString(36).toUpperCase()}`,
            algorithm: a,
            seed: randInt(rng, 1, 99),
            population: pick(rng, [60, 80, 100]),
            iterations: pick(rng, [100, 150, 200]),
            datasetVersion: "mock-v1",
            runtime: +randRange(rng, 8, 22).toFixed(1),
            hypervolume: +randRange(rng, 0.58, 0.78).toFixed(3),
            feasibleRate: +randRange(rng, 80, 96).toFixed(1),
            timestamp: `2025-09-${String(randInt(rng, 10, 29)).padStart(2, "0")} ${String(randInt(rng, 0, 23)).padStart(2, "0")}:${String(randInt(rng, 0, 59)).padStart(2, "0")}`,
            config: {
                algorithm: a,
                objectives: ["fuel", "cost", "wtw"],
                weather: pick(rng, ["Normal", "Adverse", "Severe"]),
                carbonPrice: pick(rng, [0, 50, 85]),
            },
        });
    }
    return log;
}