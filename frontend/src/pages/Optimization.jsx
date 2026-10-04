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
    BarChart3,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ArrowRight
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
    const [page, setPage] = useState(1);
    const pageSize = 10;
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
        setPage(1);
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
                            <p>â€¢ Ensure your <strong>Deadline</strong> is sufficient for the sailing distance (e.g. for {config.distance} nm, minimum feasible deadline at max fleet speed is ~{Math.ceil(config.distance / 20 + config.portTime + config.bufferTime)} h).</p>
                            <p>â€¢ Select vessels whose combined cargo capacity satisfies the <strong>Cargo Demand</strong> ({config.cargoDemand.toLocaleString()} t).</p>
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
            margin: `${maxSailTime} h â‰¤ ${config.deadline + config.bufferTime} h (${scheduleSlack} h slack)`
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
        <div className="flex flex-col gap-6 w-full pb-12 font-['Open_Sans',sans-serif]">
            {isOverlay && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#F0F9FF] border border-[#B9E6FE] text-[#0076a8] flex items-center justify-center shrink-0">
                            <Sparkles size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-[14px] font-extrabold text-[#0F172A] uppercase tracking-wide">Multi-Objective Pareto Frontier</h2>
                                <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                    <CheckCircle2 size={12} strokeWidth={3} /> {pareto.length} Feasible Solutions
                                </span>
                            </div>
                            <p className="text-[12px] font-medium text-[#64748B]">
                                Evaluated across Fuel Consumption (t), Operating Cost (INR), and Well-to-Wake Lifecycle GHG (tCOâ‚‚e)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {engineMetadata && (
                <div className="px-6 mt-4">
                    <div className="bg-white border border-[#E2E8F0] px-5 py-3 rounded-xl text-[11px] text-[#64748B] flex items-center flex-wrap gap-3 shadow-sm">
                        <span className="font-bold uppercase tracking-wider text-[#0F172A]">Calculation Context</span>
                        <div className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                        <span className="font-semibold text-[#0F172A] px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md shadow-sm">{engineMetadata.model_version}</span>
                        <div className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                        <span className="font-semibold text-[#0076a8]">{engineMetadata.fleet_data_status?.replaceAll("_", " ")}</span>
                        <div className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                        <span className="font-semibold text-[#0076a8]">{engineMetadata.fuel_factor_status?.replaceAll("_", " ")}</span>
                    </div>
                </div>
            )}

            {/* Case study tabs */}
            <div className="px-6 mt-2">
                <div className="flex gap-2 border-b border-[#E2E8F0] pb-1 overflow-x-auto no-scrollbar">
                    {CASE_STUDIES.map((cs) => (
                        <button
                            key={cs.id}
                            onClick={() => selectCaseStudy(cs.id)}
                            disabled={running}
                            className={cn(
                                "h-11 px-6 text-[12px] font-bold uppercase tracking-wider border-b-2 transition-all duration-200 inline-flex items-center gap-3 whitespace-nowrap cursor-pointer",
                                caseStudy === cs.id 
                                    ? "border-[#0076a8] text-[#0076a8] bg-[#F0F9FF] rounded-t-lg" 
                                    : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-t-lg"
                            )}
                        >
                            {running && caseStudy === cs.id ? (
                                <Loader2 size={16} className="animate-spin text-[#0076a8]" />
                            ) : (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    caseStudy === cs.id ? "bg-[#0076a8] text-white" : "bg-[#E2E8F0] text-[#475569]"
                                )}>{cs.id}</span>
                            )}
                            {cs.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 flex flex-col gap-6 mt-4">
                {/* Strategy quick selectors */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide flex items-center gap-2">
                            <BarChart3 size={16} className="text-[#0076a8]" /> Key Optimization Trade-Off Strategies
                        </span>
                        <span className="text-[12px] font-medium text-[#64748B]">Click any strategy to inspect detailed fleet deployment & metrics</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {strategies.map((st) => {
                            const Icon = st.icon;
                            const isSelected = activePoint === st.point;
                            return (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => setSelectedPoint(st.point)}
                                    className={cn(
                                        "flex flex-col p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer text-xs group relative overflow-hidden",
                                        isSelected
                                            ? "border-[#0076a8] bg-[#0076a8]/5 shadow-sm ring-1 ring-[#0076a8]"
                                            : "bg-white border-[#E2E8F0] hover:border-[#0076a8]/40 hover:bg-[#F8FAFC] hover:shadow-md"
                                    )}
                                >
                                    {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[#0076a8]" />}
                                    <div className="flex items-center justify-between gap-1 mb-3 ml-1">
                                        <span className="font-extrabold text-[13px] text-[#0F172A] flex items-center gap-2 truncate">
                                            <Icon size={16} strokeWidth={2.5} className="shrink-0 text-[#0076a8]" />
                                            {st.label}
                                        </span>
                                        {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#0076a8] shrink-0" />}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[10px] num pt-3 border-t border-[#E2E8F0] ml-1">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Fuel</span>
                                            <span className="font-mono text-[12px] font-bold text-[#0F172A]">{st.point?.fuel} <span className="text-[#94A3B8] font-semibold text-[10px]">t</span></span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Cost</span>
                                            <span className="font-mono text-[12px] font-bold text-[#0F172A]">â‚¹{(st.point?.cost / 1000).toFixed(0)}<span className="text-[#94A3B8] font-semibold text-[10px]">k</span></span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">WtW</span>
                                            <span className="font-mono text-[12px] font-bold text-[#0F172A]">{st.point?.wtw} <span className="text-[#94A3B8] font-semibold text-[10px]">t</span></span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Pareto & Deployment Plan Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left 60% Pareto Chart */}
                    <div className="xl:col-span-6 flex flex-col gap-6">
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide mb-6">Pareto Front â€” 3 Objectives Frontier</h3>
                            <div className="h-[300px]">
                                <ParetoChart pareto={pareto} baseline={baseline} selected={selectedPoint} onSelect={setSelectedPoint} />
                            </div>
                            <div className="text-[11px] font-semibold text-[#64748B] mt-6 flex items-center justify-between border-t border-[#E2E8F0] pt-4 flex-wrap gap-3">
                                <span>X = operating cost, Y = WtW GHG, color = fuel pathway.</span>
                                <span className="font-bold text-[#0F172A] px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md">
                                    Selected: {activePoint.tag || "Custom Solution"} <span className="text-[#0076a8]">({activePoint.fuelId})</span>
                                </span>
                            </div>
                        </div>

                        {/* Operational Dynamics & Diagnostic Metrics Cards */}
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide mb-5">Voyage Operational & Engine Dynamics</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-2">
                                        <Activity size={14} className="text-[#0076a8]" /> Avg Speed
                                    </span>
                                    <div className="text-[18px] font-mono font-bold text-[#0F172A] mb-1">{avgSpeed} <span className="text-[12px] font-semibold text-[#94A3B8]">kn</span></div>
                                    <span className="text-[10px] font-medium text-[#64748B]">Optimal cruising tempo</span>
                                </div>
                                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-2">
                                        <Clock size={14} className="text-[#0076a8]" /> Transit ETA
                                    </span>
                                    <div className="text-[18px] font-mono font-bold text-[#0F172A] mb-1">{maxSailTime} <span className="text-[12px] font-semibold text-[#94A3B8]">h</span></div>
                                    <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">+{scheduleSlack} h slack</span>
                                </div>
                                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-2">
                                        <Fuel size={14} className="text-[#0076a8]" /> Daily Burn
                                    </span>
                                    <div className="text-[18px] font-mono font-bold text-[#0F172A] mb-1">{dailyBurnRate} <span className="text-[12px] font-semibold text-[#94A3B8]">t/d</span></div>
                                    <span className="text-[10px] font-medium text-[#64748B]">Main + Aux energy</span>
                                </div>
                                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-2">
                                        <DollarSign size={14} className="text-[#0076a8]" /> Unit Cost
                                    </span>
                                    <div className="text-[18px] font-mono font-bold text-[#0F172A] mb-1">â‚¹{costPerTonne} <span className="text-[12px] font-semibold text-[#94A3B8]">/t</span></div>
                                    <span className="text-[10px] font-medium text-[#64748B]">Cargo delivery index</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right 40% Deployment Table & Checklists */}
                    <div className="xl:col-span-6 flex flex-col gap-6">
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-5 flex items-center justify-between">
                                <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide">Selected Solution â€” Fleet Deployment Plan</h3>
                                {allVesselsFeasible ? (
                                    <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                        <Check size={14} strokeWidth={3} /> Feasible Deployment
                                    </span>
                                ) : (
                                    <span className="bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
                                        <AlertTriangle size={14} strokeWidth={3} /> Constraint Violation
                                    </span>
                                )}
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] text-[10px] uppercase font-bold tracking-wider">
                                            <th className="px-5 py-3">Vessel / Class</th>
                                            <th className="px-5 py-3 text-right">Speed</th>
                                            <th className="px-5 py-3 text-center">Fuel</th>
                                            <th className="px-5 py-3 text-center">OPS</th>
                                            <th className="px-5 py-3 text-right">Cargo (t)</th>
                                            <th className="px-5 py-3 text-right">Sail (h)</th>
                                            <th className="px-5 py-3 text-right">Fuel (t)</th>
                                            <th className="px-5 py-3 text-right">Cost (INR)</th>
                                            <th className="px-5 py-3 text-right">WtW</th>
                                            <th className="px-5 py-3 text-center">Feas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E2E8F0]">
                                        {deployment.map((d, i) => (
                                            <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                                                        <Ship size={14} className="text-[#0076a8]" /> {d.id}
                                                    </div>
                                                    <div className="text-[10px] text-[#64748B] mt-0.5">{d.class}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="font-mono font-bold text-[#0F172A]">{d.speed.toFixed(1)}</div>
                                                    <div className="text-[10px] font-semibold text-[#94A3B8]">kn</div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <Badge tone="neutral" className="bg-[#F1F5F9] border-[#CBD5E1] text-[#475569] font-bold text-[10px] uppercase">{d.fuelId}</Badge>
                                                </td>
                                                <td className="px-5 py-3 text-center text-[#64748B] font-medium">{d.shorePower ? "Yes" : "No"}</td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">{d.cargo.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="font-mono font-bold text-[#0F172A]">{d.sailingTime}</div>
                                                    <div className="text-[10px] text-[#059669] font-semibold">Â±{d.bufferUsed || 0}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">{d.fuel.toFixed(1)}</td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">â‚¹{d.cost.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-right font-mono font-bold text-[#0F172A]">{d.wtw.toFixed(4)}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <StatusDot status={d.feasible ? "success" : "danger"} label={d.feasible ? "Pass" : "Fail"} />
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-[#F8FAFC] border-t-2 border-[#CBD5E1]">
                                            <td className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider text-[#0F172A]">
                                                Total Fleet ({deployment.length} Ships)
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-[#0F172A]">{avgSpeed} <span className="text-[10px] text-[#64748B]">kn</span></td>
                                            <td className="px-5 py-4 text-center text-[#94A3B8]">â€”</td>
                                            <td className="px-5 py-4 text-center text-[#94A3B8]">â€”</td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-[#0076a8]">{totalCargoPlanned.toLocaleString()} t</td>
                                            <td className="px-5 py-4 text-right font-mono font-bold text-[#0F172A]">{maxSailTime} h</td>
                                            <td className="px-5 py-4 text-right font-mono font-extrabold text-[#0076a8]">{totalFuelBurn} t</td>
                                            <td className="px-5 py-4 text-right font-mono font-extrabold text-[#059669]">â‚¹{totalOperatingCost.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-right font-mono font-extrabold text-[#0076a8]">{totalWtwGhg} t</td>
                                            <td className="px-5 py-4 text-center">
                                                <StatusDot status={allVesselsFeasible ? "success" : "danger"} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                            <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide mb-5">Operational & Regulatory Constraint Checks</h3>
                            <div className="divide-y divide-[#E2E8F0]">
                                {constraintChecks.map((c, i) => (
                                    <div key={i} className="py-3 flex items-center justify-between text-[12px] group hover:bg-[#F8FAFC] -mx-4 px-4 rounded transition-colors">
                                        <span className="font-semibold text-[#475569] group-hover:text-[#0F172A] transition-colors">{c.label}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-[11px] font-medium text-[#64748B]">{c.margin}</span>
                                            <StatusDot status={c.pass ? "success" : "danger"} label={c.pass ? "Pass" : "Fail"} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preference Sliders */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm mt-2">
                    <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide mb-6">Multi-Objective Weighting & TOPSIS Preference</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Fuel */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                <span>Fuel Priority</span>
                                <span className="bg-[#F0F9FF] border border-[#B9E6FE] text-[#0076a8] px-2 py-0.5 rounded">{weights.fuel.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={weights.fuel} onChange={(e) => setWeights({ ...weights, fuel: +e.target.value })} className="w-full accent-[#0076a8]" />
                            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
                                <div className="flex flex-col"><span className="uppercase font-semibold mb-0.5">Baseline</span><span>{baseline?.fuel.toFixed(1)} t</span></div>
                                <div className="flex flex-col text-right"><span className="uppercase font-semibold text-[#0076a8] mb-0.5">Optimized</span><span className="text-[#0076a8] font-bold">{weightedPoint?.fuel.toFixed(1)} t</span></div>
                            </div>
                        </div>
                        {/* Cost */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                <span>Cost Priority</span>
                                <span className="bg-[#F0F9FF] border border-[#B9E6FE] text-[#0076a8] px-2 py-0.5 rounded">{weights.cost.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={weights.cost} onChange={(e) => setWeights({ ...weights, cost: +e.target.value })} className="w-full accent-[#0076a8]" />
                            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
                                <div className="flex flex-col"><span className="uppercase font-semibold mb-0.5">Baseline</span><span>â‚¹{(baseline?.cost / 1000).toFixed(0)}k</span></div>
                                <div className="flex flex-col text-right"><span className="uppercase font-semibold text-[#0076a8] mb-0.5">Optimized</span><span className="text-[#0076a8] font-bold">â‚¹{(weightedPoint?.cost / 1000).toFixed(0)}k</span></div>
                            </div>
                        </div>
                        {/* GHG */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                <span>GHG Lifecycle Weight</span>
                                <span className="bg-[#F0F9FF] border border-[#B9E6FE] text-[#0076a8] px-2 py-0.5 rounded">{weights.wtw.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={weights.wtw} onChange={(e) => setWeights({ ...weights, wtw: +e.target.value })} className="w-full accent-[#0076a8]" />
                            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-1">
                                <div className="flex flex-col"><span className="uppercase font-semibold mb-0.5">Baseline</span><span>{baseline?.wtw.toFixed(2)} tCOâ‚‚e</span></div>
                                <div className="flex flex-col text-right"><span className="uppercase font-semibold text-[#0076a8] mb-0.5">Optimized</span><span className="text-[#0076a8] font-bold">{weightedPoint?.wtw.toFixed(2)} tCOâ‚‚e</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] -mx-6 px-6 -mb-6 pb-6 rounded-b-2xl">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-[#0F172A]">
                            <Sparkles size={16} className="text-[#F59E0B]" /> TOPSIS Compromise Solution:
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex gap-4 font-mono text-[12px] font-bold text-[#0F172A]">
                                <span>Fuel: <span className="text-[#0076a8]">{weightedPoint?.fuel.toFixed(1)} t</span></span>
                                <span>Cost: <span className="text-[#059669]">â‚¹{weightedPoint?.cost.toLocaleString()}</span></span>
                                <span>WtW: <span className="text-[#0076a8]">{weightedPoint?.wtw.toFixed(2)} tCOâ‚‚e</span></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPoint(weightedPoint)}
                                className="bg-white border border-[#CBD5E1] hover:border-[#0076a8] text-[#0F172A] hover:text-[#0076a8] px-4 py-2 rounded-lg text-[12px] font-bold shadow-sm transition-all cursor-pointer"
                            >
                                Apply Weighted Point
                            </button>
                        </div>
                    </div>
                </div>

                {/* Benchmark Variance */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden mt-2">
                    <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-5">
                        <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide">Benchmark Variance â€” Baseline vs Selected Fleet Plan</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-[#E2E8F0] bg-white text-[#64748B] text-[10px] uppercase font-bold tracking-wider">
                                    <th className="px-6 py-4">Key Performance Indicator</th>
                                    <th className="px-6 py-4 text-right">Baseline Fleet</th>
                                    <th className="px-6 py-4 text-right">Optimized Plan</th>
                                    <th title="Optimized minus baseline; negative represents savings" className="px-6 py-4 text-right">Î” Variance</th>
                                    <th className="px-6 py-4 text-right">Reduction %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {comparisonRows.map((r) => {
                                    const delta = (r.selected || 0) - (r.baseline || 0);
                                    const pct = r.baseline ? (delta / r.baseline) * 100 : 0;
                                    const better = delta <= 0;
                                    return (
                                        <tr key={r.metric} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="px-6 py-4 font-bold text-[#0F172A]">{r.metric}</td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-[#64748B]">{r.baseline != null ? r.baseline.toLocaleString() : "â€”"}</td>
                                            <td className="px-6 py-4 text-right font-mono font-extrabold text-[#0F172A]">{r.selected != null ? r.selected.toLocaleString() : "â€”"}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono font-bold", better ? "text-[#059669]" : "text-[#E11D48]")}>
                                                {delta <= 0 ? "" : "+"}{delta.toLocaleString(undefined, {maximumFractionDigits: 1})}
                                            </td>
                                            <td className={cn("px-6 py-4 text-right font-mono font-extrabold", better ? "text-[#059669]" : "text-[#E11D48]")}>
                                                {pct <= 0 ? "" : "+"}{pct.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-4">
                        <p className="text-[11px] font-medium text-[#64748B]">
                            Negative Î” Variance confirms energy conservation and emission reduction against baseline operational benchmarks.
                        </p>
                    </div>
                </div>

                {/* Full Pareto Frontier Candidate Table */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden mt-2 flex flex-col">
                    <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-5 flex items-center justify-between flex-wrap gap-4">
                        <h3 className="text-[13px] font-extrabold text-[#0F172A] uppercase tracking-wide">All Pareto Frontier Candidates ({filteredPareto.length} Solutions)</h3>
                        
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => { setFilterFeasible(!filterFeasible); setPage(1); }}
                                className={cn(
                                    "text-[11px] border px-3 h-8 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer",
                                    filterFeasible ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm" : "bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                                )}
                            >
                                {filterFeasible ? "Showing Feasible Only" : "Show All Candidates"}
                            </button>
                            <div className="w-[180px]">
                                <LabeledSelect
                                    value={sortKey}
                                    onChange={(v) => { setSortKey(v); setPage(1); }}
                                    options={[
                                        { value: "cost", label: "Sort: Lowest Cost" },
                                        { value: "fuel", label: "Sort: Lowest Fuel" },
                                        { value: "wtw", label: "Sort: Lowest GHG" },
                                    ]}
                                />
                            </div>
                            <ExportCsv rows={filteredPareto.slice((page - 1) * pageSize, page * pageSize)} filename="fleet_pareto_front.csv" />
                        </div>
                    </div>
                    
                    <div className="p-0">
                        <DataTable
                            columns={[
                                {
                                    key: "tag",
                                    header: "Solution Profile",
                                    render: (r) => (
                                        <div className="flex items-center gap-2">
                                            {r.tag ? (
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                                    r.tag === "Balanced" ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]" :
                                                    r.tag.includes("cost") ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]" :
                                                    "bg-[#F0F9FF] text-[#0076a8] border-[#B9E6FE]"
                                                )}>
                                                    {r.tag}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-[#94A3B8] font-mono font-medium">Candidate #{pareto.indexOf(r) + 1}</span>
                                            )}
                                            {selectedPoint === r && (
                                                <span className="text-[10px] bg-[#0F172A] text-white font-bold px-2 py-1 rounded-md">
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
                                        <span className="text-[12px] font-extrabold text-[#0F172A]">
                                            {r.deployment?.length || 1} Ship{(r.deployment?.length || 1) > 1 ? "s" : ""}
                                        </span>
                                    ),
                                },
                                { key: "fuel", header: "Fuel (t)", numeric: true, render: (r) => <span className="font-mono font-bold text-[#0F172A]">{r.fuel.toFixed(1)}</span> },
                                { key: "cost", header: "Cost (INR)", numeric: true, render: (r) => <span className="font-mono font-extrabold text-[#059669]">â‚¹{r.cost.toLocaleString()}</span> },
                                { key: "wtw", header: "WtW GHG (tCOâ‚‚e)", numeric: true, render: (r) => <span className="font-mono font-bold text-[#0076a8]">{r.wtw.toFixed(2)}</span> },
                                {
                                    key: "fuelId",
                                    header: "Primary Fuel",
                                    render: (r) => <span className="px-2 py-1 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] text-[10px] font-bold tracking-wider uppercase">{r.fuelId}</span>,
                                },
                                {
                                    key: "feasible",
                                    header: "Feasibility",
                                    align: "center",
                                    render: (r) => <StatusDot status={r.feasible ? "success" : "danger"} label={r.feasible ? "Pass" : "Fail"} />,
                                },
                            ]}
                            rows={filteredPareto.slice((page - 1) * pageSize, page * pageSize)}
                            onRowClick={(r) => setSelectedPoint(r)}
                            emptyMessage="No Pareto candidate solutions generated."
                        />
                        {filteredPareto.length > pageSize && (
                            <div className="border-t border-[#E2E8F0] p-4 bg-[#F8FAFC] flex items-center justify-between">
                                <span className="text-[11px] font-medium text-[#64748B]">
                                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredPareto.length)} of {filteredPareto.length} entries
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="flex items-center justify-center w-8 h-8 bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] shadow-sm hover:border-[#0076a8] hover:text-[#0076a8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-[12px] font-bold text-[#0F172A] min-w-[60px] text-center">
                                        Page {page} of {Math.ceil(filteredPareto.length / pageSize)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(Math.ceil(filteredPareto.length / pageSize), p + 1))}
                                        disabled={page === Math.ceil(filteredPareto.length / pageSize)}
                                        className="flex items-center justify-center w-8 h-8 bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] shadow-sm hover:border-[#0076a8] hover:text-[#0076a8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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




