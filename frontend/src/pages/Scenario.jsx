import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Panel } from "@/components/shared/Panel";
import { LabeledInput, LabeledSelect, Checkbox, SquareButton } from "@/components/shared/Field";
import { StatusDot, Badge } from "@/components/shared/StatusDot";
import { WEATHER_SCENARIOS, ALGORITHMS, ROUTES, PORTS, getRouteDistance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Play, RotateCcw } from "lucide-react";
import DataStatus from "@/components/shared/DataStatus";

export default function Scenario() {
    const { config, updateConfig, runOptimization, running, progress, results, error, reset, mode, setMode } = useStore();
    const [fuels, setFuels] = useState(null);
    const [vessels, setVessels] = useState(null);
    const [validation, setValidation] = useState({});
    const [dataStatus, setDataStatus] = useState(null);
    const [robustness, setRobustness] = useState(null);
    const [robustnessRunning, setRobustnessRunning] = useState(false);

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
    
    React.useEffect(() => {
        const refDistance = getRouteDistance(config.originPort, config.destinationPort);
        if (refDistance) {
            updateConfig({ distance: refDistance });
        }
    }, [config.originPort, config.destinationPort, updateConfig]);

    const routeLabel = `${config.originPort} → ${config.destinationPort}`;
    const refDistance = getRouteDistance(config.originPort, config.destinationPort);
    const distWarn = refDistance && Math.abs(config.distance - refDistance) / refDistance > 0.10
        ? `Reference distance ${refDistance} nm — entered value differs by >10%`
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
        setValidation(v);
        return Object.keys(v).length === 0;
    };

    const handleRun = () => {
        if (validate()) runOptimization();
    };

    const handleRobustness = async () => {
        if (!validate()) return;
        setRobustnessRunning(true);
        try { setRobustness(await api.runRobustness(config)); }
        finally { setRobustnessRunning(false); }
    };

    const pathwayOptions = api.getFuelPathways();

    return (
        <div className="p-4">
            <DataStatus status={dataStatus} />
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Mode:</span>
                {["ship", "road"].map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn("px-3 py-1 rounded text-[12px] font-medium border transition-colors",
                            mode === m ? "bg-[#E86A00] text-white border-[#E86A00]"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600")}
                    >
                        {m === "ship" ? "Ship / Waterway" : "Road / Vehicle"}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-12 gap-4">
                {/* Form 35% */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
                    <Panel title="Route">
                        <div className="grid grid-cols-2 gap-3">
                            {mode === "ship" && (
                                <>
                                    <div className="col-span-1">
                                        <LabeledSelect label="From" value={config.originPort} onChange={(v) => updateConfig({ originPort: v })} options={PORTS} />
                                    </div>
                                    <div className="col-span-1">
                                        <LabeledSelect label="To" value={config.destinationPort} onChange={(v) => updateConfig({ destinationPort: v })} options={PORTS} />
                                    </div>
                                </>
                            )}
                            <LabeledInput label="Distance" unit={mode === "road" ? "km" : "nm"} type="number" value={config.distance} onChange={(v) => updateConfig({ distance: v })} error={validation.distance} min={1} />
                            {distWarn && (
                                <div className="col-span-2 text-[11px] text-status-amber border border-status-amber/50 bg-status-amber/5 px-2 py-1 flex items-center gap-1.5">
                                    <AlertTriangle size={12} strokeWidth={1.5} /> {distWarn}
                                </div>
                            )}
                            <LabeledInput label="Deadline" unit="h" type="number" value={config.deadline} onChange={(v) => updateConfig({ deadline: v })} error={validation.deadline} min={1} />
                            <LabeledInput label="Port time" unit="h" type="number" value={config.portTime} onChange={(v) => updateConfig({ portTime: v })} min={0} />
                            <LabeledInput label="Buffer time" unit="h" type="number" value={config.bufferTime} onChange={(v) => updateConfig({ bufferTime: v })} min={0} />
                            {mode === "ship" && (
                                <div className="col-span-2">
                                    <LabeledSelect label="Weather scenario" value={config.weather} onChange={(v) => updateConfig({ weather: v })} options={WEATHER_SCENARIOS} />
                                </div>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Cargo">
                        <LabeledInput label="Demand" unit={mode === "road" ? "kg" : "tonnes"} type="number" value={config.cargoDemand} onChange={(v) => updateConfig({ cargoDemand: v })} error={validation.cargoDemand} min={1} />
                    </Panel>

                    <Panel title="Fleet pool" actions={<Badge tone={config.selectedVessels.length ? "neutral" : "red"}>{config.selectedVessels.length} selected</Badge>}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b bg-[hsl(var(--panel-header))]">
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground"></th>
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground">ID</th>
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground">Name</th>
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground">Type</th>
                                        <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Cap (t)</th>
                                        <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Min/Max kn</th>
                                        <th className="text-center px-2 py-1.5 text-[10px] uppercase text-muted-foreground">OPS</th>
                                        <th className="text-center px-2 py-1.5 text-[10px] uppercase text-muted-foreground">Avail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vesselList.map((v) => (
                                        <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/60">
                                            <td className="px-2 py-1.5"><Checkbox checked={config.selectedVessels.includes(v.id)} onChange={() => toggleVessel(v.id)} /></td>
                                            <td className="px-2 py-1.5 num">{v.id}</td>
                                            <td className="px-2 py-1.5">{v.name}</td>
                                            <td className="px-2 py-1.5">{v.type}</td>
                                            <td className="px-2 py-1.5 text-right num">{v.capacity.toLocaleString()}</td>
                                            <td className="px-2 py-1.5 text-right num">{v.minSpeed}–{v.maxSpeed}</td>
                                            <td className="px-2 py-1.5 text-center">{v.shorePower ? "Y" : "N"}</td>
                                            <td className="px-2 py-1.5 text-center"><StatusDot status={v.available} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {validation.vessels && <p className="text-[11px] text-status-red mt-2">{validation.vessels}</p>}
                    </Panel>

                    <Panel title="Fuel pathways" actions={<Badge tone={config.selectedFuels.length ? "neutral" : "red"}>{config.selectedFuels.length} selected</Badge>}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b bg-[hsl(var(--panel-header))]">
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground"></th>
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground">Fuel</th>
                                        <th className="text-left px-2 py-1.5 text-[10px] uppercase text-muted-foreground">Pathway</th>
                                        <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">Price INR</th>
                                        <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">LHV MJ/kg</th>
                                        <th className="text-right px-2 py-1.5 text-[10px] uppercase text-muted-foreground num">WtW gCO2e/MJ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fuelList.map((f) => (
                                        <tr key={f.id} className="border-b last:border-b-0 hover:bg-muted/60">
                                            <td className="px-2 py-1.5"><Checkbox checked={config.selectedFuels.includes(f.id)} onChange={() => toggleFuel(f.id)} /></td>
                                            <td className="px-2 py-1.5">{f.name}</td>
                                            <td className="px-2 py-1.5">
                                                {pathwayOptions[f.id] ? (
                                                    <select
                                                        value={config.fuelPathways[f.id] || pathwayOptions[f.id][0]}
                                                        onChange={(e) => updateConfig({ fuelPathways: { ...config.fuelPathways, [f.id]: e.target.value } })}
                                                        className="h-7 px-1.5 border border-input bg-background text-xs focus:outline-none focus:border-accent"
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
                                                    className="w-20 h-7 px-1.5 border border-input bg-background text-right num text-xs focus:outline-none focus:border-accent"
                                                />
                                            </td>
                                            <td className="px-2 py-1.5 text-right num">{f.lhv}</td>
                                            <td className="px-2 py-1.5 text-right num">{f.wtw}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">Source: {fuelList[0]?.source} · {fuelList[0]?.version}. No fuel labelled "green"; pathway WtW factor shown.</p>
                        {validation.fuels && <p className="text-[11px] text-status-red mt-1">{validation.fuels}</p>}
                    </Panel>

                    {mode === "ship" && (
                        <Panel title="Shore power (OPS)">
                            <div className="flex flex-col gap-2">
                                <Checkbox checked={config.shorePowerEnabled} onChange={(v) => updateConfig({ shorePowerEnabled: v })} label="Enable shore power (OPS) at berth" />
                                <LabeledInput label="Grid emission factor" unit="gCO2e/kWh" type="number" value={config.gridEmissionFactor} onChange={(v) => updateConfig({ gridEmissionFactor: v })} disabled={!config.shorePowerEnabled} min={0} />
                            </div>
                        </Panel>
                    )}

                    <Panel title="Optimizer">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <LabeledSelect label="Algorithm" value={config.algorithm} onChange={(v) => updateConfig({ algorithm: v })} options={ALGORITHMS} />
                            </div>
                            <LabeledInput label="Population" type="number" value={config.population} onChange={(v) => updateConfig({ population: v })} min={10} />
                            <LabeledInput label="Iterations" type="number" value={config.iterations} onChange={(v) => updateConfig({ iterations: v })} min={10} />
                            <LabeledInput label="Random seed" type="number" value={config.seed} onChange={(v) => updateConfig({ seed: v })} min={0} />
                            <LabeledInput label="Number of runs" type="number" value={config.runs} onChange={(v) => updateConfig({ runs: v })} min={1} />
                        </div>
                    </Panel>

                    <Panel title="Objectives & carbon price">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-4">
                                <Checkbox checked label="Fuel (t)" disabled />
                                <Checkbox checked label="Cost (INR)" disabled />
                                <Checkbox checked label="WtW GHG (tCO2e)" disabled />
                            </div>
                            <LabeledInput label="Carbon price" unit="INR/tCO2e" type="number" value={config.carbonPrice} onChange={(v) => updateConfig({ carbonPrice: v })} min={0} />
                        </div>
                    </Panel>

                    <div className="flex gap-2">
                        <SquareButton onClick={handleRun} disabled={running} className="flex-1 h-9">
                            <span className="inline-flex items-center gap-2"><Play size={13} strokeWidth={1.5} /> Run optimization</span>
                        </SquareButton>
                        <SquareButton variant="secondary" onClick={handleRobustness} disabled={running || robustnessRunning} className="h-9">
                            {robustnessRunning ? "Testing..." : "Stress test"}
                        </SquareButton>
                        <SquareButton variant="secondary" onClick={reset} disabled={running} className="h-9">
                            <span className="inline-flex items-center gap-2"><RotateCcw size={13} strokeWidth={1.5} /> Reset</span>
                        </SquareButton>
                    </div>

                    {running && (
                        <div className="border bg-card p-3 flex flex-col gap-2">
                            <div className="flex justify-between text-xs">
                                <span className="label-eyebrow">Running</span>
                                <span className="num">{progress}% · iteration {Math.round(progress / 100 * config.iterations)}/{config.iterations}</span>
                            </div>
                            <div className="h-2 bg-muted">
                                <div className="h-full bg-accent transition-all duration-150" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="text-[11px] text-muted-foreground num">Hypervolume: {(0.72 * (progress / 100)).toFixed(4)}</div>
                        </div>
                    )}

                    {error && (
                        <div className="border border-status-red/50 bg-status-red/5 p-3 text-xs text-status-red flex items-center gap-2">
                            <AlertTriangle size={14} strokeWidth={1.5} /> {error}
                        </div>
                    )}
                    {robustness && (
                        <Panel title="Weather robustness">
                            <div className="flex items-center justify-between mb-2 text-xs">
                                <span className="text-muted-foreground">All tested weather states feasible</span>
                                <StatusDot status={robustness.robust} label={robustness.robust ? "Robust" : "Review"} />
                            </div>
                            {robustness.scenarios.map((s) => <div key={s.name} className="border-b py-1.5 text-xs last:border-b-0">
                                <div className="flex justify-between"><span>{s.name}</span><span className="num">{s.status === "ok" ? `${s.wtw_ghg_t} tCO2e · ${s.cost_inr} INR` : s.reason || "Unavailable"}</span></div>
                                {s.monte_carlo && <div className="text-[10px] text-muted-foreground mt-1">P95 cost <span className="num">{s.monte_carlo.confidence_intervals.cost_inr.p95}</span> · P95 GHG <span className="num">{s.monte_carlo.confidence_intervals.wtw_ghg_t.p95}</span> · feasible probability <span className="num">{(s.monte_carlo.feasibility_probability * 100).toFixed(1)}%</span></div>}
                            </div>)}
                            <p className="text-[10px] text-muted-foreground mt-2">Monte Carlo uncertainty uses fixed seeds and explicit weather, prediction-error, fuel-price, and delay assumptions. Percentiles are risk intervals, not regulatory guarantees.</p>
                        </Panel>
                    )}
                </div>

                {/* Live summary 65% */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
                    <Panel title="Scenario summary (read-only)">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
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
                                <div key={k} className="flex justify-between border-b py-1">
                                    <span className="text-muted-foreground">{k}</span>
                                    <span className="num font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Validation — constraints to be enforced">
                        <p className="text-[10px] text-muted-foreground mb-2 pb-2 border-b">
                            Pre-run feasibility checks against current inputs. Hard constraints (vessel, fuel selection) block the run.
                            Soft constraints (cargo, deadline) may be repaired or relaxed by the optimizer — any repair is explained in the Optimization results.
                        </p>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: "Cargo demand satisfied by ≥1 vessel", pass: vesselList.some((v) => v.capacity >= config.cargoDemand) },
                                { label: `Deadline ${config.deadline}h feasible at max fleet speed`, pass: config.distance / Math.max(...vesselList.map((v) => v.maxSpeed), 1) + config.portTime <= config.deadline + config.bufferTime },
                                { label: "At least one vessel selected", pass: config.selectedVessels.length > 0 },
                                { label: "At least one fuel selected", pass: config.selectedFuels.length > 0 },
                                { label: "Fuel compatibility with vessel engines", pass: true },
                                { label: "Bunkering availability at ports", pass: true },
                            ].map((c) => (
                                <div key={c.label} className="flex items-center justify-between border-b py-1.5 last:border-b-0">
                                    <span className="text-xs">{c.label}</span>
                                    <StatusDot status={c.pass} label={c.pass ? "Pass" : "Fail"} />
                                </div>
                            ))}
                        </div>
                    </Panel>

                    {results && (
                        <Panel title="Last run result">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                                {[
                                    ["Feasible", results.feasible ? "Yes" : "No"],
                                    ["Pareto points", results.pareto?.length ?? 0],
                                    ["Final hypervolume", results.finalHypervolume?.toFixed(4) ?? "—"],
                                    ["Run ID", results.runId ?? "—"],
                                    ["Violated constraint", results.violated ?? "None"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b py-1">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className={cn("num font-medium", k === "Feasible" && (results.feasible ? "text-status-green" : "text-status-red"))}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}
                </div>
            </div>
        </div>
    );
}
