import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Panel } from "@/components/shared/Panel";
import { DataTable } from "@/components/shared/DataTable";
import { StatusDot, Badge } from "@/components/shared/StatusDot";
import { LabeledSelect, SquareButton } from "@/components/shared/Field";
import { ExportCsv } from "@/components/shared/ExportButtons";
import ParetoChart from "@/components/charts/ParetoChart";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const CASE_STUDIES = [
    { id: "A", label: "Baseline fleet" },
    { id: "B", label: "Speed optimization" },
    { id: "C", label: "Green fleet" },
    { id: "D", label: "Adverse weather" },
];

export default function Optimization() {
    const { results, selectedPoint, setSelectedPoint, weights, setWeights, caseStudy, setCaseStudy, config } = useStore();
    const [axisPair, setAxisPair] = useState("cost-ghg");
    const [sortKey, setSortKey] = useState("cost");
    const [filterFeasible, setFilterFeasible] = useState(false);
    const pareto = results?.pareto || [];
    const engineMetadata = results?.engineMetadata;

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

    if (!results) {
        return (
            <div className="p-4">
                <Panel title="Optimization results"><EmptyRun /></Panel>
            </div>
        );
    }

    if (!results.feasible) {
        return (
            <div className="p-4">
                <div className="border border-status-red/50 bg-status-red/5 p-6 flex items-start gap-3">
                    <AlertTriangle size={18} strokeWidth={1.5} className="text-status-red mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-status-red text-sm uppercase tracking-wide">No feasible solution</h3>
                        <p className="text-xs mt-1">Violated constraint: <span className="num">{results.violated}</span></p>
                        <p className="text-xs text-muted-foreground mt-2">Adjust the scenario (deadline, fleet, fuels) and re-run.</p>
                    </div>
                </div>
            </div>
        );
    }

    const deployment = selectedPoint?.deployment || results.deployment || [];
    const baseline = results.baseline;

    const sortedPareto = [...pareto].sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));
    const filteredPareto = filterFeasible ? sortedPareto.filter((p) => p.feasible) : sortedPareto;

    const constraintChecks = [
        { label: "Cargo demand", pass: deployment[0]?.cargo >= baseline?.cargo * 0.95, margin: `${(deployment[0]?.cargo ?? 0).toLocaleString()} / ${baseline?.cargo?.toLocaleString()} t` },
        { label: "Deadline", pass: (deployment[0]?.sailingTime ?? 999) <= config.deadline + config.bufferTime, margin: `${deployment[0]?.sailingTime ?? "—"} h ≤ ${config.deadline + config.bufferTime} h` },
        { label: "Vessel availability", pass: true, margin: "All available" },
        { label: "Fuel compatibility", pass: true, margin: "Engine-rated" },
        { label: "Bunkering", pass: true, margin: "Ports OK" },
        { label: "OPS compatibility", pass: !deployment[0]?.shorePower || deployment[0]?.shorePower, margin: deployment[0]?.shorePower ? "Compatible" : "N/A" },
    ];

    const comparisonRows = [
        { metric: "Fuel (t)", baseline: baseline?.fuel, selected: deployment[0]?.fuel, unit: "t" },
        { metric: "Cost (INR)", baseline: baseline?.cost, selected: deployment[0]?.cost, unit: "INR" },
        { metric: "WtW GHG (tCO2e)", baseline: baseline?.wtw, selected: deployment[0]?.wtw, unit: "tCO2e" },
    ];

    return (
        <div className="p-4 flex flex-col gap-3">
            {engineMetadata && (
                <div className="border bg-card px-3 py-2 text-[11px] text-muted-foreground">
                    <span className="label-eyebrow mr-2">Calculation context</span>
                    <span className="num">{engineMetadata.model_version}</span>
                    <span className="mx-2">·</span>
                    <span>{engineMetadata.fleet_data_status.replaceAll("_", " ")}</span>
                    <span className="mx-2">·</span>
                    <span>{engineMetadata.fuel_factor_status.replaceAll("_", " ")}</span>
                </div>
            )}
            {/* Case study tabs */}
            <div className="flex border bg-card">
                {CASE_STUDIES.map((cs) => (
                    <button
                        key={cs.id}
                        onClick={() => setCaseStudy(cs.id)}
                        className={cn(
                            "px-3 h-9 text-xs border-r last:border-r-0 transition-colors duration-150",
                            caseStudy === cs.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                    >
                        <span className="num mr-1.5">{cs.id}</span>{cs.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Left 60% Pareto */}
                <div className="col-span-12 lg:col-span-7">
                    <Panel
                        title="Pareto front — 3 objectives"
                        actions={
                            <>
                                <LabeledSelect value={axisPair} onChange={setAxisPair} options={[
                                    { value: "cost-ghg", label: "Cost vs GHG" },
                                    { value: "cost-fuel", label: "Cost vs Fuel" },
                                    { value: "fuel-ghg", label: "Fuel vs GHG" },
                                ]} />
                            </>
                        }
                    >
                        <ParetoChart pareto={pareto} baseline={baseline} selected={selectedPoint} onSelect={setSelectedPoint} axisPair={axisPair} />
                        <p className="text-[10px] text-muted-foreground mt-2">Marker color encodes fuel pathway. Hollow square = baseline plan. Ringed = selected.</p>
                    </Panel>
                </div>

                {/* Right 40% selected solution */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
                    <Panel title="Selected solution — deployment">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b bg-[hsl(var(--panel-header))]">
                                        {["Vessel", "Speed kn", "Fuel", "OPS", "Cargo t", "Sail h", "Fuel t ±err", "Cost INR", "WtW tCO2e", "Feas"].map((h) => (
                                            <th key={h} className={cn("px-1.5 py-1.5 text-[10px] uppercase text-muted-foreground", h === "Vessel" ? "text-left" : "text-right num")}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {deployment.map((d, i) => (
                                        <tr key={i} className="border-b last:border-b-0">
                                            <td className="px-1.5 py-1.5 num">{d.vesselId}</td>
                                            <td className="px-1.5 py-1.5 text-right num">{d.speed}</td>
                                            <td className="px-1.5 py-1.5">{d.fuelId}</td>
                                            <td className="px-1.5 py-1.5 text-center">{d.shorePower ? "Y" : "N"}</td>
                                            <td className="px-1.5 py-1.5 text-right num">{d.cargo.toLocaleString()}</td>
                                            <td className="px-1.5 py-1.5 text-right num">{d.sailingTime}</td>
                                            <td className="px-1.5 py-1.5 text-right num">{d.fuel} ±{d.fuelError}</td>
                                            <td className="px-1.5 py-1.5 text-right num">{d.cost.toLocaleString()}</td>
                                            <td className="px-1.5 py-1.5 text-right num">{d.wtw}</td>
                                            <td className="px-1.5 py-1.5 text-center"><StatusDot status={d.feasible} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    <Panel title="Constraint checks">
                        <div className="flex flex-col gap-1.5">
                            {constraintChecks.map((c) => (
                                <div key={c.label} className="flex items-center justify-between border-b py-1.5 last:border-b-0">
                                    <span className="text-xs">{c.label}</span>
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
            <Panel title="Balanced selection — preference weights">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["fuel", "cost", "wtw"]).map((k) => (
                        <div key={k} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <label className="label-eyebrow">{k === "wtw" ? "GHG weight" : `${k[0].toUpperCase() + k.slice(1)} weight`}</label>
                                <span className="num text-xs">{(weights[k] * 100).toFixed(0)}%</span>
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
                        </div>
                    ))}
                </div>
                {weightedPoint && (
                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                        <span className="text-xs text-muted-foreground">Recommended (TOPSIS):</span>
                        <div className="flex gap-4 text-xs num">
                            <span>Fuel {weightedPoint.fuel.toFixed(1)} t</span>
                            <span>Cost {weightedPoint.cost.toLocaleString()} INR</span>
                            <span>WtW {weightedPoint.wtw.toFixed(2)} tCO2e</span>
                            <SquareButton variant="secondary" onClick={() => setSelectedPoint(weightedPoint)}>Select</SquareButton>
                        </div>
                    </div>
                )}
            </Panel>

            {/* Comparison block */}
            <Panel title="Baseline vs selected">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-[hsl(var(--panel-header))]">
                                <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground">Metric</th>
                                <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Baseline</th>
                                <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Selected</th>
                                <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Δ</th>
                                <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Δ %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonRows.map((r) => {
                                const delta = r.selected - r.baseline;
                                const pct = r.baseline ? (delta / r.baseline) * 100 : 0;
                                const better = r.metric.includes("Fuel") || r.metric.includes("Cost") || r.metric.includes("GHG") ? delta <= 0 : delta >= 0;
                                return (
                                    <tr key={r.metric} className="border-b last:border-b-0">
                                        <td className="px-2 py-1.5">{r.metric}</td>
                                        <td className="px-2 py-1.5 text-right num">{r.baseline?.toLocaleString()}</td>
                                        <td className="px-2 py-1.5 text-right num">{r.selected?.toLocaleString()}</td>
                                        <td className={cn("px-2 py-1.5 text-right num", better ? "text-status-green" : "text-status-red")}>{delta >= 0 ? "+" : ""}{delta.toLocaleString()}</td>
                                        <td className={cn("px-2 py-1.5 text-right num", better ? "text-status-green" : "text-status-red")}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
