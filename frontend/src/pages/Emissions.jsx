import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FUELS, PATHWAY_WTW } from "@/data/mock";
import { Panel } from "@/components/shared/Panel";
import { DataTable } from "@/components/shared/DataTable";
import { LabeledInput, LabeledSelect } from "@/components/shared/Field";
import { ExportCsv } from "@/components/shared/ExportButtons";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Cell,
} from "recharts";
import { CHART, FlatTooltip, axisProps } from "@/components/shared/ChartKit";
import { useStore } from "@/lib/store";
import { Info, TrendingDown } from "lucide-react";

const DATASETS = [
    { value: "IMO MEPC.391(81)", label: "IMO MEPC.391(81) (2024)" },
    { value: "Sphera / ICCT",    label: "Sphera / ICCT (2023)" },
    { value: "CONCAWE / IEA",    label: "CONCAWE / IEA (2024)" },
];

// Fixed custom legend Î“Ã‡Ã¶ no overlap
function ChartLegend() {
    return (
        <div className="flex items-center justify-center gap-6 mt-4 text-[12px] font-semibold text-[#475569]">
            <span className="inline-flex items-center gap-2 hover:text-[#0F172A] transition-colors cursor-default">
                <span className="w-4 h-4 inline-block rounded-sm shadow-sm" style={{ background: CHART.wtt }} />
                Well-to-Tank (WtT)
            </span>
            <span className="inline-flex items-center gap-2 hover:text-[#0F172A] transition-colors cursor-default">
                <span className="w-4 h-4 inline-block rounded-sm shadow-sm" style={{ background: CHART.ttw }} />
                Tank-to-Wake (TtW)
            </span>
        </div>
    );
}

