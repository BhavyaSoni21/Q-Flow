import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Panel } from "@/components/shared/Panel";
import { DataTable } from "@/components/shared/DataTable";
import { ExportCsv } from "@/components/shared/ExportButtons";
import { HvCurveChart, ScalabilityChart, BoxPlotChart } from "@/components/charts/BenchmarkCharts";
import { cn } from "@/lib/utils";

export default function Benchmarking() {
    const { config } = useStore();
    const [predRows, setPredRows] = useState(null);
    const [optRows, setOptRows] = useState(null);
    const [hvCurves, setHvCurves] = useState(null);
    const [scalability, setScalability] = useState(null);
    const [boxplot, setBoxplot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        Promise.all([
            api.getBenchmarks.prediction(),
            api.getBenchmarks.optimization(config.seed),
            api.getBenchmarks.hypervolumeCurves(config.seed),
            api.getBenchmarks.scalability(config.seed),
            api.getBenchmarks.boxplot(config.seed),
        ]).then(([p, o, h, s, b]) => {
            if (!alive) return;
            setPredRows(p); setOptRows(o); setHvCurves(h); setScalability(s); setBoxplot(b);
            setLoading(false);
        });
        return () => { alive = false; };
    }, [config.seed]);

    // Best per column for prediction (lower is better for mae/rmse/smape/train/infer; higher for r2)
    const predBest = React.useMemo(() => {
        if (!predRows) return {};
        const keys = ["mae", "rmse", "smape", "trainTime", "inferTime", "r2"];
        const best = {};
        keys.forEach((k) => {
            const lowerBetter = k !== "r2";
            best[k] = predRows.reduce((a, b) => (lowerBetter ? (b[k] < a ? b[k] : a) : (b[k] > a ? b[k] : a)), lowerBetter ? Infinity : -Infinity);
        });
        return best;
    }, [predRows]);

    const optBest = React.useMemo(() => {
        if (!optRows) return {};
        const keys = ["hypervolumeMean", "median", "best", "feasibleRate", "itersTo95", "runtime"];
        const best = {};
        keys.forEach((k) => {
            const lowerBetter = k === "itersTo95" || k === "runtime";
            best[k] = optRows.reduce((a, b) => (lowerBetter ? (b[k] < a ? b[k] : a) : (b[k] > a ? b[k] : a)), lowerBetter ? Infinity : -Infinity);
        });
        return best;
    }, [optRows]);

    return (
        <div className="p-4 flex flex-col gap-3">
            <Panel title="Table 1 — Prediction benchmark" loading={loading} actions={<ExportCsv rows={predRows || []} filename="prediction_bench.csv" />}>
                <DataTable
                    columns={[
                        { key: "model", header: "Model" },
                        { key: "mae", header: "MAE", numeric: true, render: (r) => <span className={cn(predBest.mae === r.mae && "font-bold")}>{r.mae.toFixed(2)}</span> },
                        { key: "rmse", header: "RMSE", numeric: true, render: (r) => <span className={cn(predBest.rmse === r.rmse && "font-bold")}>{r.rmse.toFixed(2)}</span> },
                        { key: "r2", header: "R²", numeric: true, render: (r) => <span className={cn(predBest.r2 === r.r2 && "font-bold")}>{r.r2.toFixed(3)}</span> },
                        { key: "smape", header: "sMAPE %", numeric: true, render: (r) => <span className={cn(predBest.smape === r.smape && "font-bold")}>{r.smape.toFixed(1)}</span> },
                        { key: "trainTime", header: "Train (s)", numeric: true, render: (r) => <span className={cn(predBest.trainTime === r.trainTime && "font-bold")}>{r.trainTime != null ? r.trainTime.toFixed(1) : "—"}</span> },
                        { key: "inferTime", header: "Infer (ms)", numeric: true, render: (r) => <span className={cn(predBest.inferTime === r.inferTime && "font-bold")}>{r.inferTime != null ? r.inferTime.toFixed(1) : "—"}</span> },
                        { key: "protocol", header: "Validation" },
                    ]}
                    rows={predRows || []}
                    emptyMessage="No benchmark data"
                />
                <p className="text-[10px] text-muted-foreground mt-2">Bold = best per column. Lower is better for MAE/RMSE/sMAPE/time; higher for R².</p>
            </Panel>

            <Panel title="Table 2 — Optimization benchmark" loading={loading} actions={<ExportCsv rows={optRows || []} filename="optimization_bench.csv" />}>
                <DataTable
                    columns={[
                        { key: "algorithm", header: "Algorithm" },
                        { key: "hypervolumeMean", header: "HV (mean ± std)", numeric: true, render: (r) => <span className={cn(optBest.hypervolumeMean === r.hypervolumeMean && "font-bold")}>{r.hypervolumeMean.toFixed(3)} ± {r.hypervolumeStd.toFixed(3)}</span> },
                        { key: "median", header: "Median", numeric: true, render: (r) => <span className={cn(optBest.median === r.median && "font-bold")}>{r.median.toFixed(3)}</span> },
                        { key: "best", header: "Best", numeric: true, render: (r) => <span className={cn(optBest.best === r.best && "font-bold")}>{r.best.toFixed(3)}</span> },
                        { key: "worst", header: "Worst", numeric: true, render: (r) => r.worst.toFixed(3) },
                        { key: "feasibleRate", header: "Feasible %", numeric: true, render: (r) => <span className={cn(optBest.feasibleRate === r.feasibleRate && "font-bold")}>{r.feasibleRate.toFixed(1)}</span> },
                        { key: "itersTo95", header: "Iters→95% HV", numeric: true, render: (r) => <span className={cn(optBest.itersTo95 === r.itersTo95 && "font-bold")}>{r.itersTo95}</span> },
                        { key: "runtime", header: "Runtime (s)", numeric: true, render: (r) => <span className={cn(optBest.runtime === r.runtime && "font-bold")}>{r.runtime.toFixed(2)}</span> },
                    ]}
                    rows={optRows || []}
                    emptyMessage="No benchmark data"
                />
                <p className="text-[10px] text-muted-foreground mt-2">Mean ± std over {config.runs} seeds. Bold = best per column. No fixed winner — wins and losses both shown.</p>
            </Panel>

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-7">
                    <Panel title="Chart 1 — Mean hypervolume vs iteration" loading={loading}>
                        {hvCurves && <HvCurveChart data={hvCurves} />}
                    </Panel>
                </div>
                <div className="col-span-12 lg:col-span-5">
                    <Panel title="Box plot — Final hypervolume across seeds" loading={loading}>
                        {boxplot && <BoxPlotChart data={boxplot} />}
                    </Panel>
                </div>
            </div>

            <Panel title="Chart 2 — Scalability vs problem size" loading={loading}>
                {scalability && <ScalabilityChart data={scalability} />}
            </Panel>

            <div className="border bg-card p-3 text-[11px] text-muted-foreground">
                <p className="label-eyebrow mb-1">Protocol</p>
                <p>
                    Seeds: {config.runs} · Scenario ID: SIH26138 · Dataset version: mock-v1 · Seed base: {config.seed}.
                    Results reported as measured; wins and losses are both shown. Optimizer labelled "Quantum-inspired (QPSO), classical hardware".
                </p>
            </div>
        </div>
    );
}