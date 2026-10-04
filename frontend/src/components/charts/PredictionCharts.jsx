import React from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ScatterChart,
    Scatter,
    Line,
    ComposedChart,
    ReferenceLine,
} from "recharts";
import { CHART, FlatTooltip, axisProps } from "@/components/shared/ChartKit";

export function ShapBarChart({ data }) {
    const sorted = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return (
        <div style={{ height: 320 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sorted} layout="vertical" margin={{ top: 10, right: 30, bottom: 20, left: 110 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.5} />
                    <XAxis 
                        type="number" 
                        {...axisProps} 
                        label={{ value: "SHAP value (t)", position: "insideBottom", offset: -15, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={10} 
                    />
                    <YAxis 
                        type="category" 
                        dataKey="feature" 
                        {...axisProps} 
                        width={100} 
                        tick={{ fontSize: 12, fill: CHART.axis, fontFamily: CHART.fontFamily, fontWeight: 600 }} 
                        tickMargin={8}
                    />
                    <Tooltip content={<FlatTooltip unit="t" />} cursor={{ fill: "#F1F5F9" }} />
                    <Bar dataKey="value" fill={CHART.line2} barSize={20} radius={[0, 4, 4, 0]}>
                        {sorted.map((d, i) => (
                            <Cell key={i} fill={d.value >= 0 ? CHART.line2 : CHART.line3} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ShapWaterfall({ data }) {
    // Local waterfall — cumulative contribution
    let cum = 0;
    const rows = data.map((d) => {
        const start = cum;
        cum += d.value;
        return { feature: d.feature, start, end: cum, value: d.value };
    });
    return (
        <div style={{ height: 320 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 30, bottom: 20, left: 110 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.5} />
                    <XAxis 
                        type="number" 
                        {...axisProps} 
                        label={{ value: "Cumulative contribution (t)", position: "insideBottom", offset: -15, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={10} 
                    />
                    <YAxis 
                        type="category" 
                        dataKey="feature" 
                        {...axisProps} 
                        width={100} 
                        tick={{ fontSize: 12, fill: CHART.axis, fontFamily: CHART.fontFamily, fontWeight: 600 }} 
                        tickMargin={8}
                    />
                    <Tooltip content={<FlatTooltip unit="t" />} cursor={{ fill: "#F1F5F9" }} />
                    <Bar dataKey="start" stackId="a" fill="transparent" barSize={20} />
                    <Bar dataKey="value" stackId="a" barSize={20} radius={4}>
                        {rows.map((d, i) => (
                            <Cell key={i} fill={d.value >= 0 ? CHART.line2 : CHART.line3} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function PredVsActualChart({ data }) {
    if (!data?.length) return <div className="h-[280px] flex items-center justify-center text-sm text-[#64748B]">No validation points available</div>;
    const max = Math.max(...data.map((d) => Math.max(d.actual, d.predicted)), 1);
    return (
        <div style={{ height: 320 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" opacity={0.7} />
                    <XAxis 
                        type="number" 
                        dataKey="actual" 
                        name="Actual" 
                        {...axisProps} 
                        domain={[0, max * 1.05]} 
                        label={{ value: "Actual Fuel (t)", position: "insideBottom", offset: -25, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={10}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="predicted" 
                        name="Predicted" 
                        {...axisProps} 
                        domain={[0, max * 1.05]} 
                        label={{ value: "Predicted Fuel (t)", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={8}
                    />
                    <Tooltip content={<FlatTooltip unit="t" />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Scatter data={data} fill={CHART.line2} opacity={0.7} line={false} shape="circle" />
                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: max * 1.05, y: max * 1.05 }]} stroke="#0F172A" strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ResidualChart({ data }) {
    if (!data?.length) return <div className="h-[280px] flex items-center justify-center text-sm text-[#64748B]">No validation points available</div>;
    
    // Add residual dataKey mapping if it's not strictly calculated as predicted - actual natively
    const formattedData = data.map(d => ({ ...d, residual: d.predicted - d.actual }));
    
    return (
        <div style={{ height: 320 }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={formattedData} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" opacity={0.7} />
                    <XAxis 
                        type="number" 
                        dataKey="actual" 
                        name="Actual" 
                        {...axisProps} 
                        label={{ value: "Actual Fuel (t)", position: "insideBottom", offset: -25, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={10}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="residual" 
                        name="Residual" 
                        {...axisProps} 
                        label={{ value: "Residual Error (t)", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={8}
                    />
                    <Tooltip content={<FlatTooltip unit="t" />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Scatter data={formattedData} fill={CHART.line3} opacity={0.7} line={false} shape="circle" />
                    <ReferenceLine y={0} stroke="#0F172A" strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
