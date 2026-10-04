import React from "react";
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

const algoColors = CHART.algo;

export function HvCurveChart({ data }) {
    return (
        <div className="w-full mt-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="iteration" 
                        {...axisProps} 
                        label={{ value: "Iteration", position: "insideBottom", offset: -25, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={10}
                    />
                    <YAxis 
                        {...axisProps} 
                        label={{ value: "Mean Hypervolume", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={8}
                    />
                    <Tooltip content={<FlatTooltip />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 500, color: "#475569" }} iconType="circle" />
                    
                    <Line type="monotone" dataKey="Classical PSO" stroke={algoColors["Classical PSO"]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="NSGA-II" stroke={algoColors["NSGA-II"]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="QPSO" stroke={algoColors["QPSO"]} strokeWidth={3.5} dot={false} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ScalabilityChart({ data }) {
    const runtime = data.map((d) => ({ vessels: d.vessels, "Classical PSO": d["Classical PSO"].runtime, "NSGA-II": d["NSGA-II"].runtime, QPSO: d.QPSO.runtime }));
    const hv = data.map((d) => ({ vessels: d.vessels, "Classical PSO": d["Classical PSO"].hv, "NSGA-II": d["NSGA-II"].hv, QPSO: d.QPSO.hv }));
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            <div>
                <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-4 ml-4">Runtime vs Problem Size</p>
                <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={runtime} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="vessels" 
                                {...axisProps} 
                                label={{ value: "Number of Vessels", position: "insideBottom", offset: -25, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                                tickMargin={10}
                            />
                            <YAxis 
                                {...axisProps} 
                                label={{ value: "Runtime (seconds)", angle: -90, position: "insideLeft", fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                                tickMargin={8}
                            />
                            <Tooltip content={<FlatTooltip unit="s" />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
                            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 11, fontWeight: 500 }} iconType="circle" />
                            
                            <Line type="monotone" dataKey="Classical PSO" stroke={algoColors["Classical PSO"]} strokeWidth={2.5} dot={{ r: 3, fill: algoColors["Classical PSO"] }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="NSGA-II" stroke={algoColors["NSGA-II"]} strokeWidth={2.5} dot={{ r: 3, fill: algoColors["NSGA-II"] }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="QPSO" stroke={algoColors["QPSO"]} strokeWidth={3} dot={{ r: 4, fill: algoColors["QPSO"] }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <p className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-4 ml-4">Final Hypervolume vs Problem Size</p>
                <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hv} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                            <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="vessels" 
                                {...axisProps} 
                                label={{ value: "Number of Vessels", position: "insideBottom", offset: -25, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                                tickMargin={10}
                            />
                            <YAxis 
                                {...axisProps} 
                                domain={[0.5, 0.8]} 
                                label={{ value: "Final Hypervolume", angle: -90, position: "insideLeft", fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                                tickMargin={8}
                            />
                            <Tooltip content={<FlatTooltip />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
                            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 11, fontWeight: 500 }} iconType="circle" />
                            
                            <Line type="monotone" dataKey="Classical PSO" stroke={algoColors["Classical PSO"]} strokeWidth={2.5} dot={{ r: 3, fill: algoColors["Classical PSO"] }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="NSGA-II" stroke={algoColors["NSGA-II"]} strokeWidth={2.5} dot={{ r: 3, fill: algoColors["NSGA-II"] }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="QPSO" stroke={algoColors["QPSO"]} strokeWidth={3} dot={{ r: 4, fill: algoColors["QPSO"] }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export function BoxPlotChart({ data }) {
    // Render as a composed chart showing min/max range and median.
    return (
        <div className="w-full mt-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="algorithm" 
                        {...axisProps} 
                        tickMargin={12}
                        tick={{ fontSize: 12, fill: CHART.axis, fontFamily: CHART.fontFamily, fontWeight: 600 }}
                    />
                    <YAxis 
                        {...axisProps} 
                        domain={[0.5, 0.8]} 
                        label={{ value: "Hypervolume Range", angle: -90, position: "insideLeft", offset: -5, fontSize: 12, fill: CHART.axis, fontWeight: 500 }} 
                        tickMargin={8}
                    />
                    <Tooltip content={<FlatTooltip />} cursor={{ fill: "#F1F5F9" }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 500 }} iconType="plainline" />
                    
                    <Area type="step" dataKey="max" name="Maximum HV" fill="#E2E8F0" fillOpacity={0.4} stroke="none" />
                    <Area type="step" dataKey="min" name="Minimum HV" fill="#fff" fillOpacity={1} stroke="none" />
                    
                    <Line type="step" dataKey="median" name="Median HV" stroke="#0F172A" strokeWidth={2.5} dot={{ r: 4, fill: "#0F172A" }} activeDot={{ r: 6 }} />
                    <Line type="step" dataKey="q3" name="75th Percentile" stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    <Line type="step" dataKey="q1" name="25th Percentile" stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
