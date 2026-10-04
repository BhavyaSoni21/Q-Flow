import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { RefreshCw, Download, Beaker, Cpu, Activity, Info } from "lucide-react";
import { HvCurveChart, BoxPlotChart, ScalabilityChart } from "@/components/charts/BenchmarkCharts";
import { getPredictionBenchmarks, getOptimizationBenchmarks, getHypervolumeCurves, getScalabilityData, getBoxPlotData } from "@/data/mock";

export default function Benchmarking() {
    const { config } = useStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Data states
    const [predRows, setPredRows] = useState(null);
    const [optRows, setOptRows] = useState(null);
    const [hvCurves, setHvCurves] = useState(null);
    const [boxplot, setBoxplot] = useState(null);
    const [scalability, setScalability] = useState(null);
    const [source, setSource] = useState(null);

    const load = React.useCallback(async (force = false) => {
        setLoading(true);
        return Promise.all([
            api.getBenchmarks.prediction(force).catch(() => getPredictionBenchmarks()),
            api.getBenchmarks.optimizer(force).catch(() => ({
                table: getOptimizationBenchmarks(),
                hvCurves: getHypervolumeCurves(),
                scalability: getScalabilityData(),
                boxplot: getBoxPlotData(),
                source: "mock",
            })),
        ])
            .then(([predRes, optRes]) => {
                setPredRows(Array.isArray(predRes) ? predRes : predRes.data);
                setOptRows(optRes.table);
                setHvCurves(optRes.hvCurves);
                setBoxplot(optRes.boxplot);
                setScalability(optRes.scalability);
                setSource(optRes.source);
            })
            .catch(console.error)
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        let alive = true;
        load(false).then(() => { if (!alive) setLoading(false); });
        return () => { alive = false; };
    }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load(true).finally(() => setRefreshing(false));
    };

    // Calculate Bests
    const predBest = React.useMemo(() => {
        if (!predRows || !predRows.length) return {};
        const keys = ["mae", "rmse", "smape", "trainTime", "inferTime", "r2"];
        const best = {};
        keys.forEach((k) => {
            const lowerBetter = k !== "r2";
            best[k] = predRows.reduce((a, b) => (lowerBetter ? (b[k] < a ? b[k] : a) : (b[k] > a ? b[k] : a)), lowerBetter ? Infinity : -Infinity);
        });
        return best;
    }, [predRows]);

    const optBest = React.useMemo(() => {
        if (!optRows || !optRows.length) return {};
        const keys = ["hypervolumeMean", "median", "best", "feasibleRate", "itersTo95", "runtime"];
        const best = {};
        keys.forEach((k) => {
            const lowerBetter = k === "itersTo95" || k === "runtime";
            best[k] = optRows.reduce((a, b) => (lowerBetter ? (b[k] < a ? b[k] : a) : (b[k] > a ? b[k] : a)), lowerBetter ? Infinity : -Infinity);
        });
        return best;
    }, [optRows]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Open_Sans',sans-serif]">
            
            {/* Page Header */}
            <div className="bg-white border-b border-[#E2E8F0] mb-8">
                <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A]">Benchmarking Lab</h1>
                            <span className="px-2.5 py-0.5 bg-[#E0F2FE] text-[#0369A1] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#BAE6FD]">
                                Synthetic Mock Data
                            </span>
                        </div>
                        <p className="text-[14px] text-[#475569]">
                            Evaluate ML surrogate prediction accuracy and MO-QPSO evolutionary optimization performance.
                        </p>
                    </div>
                    
                    <button
                        onClick={onRefresh}
                        disabled={refreshing || loading}
                        className="bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-[13px] font-bold px-4 py-2 border border-[#CBD5E1] rounded-md transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Computing..." : "Recompute Benchmark"}
                    </button>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 flex flex-col gap-12">
                
                {/* 1. SURROGATE MODEL ACCURACY */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#0076a8]/10 text-[#0076a8] flex items-center justify-center shrink-0">
                            <Activity size={18} />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">Surrogate Model Prediction Accuracy</h2>
                            <p className="text-[13px] text-[#64748B] mt-0.5">Evaluating baseline machine learning models against QPSO-tuned XGBoost.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Model Architecture</th>
                                        <th className="px-6 py-4 text-right">MAE</th>
                                        <th className="px-6 py-4 text-right">RMSE</th>
                                        <th className="px-6 py-4 text-right">R²</th>
                                        <th className="px-6 py-4 text-right">sMAPE %</th>
                                        <th className="px-6 py-4 text-right">Train (s)</th>
                                        <th className="px-6 py-4 text-right">Infer (ms)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {(predRows || []).map((r, i) => (
                                        <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#0F172A]">{r.model}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", predBest.mae === r.mae ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.mae.toFixed(2)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", predBest.rmse === r.rmse ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.rmse.toFixed(2)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", predBest.r2 === r.r2 ? "font-bold text-[#0076a8]" : "text-[#475569]")}>{r.r2.toFixed(3)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", predBest.smape === r.smape ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.smape.toFixed(1)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", predBest.trainTime === r.trainTime ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.trainTime?.toFixed(1) || "-"}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", predBest.inferTime === r.inferTime ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.inferTime?.toFixed(1) || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* 2. OPTIMIZATION ALGORITHM PERFORMANCE */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#E86A00]/10 text-[#E86A00] flex items-center justify-center shrink-0">
                            <Cpu size={18} />
                        </div>
                        <div>
                            <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">Optimization Engine Benchmarks</h2>
                            <p className="text-[13px] text-[#64748B] mt-0.5">Pareto-front generation (Hypervolume) and computational scalability.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Algorithm</th>
                                        <th className="px-6 py-4 text-right">HV (Mean ± Std)</th>
                                        <th className="px-6 py-4 text-right">Median HV</th>
                                        <th className="px-6 py-4 text-right">Best HV</th>
                                        <th className="px-6 py-4 text-right">Worst HV</th>
                                        <th className="px-6 py-4 text-right">Feasible %</th>
                                        <th className="px-6 py-4 text-right">Iters to 95% HV</th>
                                        <th className="px-6 py-4 text-right">Runtime (s)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {(optRows || []).map((r, i) => (
                                        <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#0F172A] flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: r.algorithm.includes('QPSO') ? '#E86A00' : r.algorithm.includes('NSGA') ? '#0284C7' : '#64748B'}} />
                                                {r.algorithm}
                                            </td>
                                            <td className={cn("px-6 py-4 text-right font-mono", optBest.hypervolumeMean === r.hypervolumeMean ? "font-bold text-[#E86A00]" : "text-[#475569]")}>{r.hypervolumeMean.toFixed(3)} ± {r.hypervolumeStd.toFixed(3)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", optBest.median === r.median ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.median.toFixed(3)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", optBest.best === r.best ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.best.toFixed(3)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-[#475569]">{r.worst.toFixed(3)}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", optBest.feasibleRate === r.feasibleRate ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.feasibleRate.toFixed(1)}%</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", optBest.itersTo95 === r.itersTo95 ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.itersTo95}</td>
                                            <td className={cn("px-6 py-4 text-right font-mono", optBest.runtime === r.runtime ? "font-bold text-[#0F172A]" : "text-[#475569]")}>{r.runtime.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                        <div className="col-span-12 lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                            <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">Mean Hypervolume vs Iteration</h3>
                            <div className="h-[280px]">
                                {hvCurves && <HvCurveChart data={hvCurves} />}
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                            <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">Final Hypervolume Across Seeds</h3>
                            <div className="h-[280px]">
                                {boxplot && <BoxPlotChart data={boxplot} />}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                        <h3 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider mb-4">Scalability vs Problem Size</h3>
                        <div className="h-[300px]">
                            {scalability && <ScalabilityChart data={scalability} />}
                        </div>
                    </div>
                </section>

                <div className="flex items-start gap-3 p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[12px] text-[#64748B]">
                    <Info size={16} className="shrink-0 text-[#0076a8] mt-0.5" />
                    <p className="leading-relaxed">
                        <strong className="text-[#0F172A]">Protocol Information:</strong> Aggregated over {config.runs} seeds using scenario ID SIH26138 on dataset version <span className="font-semibold text-[#0F172A]">mock-v1</span> (base seed: {config.seed}). QPSO utilizes quantum-inspired trajectory operators running on classical hardware. All figures are representative estimates for platform demonstration and have not been independently verified against real-time telemetry.
                    </p>
                </div>
            </div>
        </div>
    );
}

