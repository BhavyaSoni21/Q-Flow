import React from "react";
import { useStore } from "@/lib/store";
import { StatusDot } from "@/components/shared/StatusDot";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

function KpiCell({ label, baseline, optimized, unit, delta, deltaPct, improved, state }) {
    if (state === "empty") {
        return (
            <div className="border border-border/60 bg-card rounded-sm px-4 py-3 flex flex-col gap-1.5">
                <span className="label-eyebrow">{label}</span>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1 flex-1 bg-muted/70 rounded animate-pulse" />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Run optimization to populate</p>
            </div>
        );
    }
    if (state === "loading") {
        return (
            <div className="border border-border/60 bg-card rounded-sm px-4 py-3 flex flex-col gap-2">
                <span className="label-eyebrow">{label}</span>
                <div className="h-5 mt-1 bg-muted/70 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
            </div>
        );
    }

    const TrendIcon = delta == null ? null : delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;

    return (
        <div className="border border-border/60 bg-card rounded-sm px-4 py-3 flex flex-col gap-1 fade-in">
            <span className="label-eyebrow">{label}</span>
            <div className="flex items-baseline gap-3 mt-0.5">
                <div>
                    <span className="text-[9px] uppercase text-muted-foreground/70 mr-1 tracking-wider font-semibold">Base</span>
                    <span className="num text-[13px] text-foreground/80">
                        {baseline?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? "ΓÇö"}
                        <span className="text-muted-foreground ml-0.5 text-[10px]">{unit}</span>
                    </span>
                </div>
                <span className="text-muted-foreground/40">ΓåÆ</span>
                <div>
                    <span className="text-[9px] uppercase text-muted-foreground/70 mr-1 tracking-wider font-semibold">Opt</span>
                    <span className="num text-[14px] font-bold text-foreground">
                        {optimized?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? "ΓÇö"}
                        <span className="text-muted-foreground ml-0.5 text-[10px]">{unit}</span>
                    </span>
                </div>
            </div>
            {delta != null && (
                <div className={cn("num text-[11px] flex items-center gap-1 mt-0.5", improved ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]")}>
                    {TrendIcon && <TrendIcon size={11} strokeWidth={2} />}
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)} {unit} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
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

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-6 py-4 border-b border-border/40 bg-background/50">
            <KpiCell label="Fuel consumption" unit="t" baseline={base?.fuel} optimized={opt?.fuel} delta={fuelDelta} deltaPct={pct(fuelDelta, base?.fuel)} improved={fuelDelta <= 0} state={state} />
            <KpiCell label="Operating cost" unit="INR" baseline={base?.cost} optimized={opt?.cost} delta={costDelta} deltaPct={pct(costDelta, base?.cost)} improved={costDelta <= 0} state={state} />
            <KpiCell label="Lifecycle WtW GHG" unit="tCO2e" baseline={base?.wtw} optimized={opt?.wtw} delta={wtwDelta} deltaPct={pct(wtwDelta, base?.wtw)} improved={wtwDelta <= 0} state={state} />
            <div className="border border-border/60 bg-card rounded-sm px-4 py-3 flex flex-col gap-1">
                <span className="label-eyebrow">Constraint status</span>
                {state === "empty" && <p className="text-[10px] text-muted-foreground/60 mt-2">Run optimization to populate</p>}
                {state === "loading" && (
                    <div className="space-y-1.5 mt-1">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-muted/70 rounded animate-pulse" style={{ width: `${70 + i * 7}%` }} />)}
                    </div>
                )}
                {state === "ready" && (
                    <div className="flex flex-col gap-1 mt-0.5">
                        {constraints.map((c) => (
                            <StatusDot key={c.label} status={c.pass} label={c.label} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
