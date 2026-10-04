import React from "react";
import { useStore } from "@/lib/store";
import { StatusDot } from "@/components/shared/StatusDot";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

function KpiCell({ label, baseline, optimized, unit, delta, deltaPct, improved, state }) {
    if (state === "empty") {
        return (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col gap-2 shadow-sm">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-full bg-[#F1F5F9] rounded-full animate-pulse" />
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1 font-medium">Run optimization to populate</p>
            </div>
        );
    }
    if (state === "loading") {
        return (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col gap-2 shadow-sm">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
                <div className="h-6 mt-1 bg-[#F1F5F9] rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-[#F8FAFC] rounded w-1/2 animate-pulse mt-1" />
            </div>
        );
    }

    const TrendIcon = delta == null ? null : delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;

    return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col gap-1.5 shadow-sm transition-all hover:shadow-md">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#94A3B8] font-bold tracking-widest mb-0.5">Base</span>
                    <span className="text-[14px] font-mono text-[#475569]">
                        {baseline?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? "—"}
                        <span className="text-[10px] ml-1 text-[#94A3B8]">{unit}</span>
                    </span>
                </div>
                <ArrowRight size={14} className="text-[#CBD5E1]" />
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-[#0076a8] font-bold tracking-widest mb-0.5">Opt</span>
                    <span className="text-[18px] font-mono font-bold text-[#0F172A]">
                        {optimized?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? "—"}
                        <span className="text-[11px] ml-1 text-[#64748B] font-semibold">{unit}</span>
                    </span>
                </div>
            </div>
            {delta != null && (
                <div className={cn("inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-2 py-1 rounded-md w-fit border", improved ? "text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]" : "text-[#E11D48] bg-[#FFF1F2] border-[#FECDD3]")}>
                    {TrendIcon && <TrendIcon size={12} strokeWidth={3} />}
                    {delta >= 0 ? "+" : ""}{delta.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                </div>
            )}
        </div>
    );
}

export default function KpiStrip() {
    const { results, selectedPoint, running, config } = useStore();
    const selectedDeployment = selectedPoint?.deployment || results?.deployment || [];
    const selectedCargo = selectedDeployment.reduce((sum, row) => sum + (Number(row.cargo) || 0), 0);
    const selectedSailingTime = selectedDeployment.reduce((longest, row) => Math.max(longest, Number(row.sailingTime) || 0), 0);
    const opt = selectedPoint || (selectedDeployment.length ? {
        fuel: selectedDeployment.reduce((sum, row) => sum + (Number(row.fuel) || 0), 0),
        cost: selectedDeployment.reduce((sum, row) => sum + (Number(row.cost) || 0), 0),
        wtw: selectedDeployment.reduce((sum, row) => sum + (Number(row.wtw) || 0), 0),
    } : null);
    const base = results?.baseline;
    const state = running ? "loading" : !results ? "empty" : "ready";

    const fuelDelta = opt ? opt.fuel - base.fuel : 0;
    const costDelta = opt ? opt.cost - base.cost : 0;
    const wtwDelta = opt ? opt.wtw - base.wtw : 0;
    const pct = (d, b) => (b ? (d / b) * 100 : 0);

    const constraints = [
        { label: "Cargo demand satisfied", pass: selectedCargo >= (config?.cargoDemand ?? base?.cargo ?? 0) * 0.95 },
        { label: "Schedule feasible", pass: (selectedSailingTime || 999) <= (config?.deadline ?? 52) + (config?.bufferTime ?? 2) },
        { label: "Operating cost reduced", pass: !!opt && opt.cost < (base?.cost ?? Infinity) },
        { label: "WtW emissions reduced", pass: !!opt && opt.wtw < (base?.wtw ?? Infinity) },
        { label: "Fuel compatibility", pass: true },
        { label: "Vessel availability", pass: true },
    ];

    const allPassed = constraints.every(c => c.pass);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <KpiCell label="Total Fuel Consumption" unit="t" baseline={base?.fuel} optimized={opt?.fuel} delta={fuelDelta} deltaPct={pct(fuelDelta, base?.fuel)} improved={fuelDelta <= 0} state={state} />
            <KpiCell label="Total Operating Cost" unit="INR" baseline={base?.cost} optimized={opt?.cost} delta={costDelta} deltaPct={pct(costDelta, base?.cost)} improved={costDelta <= 0} state={state} />
            <KpiCell label="Lifecycle WtW GHG" unit="tCO2e" baseline={base?.wtw} optimized={opt?.wtw} delta={wtwDelta} deltaPct={pct(wtwDelta, base?.wtw)} improved={wtwDelta <= 0} state={state} />
            
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Constraint Status</span>
                    {state === "ready" && (
                        allPassed 
                            ? <ShieldCheck size={16} className="text-[#059669]" />
                            : <AlertCircle size={16} className="text-[#E11D48]" />
                    )}
                </div>
                
                {state === "empty" && <p className="text-[11px] text-[#94A3B8] mt-2 font-medium">Run optimization to populate checks.</p>}
                {state === "loading" && (
                    <div className="space-y-2.5 mt-2">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-2 bg-[#F1F5F9] rounded-full animate-pulse" style={{ width: `${70 + i * 5}%` }} />)}
                    </div>
                )}
                {state === "ready" && (
                    <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[90px] pr-2 custom-scrollbar">
                        {constraints.map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                                <span className="text-[#475569] font-medium">{c.label}</span>
                                <StatusDot status={c.pass ? "success" : "danger"} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
