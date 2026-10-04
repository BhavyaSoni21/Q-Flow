import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FUELS, PATHWAY_WTW } from "@/data/mock";
import { Panel } from "@/components/shared/Panel";
import { DataTable } from "@/components/shared/DataTable";
import { LabeledInput, LabeledSelect } from "@/components/shared/Field";
import { ExportCsv } from "@/components/shared/ExportButtons";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { CHART, FlatTooltip, axisProps } from "@/components/shared/ChartKit";
import { useStore } from "@/lib/store";
import DataStatus, { DataModeBadge } from "@/components/shared/DataStatus";

const DATASETS = [
    { value: "IMO MEPC.391(81)", label: "IMO MEPC.391(81) (2024)" },
    { value: "Sphera / ICCT", label: "Sphera / ICCT (2023)" },
    { value: "CONCAWE / IEA", label: "CONCAWE / IEA (2024)" },
];

export default function Emissions() {
    const [dataset, setDataset] = useState(DATASETS[0].value);
    const { config } = useStore();
    const [fuels, setFuels] = useState(null);
    const [ciiInput, setCiiInput] = useState({ ghg_tonnes: 100, capacity_tonnes: 50000, distance_nm: 1000, cii_limit: 3 });
    const [cii, setCii] = useState(null);

    useEffect(() => { api.getFuels().then(setFuels); }, []);
    useEffect(() => { api.calculateCii(ciiInput).then(setCii); }, [ciiInput]);
    const fuelList = fuels || FUELS;

    // Build stacked bar data: WtT, TtW per fuel (gCO2e/MJ)
    const chartData = fuelList.map((f) => {
        const pathway = config?.fuelPathways?.[f.id];
        let wtw = f.wtw;
        if (PATHWAY_WTW[f.id] && pathway && PATHWAY_WTW[f.id][pathway] != null) wtw = PATHWAY_WTW[f.id][pathway];
        return { fuel: f.id, name: f.name, WtT: f.wtt, TtW: f.ttw, WtW: wtw };
    });

    const factorRows = fuelList.map((f) => {
        const pathway = config?.fuelPathways?.[f.id];
        let wtw = f.wtw;
        if (PATHWAY_WTW[f.id] && pathway && PATHWAY_WTW[f.id][pathway] != null) wtw = PATHWAY_WTW[f.id][pathway];
        return {
            fuel: f.name,
            pathway: pathway || f.pathway,
            lhv: f.lhv,
            wtt: f.wtt,
            ttw: f.ttw,
            wtw: wtw.toFixed(1),
            source: f.source,
            version: f.version,
        };
    });

    // Shore power row
    const shorePowerRow = config?.shorePowerEnabled ? [{
        fuel: "Shore power (electricity)",
        pathway: "Grid",
        lhv: "—",
        wtt: "—",
        ttw: "—",
        wtw: ((config.gridEmissionFactor || 380) / 3.6).toFixed(1),
        source: "Grid operator",
        version: "2025",
    }] : [];

    return (
        <div className="p-4 flex flex-col gap-3">
            <DataStatus />
            <Panel
                title="Well-to-Wake emissions per fuel pathway"
                actions={<><DataModeBadge /><LabeledSelect value={dataset} onChange={setDataset} options={DATASETS} /></>}
            >
                <div style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
                            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                            <XAxis dataKey="fuel" {...axisProps} label={{ value: "Fuel pathway", position: "insideBottom", offset: -14, fontSize: 11, fill: CHART.axis }} />
                            <YAxis {...axisProps} label={{ value: "gCO2e / MJ", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                            <Tooltip content={<FlatTooltip unit="gCO2e/MJ" />} cursor={{ fill: CHART.grid, opacity: 0.3 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="WtT" stackId="a" fill={CHART.line2} barSize={28} />
                            <Bar dataKey="TtW" stackId="a" fill={CHART.line1} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Stacked: Well-to-Tank (WtT) + Tank-to-Wake (TtW) = Well-to-Wake (WtW). Factor dataset: {dataset}.</p>
            </Panel>

            <Panel title="Emission factors table" actions={<ExportCsv rows={[...factorRows, ...shorePowerRow]} filename="emission_factors.csv" />}>
                <DataTable
                    columns={[
                        { key: "fuel", header: "Fuel" },
                        { key: "pathway", header: "Pathway" },
                        { key: "lhv", header: "LHV (MJ/kg)", numeric: true, render: (r) => typeof r.lhv === "number" ? r.lhv : r.lhv },
                        { key: "wtt", header: "WtT (gCO2e/MJ)", numeric: true },
                        { key: "ttw", header: "TtW (gCO2e/MJ)", numeric: true },
                        { key: "wtw", header: "WtW (gCO2e/MJ)", numeric: true },
                        { key: "source", header: "Source" },
                        { key: "version", header: "Version" },
                    ]}
                    rows={[...factorRows, ...shorePowerRow]}
                    emptyMessage="No factors"
                />
            </Panel>

            <Panel title="Regulatory KPI - indicative CII-style check">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <LabeledInput label="GHG" unit="tCO2e" type="number" value={ciiInput.ghg_tonnes} onChange={(v) => setCiiInput({ ...ciiInput, ghg_tonnes: v })} min={0} />
                    <LabeledInput label="Capacity" unit="t" type="number" value={ciiInput.capacity_tonnes} onChange={(v) => setCiiInput({ ...ciiInput, capacity_tonnes: v })} min={1} />
                    <LabeledInput label="Distance" unit="nm" type="number" value={ciiInput.distance_nm} onChange={(v) => setCiiInput({ ...ciiInput, distance_nm: v })} min={1} />
                    <LabeledInput label="Limit" unit="gCO2e/dwt-nm" type="number" value={ciiInput.cii_limit} onChange={(v) => setCiiInput({ ...ciiInput, cii_limit: v })} min={0} />
                </div>
                {cii && <div className="mt-3 border-t pt-3 flex flex-wrap gap-4 text-xs">
                    <span>Attained: <strong className="num">{cii.attained_cii}</strong> {cii.unit}</span>
                    <span>Violation: <strong className="num">{cii.violation}</strong></span>
                    <span className={cii.satisfied ? "text-status-green" : "text-status-red"}>{cii.satisfied ? "Within limit" : "Over limit"}</span>
                </div>}
                <p className="text-[10px] text-muted-foreground mt-2">Indicative calculation only. Confirm applicable IMO/CII rules, reference lines, vessel class, and reporting period before regulatory use.</p>
            </Panel>

            <div className="border bg-card p-3 text-[11px] text-muted-foreground">
                <p className="label-eyebrow mb-1">Note</p>
                <p>Well-to-Wake (WtW) = Well-to-Tank (WtT) + Tank-to-Wake (TtW). WtT covers extraction, production and distribution of the fuel; TtW covers combustion / conversion on board. Shore power is shown as electricity × grid emission factor (gCO2e/kWh → gCO2e/MJ at 3.6 MJ/kWh).</p>
            </div>
        </div>
    );
}
