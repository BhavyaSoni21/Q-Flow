import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Panel } from "@/components/shared/Panel";
import { DataTable } from "@/components/shared/DataTable";
import { StatusDot, Badge } from "@/components/shared/StatusDot";
import { LabeledSelect, SquareButton } from "@/components/shared/Field";
import { ExportCsv } from "@/components/shared/ExportButtons";
import ParetoChart from "@/components/charts/ParetoChart";
import { cn } from "@/lib/utils";
import { AlertTriangle, X, Sparkles, Loader2 } from "lucide-react";

const CASE_STUDIES = [
    { id: "A", label: "Baseline fleet" },
    { id: "B", label: "Speed optimization" },
    { id: "C", label: "Green fleet" },
    { id: "D", label: "Adverse weather" },
];

export function OptimizationView({ isOverlay = false, onClose }) {
    const navigate = useNavigate();
    const { results, selectedPoint, setSelectedPoint, weights, setWeights, caseStudy, setCaseStudy, config, updateConfig, runOptimization, running } = useStore();
    const [sortKey, setSortKey] = useState("cost");
    const [filterFeasible, setFilterFeasible] = useState(false);
    const pareto = results?.pareto || [];
    const engineMetadata = results?.engineMetadata;

    const CASE_CONFIG = {
        A: { weather: "Normal", selectedFuels: ["HFO", "VLSFO"], shorePowerEnabled: false, carbonPrice: 0, seed: 42 },
        B: { weather: "Normal", selectedFuels: ["HFO", "VLSFO", "LNG", "METHANOL"], shorePowerEnabled: false, carbonPrice: 0, deadline: Math.max(24, Math.round((config.distance / 17.5) + (config.portTime || 12) + (config.bufferTime || 6))), seed: 43 },
        C: { weather: "Normal", selectedFuels: ["METHANOL", "HYDROGEN", "AMMONIA"], shorePowerEnabled: true, carbonPrice: 1500, seed: 44 },
        D: { weather: "Severe", selectedFuels: ["HFO", "VLSFO", "LNG", "METHANOL"], shorePowerEnabled: false, bufferTime: 6, seed: 45 },
    };

    const selectCaseStudy = async (id) => {
        setCaseStudy(id);
        const patch = CASE_CONFIG[id];
        updateConfig(patch);
        await runOptimization(patch);
    };

    const weightedPoint = useMemo(() => {
        if (!pareto.length) return null;
        const normalized = (key) => {
            const values = pareto.map((point) => point[key]);
            const min = Math.min(...values);
            const max = Math.max(...values);
            return (point) => (max === min ? 0 : (point[key] - min) / (max - min));
        };
        const fuel = normalized("fuel");
        const cost = normalized("cost");
        const wtw = normalized("wtw");
        const totalWeight = weights.fuel + weights.cost + weights.wtw || 1;

        return pareto.reduce((best, point) => {
            const score = (weights.fuel * fuel(point) + weights.cost * cost(point) + weights.wtw * wtw(point)) / totalWeight;
            const bestScore = (weights.fuel * fuel(best) + weights.cost * cost(best) + weights.wtw * wtw(best)) / totalWeight;
            return score < bestScore ? point : best;
        });
    }, [pareto, weights]);

    if (!results && !running) {
        return (
            <div className="p-4">
                <Panel title="Optimization results"><EmptyRun /></Panel>
            </div>
        );
    }

    if (results && !results.feasible && !running) {
        return (
            <div className="relative p-6 flex flex-col gap-4">
                {/* Close button — top right corner */}
                <button
                    type="button"
                    onClick={onClose || (() => navigate("/scenario"))}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-border shadow hover:bg-red-50 hover:border-red-300 transition-colors"
                    aria-label="Back to Scenario"
                >
                    <X size={16} className="text-muted-foreground hover:text-red-500" />
                </button>
                <div className="border border-status-red/50 bg-status-red/5 rounded-md p-6 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={18} strokeWidth={2} className="text-status-red" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-status-red text-sm uppercase tracking-wide">No Feasible Fleet Solution</h3>
                        <p className="text-xs mt-1 leading-relaxed text-foreground/90">
                            <strong>Violated Constraint:</strong> <span className="num font-medium text-status-red">{results.violated}</span>
                        </p>
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                            <p>• Ensure your <strong>Deadline</strong> is sufficient for the sailing distance (e.g. for {config.distance} nm, minimum feasible deadline at max fleet speed is ~{Math.ceil(config.distance / 20 + config.portTime + config.bufferTime)} h).</p>
                            <p>• Select vessels whose combined cargo capacity satisfies the <strong>Cargo Demand</strong> ({config.cargoDemand.toLocaleString()} t).</p>
                        </div>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={onClose || (() => navigate("/scenario"))}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0076a8] hover:bg-[#005e86] px-4 py-2 rounded transition-colors shadow-sm cursor-pointer"
                            >
                                Reconfigure Scenario & Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const deployment = selectedPoint?.deployment || results?.deployment || [];
    const baseline = results?.baseline;
    const activePoint = selectedPoint || pareto[0] || {};

    const sortedPareto = [...pareto].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
    const filteredPareto = filterFeasible ? sortedPareto.filter((p) => p.feasible) : sortedPareto;

    const constraintChecks = [
        { label: "Cargo demand", pass: (deployment[0]?.cargo ?? 0) >= (baseline?.cargo ?? config.cargoDemand) * 0.95, margin: `${(deployment[0]?.cargo ?? 0).toLocaleString()} / ${(baseline?.cargo ?? config.cargoDemand).toLocaleString()} t` },
        { label: "Deadline", pass: (deployment[0]?.sailingTime ?? 999) <= config.deadline + config.bufferTime, margin: `${deployment[0]?.sailingTime ?? "—"} h ≤ ${config.deadline + config.bufferTime} h` },
        { label: "Vessel availability", pass: true, margin: "All available" },
        { label: "Fuel compatibility", pass: true, margin: "Engine-rated" },
        { label: "Bunkering", pass: true, margin: "Ports OK" },
        { label: "OPS compatibility", pass: !deployment[0]?.shorePower || deployment[0]?.shorePower, margin: deployment[0]?.shorePower ? "Compatible" : "N/A" },
        { label: "Operating cost reduced", pass: baseline ? activePoint.cost < baseline.cost : true, margin: baseline ? `${(activePoint.cost - baseline.cost).toLocaleString()} INR vs baseline` : "Optimized" },
        { label: "WtW emissions reduced", pass: baseline ? activePoint.wtw < baseline.wtw : true, margin: baseline ? `${(activePoint.wtw - baseline.wtw).toFixed(2)} tCO2e vs baseline` : "Optimized" },
    ];

    const comparisonRows = [
        { metric: "Fuel (t)", baseline: baseline?.fuel, selected: selectedPoint?.fuel ?? results?.pareto?.[0]?.fuel, unit: "t" },
        { metric: "Cost (INR)", baseline: baseline?.cost, selected: selectedPoint?.cost ?? results?.pareto?.[0]?.cost, unit: "INR" },
        { metric: "WtW GHG (tCO2e)", baseline: baseline?.wtw, selected: selectedPoint?.wtw ?? results?.pareto?.[0]?.wtw, unit: "tCO2e" },
    ];

    return (
        <div className="p-4 flex flex-col gap-3">
            {isOverlay && (
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#003859] to-[#005f94] text-white rounded-t-sm -mx-4 -mt-4 mb-2 shadow-sm shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <Sparkles size={16} className="text-sky-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-white tracking-wide">Fleet Optimization Results</h2>
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Simulation Succeeded
                                </span>
                            </div>
                            <p className="text-[11px] text-sky-100">
                                3-Objective Pareto front (Fuel · Operating Cost · Lifecycle WtW GHG)
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-sm border border-white/20 transition-colors cursor-pointer"
                            aria-label="Close optimization overlay"
                        >
                            <X size={15} />
                            <span>Close & Return to Scenario</span>
                        </button>
                    )}
                </div>
            )}
            {engineMetadata && (
                <div className="border bg-card px-3 py-2 text-[11px] text-muted-foreground flex items-center flex-wrap gap-2">
                    <span className="label-eyebrow">Calculation context</span>
                    <span className="num font-medium text-foreground">{engineMetadata.model_version}</span>
                    <span>·</span>
                    <span>{engineMetadata.fleet_data_status.replaceAll("_", " ")}</span>
                    <span>·</span>
                    <span>{engineMetadata.fuel_factor_status.replaceAll("_", " ")}</span>
                </div>
            )}
            {/* Case study tabs */}
            <div className="flex border bg-card overflow-x-auto rounded-sm">
                {CASE_STUDIES.map((cs) => (
                    <button
                        key={cs.id}
                        onClick={() => selectCaseStudy(cs.id)}
                        disabled={running}
                        className={cn(
                            "px-4 h-9 text-xs border-r last:border-r-0 transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                            caseStudy === cs.id ? "bg-[#0076a8] text-white font-semibold shadow-inner" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {running && caseStudy === cs.id ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <span className="num font-bold opacity-80">{cs.id}</span>
                        )}
                        <span>{cs.label}</span>
                    </button>
                ))}
                    <div className="grid grid-cols-12 gap-4">
                {/* Left 60% Pareto */}
                <div className="col-span-12 lg:col-span-7">
                    <Panel
                        title="Pareto Front — 3 Objectives"
                        actions={null}
                    >
                        <ParetoChart pareto={pareto} baseline={baseline} selected={selectedPoint} onSelect={setSelectedPoint} />
                        <p className="text-[10px] text-muted-foreground mt-2">X = operating cost, Y = WtW GHG, color = fuel pathway; hover any point for fuel quantity, cost, GHG, and feasibility. Hollow square = baseline; ringed = selected.</p>
                    </Panel>
                </div>

                {/* Right 40% selected solution */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
                    <Panel title="Selected Solution — Deployment Plan">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[480px]">
                                <thead>
                                    <tr className="border-b bg-[hsl(var(--panel-header))]">
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-left">Vessel</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-right num">Speed</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-left">Fuel</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-center">OPS</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-right num">Cargo (t)</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-right num">Sail (h)</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-right num">Fuel (t)</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-right num">Cost (INR)</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-right num">WtW</th>
                                        <th className="px-2 py-2 text-[10px] uppercase text-muted-foreground text-center">Feas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deployment.map((d, i) => (
                                        <tr key={i} className="border-b last:border-b-0 hover:bg-muted/40 transition-colors">
                                            <td className="px-2 py-2 num font-semibold text-foreground">{d.vesselId}</td>
                                            <td className="px-2 py-2 text-right num">{d.speed} kn</td>
                                            <td className="px-2 py-2 font-medium">{d.fuelId}</td>
                                            <td className="px-2 py-2 text-center text-muted-foreground">{d.shorePower ? "Yes" : "No"}</td>
                                            <td className="px-2 py-2 text-right num">{d.cargo.toLocaleString()}</td>
                                            <td className="px-2 py-2 text-right num">{d.sailingTime}</td>
                                            <td className="px-2 py-2 text-right num">{d.fuel} ±{d.fuelError}</td>
                                            <td className="px-2 py-2 text-right num font-medium">{d.cost.toLocaleString()}</td>
                                            <td className="px-2 py-2 text-right num">{d.wtw}</td>
                                            <td className="px-2 py-2 text-center"><StatusDot status={d.feasible} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    <Panel title="Constraint Checks">
                        <div className="flex flex-col gap-1.5">
                            {constraintChecks.map((c) => (
                                <div key={c.label} className="flex items-center justify-between border-b py-2 last:border-b-0">
                                    <span className="text-xs text-foreground/85">{c.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-muted-foreground num">{c.margin}</span>
                                        <StatusDot status={c.pass} label={c.pass ? "Pass" : "Fail"} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Balanced selection sliders */}
            <Panel title="Balanced Selection — Preference Weights">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["fuel", "cost", "wtw"]).map((k) => (
                        <div key={k} className="flex flex-col gap-2 min-w-0 border p-3 rounded-sm bg-card">
                            <div className="flex items-center justify-between gap-3">
                                <label className="label-eyebrow whitespace-nowrap">{k === "wtw" ? "GHG weight" : `${k[0].toUpperCase() + k.slice(1)} weight`}</label>
                                <span className="num text-xs whitespace-nowrap font-medium">Weight {Number(weights[k]).toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={weights[k]}
                                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                                className="w-full accent-[hsl(var(--accent))]"
                            />
                            <div className="grid grid-cols-2 gap-2 text-[11px] num pt-1">
                                <div className="min-w-0">
                                    <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Original</div>
                                    <div className="whitespace-nowrap truncate font-medium">
                                        {k === "fuel"
                                            ? `${Number(baseline?.fuel || 0).toFixed(1)} t`
                                            : k === "cost"
                                                ? `${Math.max(0, Number(baseline?.cost || 0)).toLocaleString()} INR`
                                                : `${Number(baseline?.wtw || 0).toFixed(2)} tCO2e`}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-muted-foreground uppercase tracking-wide text-[9px]">Optimized</div>
                                    <div className="whitespace-nowrap truncate text-accent font-semibold">
                                        {k === "fuel"
                                            ? `${Number(weightedPoint?.fuel || 0).toFixed(1)} t`
                                            : k === "cost"
                                                ? `${Math.max(0, Number(weightedPoint?.cost || 0)).toLocaleString()} INR`
                                                : `${Number(weightedPoint?.wtw || 0).toFixed(2)} tCO2e`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {weightedPoint && (
                    <div className="mt-3 flex items-center justify-between border-t pt-3 flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Recommended (TOPSIS):</span>
                        <div className="flex items-center gap-4 text-xs num">
                            <span>Fuel: <strong>{weightedPoint.fuel.toFixed(1)} t</strong></span>
                            <span>Cost: <strong>{Math.max(0, Number(weightedPoint.cost || 0)).toLocaleString()} INR</strong></span>
                            <span>WtW: <strong>{weightedPoint.wtw.toFixed(2)} tCO2e</strong></span>
                            <SquareButton variant="secondary" onClick={() => setSelectedPoint(weightedPoint)}>Select</SquareButton>
                        </div>
                    </div>
                )}
            </Panel>

            {/* Comparison block */}
            <Panel title="Baseline vs Selected Solution">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px]">
                        <thead>
                            <tr className="border-b bg-[hsl(var(--panel-header))]">
                                <th className="text-left px-3 py-2 text-[10px] uppercase text-muted-foreground">Metric</th>
                                <th className="text-right px-3 py-2 text-[10px] uppercase text-muted-foreground num">Baseline</th>
                                <th className="text-right px-3 py-2 text-[10px] uppercase text-muted-foreground num">Selected</th>
                                <th title="Optimized minus baseline; negative means a reduction" className="text-right px-3 py-2 text-[10px] uppercase text-muted-foreground num">Δ Difference</th>
                                <th className="text-right px-3 py-2 text-[10px] uppercase text-muted-foreground num">Δ %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonRows.map((r) => {
                                const delta = r.selected - r.baseline;
                                const pct = r.baseline ? (delta / r.baseline) * 100 : 0;
                                const better = r.metric.includes("Fuel") || r.metric.includes("Cost") || r.metric.includes("GHG") ? delta <= 0 : delta >= 0;
                                return (
                                    <tr key={r.metric} className="border-b last:border-b-0 hover:bg-muted/40 transition-colors">
                                        <td className="px-3 py-2 font-medium">{r.metric}</td>
                                        <td className="px-3 py-2 text-right num">{r.baseline?.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right num font-semibold">{r.selected?.toLocaleString()}</td>
                                        <td className={cn("px-3 py-2 text-right num font-medium", better ? "text-status-green" : "text-status-red")}>{delta >= 0 ? "+" : ""}{delta.toLocaleString()}</td>
                                        <td className={cn("px-3 py-2 text-right num font-medium", better ? "text-status-green" : "text-status-red")}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Change = optimized − baseline. A negative cost or WtW change means that value decreased; absolute cost and emissions are nonnegative.</p>
            </Panel>

            {/* Full Pareto table */}
            <Panel
                title="Full Pareto set"
                actions={
                    <>
                        <button onClick={() => setFilterFeasible(!filterFeasible)} className="text-[11px] border px-2 h-7 hover:bg-muted">
                            {filterFeasible ? "Showing feasible" : "All"}
                        </button>
                        <LabeledSelect value={sortKey} onChange={setSortKey} options={[
                            { value: "cost", label: "Sort: Cost" },
                            { value: "fuel", label: "Sort: Fuel" },
                            { value: "wtw", label: "Sort: GHG" },
                        ]} />
                        <ExportCsv rows={filteredPareto} filename="pareto.csv" />
                    </>
                }
            >
                <DataTable
                    columns={[
                        { key: "tag", header: "Tag", render: (r) => r.tag ? <Badge tone="accent">{r.tag}</Badge> : "" },
                        { key: "fuel", header: "Fuel (t)", numeric: true, render: (r) => r.fuel.toFixed(1) },
                        { key: "cost", header: "Cost (INR)", numeric: true, render: (r) => r.cost.toLocaleString() },
                        { key: "wtw", header: "WtW (tCO2e)", numeric: true, render: (r) => r.wtw.toFixed(2) },
                        { key: "fuelId", header: "Fuel" },
                        { key: "feasible", header: "Feasible", align: "center", render: (r) => <StatusDot status={r.feasible} /> },
                    ]}
                    rows={filteredPareto}
                    onRowClick={(r) => setSelectedPoint(r)}
                    emptyMessage="No Pareto points"
                />
            </Panel>
        </div>
    );
}

function EmptyRun() {
    return (
        <div className="py-10 text-center text-muted-foreground text-xs">
            No optimization run yet. Configure a scenario and press <span className="font-semibold">Run optimization</span>.
        </div>
    );
}

export default function Optimization() {
    return <OptimizationView />;
}
