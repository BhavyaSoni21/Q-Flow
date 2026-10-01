import React, { useRef } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Area,
    ComposedChart,
} from "recharts";
import { CHART, FlatTooltip, axisProps } from "@/components/shared/ChartKit";

export function HvCurveChart({ data }) {
    return (
        <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 28, left: 4 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                    <XAxis dataKey="iteration" {...axisProps} label={{ value: "Iteration", position: "insideBottom", offset: -14, fontSize: 11, fill: CHART.axis }} />
                    <YAxis {...axisProps} label={{ value: "Hypervolume", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                    <Tooltip content={<FlatTooltip />} />
                    <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="NSGA-II" stroke={CHART.line1} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Classical PSO" stroke={CHART.line4} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="QPSO" stroke={CHART.line2} strokeWidth={1.5} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ScalabilityChart({ data }) {
    const runtime = data.map((d) => ({ vessels: d.vessels, "NSGA-II": d["NSGA-II"].runtime, "Classical PSO": d["Classical PSO"].runtime, QPSO: d.QPSO.runtime }));
    const hv = data.map((d) => ({ vessels: d.vessels, "NSGA-II": d["NSGA-II"].hv, "Classical PSO": d["Classical PSO"].hv, QPSO: d.QPSO.hv }));
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <p className="label-eyebrow mb-1">Runtime vs problem size</p>
                <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={runtime} margin={{ top: 6, right: 12, bottom: 24, left: 4 }}>
                            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                            <XAxis dataKey="vessels" {...axisProps} label={{ value: "Vessels", position: "insideBottom", offset: -12, fontSize: 11, fill: CHART.axis }} />
                            <YAxis {...axisProps} label={{ value: "Runtime (s)", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                            <Tooltip content={<FlatTooltip unit="s" />} />
                            <Legend verticalAlign="top" height={22} wrapperStyle={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="NSGA-II" stroke={CHART.line1} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line1 }} />
                            <Line type="monotone" dataKey="Classical PSO" stroke={CHART.line4} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line4 }} />
                            <Line type="monotone" dataKey="QPSO" stroke={CHART.line2} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <p className="label-eyebrow mb-1">Final hypervolume vs problem size</p>
                <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hv} margin={{ top: 6, right: 12, bottom: 24, left: 4 }}>
                            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                            <XAxis dataKey="vessels" {...axisProps} label={{ value: "Vessels", position: "insideBottom", offset: -12, fontSize: 11, fill: CHART.axis }} />
                            <YAxis {...axisProps} domain={[0.5, 0.8]} label={{ value: "Hypervolume", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                            <Tooltip content={<FlatTooltip />} />
                            <Legend verticalAlign="top" height={22} wrapperStyle={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="NSGA-II" stroke={CHART.line1} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line1 }} />
                            <Line type="monotone" dataKey="Classical PSO" stroke={CHART.line4} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line4 }} />
                            <Line type="monotone" dataKey="QPSO" stroke={CHART.line2} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export function BoxPlotChart({ data }) {
    // Render as a simple bar-based box plot using Recharts composed chart.
    return (
        <div className="w-full" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 12, left: 8 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="2 2" />
                    <XAxis dataKey="algorithm" {...axisProps} />
                    <YAxis {...axisProps} domain={[0.5, 0.8]} label={{ value: "Hypervolume", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.axis }} />
                    <Tooltip content={<FlatTooltip />} />
                    <Legend verticalAlign="top" height={22} wrapperStyle={{ fontSize: 10 }} />
                    <Area dataKey="min" fill="none" stroke="none" />
                    <Area dataKey="max" fill={CHART.line2} fillOpacity={0.08} stroke="none" />
                    <Line dataKey="median" stroke={CHART.line1} strokeWidth={1.5} dot={{ r: 3, fill: CHART.line1 }} />
                    <Line dataKey="q1" stroke={CHART.line2} strokeWidth={1} dot={false} strokeDasharray="3 3" />
                    <Line dataKey="q3" stroke={CHART.line2} strokeWidth={1} dot={false} strokeDasharray="3 3" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}