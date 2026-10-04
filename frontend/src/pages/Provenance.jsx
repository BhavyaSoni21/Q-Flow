import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { ExportCsv } from "@/components/shared/ExportButtons";
import { X, Search, Database, Clock, Terminal, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_TONE = {
    Operational: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
    Environmental: "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]",
    Derived: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    Scenario: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
    Target: "bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]",
    Lifecycle: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
};

export default function Provenance() {
    const { config } = useStore();
    const [ledger, setLedger] = useState(null);
    const [experiments, setExperiments] = useState(null);
    const [drawer, setDrawer] = useState(null);
    const [sourceStatus, setSourceStatus] = useState(null);

    useEffect(() => {
        api.getProvenance().then(setLedger);
        api.getExperimentLog(config.seed).then(setExperiments);
        api.getDataStatus().then(setSourceStatus);
    }, [config.seed]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Open_Sans',sans-serif]">
            
            {/* Page Header */}
            <div className="bg-white border-b border-[#E2E8F0] mb-8">
                <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A]">Data & Provenance</h1>
                            <span className="px-2.5 py-0.5 bg-[#FEE2E2] text-[#991B1B] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#FECACA]">
                                Synthetic / Mock Active
                            </span>
                        </div>
                        <p className="text-[14px] text-[#475569]">
                            Review dataset origins, track measurement lifecycles, and audit optimization runs.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 flex flex-col gap-10">
                
                {/* Source Availability Card */}
                {sourceStatus && (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 flex flex-col sm:flex-row items-center gap-6 text-[13px]">
                        <div className="flex items-center gap-2 font-bold text-[#0F172A] shrink-0">
                            <Database size={16} className="text-[#0076a8]" /> Dataset Status
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {Object.entries(sourceStatus.datasets).map(([name, present]) => (
                                <div key={name} className="flex items-center gap-2">
                                    <span className="text-[#64748B] uppercase tracking-wider text-[11px] font-bold">{name}</span>
                                    {present ? (
                                        <span className="flex items-center gap-1.5 text-[#059669] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Available</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-[#D97706] font-medium"><div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Not Loaded</span>
                                    )}
                                </div>
                            ))}
                            <div className="flex items-center gap-2 border-l border-[#E2E8F0] pl-6">
                                <span className="text-[#64748B] uppercase tracking-wider text-[11px] font-bold">Live API</span>
                                <span className={cn("font-medium", Object.values(sourceStatus.live_sources).some(Boolean) ? "text-[#059669]" : "text-[#475569]")}>
                                    {Object.values(sourceStatus.live_sources).some(Boolean) ? "Configured" : "Not Configured"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Provenance Ledger */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0076a8]/10 text-[#0076a8] flex items-center justify-center shrink-0">
                                <Search size={18} />
                            </div>
                            <div>
                                <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">Data Provenance Ledger</h2>
                                <p className="text-[13px] text-[#64748B] mt-0.5">Lineage mapping for all scenario inputs and environmental variables.</p>
                            </div>
                        </div>
                        <ExportCsv rows={ledger || []} filename="provenance.csv" />
                    </div>
                    
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                        
                        {/* Legend */}
                        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-3 flex flex-wrap items-center justify-end gap-3 text-[11px] font-medium">
                            <span className="text-[#94A3B8] uppercase tracking-wider font-bold mr-2">Status Legend:</span>
                            <span className="flex items-center gap-1.5 text-[#991B1B]"><div className="w-2 h-2 rounded-full bg-[#F87171]" /> Synthetic / Mock</span>
                            <span className="flex items-center gap-1.5 text-[#92400E]"><div className="w-2 h-2 rounded-full bg-[#FBBF24]" /> Derived / Computed</span>
                            <span className="flex items-center gap-1.5 text-[#1E40AF]"><div className="w-2 h-2 rounded-full bg-[#60A5FA]" /> Measured / Reported</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-white border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-5 py-4">Field</th>
                                        <th className="px-5 py-4">Type</th>
                                        <th className="px-5 py-4">Source Origin</th>
                                        <th className="px-5 py-4 text-right">Unit</th>
                                        <th className="px-5 py-4 text-center">Status</th>
                                        <th className="px-5 py-4 text-right">Version / Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {(ledger || []).map((r, i) => {
                                        const isMock = r.status === "Synthetic" || r.version?.startsWith("mock");
                                        const isDerived = r.status === "Derived";
                                        return (
                                            <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-[#0F172A]">{r.field}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={cn("inline-flex px-2 py-0.5 text-[11px] font-semibold border rounded-sm tracking-wide uppercase", TYPE_TONE[r.type] || TYPE_TONE.Operational)}>
                                                        {r.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-[#475569]">{r.source}</td>
                                                <td className="px-5 py-3.5 text-right font-mono text-[#64748B]">{r.unit || "-"}</td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={cn(
                                                        "inline-flex px-2 py-0.5 text-[11px] font-bold border rounded-full",
                                                        isMock ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]" : 
                                                        isDerived ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]" : 
                                                        "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]"
                                                    )}>
                                                        {r.status}{isMock && !r.status.includes("Synthetic") ? " (Mock)" : ""}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.version}</td>
                                            </tr>
                                        );
                                    })}
                                    {(!ledger || ledger.length === 0) && (
                                        <tr><td colSpan="6" className="px-5 py-8 text-center text-[#94A3B8]">Loading ledger data...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Experiment Log */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E86A00]/10 text-[#E86A00] flex items-center justify-center shrink-0">
                                <Terminal size={18} />
                            </div>
                            <div>
                                <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">Experiment Audit Log</h2>
                                <p className="text-[13px] text-[#64748B] mt-0.5">Historical record of scenario execution configurations and results. Click any run to inspect JSON.</p>
                            </div>
                        </div>
                        <ExportCsv rows={experiments || []} filename="experiments.csv" />
                    </div>
                    
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-5 py-4">Run ID</th>
                                        <th className="px-5 py-4">Algorithm</th>
                                        <th className="px-5 py-4 text-right">Seed</th>
                                        <th className="px-5 py-4 text-right">Pop</th>
                                        <th className="px-5 py-4 text-right">Iters</th>
                                        <th className="px-5 py-4">Dataset</th>
                                        <th className="px-5 py-4 text-right">Runtime (s)</th>
                                        <th className="px-5 py-4 text-right">HV</th>
                                        <th className="px-5 py-4 text-right">Feasible %</th>
                                        <th className="px-5 py-4 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {(experiments || []).map((r, i) => (
                                        <tr key={i} onClick={() => setDrawer(r)} className="hover:bg-[#F0F9FF] cursor-pointer transition-colors group">
                                            <td className="px-5 py-3.5 font-mono font-bold text-[#0076a8] group-hover:underline flex items-center gap-1.5">
                                                {r.runId} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-[#0F172A]">{r.algorithm}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#64748B]">{r.seed}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#64748B]">{r.population}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#64748B]">{r.iterations}</td>
                                            <td className="px-5 py-3.5 text-[#475569]">{r.datasetVersion}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.runtime?.toFixed(1) || "-"}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.hypervolume?.toFixed(3) || "-"}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.feasibleRate?.toFixed(1) || "-"}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#64748B]">{r.timestamp}</td>
                                        </tr>
                                    ))}
                                    {(!experiments || experiments.length === 0) && (
                                        <tr><td colSpan="10" className="px-5 py-8 text-center text-[#94A3B8]">Loading experiment log...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {/* JSON Drawer */}
            {drawer && (
                <div className="fixed inset-0 z-50 flex justify-end font-['Open_Sans',sans-serif]">
                    <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm transition-opacity" onClick={() => setDrawer(null)} />
                    <div className="relative w-full max-w-lg bg-white border-l border-[#E2E8F0] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <div className="flex items-center gap-3">
                                <Activity size={18} className="text-[#0076a8]" />
                                <h3 className="text-[14px] font-bold text-[#0F172A] uppercase tracking-wide">Run Details: <span className="text-[#0076a8]">{drawer.runId}</span></h3>
                            </div>
                            <button onClick={() => setDrawer(null)} className="p-1.5 rounded-md hover:bg-[#E2E8F0] text-[#64748B] transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            
                            <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3">Execution Summary</h4>
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                                    {[
                                        { k: "Algorithm", v: drawer.algorithm },
                                        { k: "Seed", v: drawer.seed },
                                        { k: "Population", v: drawer.population },
                                        { k: "Iterations", v: drawer.iterations },
                                        { k: "Dataset", v: drawer.datasetVersion },
                                        { k: "Runtime (s)", v: drawer.runtime?.toFixed(1) },
                                        { k: "Hypervolume", v: drawer.hypervolume?.toFixed(3) },
                                        { k: "Feasible %", v: drawer.feasibleRate?.toFixed(1) }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-[#E2E8F0]/60 pb-1.5 last:border-0 last:pb-0">
                                            <span className="text-[#64748B]">{item.k}</span>
                                            <span className="font-mono font-medium text-[#0F172A]">{item.v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3">Configuration Payload</h4>
                            <div className="bg-[#0F172A] rounded-lg overflow-hidden border border-[#334155]">
                                <div className="bg-[#1E293B] px-4 py-2 border-b border-[#334155] flex justify-between items-center">
                                    <span className="text-[11px] font-mono text-[#94A3B8]">config.json</span>
                                </div>
                                <pre className="p-4 text-[12px] font-mono text-[#38BDF8] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                                    {JSON.stringify(drawer.config, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
