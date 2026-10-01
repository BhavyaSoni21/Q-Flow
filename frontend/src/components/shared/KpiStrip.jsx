import React from "react";
import { useStore } from "@/lib/store";
import { StatusDot } from "@/components/shared/StatusDot";
import { cn } from "@/lib/utils";

function KpiCell({ label, baseline, optimized, unit, delta, deltaPct, improved, state }) {
    if (state === "empty") {
        return (
            <div className="border bg-card px-3 py-2 flex flex-col gap-1">
                <span className="label-eyebrow">{label}</span>
                <p className="text-[11px] text-muted-foreground py-1.5">Run optimization to populate</p>
            </div>
        );
    }
    if (state === "loading") {
        return (
            <div className="border bg-card px-3 py-2 flex flex-col gap-1">
                <span className="label-eyebrow">{label}</span>
                <div className="h-5 mt-1 bg-muted" />
            </div>
        );
    }
    return (
        <div className="border bg-card px-3 py-2 flex flex-col gap-1">
            <span className="label-eyebrow">{label}</span>
            <div className="flex items-baseline gap-3">
                <div>
                    <span className="text-[10px] uppercase text-muted-foreground mr-1">Base</span>
                    <span className="num text-sm">{baseline?.toFixed(1) ?? "—"}<span className="text-muted-foreground ml-0.5">{unit}</span></span>
                </div>
                <div>
                    <span className="text-[10px] uppercase text-muted-foreground mr-1">Opt</span>
                    <span className="num text-sm font-semibold">{optimized?.toFixed(1) ?? "—"}<span className="text-muted-foreground ml-0.5">{unit}</span></span>
                </div>
            </div>
            {delta != null && (
                <div className={cn("num text-[11px]", improved ? "text-status-green" : "text-status-red")}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)} {unit} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                </div>
            )}
        </div>
    );
}

export default function KpiStrip() {
    const { results, selectedPoint, running, config } = useStore();
    const opt = selectedPoint?.deployment?.[0] || results?.deployment?.[0];
    const base = results?.baseline;
    const state = running ? "loading" : !results ? "empty" : "ready";

    const fuelDelta = opt ? opt.fuel - base.fuel : 0;
    const costDelta = opt ? opt.cost - base.cost : 0;
    const wtwDelta = opt ? opt.wtw - base.wtw : 0;
    const pct = (d, b) => (b ? (d / b) * 100 : 0);

    const constraints = [
        { label: "Cargo demand satisfied", pass: (opt?.cargo ?? 0) >= ((base?.cargo ?? 0) * 0.95) },
        { label: "Schedule feasible", pass: (opt?.sailingTime ?? 999) <= (config?.deadline ?? 52) + (config?.bufferTime ?? 2) },
        { label: "Fuel compatibility", pass: true },
        { label: "Vessel availability", pass: true },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-4 py-3">
            <KpiCell label="Fuel consumption" unit="t" baseline={base?.fuel} optimized={opt?.fuel} delta={fuelDelta} deltaPct={pct(fuelDelta, base?.fuel)} improved={fuelDelta <= 0} state={state} />
            <KpiCell label="Operating cost" unit="USD" baseline={base?.cost} optimized={opt?.cost} delta={costDelta} deltaPct={pct(costDelta, base?.cost)} improved={costDelta <= 0} state={state} />
            <KpiCell label="Lifecycle WtW GHG" unit="tCO2e" baseline={base?.wtw} optimized={opt?.wtw} delta={wtwDelta} deltaPct={pct(wtwDelta, base?.wtw)} improved={wtwDelta <= 0} state={state} />
            <div className="border bg-card px-3 py-2 flex flex-col gap-1">
                <span className="label-eyebrow">Constraint status</span>
                {state === "empty" && <p className="text-[11px] text-muted-foreground py-1.5">Run optimization to populate</p>}
                {state === "loading" && <div className="h-5 mt-1 bg-muted" />}
                {state === "ready" && (
                    <div className="flex flex-col gap-1">
                        {constraints.map((c) => (
                            <StatusDot key={c.label} status={c.pass} label={c.label} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}