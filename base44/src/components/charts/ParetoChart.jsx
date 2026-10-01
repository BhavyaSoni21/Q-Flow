import React, { useRef } from "react";
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ReferenceDot,
    Legend,
    Cell,
} from "recharts";
import { CHART, FlatTooltip, axisProps } from "@/components/shared/ChartKit";

const FUEL_COLORS = {
    HFO: CHART.line5,
    VLSFO: CHART.line4,
    LNG: CHART.line2,
    METHANOL: CHART.line3,
    HYDROGEN: "#6B7F9E",
    AMMONIA: "#8A6FBF",
};

export default function ParetoChart({ pareto, baseline, selected, onSelect, axisPair = "cost-ghg" }) {
    const ref = useRef(null);
    const xKey = axisPair === "cost-ghg" ? "cost" : axisPair === "cost-fuel" ? "cost" : "fuel";
    const yKey = axisPair === "cost-ghg" ? "wtw" : axisPair === "cost-fuel" ? "fuel" : "wtw";
    const xLabel = axisPair === "cost-ghg" || axisPair === "cost-fuel" ? "Operating cost (USD)" : "Fuel (t)";
    const yLabel = axisPair === "cost-ghg" ? "Lifecycle WtW GHG (tCO2e)" : "Fuel (t)";

    const tagged = pareto.filter((p) => p.tag);
    const data = pareto.map((p) => ({ ...p, x: p[xKey], y: p[yKey] }));
    const baseData = baseline ? [{ x: baseline[xKey], y: baseline[yKey] }] : [];

    return (
        <div ref={ref} className="w-full" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 16, bottom: 36, left: 12 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                    <XAxis type="number" dataKey="x" name={xLabel} {...axisProps} label={{ value: xLabel, position: "insideBottom", offset: -20, fontSize: 11, fill: CHART.axis }} />
                    <YAxis type="number" dataKey="y" name={yLabel} {...axisProps} label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                    <ZAxis type="number" range={[40, 40]} />
                    <Tooltip content={<FlatTooltip unit="" />} cursor={{ stroke: CHART.grid }} />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: CHART.fontFamily }} />

                    {/* Baseline hollow marker */}
                    {baseData.length > 0 && (
                        <Scatter name="Baseline" data={baseData} fill="none" stroke={CHART.line1} strokeWidth={1.5} shape="square" />
                    )}

                    {/* Pareto points colored by fuel */}
                    <Scatter name="Pareto front" data={data} shape="square">
                        {data.map((d, i) => (
                            <Cell key={i} fill={FUEL_COLORS[d.fuelId] || CHART.line2} stroke={selected && d === selected ? CHART.line1 : "none"} strokeWidth={selected && d === selected ? 2 : 0} />
                        ))}
                    </Scatter>

                    {/* Tagged reference dots */}
                    {tagged.map((p) => (
                        <ReferenceDot
                            key={p.tag}
                            x={p[xKey]}
                            y={p[yKey]}
                            r={6}
                            fill="none"
                            stroke={CHART.line1}
                            strokeWidth={1.5}
                            label={{ value: p.tag, position: "top", fontSize: 10, fill: CHART.line1 }}
                        />
                    ))}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}