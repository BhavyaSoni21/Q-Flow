import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Panel } from "@/components/shared/Panel";
import { LabeledInput, LabeledSelect } from "@/components/shared/Field";
import { Badge } from "@/components/shared/StatusDot";
import { ShapBarChart, ShapWaterfall, PredVsActualChart, ResidualChart } from "@/components/charts/PredictionCharts";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import DataStatus from "@/components/shared/DataStatus";

const VESSEL_TYPES = ["Panamax", "Aframax", "Capesize"];
const FUEL_TYPES = ["HFO", "VLSFO", "LNG", "Methanol", "Hydrogen", "Ammonia"];

export default function Prediction() {
    const [input, setInput] = useState({
        vesselType: "Panamax",
        loadFactor: 0.7,
        speed: 14,
        enginePower: 12000,
        wind: 8,
        waveHeight: 1.5,
        seaState: 3,
        fuelType: "VLSFO",
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scatter, setScatter] = useState(null);
    const [split, setSplit] = useState("time");
    const [dataStatus, setDataStatus] = useState(null);

    useEffect(() => {
        api.getPredictionScatter(42).then(setScatter);
        api.getStatus().then(setDataStatus);
    }, []);

    const runPrediction = () => {
        setLoading(true);
        api.predictFuel({ ...input, distance: 600 }).then((r) => {
            setResult(r);
            setLoading(false);
        });
    };

    // Auto-run on mount and on input change (debounced feel)
    useEffect(() => {
        const t = setTimeout(runPrediction, 50);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input]);

    const shap = api.getShapGlobal();

    return (
        <div className="p-4 flex flex-col gap-3">
            <DataStatus status={dataStatus} />
            <div className="grid grid-cols-12 gap-4">
                {/* Input form */}
                <div className="col-span-12 lg:col-span-4">
                    <Panel title="Single prediction — input">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2"><LabeledSelect label="Vessel type" value={input.vesselType} onChange={(v) => setInput({ ...input, vesselType: v })} options={VESSEL_TYPES} /></div>
                            <div className="col-span-2"><LabeledSelect label="Fuel type" value={input.fuelType} onChange={(v) => setInput({ ...input, fuelType: v })} options={FUEL_TYPES} /></div>
                            <LabeledInput label="Load factor" type="number" value={input.loadFactor} onChange={(v) => setInput({ ...input, loadFactor: v })} min={0} max={1} step={0.05} />
                            <LabeledInput label="Speed" unit="kn" type="number" value={input.speed} onChange={(v) => setInput({ ...input, speed: v })} min={0} step={0.5} />
                            <LabeledInput label="Engine power" unit="kW" type="number" value={input.enginePower} onChange={(v) => setInput({ ...input, enginePower: v })} step={500} />
                            <LabeledInput label="Wind" unit="m/s" type="number" value={input.wind} onChange={(v) => setInput({ ...input, wind: v })} step={0.5} />
                            <LabeledInput label="Wave height" unit="m" type="number" value={input.waveHeight} onChange={(v) => setInput({ ...input, waveHeight: v })} step={0.25} />
                            <LabeledInput label="Sea state" unit="Douglas" type="number" value={input.seaState} onChange={(v) => setInput({ ...input, seaState: v })} min={0} max={9} />
                        </div>
                    </Panel>

                    <Panel title="Prediction output" loading={loading}>
                        {result && (
                            <div className="flex flex-col gap-3">
                                <div className="border p-3">
                                    <p className="label-eyebrow">Predicted fuel</p>
                                    <p className="num text-2xl font-semibold mt-1">
                                        {result.fuel.toFixed(2)} <span className="text-sm text-muted-foreground">t</span>
                                        <span className="text-sm text-muted-foreground ml-2">± {result.error.toFixed(2)} t</span>
                                    </p>
                                </div>
                                <div className={cn("border p-2 flex items-center gap-2 text-xs", result.sanity === "pass" ? "border-status-green/50 text-status-green bg-status-green/5" : "border-status-amber/50 text-status-amber bg-status-amber/5")}>
                                    {result.sanity === "pass" ? <CheckCircle2 size={14} strokeWidth={1.5} /> : <AlertTriangle size={14} strokeWidth={1.5} />}
                                    <span>Physics sanity: cubic speed-power expectation {result.sanity === "pass" ? "consistent" : "flagged"} (expected {result.physicsExpected} t)</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Value shown with error band (±). Never an exact value.</p>
                            </div>
                        )}
                    </Panel>
                </div>

                {/* SHAP */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
                    <Panel title="Global SHAP — feature importance">
                        <ShapBarChart data={shap} />
                    </Panel>
                    <Panel title="Local SHAP — waterfall for current input">
                        <ShapWaterfall data={result?.explanation || shap} />
                    </Panel>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-6">
                    <Panel title="Predicted vs actual" actions={<Badge tone="neutral">{split === "time" ? "Time holdout" : "Vessel holdout"}</Badge>}>
                        <PredVsActualChart data={scatter || []} />
                        <p className="text-[10px] text-muted-foreground mt-2">Dashed line = y = x. Validation split: {split === "time" ? "time holdout" : "vessel holdout"}.</p>
                    </Panel>
                </div>
                <div className="col-span-12 lg:col-span-6">
                    <Panel title="Residuals" actions={<Badge tone="neutral">{split === "time" ? "Time holdout" : "Vessel holdout"}</Badge>}>
                        <ResidualChart data={scatter || []} />
                    </Panel>
                </div>
            </div>
            <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">Validation split:</span>
                <button onClick={() => setSplit("time")} className={cn("text-xs border px-2 h-7", split === "time" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>Time holdout</button>
                <button onClick={() => setSplit("vessel")} className={cn("text-xs border px-2 h-7", split === "vessel" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>Vessel holdout</button>
            </div>
        </div>
    );
}
