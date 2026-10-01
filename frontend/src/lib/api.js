// Single data layer. Swap USE_MOCK to call real FastAPI endpoints.
import {
    USE_MOCK,
    VESSELS,
    FUELS,
    FUEL_PATHWAY_OPTIONS,
    PATHWAY_WTW,
    PROVENANCE_LEDGER,
    runMockOptimization,
    getPredictionBenchmarks,
    getOptimizationBenchmarks,
    getHypervolumeCurves,
    getScalabilityData,
    getBoxPlotData,
    predictFuel,
    SHAP_GLOBAL,
    getPredictionScatter,
    getExperimentLog,
} from "@/data/mock";

export const isMock = USE_MOCK;

// Same-origin "/api" by default (dev proxy / reverse proxy). Set VITE_API_BASE
// to an absolute URL (e.g. https://api.example.com) to target a backend on a
// different host — the backend's CORS_ORIGINS must then include this frontend.
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function maybeReal(path, mockFn) {
    if (!USE_MOCK) {
        try {
            const res = await fetch(`${API_BASE}${path}`, { headers: { "Content-Type": "application/json" } });
            if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
            return await res.json();
        } catch (e) {
            // graceful degrade: if the backend isn't up, show representative mock data
            console.warn(`[api] live ${path} failed, falling back to mock:`, e.message);
            return mockFn();
        }
    }
    // Simulate latency for realistic loading states
    await new Promise((r) => setTimeout(r, 280));
    return mockFn();
}

export const api = {
    isMock: USE_MOCK,
    getVessels: () => maybeReal("/vessels", () => VESSELS),
    getFuels: () => maybeReal("/fuels", () => FUELS),
    getFuelPathways: () => FUEL_PATHWAY_OPTIONS,
    getPathwayWtw: () => PATHWAY_WTW,
    getProvenance: () => maybeReal("/provenance", () => PROVENANCE_LEDGER),
    predictFuel: (input) => maybeReal("/predict/fuel", () => predictFuel(input)),
    getShapGlobal: () => SHAP_GLOBAL,
    getPredictionScatter: (seed) => maybeReal("/predict/scatter", () => getPredictionScatter(seed)),
    runOptimization: (config) =>
        USE_MOCK
            ? new Promise((r) => setTimeout(() => r(runMockOptimization(config)), 650))
            : fetch(`${API_BASE}/optimize/fleet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) })
                .then((res) => res.json())
                .catch(() => runMockOptimization(config)),
    // ROAD mode (live backend only; no mock)
    getRoadVessels: () => fetch(`${API_BASE}/road/vehicles`).then((r) => r.json()),
    getRoadFuels: () => fetch(`${API_BASE}/road/fuels`).then((r) => r.json()),
    runRoadOptimization: (config) =>
        fetch(`${API_BASE}/optimize/road`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) }).then((res) => res.json()),
    getBenchmarks: {
        prediction: () => maybeReal("/benchmarks/prediction", () => getPredictionBenchmarks()),
        optimization: (seed) => maybeReal("/benchmarks/optimization", () => getOptimizationBenchmarks(seed)),
        hypervolumeCurves: (seed) => maybeReal("/benchmarks/hv-curves", () => getHypervolumeCurves(seed)),
        scalability: (seed) => maybeReal("/benchmarks/scalability", () => getScalabilityData(seed)),
        boxplot: (seed) => maybeReal("/benchmarks/boxplot", () => getBoxPlotData(seed)),
    },
    getExperimentLog: (seed) => maybeReal("/experiments", () => getExperimentLog(seed)),
};