// Tooltip for the stacked bar
function EmissionsTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const wtt = payload.find(p => p.dataKey === "WtT");
    const ttw = payload.find(p => p.dataKey === "TtW");
    const total = (wtt?.value || 0) + (ttw?.value || 0);

    return (
        <div className="border border-[#CBD5E1] bg-white/95 backdrop-blur-md px-4 py-3 text-[13px] shadow-lg rounded-md">
            <div className="font-bold text-[#0F172A] mb-3 border-b border-[#E2E8F0] pb-2">{label}</div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-6">
                    <span className="text-[#475569] font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shadow-sm" style={{ background: CHART.wtt }}/> Well-to-Tank:
                    </span>
                    <span className="font-mono font-semibold text-[#0F172A]">{wtt?.value.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <span className="text-[#475569] font-medium flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shadow-sm" style={{ background: CHART.ttw }}/> Tank-to-Wake:
                    </span>
                    <span className="font-mono font-semibold text-[#0F172A]">{ttw?.value.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between gap-6 mt-1 pt-2 border-t border-[#E2E8F0]">
                    <span className="text-[#0F172A] font-bold">Total WtW:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{total.toFixed(1)} gCOâ‚‚e</span>
                </div>
            </div>
        </div>
    );
}

export default function Emissions() {
    const [dataset, setDataset] = useState(DATASETS[0].value);
    const { config } = useStore();
    const [fuels, setFuels] = useState(null);
    const [ciiInput, setCiiInput] = useState({
        ghg_tonnes: 100,
        capacity_tonnes: 50000,
        distance_nm: 1000,
        cii_limit: 3,
    });
    const [cii, setCii] = useState(null);

    useEffect(() => { api.getFuels().then(setFuels); }, []);
    useEffect(() => { api.calculateCii(ciiInput).then(setCii); }, [ciiInput]);
    const fuelList = fuels || FUELS;

    const chartData = fuelList.map((f) => {
        const pathway = config?.fuelPathways?.[f.id];
        let wtw = f.wtw;
        if (PATHWAY_WTW[f.id] && pathway && PATHWAY_WTW[f.id][pathway] != null) {
            wtw = PATHWAY_WTW[f.id][pathway];
        }
        return { fuel: f.name, fuelId: f.id, WtT: f.wtt, TtW: f.ttw, WtW: wtw };
    });

    const factorRows = fuelList.map((f) => {
        const pathway = config?.fuelPathways?.[f.id];
        let wtw = f.wtw;
        if (PATHWAY_WTW[f.id] && pathway && PATHWAY_WTW[f.id][pathway] != null) {
            wtw = PATHWAY_WTW[f.id][pathway];
        }
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

    const shorePowerRow = config?.shorePowerEnabled
        ? [{
            fuel: "Shore power",
            pathway: "Grid",
            lhv: "Î“Ã‡Ã¶",
            wtt: "Î“Ã‡Ã¶",
            ttw: "Î“Ã‡Ã¶",
            wtw: ((config.gridEmissionFactor || 380) / 3.6).toFixed(1),
            source: "Grid operator",
            version: "2025",
        }]
        : [];

    // Lowest WtW for highlighting
    const minWtw = Math.min(...chartData.map((d) => d.WtT + d.TtW));

    return (
        <div className="p-4 sm:p-6 flex flex-col gap-4">

            {/* Î“Ã¶Ã‡Î“Ã¶Ã‡ How to use this page Î“Ã¶Ã‡Î“Ã¶Ã‡ */}
            <div className="flex gap-3 p-3 bg-[#e8f4fb] dark:bg-[#0f1e2d] border border-[#bae7ff] dark:border-[#1e3a5a] rounded-sm text-xs">
                <Info size={15} className="text-[#0076a8] dark:text-[#38bdf8] shrink-0 mt-0.5" />
                <div className="text-[#334155] dark:text-[#94a3b8]">
                    <span className="font-semibold text-[#0076a8] dark:text-[#38bdf8]">How to use this page: </span>
                    The bar chart shows Well-to-Wake (WtW) emissions per fuel Î“Ã‡Ã¶ shorter bars = cleaner fuel.
                    Use the <strong>CII checker</strong> below to test regulatory compliance for your vessel.
                    Fuel pathways can be changed in the <strong>Scenario</strong> section.
                </div>
            </div>

            {/* Î“Ã¶Ã‡Î“Ã¶Ã‡ WtW Chart Î“Ã¶Ã‡Î“Ã¶Ã‡ */}
            <Panel
                title="Well-to-Wake Emissions per Fuel Pathway"
                actions={<LabeledSelect value={dataset} onChange={setDataset} options={DATASETS} />}
            >
                {/* Î“Ã¶Ã‡Î“Ã¶Ã‡ Custom Legend (fixed, no overlap) Î“Ã¶Ã‡Î“Ã¶Ã‡ */}
                <ChartLegend />

                <div style={{ height: 300 }} className="mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 8, right: 20, bottom: 40, left: 16 }}
                            barCategoryGap="30%"
                        >
                            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="fuel"
                                {...axisProps}
                                interval={0}
                                tick={{ fontSize: 12, fill: CHART.axis, fontFamily: CHART.fontFamily, fontWeight: 500 }}
                                tickLine={false}
                                angle={-25}
                                textAnchor="end"
                                height={60} tickMargin={10}
                            />
                            <YAxis
                                {...axisProps}
                                label={{
                                    value: "gCOÎ“Ã©Ã©e / MJ",
                                    angle: -90,
                                    position: "insideLeft",
                                    offset: 4,
                                    fontSize: 12, fontWeight: 500,
                                    fill: CHART.axis,
                                    style: { fontFamily: CHART.fontFamily },
                                }}
                                width={60} tickMargin={8}
                            />
                            <Tooltip content={<EmissionsTooltip />} cursor={{ fill: "rgba(0,118,168,0.06)" }} />
                            <Bar dataKey="WtT" stackId="a" fill={CHART.wtt} name="Well-to-Tank (WtT)" radius={[0, 0, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={CHART.wtt}
                                        opacity={entry.WtT + entry.TtW === minWtw ? 1 : 0.85}
                                    />
                                ))}
                            </Bar>
                            <Bar dataKey="TtW" stackId="a" fill={CHART.ttw} name="Tank-to-Wake (TtW)" radius={[2, 2, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={CHART.ttw}
                                        opacity={entry.WtT + entry.TtW === minWtw ? 1 : 0.85}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Lowest-emission callout */}
                {(() => {
                    const best = chartData.reduce((a, b) => (a.WtT + a.TtW < b.WtT + b.TtW ? a : b));
                    return (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-[hsl(var(--status-green))] bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 px-2.5 py-1.5 rounded-sm">
                            <TrendingDown size={12} />
                            <strong>{best.fuel}</strong> has the lowest WtW emissions ({(best.WtT + best.TtW).toFixed(1)} gCOÎ“Ã©Ã©e/MJ) in the selected pathways.
                        </div>
                    );
                })()}

                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    Stacked: Well-to-Tank (WtT) + Tank-to-Wake (TtW) = Well-to-Wake (WtW). Dataset: {dataset}.
                </p>
            </Panel>

            {/* Î“Ã¶Ã‡Î“Ã¶Ã‡ Emission Factors Table Î“Ã¶Ã‡Î“Ã¶Ã‡ */}
            <Panel
                title="Emission Factors Reference Table"
                actions={<ExportCsv rows={[...factorRows, ...shorePowerRow]} filename="emission_factors.csv" />}
            >
                <DataTable
                    columns={[
                        { key: "fuel",    header: "Fuel" },
                        { key: "pathway", header: "Pathway" },
                        { key: "lhv",     header: "LHV (MJ/kg)",      numeric: true, render: (r) => r.lhv },
                        { key: "wtt",     header: "WtT (gCOÎ“Ã©Ã©e/MJ)",   numeric: true },
                        { key: "ttw",     header: "TtW (gCOÎ“Ã©Ã©e/MJ)",   numeric: true },
                        { key: "wtw",     header: "WtW (gCOÎ“Ã©Ã©e/MJ)",   numeric: true },
                        { key: "source",  header: "Source" },
                        { key: "version", header: "Version" },
                    ]}
                    rows={[...factorRows, ...shorePowerRow]}
                    emptyMessage="No factors"
                />
            </Panel>

            {/* Î“Ã¶Ã‡Î“Ã¶Ã‡ CII Checker Î“Ã¶Ã‡Î“Ã¶Ã‡ */}
            <Panel title="Regulatory KPI Î“Ã‡Ã¶ Indicative CII-Style Check">
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                    Enter your vessel's voyage data below to get an indicative CII result. A <strong>violation of 0</strong> and status <strong>Within limit</strong> means the vessel meets the set threshold.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <LabeledInput label="GHG" unit="tCO2e" type="number" value={ciiInput.ghg_tonnes}
                        onChange={(v) => setCiiInput({ ...ciiInput, ghg_tonnes: v })} min={0} />
                    <LabeledInput label="Capacity" unit="t" type="number" value={ciiInput.capacity_tonnes}
                        onChange={(v) => setCiiInput({ ...ciiInput, capacity_tonnes: v })} min={1} />
                    <LabeledInput label="Distance" unit="nm" type="number" value={ciiInput.distance_nm}
                        onChange={(v) => setCiiInput({ ...ciiInput, distance_nm: v })} min={1} />
                    <LabeledInput label="Limit" unit="gCO2e/dwt-nm" type="number" value={ciiInput.cii_limit}
                        onChange={(v) => setCiiInput({ ...ciiInput, cii_limit: v })} min={0} />
                </div>
                {cii && (
                    <div className="mt-4 border-t border-border pt-3 flex flex-wrap gap-4 text-xs">
                        <div className="flex flex-col gap-0.5">
                            <span className="label-eyebrow">Attained CII</span>
                            <span className="num text-base font-bold">{cii.attained_cii} <span className="text-muted-foreground text-[11px]">{cii.unit}</span></span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="label-eyebrow">Violation</span>
                            <span className="num text-base font-bold">{cii.violation}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="label-eyebrow">Status</span>
                            <span className={`text-sm font-bold ${cii.satisfied ? "text-[hsl(var(--status-green))]" : "text-[hsl(var(--status-red))]"}`}>
                                {cii.satisfied ? "Î“Â£Ã´ Within limit" : "Î“Â£Ã¹ Over limit"}
                            </span>
                        </div>
                    </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                    Indicative only. Confirm applicable IMO/CII rules, reference lines, vessel class, and reporting period before regulatory use.
                </p>
            </Panel>

            {/* Î“Ã¶Ã‡Î“Ã¶Ã‡ Note Î“Ã¶Ã‡Î“Ã¶Ã‡ */}
            <div className="border border-border/50 bg-muted/30 rounded-sm p-3 text-[11px] text-muted-foreground leading-relaxed">
                <p className="label-eyebrow mb-1">Methodology Note</p>
                <p>
                    Well-to-Wake (WtW) = Well-to-Tank (WtT) + Tank-to-Wake (TtW).
                    WtT covers extraction, production and distribution of the fuel.
                    TtW covers combustion/conversion on board.
                    Shore power is shown as electricity â”œÃ¹ grid emission factor (gCOÎ“Ã©Ã©e/kWh Î“Ã¥Ã† gCOÎ“Ã©Ã©e/MJ at 3.6 MJ/kWh).
                </p>
            </div>
        </div>
    );
}
