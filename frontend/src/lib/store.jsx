import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";

const StoreContext = createContext(null);

const DEFAULT_CONFIG = {
    routeId: "routeA",
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

export function StoreProvider({ children }) {
    const [contrastMode, setContrastMode] = useState("normal"); // normal | high-contrast | dark
    const [fontScale, setFontScale] = useState(1); // 0.9 | 1 | 1.1
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [results, setResults] = useState(null);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [runId, setRunId] = useState(null);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [caseStudy, setCaseStudy] = useState("A");
    const [weights, setWeights] = useState({ fuel: 0.34, cost: 0.33, wtw: 0.33 });
    const [error, setError] = useState(null);

    const updateConfig = useCallback((patch) => {
        setConfig((c) => ({ ...c, ...patch }));
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

    const runOptimization = useCallback(async () => {
        setRunning(true);
        setError(null);
        setProgress(0);
        // Deterministic progress animation
        const total = config.iterations;
        let cur = 0;
        const timer = setInterval(() => {
            cur += Math.max(1, Math.floor(total / 24));
            setProgress(Math.min(95, Math.round((cur / total) * 100)));
        }, 28);
        try {
            const res = await api.runOptimization(config);
            clearInterval(timer);
            setProgress(100);
            setResults(res);
            setRunId(res.runId);
            const balanced = res.pareto?.find((p) => p.tag === "Balanced") ?? res.pareto?.[0 ?? null];
            setSelectedPoint(balanced ?? null);
        } catch (e) {
            clearInterval(timer);
            setError(e.message || "Optimization failed");
        } finally {
            setRunning(false);
        }
    }, [config]);

    const reset = useCallback(() => {
        setConfig(DEFAULT_CONFIG);
        setResults(null);
        setSelectedPoint(null);
        setProgress(0);
        setError(null);
    }, []);

    const value = {
        contrastMode, cycleContrast, fontScale, setFontScale,
        config, updateConfig,
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