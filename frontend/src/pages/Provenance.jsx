import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Panel } from "@/components/shared/Panel";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/shared/StatusDot";
import { ExportCsv } from "@/components/shared/ExportButtons";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_TONE = {
    Operational: "neutral",
    Environmental: "neutral",
    Derived: "accent",
    Scenario: "neutral",
    Target: "neutral",
    Lifecycle: "neutral",
};

export default function Provenance() {
    const { config } = useStore();
    const [ledger, setLedger] = useState(null);
    const [experiments, setExperiments] = useState(null);
    const [drawer, setDrawer] = useState(null);

    useEffect(() => {
        api.getProvenance().then(setLedger);
        api.getExperimentLog(config.seed).then(setExperiments);
    }, [config.seed]);

    return (
        <div className="p-4 flex flex-col gap-3">
            <Panel title="Data provenance ledger" loading={!ledger} actions={<ExportCsv rows={ledger || []} filename="provenance.csv" />}>
                <DataTable
                    columns={[
                        { key: "field", header: "Field" },
                        { key: "type", header: "Type", render: (r) => <Badge tone={TYPE_TONE[r.type] || "neutral"}>{r.type}</Badge> },
                        { key: "source", header: "Source" },
                        { key: "unit", header: "Unit", numeric: true },
                        { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Synthetic" ? "amber" : "neutral"}>{r.status}</Badge> },
                        { key: "version", header: "Version / date", numeric: true },
                    ]}
                    rows={ledger || []}
                    emptyMessage="No provenance data"
                />
                <p className="text-[10px] text-muted-foreground mt-2">Synthetic fields tagged in amber. Sources: EU THETIS-MRV, NOAA AIS, Copernicus ERA5, IMO MEPC.391(81).</p>
            </Panel>

            <Panel title="Experiment log" loading={!experiments} actions={<ExportCsv rows={experiments || []} filename="experiments.csv" />}>
                <DataTable
                    columns={[
                        { key: "runId", header: "Run ID", render: (r) => <span className="num text-accent">{r.runId}</span> },
                        { key: "algorithm", header: "Algorithm" },
                        { key: "seed", header: "Seed", numeric: true },
                        { key: "population", header: "Pop", numeric: true },
                        { key: "iterations", header: "Iters", numeric: true },
                        { key: "datasetVersion", header: "Dataset" },
                        { key: "runtime", header: "Runtime (s)", numeric: true, render: (r) => r.runtime != null ? r.runtime.toFixed(1) : "—" },
                        { key: "hypervolume", header: "HV", numeric: true, render: (r) => r.hypervolume != null ? r.hypervolume.toFixed(3) : "—" },
                        { key: "feasibleRate", header: "Feasible %", numeric: true, render: (r) => r.feasibleRate != null ? r.feasibleRate.toFixed(1) : "—" },
                        { key: "timestamp", header: "Timestamp", numeric: true },
                    ]}
                    rows={experiments || []}
                    onRowClick={setDrawer}
                    emptyMessage="No experiments"
                />
                <p className="text-[10px] text-muted-foreground mt-2">Click a row to view full configuration JSON.</p>
            </Panel>

            {/* Side drawer */}
            {drawer && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(null)} />
                    <div className="relative w-full max-w-md bg-card border-l h-full flex flex-col">
                        <div className="panel-header-bar">
                            <h3 className="label-eyebrow">Run {drawer.runId} — config</h3>
                            <button onClick={() => setDrawer(null)} className="p-1 hover:bg-muted"><X size={14} strokeWidth={1.5} /></button>
                        </div>
                        <div className="p-3 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-4">
                                {["algorithm", "seed", "population", "iterations", "datasetVersion", "runtime", "hypervolume", "feasibleRate", "timestamp"].map((k) => (
                                    <div key={k} className="flex justify-between border-b py-1">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="num">{String(drawer[k])}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="label-eyebrow mb-2">Configuration JSON</p>
                            <pre className="text-[11px] num bg-muted p-2 overflow-x-auto border whitespace-pre-wrap break-all">{JSON.stringify(drawer.config, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}