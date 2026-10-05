import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { FUELS, PATHWAY_WTW } from "@/data/mock";
import { DataTable } from "@/components/shared/DataTable";
import { ExportCsv } from "@/components/shared/ExportButtons";
import { LabeledSelect } from "@/components/shared/Field";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Info, Leaf, TrendingDown, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHART } from "@/components/shared/ChartKit";

const DATASETS = [
    { value: "IMO MEPC.391(81)", label: "IMO MEPC.391(81) (2024)" },
    { value: "Sphera / ICCT",    label: "Sphera / ICCT (2023)" },
    { value: "CONCAWE / IEA",    label: "CONCAWE / IEA (2024)" },
];

function EmissionsTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const wtt = payload.find(p => p.dataKey === "WtT");
    const ttw = payload.find(p => p.dataKey === "TtW");
    const total = (wtt?.value || 0) + (ttw?.value || 0);

    return (
        <div className="bg-white border border-[#E2E8F0] shadow-lg rounded-lg p-3 text-[13px] min-w-[200px]">
            <p className="font-bold text-[#0F172A] mb-2 pb-2 border-b border-[#E2E8F0]">{label}</p>
            <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5 text-[#64748B]">
                    <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: CHART.wtt }} /> WtT
                </div>
                <span className="font-mono font-medium text-[#0F172A]">{wtt?.value.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-[#64748B]">
                    <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: CHART.ttw }} /> TtW
                </div>
                <span className="font-mono font-medium text-[#0F172A]">{ttw?.value.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
                <strong className="text-[#0F172A]">Total WtW</strong>
                <strong className="font-mono text-[#0F172A]">{total.toFixed(1)} <span className="text-[10px] text-[#94A3B8] font-sans ml-0.5">gCO₂e</span></strong>
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
            lhv: "—",
            wtt: "—",
            ttw: "—",
            wtw: ((config.gridEmissionFactor || 380) / 3.6).toFixed(1),
            source: "Grid operator",
            version: "2025",
        }]
        : [];

    const allRows = [...factorRows, ...shorePowerRow];
    const minWtw = chartData.length > 0 ? Math.min(...chartData.map((d) => d.WtT + d.TtW)) : 0;
    const bestFuel = chartData.length > 0 ? chartData.reduce((a, b) => (a.WtT + a.TtW < b.WtT + b.TtW ? a : b)) : null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-['Open_Sans',sans-serif]">
            
            <div className="bg-white border-b border-[#E2E8F0] mb-8">
                <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A]">Emissions & Alternative Fuels</h1>
                        </div>
                        <p className="text-[14px] text-[#475569]">
                            Compare lifecycle emissions of marine fuels and verify regulatory CII compliance.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 flex flex-col gap-10">
                
                <section>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">Well-to-Wake Emissions per Fuel</h2>
                                {bestFuel && (
                                    <div className="mt-2 inline-flex items-center gap-2 text-[12px] font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-full">
                                        <TrendingDown size={14} />
                                        {bestFuel.fuel} has the lowest WtW emissions ({(bestFuel.WtT + bestFuel.TtW).toFixed(1)} gCO₂e/MJ)
                                    </div>
                                )}
                            </div>
                            <div className="w-full sm:w-64 shrink-0">
                                <LabeledSelect value={dataset} onChange={setDataset} options={DATASETS} />
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-6 mb-4">
                            <div className="flex items-center gap-2 text-[13px] font-medium text-[#475569]">
                                <div className="w-3.5 h-3.5 rounded-sm shadow-sm" style={{backgroundColor: CHART.wtt}} /> Well-to-Tank (WtT)
                            </div>
                            <div className="flex items-center gap-2 text-[13px] font-medium text-[#475569]">
                                <div className="w-3.5 h-3.5 rounded-sm shadow-sm" style={{backgroundColor: CHART.ttw}} /> Tank-to-Wake (TtW)
                            </div>
                        </div>

                        <div style={{ height: 360 }} className="w-full">
                            {chartData.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 40, left: 20 }} barCategoryGap="25%">
                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="fuel" 
                                            interval={0} 
                                            tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }} 
                                            tickLine={false} 
                                            axisLine={{ stroke: '#E2E8F0' }}
                                            angle={-20} 
                                            textAnchor="end" 
                                            height={60} 
                                            tickMargin={10} 
                                        />
                                        <YAxis 
                                            label={{ value: "gCO₂e / MJ", angle: -90, position: "insideLeft", offset: 0, fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} 
                                            tick={{ fontSize: 12, fill: '#64748B' }} 
                                            tickLine={false} 
                                            axisLine={false}
                                            width={70} 
                                            tickMargin={10} 
                                        />
                                        <Tooltip content={<EmissionsTooltip />} cursor={{ fill: "#F1F5F9" }} />
                                        <Bar dataKey="WtT" stackId="a" fill={CHART.wtt} radius={[0, 0, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={index} fill={CHART.wtt} opacity={entry.WtT + entry.TtW === minWtw ? 1 : 0.85} />
                                            ))}
                                        </Bar>
                                        <Bar dataKey="TtW" stackId="a" fill={CHART.ttw} radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={index} fill={CHART.ttw} opacity={entry.WtT + entry.TtW === minWtw ? 1 : 0.85} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">Emission Factors Reference</h2>
                        <ExportCsv rows={allRows} filename="emission_factors.csv" />
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-5 py-4">Fuel</th>
                                        <th className="px-5 py-4">Pathway</th>
                                        <th className="px-5 py-4 text-right">LHV <span className="normal-case opacity-70">(MJ/kg)</span></th>
                                        <th className="px-5 py-4 text-right">WtT <span className="normal-case opacity-70">(gCO₂e/MJ)</span></th>
                                        <th className="px-5 py-4 text-right">TtW <span className="normal-case opacity-70">(gCO₂e/MJ)</span></th>
                                        <th className="px-5 py-4 text-right">WtW <span className="normal-case opacity-70">(gCO₂e/MJ)</span></th>
                                        <th className="px-5 py-4">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {allRows.map((r, i) => (
                                        <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="px-5 py-3.5 font-bold text-[#0F172A]">{r.fuel}</td>
                                            <td className="px-5 py-3.5 text-[#475569]">{r.pathway}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.lhv}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.wtt}</td>
                                            <td className="px-5 py-3.5 text-right font-mono text-[#475569]">{r.ttw}</td>
                                            <td className="px-5 py-3.5 text-right font-mono font-bold text-[#0F172A]">{r.wtw}</td>
                                            <td className="px-5 py-3.5 text-[#64748B]">{r.source} {r.version}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="bg-[#0F172A] rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row">
                        <div className="flex-1 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#1E293B]">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck size={20} className="text-[#38BDF8]" />
                                <h2 className="text-[18px] font-bold text-white uppercase tracking-wide">CII Regulatory Checker</h2>
                            </div>
                            <p className="text-[13px] text-[#94A3B8] mb-8 leading-relaxed max-w-lg">
                                Input voyage parameters to calculate the indicative Carbon Intensity Indicator (CII). Compare attained efficiency against target limits.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total GHG (tCO₂e)</label>
                                    <input type="number" min="0" value={ciiInput.ghg_tonnes} onChange={(e) => setCiiInput({ ...ciiInput, ghg_tonnes: Math.max(0, Number(e.target.value)) })} className="w-full h-10 px-3 bg-[#1E293B] border border-[#334155] rounded-md text-white font-mono focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Capacity (dwt)</label>
                                    <input type="number" min="0" value={ciiInput.capacity_tonnes} onChange={(e) => setCiiInput({ ...ciiInput, capacity_tonnes: Math.max(0, Number(e.target.value)) })} className="w-full h-10 px-3 bg-[#1E293B] border border-[#334155] rounded-md text-white font-mono focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Distance (nm)</label>
                                    <input type="number" min="0" value={ciiInput.distance_nm} onChange={(e) => setCiiInput({ ...ciiInput, distance_nm: Math.max(0, Number(e.target.value)) })} className="w-full h-10 px-3 bg-[#1E293B] border border-[#334155] rounded-md text-white font-mono focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Required CII Limit</label>
                                    <input type="number" min="0" step="0.1" value={ciiInput.cii_limit} onChange={(e) => setCiiInput({ ...ciiInput, cii_limit: Math.max(0, Number(e.target.value)) })} className="w-full h-10 px-3 bg-[#1E293B] border border-[#334155] rounded-md text-white font-mono focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-[400px] bg-[#162032] p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
                            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Attained CII</div>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-[48px] font-extrabold text-white leading-none tracking-tighter font-mono">{cii ? cii.attained_cii : "—"}</span>
                                <span className="text-[13px] text-[#94A3B8]">gCO₂e / dwt-nm</span>
                            </div>

                            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Status</div>
                            {cii && cii.satisfied ? (
                                <div className="flex items-center gap-2 text-[20px] font-bold text-[#10B981]">
                                    <CheckCircle2 size={24} /> Compliant
                                </div>
                            ) : cii ? (
                                <div>
                                    <div className="flex items-center gap-2 text-[20px] font-bold text-[#F43F5E] mb-1">
                                        <AlertTriangle size={24} /> Non-Compliant
                                    </div>
                                    <div className="text-[13px] text-[#F43F5E]/80 font-mono">+{cii.violation} over limit</div>
                                </div>
                            ) : (
                                <div className="text-[20px] font-bold text-[#64748B]">Calculating...</div>
                            )}
                            
                            <div className="absolute -bottom-16 -right-16 opacity-5 pointer-events-none">
                                <ShieldCheck size={200} />
                            </div>
                        </div>
                    </div>
                </section>

                <p className="text-[11px] text-[#94A3B8] leading-relaxed max-w-4xl pt-4">
                    <strong>Methodology Note:</strong> Well-to-Wake (WtW) = Well-to-Tank (WtT) + Tank-to-Wake (TtW). 
                    WtT covers extraction, production and distribution of the fuel. TtW covers combustion/conversion on board. 
                    Shore power is shown as electricity with a specified grid emission factor (converted from gCO₂e/kWh to gCO₂e/MJ). 
                    The CII calculator provides indicative estimates and does not replace formal regulatory verification.
                </p>

            </div>
        </div>
    );
}
