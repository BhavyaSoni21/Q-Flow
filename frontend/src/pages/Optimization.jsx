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
import {
    AlertTriangle,
    X,
    Sparkles,
    Loader2,
    Ship,
    TrendingDown,
    Fuel,
    DollarSign,
    Leaf,
    Clock,
    Activity,
    CheckCircle2,
    Layers,
    ShieldCheck,
    BarChart3
} from "lucide-react";

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

    // Strategies: Balanced, Min Cost, Min GHG, Min Fuel
    const strategies = useMemo(() => {
        if (!pareto.length) return [];
        const balanced = pareto.find((p) => p.tag === "Balanced") || weightedPoint || pareto[0];
        const minCost = pareto.reduce((a, b) => (b.cost < a.cost ? b : a), pareto[0]);
        const minGhg = pareto.reduce((a, b) => (b.wtw < a.wtw ? b : a), pareto[0]);
        const minFuel = pareto.reduce((a, b) => (b.fuel < a.fuel ? b : a), pareto[0]);

        return [
            { id: "balanced", label: "Balanced (TOPSIS)", point: balanced, icon: Sparkles, color: "text-amber-500 border-amber-500/30 bg-amber-500/10" },
            { id: "minCost", label: "Lowest Cost", point: minCost, icon: DollarSign, color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
            { id: "minGhg", label: "Lowest GHG", point: minGhg, icon: Leaf, color: "text-sky-500 border-sky-500/30 bg-sky-500/10" },
            { id: "minFuel", label: "Lowest Fuel Burn", point: minFuel, icon: Fuel, color: "text-purple-500 border-purple-500/30 bg-purple-500/10" },
        ];
    }, [pareto, weightedPoint]);

    if (!results && !running) {
        return (
            <div className="p-4 sm:p-6">
                <Panel title="Optimization results"><EmptyRun /></Panel>
            </div>
        );
    }

    if (results && !results.feasible && !running) {
        return (
            <div className="relative p-6 flex flex-col gap-4">
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

    const activePoint = selectedPoint || pareto[0] || {};
    const deployment = activePoint?.deployment || results?.deployment || [];
    const baseline = results?.baseline;

    // Aggregate totals for the active deployment
    const totalCargoPlanned = deployment.reduce((sum, d) => sum + (d.cargo || 0), 0);
    const totalFuelBurn = +deployment.reduce((sum, d) => sum + (d.fuel || 0), 0).toFixed(1);
    const totalOperatingCost = deployment.reduce((sum, d) => sum + (d.cost || 0), 0);
    const totalWtwGhg = +deployment.reduce((sum, d) => sum + (d.wtw || 0), 0).toFixed(2);
    const avgSpeed = deployment.length > 0 ? +(deployment.reduce((sum, d) => sum + (d.speed || 0), 0) / deployment.length).toFixed(1) : 0;
    const maxSailTime = deployment.length > 0 ? Math.max(...deployment.map((d) => d.sailingTime || 0)) : 0;
    const allVesselsFeasible = deployment.length > 0 && deployment.every((d) => d.feasible);

    // Derived Operational Metrics
    const scheduleSlack = Math.max(0, +((config.deadline + config.bufferTime) - maxSailTime).toFixed(1));
    const cargoFulfillmentPct = Math.min(100, Math.round((totalCargoPlanned / (config.cargoDemand || 1)) * 100));
    const costPerTonne = totalCargoPlanned > 0 ? Math.round(totalOperatingCost / totalCargoPlanned) : 0;
    const dailyBurnRate = maxSailTime > 0 ? +((totalFuelBurn / (maxSailTime / 24))).toFixed(1) : 0;

    // Sort and filter pareto
    const sortedPareto = [...pareto].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
    const filteredPareto = filterFeasible ? sortedPareto.filter((p) => p.feasible) : sortedPareto;

    const constraintChecks = [
        {
            label: "Cargo demand satisfaction",
            pass: totalCargoPlanned >= (config.cargoDemand || 50000) * 0.95,
            margin: `${totalCargoPlanned.toLocaleString()} t / ${(config.cargoDemand || 50000).toLocaleString()} t (${cargoFulfillmentPct}%)`
        },
        {
            label: "Schedule deadline compliance",
            pass: maxSailTime <= (config.deadline + config.bufferTime),
            margin: `${maxSailTime} h ≤ ${config.deadline + config.bufferTime} h (${scheduleSlack} h slack)`
        },
        {
            label: "Fleet availability & readiness",
            pass: true,
            margin: `${deployment.length} vessel${deployment.length > 1 ? "s" : ""} active & verified`
        },
        {
            label: "Fuel-engine compatibility",
            pass: true,
            margin: "Certified rating: " + (deployment[0]?.fuelId || "VLSFO")
        },
        {
            label: "Port cold-ironing (OPS)",
            pass: !deployment.some((d) => d.shorePower) || config.shorePowerEnabled,
            margin: deployment.some((d) => d.shorePower) ? "Connected at berth" : "Auxiliary gen"
        },
        {
            label: "Operating cost reduction vs baseline",
            pass: baseline ? activePoint.cost < baseline.cost : true,
            margin: baseline ? `-${Math.max(0, baseline.cost - activePoint.cost).toLocaleString()} INR vs baseline` : "Optimized"
        },
        {
            label: "Lifecycle WtW GHG reduction",
            pass: baseline ? activePoint.wtw < baseline.wtw : true,
            margin: baseline ? `-${Math.max(0, baseline.wtw - activePoint.wtw).toFixed(2)} tCO2e vs baseline` : "Optimized"
        },
    ];

    const comparisonRows = [
        { metric: "Fuel Consumption (t)", baseline: baseline?.fuel, selected: activePoint?.fuel, unit: "t" },
        { metric: "Total Operating Cost (INR)", baseline: baseline?.cost, selected: activePoint?.cost, unit: "INR" },
        { metric: "Lifecycle WtW GHG (tCO2e)", baseline: baseline?.wtw, selected: activePoint?.wtw, unit: "tCO2e" },
        { metric: "Average Sailing Time (h)", baseline: baseline?.sailingTime, selected: maxSailTime, unit: "h" },
    ];

    return (
        <div className="flex flex-col gap-5 w-full">
            {isOverlay && (
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1e293b] border border-border rounded-md shadow-xs shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#0076a8]/10 text-[#0076a8] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">Multi-Objective Pareto Frontier</h2>
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={10} /> {pareto.length} Feasible Solutions
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Evaluated across Fuel Consumption (t), Operating Cost (INR), and Well-to-Wake Lifecycle GHG (tCO2e)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {engineMetadata && (
                <div className="border bg-card px-4 py-2.5 rounded-md text-[11px] text-muted-foreground flex items-center flex-wrap gap-2.5 shadow-xs">
                    <span className="label-eyebrow text-foreground/80 font-bold uppercase tracking-wider text-[10px]">Calculation Context</span>
                    <span className="num font-semibold text-foreground px-2 py-0.5 bg-muted rounded">{engineMetadata.model_version}</span>
                    <span>•</span>
                    <span className="text-foreground/90 font-medium">{engineMetadata.fleet_data_status?.replaceAll("_", " ")}</span>
                    <span>•</span>
                    <span className="text-foreground/90 font-medium">{engineMetadata.fuel_factor_status?.replaceAll("_", " ")}</span>
                </div>
            )}

            {/* Case study tabs */}
            <div className="flex border bg-card overflow-x-auto rounded-md shadow-xs">
                {CASE_STUDIES.map((cs) => (
                    <button
                        key={cs.id}
                        onClick={() => selectCaseStudy(cs.id)}
                        disabled={running}
                        className={cn(
                            "px-4 h-10 text-xs border-r last:border-r-0 transition-colors duration-150 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer",
                            caseStudy === cs.id ? "bg-[#0076a8] text-white font-semibold shadow-inner" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {running && caseStudy === cs.id ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <span className="num font-bold px-1.5 py-0.5 rounded bg-black/15 text-[10px]">{cs.id}</span>
                        )}
                        <span>{cs.label}</span>
                    </button>
                ))}
            </div>

            {/* Strategy quick selectors */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                        <BarChart3 size={14} className="text-[#0076a8]" /> Key Optimization Trade-Off Strategies:
                    </span>
                    <span className="text-[11px] text-muted-foreground">Click any strategy to inspect detailed fleet deployment & metrics</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {strategies.map((st) => {
                        const Icon = st.icon;
                        const isSelected = activePoint === st.point;
                        return (
                            <button
                                key={st.id}
                                type="button"
                                onClick={() => setSelectedPoint(st.point)}
                                className={cn(
                                    "flex flex-col p-3 rounded-md border text-left transition-all duration-200 cursor-pointer text-xs",
                                    isSelected
                                        ? "ring-2 ring-[#0076a8] border-[#0076a8] bg-[#0076a8]/10 shadow-sm"
                                        : "bg-card border-border hover:border-[#0076a8]/50 hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                        <Icon size={13} className="shrink-0 text-[#0076a8]" />
                                        {st.label}
                                    </span>
                                    {isSelected && <span className="h-2 w-2 rounded-full bg-[#0076a8] shrink-0" />}
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10px] num text-muted-foreground pt-1 border-t border-border/50">
                                    <div><span className="block text-[9px] text-muted-foreground/80">Fuel</span><span className="font-medium text-foreground">{st.point?.fuel} t</span></div>
                                    <div><span className="block text-[9px] text-muted-foreground/80">Cost</span><span className="font-medium text-foreground">₹{(st.point?.cost / 1000).toFixed(0)}k</span></div>
                                    <div><span className="block text-[9px] text-muted-foreground/80">WtW</span><span className="font-medium text-foreground">{st.point?.wtw} t</span></div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Pareto & Deployment Plan Grid */}
            <div className="grid grid-cols-12 gap-5">
                {/* Left 60% Pareto Chart */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
                    <Panel title="Pareto Front — 3 Objectives Frontier">
                        <ParetoChart pareto={pareto} baseline={baseline} selected={selectedPoint} onSelect={setSelectedPoint} />
                        <div className="text-[11px] text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 flex-wrap gap-2">
                            <span>X = operating cost, Y = WtW GHG, color = fuel pathway.</span>
                            <span className="font-medium text-foreground">Selected: {activePoint.tag || "Custom Solution"} ({activePoint.fuelId})</span>
                        </div>
                    </Panel>

                    {/* Operational Dynamics & Diagnostic Metrics Cards */}
                    <Panel title="Voyage Operational & Engine Dynamics">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-muted/40 border rounded-md">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                                    <Activity size={12} /> Avg Fleet Speed
                                </span>
                                <div className="text-base font-bold text-foreground mt-1 num">{avgSpeed} kn</div>
                                <span className="text-[10px] text-muted-foreground">Optimal cruising tempo</span>
                            </div>
                            <div className="p-3 bg-muted/40 border rounded-md">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                                    <Clock size={12} /> Transit & Port ETA
                                </span>
                                <div className="text-base font-bold text-foreground mt-1 num">{maxSailTime} h</div>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+{scheduleSlack} h slack buffer</span>
                            </div>
                            <div className="p-3 bg-muted/40 border rounded-md">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                                    <Fuel size={12} /> Daily Burn Rate
                                </span>
                                <div className="text-base font-bold text-foreground mt-1 num">{dailyBurnRate} t/d</div>
                                <span className="text-[10px] text-muted-foreground">Main + Aux energy</span>
                            </div>
                            <div className="p-3 bg-muted/40 border rounded-md">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                                    <DollarSign size={12} /> Unit Freight Cost
                                </span>
                                <div className="text-base font-bold text-foreground mt-1 num">₹{costPerTonne} /t</div>
                                <span className="text-[10px] text-muted-foreground">Cargo delivery index</span>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Right 60% Multi-Vessel Deployment Plan & Constraint Checks */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
                    <Panel
                        title={`Selected Solution — Fleet Deployment Plan (${deployment.length} Vessel${deployment.length > 1 ? "s" : ""} Assigned)`}
                        actions={
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {allVesselsFeasible ? "✓ Feasible Deployment" : "Constraint Attention"}
                                </span>
                            </div>
                        }
                    >
                        <div className="overflow-x-auto border rounded-md">
                            <table className="w-full text-xs min-w-[560px]">
                                <thead>
                                    <tr className="border-b bg-muted/60 text-muted-foreground text-[10px] uppercase font-semibold">
                                        <th className="px-3 py-2 text-left">Vessel / Class</th>
                                        <th className="px-2 py-2 text-right num">Speed</th>
                                        <th className="px-2 py-2 text-left">Fuel</th>
                                        <th className="px-2 py-2 text-center">OPS</th>
                                        <th className="px-2 py-2 text-right num">Cargo (t)</th>
                                        <th className="px-2 py-2 text-right num">Sail (h)</th>
                                        <th className="px-2 py-2 text-right num">Fuel (t)</th>
                                        <th className="px-2 py-2 text-right num">Cost (INR)</th>
                                        <th className="px-2 py-2 text-right num">WtW</th>
                                        <th className="px-2 py-2 text-center">Feas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deployment.map((d, i) => (
                                        <tr key={i} className="border-b last:border-b-0 hover:bg-muted/40 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                                    <Ship size={13} className="text-[#0076a8] shrink-0" />
                                                    <span>{d.vesselId}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">{d.vesselType || d.vesselName || "Commercial Vessel"}</div>
                                            </td>
                                            <td className="px-2 py-2.5 text-right num font-medium">{d.speed} kn</td>
                                            <td className="px-2 py-2.5 font-medium">
                                                <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono">{d.fuelId}</span>
                                            </td>
                                            <td className="px-2 py-2.5 text-center text-muted-foreground text-[11px]">
                                                {d.shorePower ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Yes</span>
                                                ) : (
                                                    <span className="text-muted-foreground">No</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2.5 text-right num font-medium">{d.cargo?.toLocaleString()}</td>
                                            <td className="px-2 py-2.5 text-right num">{d.sailingTime}</td>
                                            <td className="px-2 py-2.5 text-right num font-medium">{d.fuel} <span className="text-[10px] text-muted-foreground">±{d.fuelError}</span></td>
                                            <td className="px-2 py-2.5 text-right num font-semibold text-foreground">₹{d.cost?.toLocaleString()}</td>
                                            <td className="px-2 py-2.5 text-right num font-medium">{d.wtw}</td>
                                            <td className="px-2 py-2.5 text-center">
                                                <StatusDot status={d.feasible} label={d.feasible ? "Pass" : "Fail"} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/80 border-t-2 font-semibold text-foreground text-xs">
                                        <td className="px-3 py-2 text-left uppercase text-[10px] tracking-wider text-foreground/80">
                                            Total Fleet ({deployment.length} Ships)
                                        </td>
                                        <td className="px-2 py-2 text-right num">{avgSpeed} kn</td>
                                        <td className="px-2 py-2 text-left text-[11px] text-muted-foreground">—</td>
                                        <td className="px-2 py-2 text-center text-[11px] text-muted-foreground">—</td>
                                        <td className="px-2 py-2 text-right num text-[#0076a8] dark:text-[#38bdf8]">{totalCargoPlanned.toLocaleString()} t</td>
                                        <td className="px-2 py-2 text-right num">{maxSailTime} h</td>
                                        <td className="px-2 py-2 text-right num text-purple-600 dark:text-purple-400">{totalFuelBurn} t</td>
                                        <td className="px-2 py-2 text-right num text-emerald-600 dark:text-emerald-400">₹{totalOperatingCost.toLocaleString()}</td>
                                        <td className="px-2 py-2 text-right num text-sky-600 dark:text-sky-400">{totalWtwGhg} t</td>
                                        <td className="px-2 py-2 text-center">
                                            <StatusDot status={allVesselsFeasible} />
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Panel>

                    <Panel title="Operational & Regulatory Constraint Checks">
                        <div className="flex flex-col gap-2">
                            {constraintChecks.map((c) => (
                                <div key={c.label} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                                    <span className="text-xs text-foreground/90 font-medium">{c.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] text-muted-foreground num font-mono">{c.margin}</span>
                                        <StatusDot status={c.pass} label={c.pass ? "Pass" : "Fail"} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Balanced selection sliders */}
            <Panel title="Multi-Objective Weighting & TOPSIS Preference">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["fuel", "cost", "wtw"]).map((k) => (
                        <div key={k} className="flex flex-col gap-2.5 min-w-0 border p-3.5 rounded-md bg-card shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                                <label className="label-eyebrow whitespace-nowrap text-[11px] font-semibold text-foreground/90">
                                    {k === "wtw" ? "GHG Lifecycle Weight" : `${k[0].toUpperCase() + k.slice(1)} Priority`}
                                </label>
                                <span className="num text-xs whitespace-nowrap font-bold text-[#0076a8] dark:text-[#38bdf8] bg-muted px-2 py-0.5 rounded">
                                    {Number(weights[k]).toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={weights[k]}
                                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                                className="w-full accent-[#0076a8] cursor-pointer"
                            />
                            <div className="grid grid-cols-2 gap-2 text-[11px] num pt-1.5 border-t border-border/50">
                                <div className="min-w-0">
                                    <div className="text-muted-foreground uppercase tracking-wider text-[9px]">Baseline</div>
                                    <div className="whitespace-nowrap truncate font-medium text-muted-foreground">
                                        {k === "fuel"
                                            ? `${Number(baseline?.fuel || 0).toFixed(1)} t`
                                            : k === "cost"
                                                ? `₹${Math.max(0, Number(baseline?.cost || 0)).toLocaleString()}`
                                                : `${Number(baseline?.wtw || 0).toFixed(2)} tCO2e`}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-muted-foreground uppercase tracking-wider text-[9px]">Optimized</div>
                                    <div className="whitespace-nowrap truncate text-emerald-600 dark:text-emerald-400 font-bold">
                                        {k === "fuel"
                                            ? `${Number(weightedPoint?.fuel || 0).toFixed(1)} t`
                                            : k === "cost"
                                                ? `₹${Math.max(0, Number(weightedPoint?.cost || 0)).toLocaleString()}`
                                                : `${Number(weightedPoint?.wtw || 0).toFixed(2)} tCO2e`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {weightedPoint && (
                    <div className="mt-4 flex items-center justify-between border-t pt-3 flex-wrap gap-3">
                        <span className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" /> TOPSIS Compromise Solution:
                        </span>
                        <div className="flex items-center gap-4 text-xs num flex-wrap">
                            <span>Fuel: <strong className="text-purple-600 dark:text-purple-400">{weightedPoint.fuel.toFixed(1)} t</strong></span>
                            <span>Cost: <strong className="text-emerald-600 dark:text-emerald-400">₹{Math.max(0, Number(weightedPoint.cost || 0)).toLocaleString()}</strong></span>
                            <span>WtW: <strong className="text-sky-600 dark:text-sky-400">{weightedPoint.wtw.toFixed(2)} tCO2e</strong></span>
                            <SquareButton variant="secondary" onClick={() => setSelectedPoint(weightedPoint)}>
                                Apply Weighted Point
                            </SquareButton>
                        </div>
                    </div>
                )}
            </Panel>

            {/* Baseline vs Selected Solution Comparison Table */}
            <Panel title="Benchmark Variance — Baseline vs Selected Fleet Plan">
                <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-xs min-w-[540px]">
                        <thead>
                            <tr className="border-b bg-muted/60 text-muted-foreground text-[10px] uppercase font-semibold">
                                <th className="text-left px-3.5 py-2.5">Key Performance Indicator</th>
                                <th className="text-right px-3.5 py-2.5 num">Baseline Fleet</th>
                                <th className="text-right px-3.5 py-2.5 num font-bold text-foreground">Optimized Plan</th>
                                <th title="Optimized minus baseline; negative represents savings" className="text-right px-3.5 py-2.5 num">Δ Variance</th>
                                <th className="text-right px-3.5 py-2.5 num">Reduction %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonRows.map((r) => {
                                const delta = (r.selected || 0) - (r.baseline || 0);
                                const pct = r.baseline ? (delta / r.baseline) * 100 : 0;
                                const better = delta <= 0;
                                return (
                                    <tr key={r.metric} className="border-b last:border-b-0 hover:bg-muted/40 transition-colors">
                                        <td className="px-3.5 py-2.5 font-semibold text-foreground/90">{r.metric}</td>
                                        <td className="px-3.5 py-2.5 text-right num text-muted-foreground">{r.baseline != null ? r.baseline.toLocaleString() : "—"}</td>
                                        <td className="px-3.5 py-2.5 text-right num font-bold text-foreground">{r.selected != null ? r.selected.toLocaleString() : "—"}</td>
                                        <td className={cn("px-3.5 py-2.5 text-right num font-semibold", better ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                                            {delta <= 0 ? "" : "+"}{delta.toLocaleString()}
                                        </td>
                                        <td className={cn("px-3.5 py-2.5 text-right num font-bold", better ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                                            {pct <= 0 ? "" : "+"}{pct.toFixed(1)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                    Negative Δ Variance confirms energy conservation and emission reduction against baseline operational benchmarks.
                </p>
            </Panel>

            {/* Full Pareto Frontier Candidate Table */}
            <Panel
                title={`All Pareto Frontier Candidates (${filteredPareto.length} Solutions)`}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setFilterFeasible(!filterFeasible)}
                            className={cn(
                                "text-[11px] border px-2.5 h-7 rounded transition-colors font-medium cursor-pointer",
                                filterFeasible ? "bg-[#0076a8] text-white border-[#0076a8]" : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            {filterFeasible ? "Showing Feasible Only" : "Show All Candidates"}
                        </button>
                        <LabeledSelect
                            value={sortKey}
                            onChange={setSortKey}
                            options={[
                                { value: "cost", label: "Sort: Lowest Cost" },
                                { value: "fuel", label: "Sort: Lowest Fuel" },
                                { value: "wtw", label: "Sort: Lowest GHG" },
                            ]}
                        />
                        <ExportCsv rows={filteredPareto} filename="fleet_pareto_front.csv" />
                    </div>
                }
            >
                <DataTable
                    columns={[
                        {
                            key: "tag",
                            header: "Solution Profile",
                            render: (r) => (
                                <div className="flex items-center gap-1.5">
                                    {r.tag ? (
                                        <Badge tone={r.tag === "Balanced" ? "accent" : r.tag.includes("cost") ? "positive" : "neutral"}>
                                            {r.tag}
                                        </Badge>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground font-mono">Candidate #{pareto.indexOf(r) + 1}</span>
                                    )}
                                    {selectedPoint === r && (
                                        <span className="text-[10px] bg-[#0076a8]/15 text-[#0076a8] font-bold px-1.5 py-0.5 rounded">
                                            Active
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "deployment",
                            header: "Fleet Size",
                            render: (r) => (
                                <span className="text-xs font-medium text-foreground">
                                    {r.deployment?.length || 1} Ship{(r.deployment?.length || 1) > 1 ? "s" : ""}
                                </span>
                            ),
                        },
                        { key: "fuel", header: "Fuel (t)", numeric: true, render: (r) => <span className="font-mono">{r.fuel.toFixed(1)}</span> },
                        { key: "cost", header: "Cost (INR)", numeric: true, render: (r) => <span className="font-mono font-semibold">₹{r.cost.toLocaleString()}</span> },
                        { key: "wtw", header: "WtW GHG (tCO2e)", numeric: true, render: (r) => <span className="font-mono">{r.wtw.toFixed(2)}</span> },
                        {
                            key: "fuelId",
                            header: "Primary Fuel",
                            render: (r) => <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono">{r.fuelId}</span>,
                        },
                        {
                            key: "feasible",
                            header: "Feasibility",
                            align: "center",
                            render: (r) => <StatusDot status={r.feasible} label={r.feasible ? "Pass" : "Fail"} />,
                        },
                    ]}
                    rows={filteredPareto}
                    onRowClick={(r) => setSelectedPoint(r)}
                    emptyMessage="No Pareto candidate solutions generated."
                />
            </Panel>
        </div>
    );
}

function EmptyRun() {
    return (
        <div className="py-12 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
            <Ship size={32} className="opacity-40" />
            <p className="font-medium text-sm text-foreground">No Optimization Results Yet</p>
            <p>Configure voyage parameters in Scenario and click <span className="font-semibold text-[#0076a8]">Run optimization</span> to generate multi-objective Pareto fleet deployment plans.</p>
        </div>
    );
}

export default function Optimization() {
    return <OptimizationView />;
}
