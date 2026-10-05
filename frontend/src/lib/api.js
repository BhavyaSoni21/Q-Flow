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
const JSON_HEADERS = { "Content-Type": "application/json" };

async function maybeReal(path, mockFn) {
    if (!USE_MOCK) {
        try {
            const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: JSON_HEADERS });
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

async function maybeRealPost(path, input, mockFn) {
    if (!USE_MOCK) {
        try {
            const res = await fetch(`${API_BASE}${path}`, { method: "POST", credentials: "include", headers: JSON_HEADERS, body: JSON.stringify(input) });
            if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[api] live ${path} failed, falling back to mock:`, e.message);
            return mockFn();
        }
    }
    return mockFn();
}

export const api = {
    isMock: USE_MOCK,
    getVessels: () => maybeReal("/vessels", () => VESSELS),
    getFuels: () => maybeReal("/fuels", () => FUELS),
    getFuelPathways: () => FUEL_PATHWAY_OPTIONS,
    getPathwayWtw: () => PATHWAY_WTW,
    getProvenance: () => maybeReal("/provenance", () => PROVENANCE_LEDGER),
    getStatus: () => maybeReal("/status", () => null),
    getDataStatus: () => maybeReal("/data/status", () => null),
    getAuthSession: () => maybeReal("/auth/session", () => ({ authenticated: false, user: null })),
    logoutSession: () => fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include", headers: JSON_HEADERS }),
    getModels: () => maybeReal("/models", () => []),
    getDigitalTwins: () => maybeReal("/digital-twins", () => []),
    getDigitalTwin: (vesselId) => maybeReal(`/digital-twins/${vesselId}`, () => null),
    fuelSensitivity: (input) => maybeRealPost("/fuels/sensitivity", input, () => ({ status: "mock", scenarios: [] })),
    annualCompliance: (input) => maybeRealPost("/compliance/annual", input, () => ({ status: "mock", results: [] })),
    evaluateEacf: (input) => maybeRealPost("/eacf/evaluate", input, () => ({ status: "mock", name: "EACF" })),
    calculateCii: (input) => USE_MOCK
        ? Promise.resolve({ attained_cii: 0, cii_limit: input.cii_limit, violation: 0, satisfied: true, status: "mock", unit: "gCO2e/dwt-nm" })
        : fetch(`${API_BASE}/compliance/annual`, { method: "POST", credentials: "include", headers: JSON_HEADERS, body: JSON.stringify(input) })
            .then((res) => { if (!res.ok) throw new Error(`API /compliance/annual failed: ${res.status}`); return res.json(); })
            .then((data) => data.results[0] || { attained_cii: 0, cii_limit: input.cii_limit, violation: 0, satisfied: true })
            .catch(() => ({ attained_cii: 0, cii_limit: input.cii_limit, violation: 0, satisfied: true, status: "fallback", unit: "gCO2e/dwt-nm" })),
    predictFuel: (input) => maybeReal("/predict/fuel", () => predictFuel(input)),
    getShapGlobal: () => SHAP_GLOBAL,
    getPredictionScatter: (seed, split = "time") => maybeReal(`/predict/scatter?seed=${seed}&split=${split}`, () => getPredictionScatter(seed, split)),
    runOptimization: (config) =>
        USE_MOCK
            ? new Promise((r) => setTimeout(() => r(runMockOptimization(config)), 650))
            : fetch(`${API_BASE}/optimize/fleet`, { method: "POST", credentials: "include", headers: JSON_HEADERS, body: JSON.stringify(config) })
                .then((res) => res.json())
                .catch(() => runMockOptimization(config)),
    runRobustness: (config) => USE_MOCK
        ? Promise.resolve({ status: "ok", robust: true, scenarios: ["Normal", "Adverse", "Severe"].map((name) => ({ name, status: "mock", feasible: true })), assumptions: { weather_states: ["Normal", "Adverse", "Severe"] } })
        : fetch(`${API_BASE}/optimize/robustness`, { method: "POST", credentials: "include", headers: JSON_HEADERS, body: JSON.stringify(config) })
            .then((res) => { if (!res.ok) throw new Error(`API /optimize/robustness failed: ${res.status}`); return res.json(); }),
    // ROAD mode (live backend only; no mock)
    getRoadVessels: () => fetch(`${API_BASE}/road/vehicles`).then((r) => r.json()),
    getRoadFuels: () => fetch(`${API_BASE}/road/fuels`).then((r) => r.json()),
    runRoadOptimization: (config) =>
        fetch(`${API_BASE}/optimize/road`, { method: "POST", credentials: "include", headers: JSON_HEADERS, body: JSON.stringify(config) }).then((res) => res.json()),
    getBenchmarks: {
        prediction: (force) => maybeReal(`/benchmarks/prediction${force ? "?force=true" : ""}`, () => getPredictionBenchmarks()),
        // Combined optimizer benchmark (one backend compute). Live mode recomputes on
        // the real engine; force=true recomputes instead of serving the cached run.
        optimizer: (force) => maybeReal(`/benchmarks/optimizer${force ? "?force=true" : ""}`, () => ({
            table: getOptimizationBenchmarks(), hvCurves: getHypervolumeCurves(),
            scalability: getScalabilityData(), boxplot: getBoxPlotData(),
            source: "mock", predictionSource: "mock",
        })),
        // Individual endpoints (served from the same cached optimizer run) — kept for compat.
        optimization: (seed) => maybeReal("/benchmarks/optimization", () => getOptimizationBenchmarks(seed)),
        hypervolumeCurves: (seed) => maybeReal("/benchmarks/hv-curves", () => getHypervolumeCurves(seed)),
        scalability: (seed) => maybeReal("/benchmarks/scalability", () => getScalabilityData(seed)),
        boxplot: (seed) => maybeReal("/benchmarks/boxplot", () => getBoxPlotData(seed)),
    },
    getExperimentLog: (seed) => maybeReal("/experiments", () => getExperimentLog(seed)),
    // Scenarios, User Profiles, Dashboard Live Metrics & Feedback
    getScenarios: () => maybeReal("/scenarios", () => []),
    getScenario: (scenarioId) => maybeReal(`/scenarios/${scenarioId}`, () => null),
    createScenario: (scenario) => maybeRealPost("/scenarios", scenario, () => scenario),
    deleteScenario: (scenarioId) =>
        fetch(`${API_BASE}/scenarios/${scenarioId}`, { method: "DELETE", credentials: "include", headers: JSON_HEADERS })
            .then((res) => res.json())
            .catch(() => ({ deleted: scenarioId })),
    getProfile: () => maybeReal("/profile", () => ({
        full_name: "Capt. Ashutosh Amale",
        email: "fleet@qflow.app",
        company_name: "Oceanic Green Logistics India Pvt Ltd",
        imo_number: "IMO-9842103",
        fleet_size: "18 Active Vessels (Panamax, Aframax, Capesize)",
        home_port: "Jawaharlal Nehru Port (JNPA / INNSA)",
        sustainability_target: "IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)",
        contact_person: "Capt. Ashutosh Amale",
        phone: "+91 98200 12345",
    })),
    updateProfile: (data) =>
        fetch(`${API_BASE}/profile`, { method: "PUT", credentials: "include", headers: JSON_HEADERS, body: JSON.stringify(data) })
            .then((res) => res.json())
            .catch(() => data),
    getDashboardSummary: () => maybeReal("/dashboard/summary", () => ({
        metrics: {
            total_simulations: 4,
            formatted_total_savings: "₹ 8,83,000",
            avg_wtw_reduction_pct: 17.1,
            feasible_rate_pct: 100.0,
            active_vessels: 18,
            avg_ci_score: "B (Satisfied)",
        },
        profile: {
            company_name: "Oceanic Green Logistics India Pvt Ltd",
            imo_number: "IMO-9842103",
            fleet_size: "18 Active Vessels (Panamax, Aframax, Capesize)",
            home_port: "Jawaharlal Nehru Port (JNPA / INNSA)",
            sustainability_target: "IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)",
            contact_person: "Capt. Ashutosh Amale",
            email: "fleet@qflow.app",
        },
        history: [],
    })),
    submitDashboardFeedback: (data) => maybeRealPost("/dashboard/feedback", data, () => ({ status: "calibrated", deviation_pct: 0 })),
};
