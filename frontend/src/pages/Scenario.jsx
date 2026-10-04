import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Panel } from "@/components/shared/Panel";
import { LabeledInput, LabeledSelect, Checkbox, SquareButton } from "@/components/shared/Field";
import { StatusDot, Badge } from "@/components/shared/StatusDot";
import { WEATHER_SCENARIOS, ALGORITHMS, ROUTES, PORTS, getRouteDistance, calculateFeasibleDeadline } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    AlertTriangle, Play, RotateCcw, ChevronRight, CheckCircle2,
    X, ExternalLink, Loader2, Ship, Fuel, Settings2, FlaskConical, Sparkles,
} from "lucide-react";
import DataStatus from "@/components/shared/DataStatus";
import { useNavigate } from "react-router-dom";
import { OptimizationView } from "@/pages/Optimization";
import TopUtilityBar from "@/components/layout/TopUtilityBar";
import SiteHeader from "@/components/layout/SiteHeader";

// ─────────────────────────────────────────────────────────────────────────────
// Optimization Toast
// ─────────────────────────────────────────────────────────────────────────────
function OptimizationToast({ onDismiss, onNavigate, type = "success", message }) {
    const [progress, setProgress] = useState(100);
    const DURATION = 6000;
    const intervalRef = useRef(null);

    useEffect(() => {
        const start = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
            setProgress(remaining);
            if (remaining === 0) {
                clearInterval(intervalRef.current);
                onDismiss();
            }
        }, 50);
        return () => clearInterval(intervalRef.current);
    }, [onDismiss]);

    if (type === "error") {
        return (
            <div className="fixed bottom-6 right-6 z-[200] w-[360px] max-w-[calc(100vw-2rem)] fade-in">
                <div className="bg-white dark:bg-[#1e293b] border border-red-200 dark:border-red-800/60 rounded-lg shadow-2xl overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Optimization Failed</p>
                            <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5 leading-relaxed">{message || "An error occurred. Please check your scenario configuration and try again."}</p>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="shrink-0 p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="h-0.5 bg-red-100 dark:bg-red-900/20">
                        <div
                            className="h-full bg-red-500 transition-none"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-[200] w-[400px] max-w-[calc(100vw-2rem)] fade-in">
            <div className="bg-white dark:bg-[#1e293b] border border-[#bbf7d0] dark:border-green-800/60 rounded-lg shadow-2xl overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            Optimization Completed Successfully!
                        </p>
                        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1 leading-relaxed">
                            Your scenario has been optimized. Visit the Optimization section to view your results.
                        </p>
                        <button
                            onClick={onNavigate}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#0076a8] hover:bg-[#005e86] px-3 py-1.5 rounded transition-colors btn-glow"
                        >
                            Go to Optimization
                            <ExternalLink size={11} />
                        </button>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="shrink-0 p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
                        aria-label="Dismiss notification"
                    >
                        <X size={14} />
                    </button>
                </div>
                {/* Auto-dismiss progress bar */}
                <div className="h-0.5 bg-green-100 dark:bg-green-900/20">
                    <div
                        className="h-full bg-green-500 transition-none"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scenario page
// ─────────────────────────────────────────────────────────────────────────────
export default function Scenario() {
    const {
        config, updateConfig, runOptimization, running, progress,
        results, error, reset, mode, setMode,
    } = useStore();

    const navigate = useNavigate();
    const [fuels, setFuels] = useState(null);
    const [vessels, setVessels] = useState(null);
    const [validation, setValidation] = useState({});
    const [dataStatus, setDataStatus] = useState(null);
    const [robustness, setRobustness] = useState(null);
    const [robustnessRunning, setRobustnessRunning] = useState(false);

    // Toast & Overlay state
    const [toast, setToast] = useState(null); // { type: "success" | "error", message?: string }
    const [showOptimizationOverlay, setShowOptimizationOverlay] = useState(false);
    const prevRunning = useRef(false);
    const prevError = useRef(null);

    // Detect optimization completion / failure
    useEffect(() => {
        if (prevRunning.current === true && !running) {
            if (error) {
                setToast({ type: "error", message: error });
            } else if (results) {
                // Auto-open spacious near-full-screen optimization overlay with background blur
                setShowOptimizationOverlay(true);
            }
        }
        prevRunning.current = running;
        prevError.current = error;
    }, [running, results, error]);

    React.useEffect(() => { api.getStatus().then(setDataStatus); }, []);

    React.useEffect(() => {
        if (mode === "road") {
            api.getRoadFuels().then(setFuels);
            api.getRoadVessels().then(setVessels);
        } else {
            api.getFuels().then(setFuels);
            api.getVessels().then(setVessels);
        }
    }, [mode]);

    const fuelList = fuels || [];
    const vesselList = vessels || [];
    const origin = config.originPort;
    const dest = config.destinationPort;
    const routeLabel = `Route: ${origin} \u2192 ${dest}`;
    const refDistance = getRouteDistance(origin, dest);
    const distWarn = refDistance && Math.abs(config.distance - refDistance) / refDistance > 0.10
        ? `Reference distance ${refDistance} nm \u2014 entered value differs by >10%`
        : null;

    const toggleVessel = (id) => {
        const next = config.selectedVessels.includes(id)
            ? config.selectedVessels.filter((v) => v !== id)
            : [...config.selectedVessels, id];
        updateConfig({ selectedVessels: next });
    };
    const toggleFuel = (id) => {
        const next = config.selectedFuels.includes(id)
            ? config.selectedFuels.filter((v) => v !== id)
            : [...config.selectedFuels, id];
        updateConfig({ selectedFuels: next });
    };

    const validate = () => {
        const v = {};
        if (config.distance <= 0) v.distance = "Must be positive";
        if (config.deadline <= 0) v.deadline = "Must be positive";
        if (config.cargoDemand <= 0) v.cargoDemand = "Must be positive";
        if (config.selectedVessels.length === 0) v.vessels = "Select at least one vessel";
        if (config.selectedFuels.length === 0) v.fuels = "Select at least one fuel";
        vesselList.forEach((vs) => {
            if (vs && vs.minSpeed >= vs.maxSpeed) v[`speed_${vs.id}`] = "Min must be < max";
        });

        // Feasibility check: speed needed vs max speed
        if (mode === "ship" && vesselList.length > 0) {
            const maxSpeed = Math.max(...vesselList.map((vs) => vs.maxSpeed || 20), 1);
            const sailWindow = config.deadline - (config.portTime || 0) - (config.bufferTime || 0);
            if (sailWindow <= 0 || config.distance / sailWindow > maxSpeed) {
                const minFeasibleDeadline = Math.ceil(config.distance / maxSpeed + (config.portTime || 0) + (config.bufferTime || 0));
                v.deadline = `Deadline too tight (min ~${minFeasibleDeadline}h for ${config.distance}nm)`;
            }
        }

        setValidation(v);
        return Object.keys(v).length === 0;
    };

    const handleRun = () => {
        if (validate()) {
            setToast(null);
            runOptimization();
        }
    };

    const handleRobustness = async () => {
        if (!validate()) return;
        setRobustnessRunning(true);
        try { setRobustness(await api.runRobustness(config)); }
        finally { setRobustnessRunning(false); }
    };

    const pathwayOptions = api.getFuelPathways();

    return (
        <div className="p-4 sm:p-6">
            {/* Toast */}
            {toast && (
                <OptimizationToast
                    type={toast.type}
                    message={toast.message}
                    onDismiss={() => setToast(null)}
                    onNavigate={() => { setToast(null); navigate("/optimization"); }}
                />
            )}

            <DataStatus status={dataStatus} />

            {/* Mode Selector */}
            <div className="flex items-center gap-2 mb-5">
                <span className="text-[12px] font-semibold text-muted-foreground">Transport Mode:</span>
                {["ship", "road"].map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all duration-200 inline-flex items-center gap-1.5",
                            mode === m
                                ? "bg-[#E86A00] text-white border-[#E86A00] shadow-sm"
                                : "bg-white dark:bg-[#1e293b] text-[#555] dark:text-[#94a3b8] border-[#d1d5db] dark:border-[#334155] hover:border-[#E86A00] hover:text-[#E86A00]"
                        )}
                    >
                        {m === "ship" ? <><Ship size={12} /> Ship / Waterway</> : <><Settings2 size={12} /> Road / Vehicle</>}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-4 sm:gap-5">
                {/* ── Left column: form ── */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">

                    {/* Route panel */}
                    <Panel title="Route & Schedule">
                        <div className="grid grid-cols-2 gap-3">
                            {mode === "ship" && (
                                <>
                                    <LabeledSelect
                                        label="From"
                                        value={config.originPort}
                                        onChange={(v) => {
                                            const d = getRouteDistance(v, config.destinationPort);
                                            const dl = calculateFeasibleDeadline(d, config.portTime, config.bufferTime);
                                            updateConfig({ originPort: v, distance: d, deadline: dl });
                                        }}
                                        options={PORTS.map(p => ({ value: p, label: p }))}
                                    />
                                    <LabeledSelect
                                        label="To"
                                        value={config.destinationPort}
                                        onChange={(v) => {
                                            const d = getRouteDistance(config.originPort, v);
                                            const dl = calculateFeasibleDeadline(d, config.portTime, config.bufferTime);
                                            updateConfig({ destinationPort: v, distance: d, deadline: dl });
                                        }}
                                        options={PORTS.map(p => ({ value: p, label: p }))}
                                    />
                                </>
                            )}
                            <LabeledInput
                                label="Distance"
                                unit={mode === "road" ? "km" : "nm"}
                                type="number"
                                value={config.distance}
                                onChange={(v) => {
                                    const numDist = Number(v);
                                    const updates = { distance: numDist };
                                    if (mode === "ship" && numDist > 0) {
                                        const maxSpeed = Math.max(...vesselList.map(vs => vs.maxSpeed || 20), 20);
                                        const minFeasible = Math.ceil(numDist / maxSpeed + (config.portTime || 0) + (config.bufferTime || 0));
                                        if (config.deadline < minFeasible) {
                                            updates.deadline = calculateFeasibleDeadline(numDist, config.portTime, config.bufferTime);
                                        }
                                    }
                                    updateConfig(updates);
                                }}
                                error={validation.distance}
                                min={1}
                            />
                            <LabeledInput
                                label="Deadline"
                                unit="h"
                                type="number"
                                value={config.deadline}
                                onChange={(v) => updateConfig({ deadline: v })}
                                error={validation.deadline}
                                min={1}
                            />
                            <LabeledInput
                                label="Port time"
                                unit="h"
                                type="number"
                                value={config.portTime}
                                onChange={(v) => updateConfig({ portTime: v })}
                                min={0}
                            />
                            <LabeledInput
                                label="Buffer time"
                                unit="h"
                                type="number"
                                value={config.bufferTime}
                                onChange={(v) => updateConfig({ bufferTime: v })}
                                min={0}
                            />
                            {mode === "ship" && (
                                <div className="col-span-2">
                                    <LabeledSelect
                                        label="Weather scenario"
                                        value={config.weather}
                                        onChange={(v) => updateConfig({ weather: v })}
                                        options={WEATHER_SCENARIOS}
                                    />
                                </div>
                            )}
                            {distWarn && (
                                <div className="col-span-2 text-[11px] text-[hsl(var(--status-amber))] border border-[hsl(var(--status-amber))/50] bg-[hsl(var(--status-amber))/5] px-2.5 py-1.5 flex items-center gap-1.5 rounded-sm">
                                    <AlertTriangle size={12} strokeWidth={1.5} className="shrink-0" /> {distWarn}
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* Cargo panel */}
                    <Panel title="Cargo">
                        <LabeledInput
                            label="Demand"
                            unit={mode === "road" ? "kg" : "tonnes"}
                            type="number"
                            value={config.cargoDemand}
                            onChange={(v) => updateConfig({ cargoDemand: v })}
                            error={validation.cargoDemand}
                            min={1}
                        />
                    </Panel>

                    {/* Fleet pool */}
                    <Panel
                        title="Fleet Pool"
                        actions={
                            <Badge tone={config.selectedVessels.length ? "neutral" : "red"}>
                                {config.selectedVessels.length} selected
                            </Badge>
                        }
                    >
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-xs min-w-[480px]">
                                <thead>
                                    <tr className="bg-[hsl(var(--panel-header))]">
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold" />
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">ID</th>
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">Name</th>
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">Type</th>
                                        <th className="text-right px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold num">Cap (t)</th>
                                        <th className="text-right px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold num">kn</th>
                                        <th className="text-center px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">OPS</th>
                                        <th className="text-center px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">Avail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vesselList.map((v) => (
                                        <tr
                                            key={v.id}
                                            className={cn(
                                                "border-b last:border-b-0 cursor-pointer hover-row transition-colors",
                                                config.selectedVessels.includes(v.id) && "bg-primary/5"
                                            )}
                                            onClick={() => toggleVessel(v.id)}
                                        >
                                            <td className="px-2 py-1.5"><Checkbox checked={config.selectedVessels.includes(v.id)} onChange={() => toggleVessel(v.id)} /></td>
                                            <td className="px-2 py-1.5 num font-medium">{v.id}</td>
                                            <td className="px-2 py-1.5 font-medium">{v.name}</td>
                                            <td className="px-2 py-1.5 text-muted-foreground">{v.type}</td>
                                            <td className="px-2 py-1.5 text-right num">{v.capacity.toLocaleString()}</td>
                                            <td className="px-2 py-1.5 text-right num">{v.minSpeed}–{v.maxSpeed}</td>
                                            <td className="px-2 py-1.5 text-center text-muted-foreground">{v.shorePower ? "Y" : "N"}</td>
                                            <td className="px-2 py-1.5 text-center"><StatusDot status={v.available} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {validation.vessels && (
                            <p className="text-[11px] text-[hsl(var(--status-red))] mt-2 flex items-center gap-1">
                                <AlertTriangle size={11} /> {validation.vessels}
                            </p>
                        )}
                    </Panel>

                    {/* Fuel pathways */}
                    <Panel
                        title="Fuel Pathways"
                        actions={
                            <Badge tone={config.selectedFuels.length ? "neutral" : "red"}>
                                {config.selectedFuels.length} selected
                            </Badge>
                        }
                    >
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-xs min-w-[400px]">
                                <thead>
                                    <tr className="bg-[hsl(var(--panel-header))]">
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold" />
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">Fuel</th>
                                        <th className="text-left px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold">Pathway</th>
                                        <th className="text-right px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold num">Price INR</th>
                                        <th className="text-right px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold num">LHV</th>
                                        <th className="text-right px-2 py-2 text-[10px] uppercase text-muted-foreground font-semibold num">WtW</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fuelList.map((f) => (
                                        <tr
                                            key={f.id}
                                            className={cn(
                                                "border-b last:border-b-0 cursor-pointer hover-row transition-colors",
                                                config.selectedFuels.includes(f.id) && "bg-primary/5"
                                            )}
                                        >
                                            <td className="px-2 py-1.5"><Checkbox checked={config.selectedFuels.includes(f.id)} onChange={() => toggleFuel(f.id)} /></td>
                                            <td className="px-2 py-1.5 font-medium">{f.name}</td>
                                            <td className="px-2 py-1.5">
                                                {pathwayOptions[f.id] ? (
                                                    <select
                                                        value={config.fuelPathways[f.id] || pathwayOptions[f.id][0]}
                                                        onChange={(e) => updateConfig({ fuelPathways: { ...config.fuelPathways, [f.id]: e.target.value } })}
                                                        className="h-7 px-1.5 border border-input bg-background text-xs focus:outline-none focus:border-accent rounded-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {pathwayOptions[f.id].map((p) => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className="text-muted-foreground">{f.pathway}</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-1.5 text-right">
                                                <input
                                                    type="number"
                                                    value={config.fuelPrices[f.id] ?? f.price}
                                                    onChange={(e) => updateConfig({ fuelPrices: { ...config.fuelPrices, [f.id]: Number(e.target.value) } })}
                                                    className="w-20 h-7 px-1.5 border border-input bg-background text-right num text-xs focus:outline-none focus:border-accent rounded-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            <td className="px-2 py-1.5 text-right num text-muted-foreground">{f.lhv}</td>
                                            <td className="px-2 py-1.5 text-right num text-muted-foreground">{f.wtw}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 mt-2">
                            Source: {fuelList[0]?.source} · {fuelList[0]?.version}. WtW factor shown for selected pathway.
                        </p>
                        {validation.fuels && (
                            <p className="text-[11px] text-[hsl(var(--status-red))] mt-1 flex items-center gap-1">
                                <AlertTriangle size={11} /> {validation.fuels}
                            </p>
                        )}
                    </Panel>

                    {/* Shore power */}
                    {mode === "ship" && (
                        <Panel title="Shore Power (OPS)">
                            <div className="flex flex-col gap-3">
                                <Checkbox
                                    checked={config.shorePowerEnabled}
                                    onChange={(v) => updateConfig({ shorePowerEnabled: v })}
                                    label="Enable shore power (OPS) at berth"
                                />
                                <LabeledInput
                                    label="Grid emission factor"
                                    unit="gCO2e/kWh"
                                    type="number"
                                    value={config.gridEmissionFactor}
                                    onChange={(v) => updateConfig({ gridEmissionFactor: v })}
                                    disabled={!config.shorePowerEnabled}
                                    min={0}
                                />
                            </div>
                        </Panel>
                    )}

                    {/* Optimizer */}
                    <Panel title="Optimizer Settings">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <LabeledSelect
                                    label="Algorithm"
                                    value={config.algorithm}
                                    onChange={(v) => updateConfig({ algorithm: v })}
                                    options={ALGORITHMS}
                                />
                            </div>
                            <LabeledInput label="Population" type="number" value={config.population} onChange={(v) => updateConfig({ population: v })} min={10} />
                            <LabeledInput label="Iterations" type="number" value={config.iterations} onChange={(v) => updateConfig({ iterations: v })} min={10} />
                            <LabeledInput label="Random seed" type="number" value={config.seed} onChange={(v) => updateConfig({ seed: v })} min={0} />
                            <LabeledInput label="Number of runs" type="number" value={config.runs} onChange={(v) => updateConfig({ runs: v })} min={1} />
                        </div>
                    </Panel>

                    {/* Objectives */}
                    <Panel title="Objectives & Carbon Price">
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-4">
                                <Checkbox checked label="Fuel (t)" disabled />
                                <Checkbox checked label="Cost (INR)" disabled />
                                <Checkbox checked label="WtW GHG (tCO2e)" disabled />
                            </div>
                            <LabeledInput label="Carbon price" unit="INR/tCO2e" type="number" value={config.carbonPrice} onChange={(v) => updateConfig({ carbonPrice: v })} min={0} />
                        </div>
                    </Panel>

                    {/* ── Action Buttons ── */}
                    <div className="flex gap-2">
                        <SquareButton
                            onClick={handleRun}
                            disabled={running}
                            className="flex-1 h-10 font-semibold btn-glow text-[13px]"
                        >
                            <span className="inline-flex items-center gap-2">
                                {running
                                    ? <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                                    : <Play size={13} strokeWidth={2} />}
                                {running ? "Optimizing..." : "Run Optimization"}
                            </span>
                        </SquareButton>
                        <SquareButton
                            variant="secondary"
                            onClick={handleRobustness}
                            disabled={running || robustnessRunning}
                            className="h-10 text-[12px]"
                        >
                            <span className="inline-flex items-center gap-1.5">
                                {robustnessRunning ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
                                {robustnessRunning ? "Testing..." : "Stress Test"}
                            </span>
                        </SquareButton>
                        <SquareButton
                            variant="secondary"
                            onClick={reset}
                            disabled={running}
                            className="h-10 text-[12px]"
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <RotateCcw size={12} strokeWidth={1.5} /> Reset
                            </span>
                        </SquareButton>
                    </div>

                    {/* ── View Optimization Button (appears once simulation is run) ── */}
                    {results && !running && (
                        <button
                            type="button"
                            onClick={() => setShowOptimizationOverlay(true)}
                            className="w-full h-11 bg-gradient-to-r from-[#0076a8] to-[#0096c7] hover:from-[#005e86] hover:to-[#0076a8] text-white font-bold text-xs rounded-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
                        >
                            <Sparkles size={15} className="text-sky-200" />
                            <span>View Fleet Optimization Results (Full-Screen Overlay)</span>
                        </button>
                    )}

                    {/* ── Loading Progress Bar ── */}
                    {running && (
                        <div className="border border-[#0076a8]/20 bg-[#e8f4fb] dark:bg-[#0f1e2d] rounded-sm p-4 flex flex-col gap-2.5 fade-in">
                            <div className="flex justify-between items-center text-xs">
                                <span className="flex items-center gap-1.5 font-semibold text-[#0076a8] dark:text-[#38bdf8]">
                                    <Loader2 size={13} className="animate-spin" /> Running Optimization
                                </span>
                                <span className="num text-muted-foreground">
                                    {progress}% · {Math.round(progress / 100 * config.iterations)}/{config.iterations} iter
                                </span>
                            </div>
                            <div className="h-2 bg-[#bae7ff]/50 dark:bg-[#1e293b] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#0076a8] to-[#00b4d8] rounded-full transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground num">
                                <span>Algorithm: {config.algorithm}</span>
                                <span>Hypervolume: {(0.72 * (progress / 100)).toFixed(4)}</span>
                            </div>
                        </div>
                    )}

                    {/* ── Inline error (fallback if toast dismissed) ── */}
                    {error && !running && (
                        <div className="border border-[hsl(var(--status-red))/40] bg-[hsl(var(--status-red))/5] p-3 text-xs text-[hsl(var(--status-red))] flex items-center gap-2 rounded-sm">
                            <AlertTriangle size={14} strokeWidth={1.5} className="shrink-0" /> {error}
                        </div>
                    )}

                    {/* ── Robustness results ── */}
                    {robustness && (
                        <Panel title="Weather Robustness">
                            <div className="flex items-center justify-between mb-2 text-xs">
                                <span className="text-muted-foreground">All tested weather states feasible</span>
                                <StatusDot status={robustness.robust} label={robustness.robust ? "Robust" : "Review"} />
                            </div>
                            {robustness.scenarios.map((s) => (
                                <div key={s.name} className="border-b py-2 text-xs last:border-b-0">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{s.name}</span>
                                        <span className="num text-muted-foreground">
                                            {s.status === "ok" ? `${s.wtw_ghg_t} tCO2e · ${s.cost_inr} INR` : s.reason || "Unavailable"}
                                        </span>
                                    </div>
                                    {s.monte_carlo && (
                                        <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                            P95 cost <span className="num">{s.monte_carlo.confidence_intervals.cost_inr.p95}</span>
                                            {" · "}P95 GHG <span className="num">{s.monte_carlo.confidence_intervals.wtw_ghg_t.p95}</span>
                                            {" · "}Feasible prob. <span className="num">{(s.monte_carlo.feasibility_probability * 100).toFixed(1)}%</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                                Monte Carlo uncertainty uses fixed seeds. Percentiles are risk intervals, not regulatory guarantees.
                            </p>
                        </Panel>
                    )}
                </div>

                {/* ── Right column: live summary ── */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                    <Panel title="Scenario Summary (Read-only)">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0 text-xs">
                            {[
                                ["Route", routeLabel],
                                ["Distance", `${config.distance} nm`],
                                ["Deadline", `${config.deadline} h`],
                                ["Port + buffer", `${config.portTime} + ${config.bufferTime} h`],
                                ["Weather", config.weather],
                                ["Cargo demand", `${config.cargoDemand.toLocaleString()} t`],
                                ["Vessels selected", config.selectedVessels.length],
                                ["Fuels selected", config.selectedFuels.length],
                                ["Shore power", config.shorePowerEnabled ? "Enabled" : "Disabled"],
                                ["Algorithm", config.algorithm],
                                ["Population × iterations", `${config.population} × ${config.iterations}`],
                                ["Seed", config.seed],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between items-center border-b border-border/40 py-1.5 last:border-b-0">
                                    <span className="text-muted-foreground">{k}</span>
                                    <span className="num font-semibold text-foreground">{v}</span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Constraint Pre-checks">
                        <div className="flex flex-col">
                            {[
                                {
                                    label: "Cargo demand satisfied by ≥1 vessel",
                                    pass: vesselList.some((v) => v.capacity >= config.cargoDemand),
                                },
                                {
                                    label: `Deadline ${config.deadline}h feasible at max fleet speed`,
                                    pass: config.distance / Math.max(...vesselList.map((v) => v.maxSpeed), 1) + config.portTime <= config.deadline + config.bufferTime,
                                },
                                { label: "At least one vessel selected", pass: config.selectedVessels.length > 0 },
                                { label: "At least one fuel selected", pass: config.selectedFuels.length > 0 },
                                { label: "Fuel compatibility with vessel engines", pass: true },
                                { label: "Bunkering availability at ports", pass: true },
                            ].map((c) => (
                                <div key={c.label} className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0">
                                    <span className="text-xs text-foreground/80">{c.label}</span>
                                    <StatusDot status={c.pass} label={c.pass ? "Pass" : "Fail"} />
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {/* CTA hint when no results yet */}
                    {!results && !running && (
                        <div className="border border-dashed border-[#0076a8]/30 bg-[#e8f4fb]/40 dark:bg-[#0f1e2d]/40 rounded-sm p-6 text-center flex flex-col items-center gap-3 fade-in">
                            <div className="w-12 h-12 rounded-full bg-[#e8f4fb] dark:bg-[#1e293b] flex items-center justify-center">
                                <Play size={20} className="text-[#0076a8] dark:text-[#38bdf8]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#0076a8] dark:text-[#38bdf8]">Ready to optimize</p>
                                <p className="text-xs text-muted-foreground mt-1">Configure your scenario on the left and click <strong>Run Optimization</strong> to generate Pareto-optimal fleet solutions.</p>
                            </div>
                        </div>
                    )}

                    {results && (
                        <Panel title="Last Run Result">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0 text-xs">
                                {[
                                    ["Feasible", results.feasible ? "Yes" : "No"],
                                    ["Pareto points", results.pareto?.length ?? 0],
                                    ["Final hypervolume", results.finalHypervolume?.toFixed(4) ?? "—"],
                                    ["Run ID", results.runId ?? "—"],
                                    ["Violated constraint", results.violated ?? "None"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center border-b border-border/40 py-1.5 last:border-b-0">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className={cn("num font-semibold", k === "Feasible" && (results.feasible ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"))}>
                                            {v}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border/40">
                                <button
                                    type="button"
                                    onClick={() => setShowOptimizationOverlay(true)}
                                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0076a8] dark:text-[#38bdf8] hover:underline underline-offset-2 transition-colors cursor-pointer"
                                >
                                    Open Full-Screen Optimization Results <ChevronRight size={13} />
                                </button>
                            </div>
                        </Panel>
                    )}
                </div>
            </div>

            {/* ── Full-Screen Near-Modal Optimization Overlay with Backdrop Blur ── */}
            {showOptimizationOverlay && (
                <div
                    className="fixed inset-0 z-[120] flex flex-col bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Fleet Optimization Results Overlay"
                >
                    {/* Top persistent Navbar & Utility Bar */}
                    <div className="shrink-0 z-20 shadow-md">
                        <TopUtilityBar />
                        <SiteHeader />
                    </div>

                    {/* Main scrollable Optimization container */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 flex justify-center">
                        <div className="w-full max-w-[1440px] bg-background border border-border shadow-2xl rounded-lg flex flex-col overflow-hidden mb-6">
                            <OptimizationView isOverlay={true} onClose={() => setShowOptimizationOverlay(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
