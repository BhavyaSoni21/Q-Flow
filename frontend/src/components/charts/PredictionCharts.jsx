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
        <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 100 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" horizontal={false} />
                    <XAxis type="number" {...axisProps} label={{ value: "SHAP value (t)", position: "insideBottom", offset: -2, fontSize: 11, fill: CHART.axis }} />
                    <YAxis type="category" dataKey="feature" {...axisProps} width={100} />
                    <Tooltip content={<FlatTooltip unit="t" />} cursor={{ fill: CHART.grid, opacity: 0.3 }} />
                    <Bar dataKey="value" fill={CHART.line2} barSize={14}>
                        {sorted.map((d, i) => (
                            <Cell key={i} fill={d.value >= 0 ? CHART.line2 : CHART.line5} />
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
        <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 100 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" horizontal={false} />
                    <XAxis type="number" {...axisProps} label={{ value: "Cumulative contribution (t)", position: "insideBottom", offset: -2, fontSize: 11, fill: CHART.axis }} />
                    <YAxis type="category" dataKey="feature" {...axisProps} width={100} />
                    <Tooltip content={<FlatTooltip unit="t" />} cursor={{ fill: CHART.grid, opacity: 0.3 }} />
                    <Bar dataKey="start" stackId="a" fill="transparent" barSize={14} />
                    <Bar dataKey="value" stackId="a" barSize={14}>
                        {rows.map((d, i) => (
                            <Cell key={i} fill={d.value >= 0 ? CHART.line2 : CHART.line5} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function PredVsActualChart({ data }) {
    const max = Math.max(...data.map((d) => Math.max(d.actual, d.predicted)));
    return (
        <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                    <XAxis type="number" dataKey="actual" name="Actual" {...axisProps} domain={[0, max * 1.05]} label={{ value: "Actual (t)", position: "insideBottom", offset: -14, fontSize: 11, fill: CHART.axis }} />
                    <YAxis type="number" dataKey="predicted" name="Predicted" {...axisProps} domain={[0, max * 1.05]} label={{ value: "Predicted (t)", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                    <Tooltip content={<FlatTooltip unit="t" />} />
                    <Scatter data={data} fill={CHART.line2} shape="square" />
                    <ReferenceLine segment={[{ x: 0, y: 0 }, { x: max * 1.05, y: max * 1.05 }]} stroke={CHART.line1} strokeWidth={1} strokeDasharray="4 4" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ResidualChart({ data }) {
    return (
        <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                    <XAxis type="number" dataKey="actual" name="Actual" {...axisProps} label={{ value: "Actual (t)", position: "insideBottom", offset: -14, fontSize: 11, fill: CHART.axis }} />
                    <YAxis type="number" dataKey="residual" name="Residual" {...axisProps} label={{ value: "Residual (t)", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                    <Tooltip content={<FlatTooltip unit="t" />} />
                    <Scatter data={data} fill={CHART.line4} shape="square" />
                    <ReferenceLine y={0} stroke={CHART.line1} strokeWidth={1} strokeDasharray="4 4" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}