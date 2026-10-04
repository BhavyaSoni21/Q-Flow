import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

const StoreContext = createContext(null);

const DEFAULT_CONFIG = {
    originPort: "Port 1",
    destinationPort: "Port 2",
    distance: 600,
    deadline: 52,
    portTime: 8,
    bufferTime: 2,
    weather: "Normal",
    cargoDemand: 45000,
    selectedVessels: ["V001", "V002", "V003"],
    selectedFuels: ["HFO", "VLSFO", "LNG", "METHANOL"],
    fuelPrices: {},
    fuelPathways: { METHANOL: "Bio", HYDROGEN: "Renewable electrolysis", AMMONIA: "Blue" },
    shorePowerEnabled: false,
    gridEmissionFactor: 380,
    algorithm: "QPSO",
    population: 80,
    iterations: 150,
    seed: 42,
    runs: 10,
    carbonPrice: 0,
    objectives: { fuel: true, cost: true, wtw: true },
};

// Versioned session key — bump the version when the stored schema changes to
// avoid stale data causing runtime errors.
const SESSION_KEY = "qflow_store_v1";

function loadSession() {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveSession(data) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch {
        // sessionStorage may be unavailable (private mode quota exceeded etc.)
    }
}

function clearSession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {}
}

export function StoreProvider({ children }) {
    const [contrastMode, setContrastMode] = useState("normal"); // normal | high-contrast | dark
    const [fontScale, setFontScale] = useState(1); // 0.9 | 1 | 1.1

    // Rehydrate persisted state on mount so navigation between pages and hard
    // refreshes do not lose an optimization run that was already completed.
    const session = loadSession();
    const [config, setConfig] = useState(session?.config ?? DEFAULT_CONFIG);
    const [mode, setMode] = useState(session?.mode ?? "ship");        // ship | road
    const [results, setResults] = useState(session?.results ?? null);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [runId, setRunId] = useState(session?.runId ?? null);
    const [selectedPoint, setSelectedPoint] = useState(session?.selectedPoint ?? null);
    const [caseStudy, setCaseStudy] = useState("A");
    const [weights, setWeights] = useState({ fuel: 0.34, cost: 0.33, wtw: 0.33 });
    const [error, setError] = useState(null);

    const updateConfig = useCallback((patch) => {
        setConfig((c) => ({ ...c, ...patch }));
    }, []);

    const changeMode = useCallback((m) => {
        setMode(m);
        setResults(null);
        setSelectedPoint(null);
        if (m === "road") {
            setConfig((c) => ({ ...c, distance: 300, cargoDemand: 4000, deadline: 8,
                selectedVessels: [], selectedFuels: ["DIESEL"] }));
        } else {
            setConfig(DEFAULT_CONFIG);
        }
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        root.classList.toggle("dark", contrastMode === "dark");
        root.classList.toggle("high-contrast", contrastMode === "high-contrast");
        root.style.fontSize = `${16 * fontScale}px`;
    }, [contrastMode, fontScale]);

    const cycleContrast = useCallback(() => {
        setContrastMode((m) =>
            m === "normal" ? "high-contrast" : m === "high-contrast" ? "dark" : "normal"
        );
    }, []);

    const runOptimization = useCallback(async (overrides = {}) => {
        const runConfig = { ...config, ...overrides };
        setRunning(true);
        setError(null);
        setProgress(0);
        // Deterministic progress animation
        const total = runConfig.iterations;
        let cur = 0;
        const timer = setInterval(() => {
            cur += Math.max(1, Math.floor(total / 24));
            setProgress(Math.min(95, Math.round((cur / total) * 100)));
        }, 28);
        try {
            const res = await (mode === "road" ? api.runRoadOptimization(runConfig) : api.runOptimization(runConfig));
            clearInterval(timer);
            setProgress(100);
            setResults(res);
            setRunId(res.runId);
            const balanced = res.pareto?.find((p) => p.tag === "Balanced") ?? res.pareto?.[0 ?? null];
            setSelectedPoint(balanced ?? null);
            // Persist the completed run to sessionStorage so navigation to
            // other pages does not lose the result.
            saveSession({ config: runConfig, mode, results: res, runId: res.runId, selectedPoint: balanced ?? null });
        } catch (e) {
            clearInterval(timer);
            setError(e.message || "Optimization failed");
        } finally {
            setRunning(false);
        }
    }, [config, mode]);

    const reset = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setResults(null);
        setSelectedPoint(null);
        setProgress(0);
        setError(null);
        clearSession();
    }, []);

    const value = {
        contrastMode, cycleContrast, fontScale, setFontScale,
        config, updateConfig,
        mode, setMode: changeMode,
        results, running, progress, runId,
        selectedPoint, setSelectedPoint,
        caseStudy, setCaseStudy,
        weights, setWeights,
        error, setError,
        runOptimization, reset,
        isMock: api.isMock,
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used within StoreProvider");
    return ctx;
}
