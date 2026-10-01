import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

const AXIS_LABELS = {
    fuel: "Fuel (t)",
    cost: "Cost (INR k)",
    wtw: "WtW GHG (tCO₂e)",
    speed: "Speed (kn)",
};

export default function ParetoChart({ pareto = [], baseline = null, selected = null, onSelect, axisPair = ["fuel", "cost"] }) {
    const [xKey, yKey] = axisPair;

    const data = pareto.map((p, i) => ({
        ...p,
        index: i,
        x: p[xKey],
        y: p[yKey],
    }));

    const CustomDot = (props) => {
        const { cx, cy, payload } = props;
        const isSelected = selected && payload.index === selected.index;
        return (
            <circle
                cx={cx}
                cy={cy}
                r={isSelected ? 7 : 5}
                fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--chart-1))"}
                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--primary)/0.4)"}
                strokeWidth={isSelected ? 2 : 1}
                style={{ cursor: "pointer" }}
                onClick={() => onSelect && onSelect(payload)}
            />
        );
    };

    return (
        <div className="w-full h-64">
            {data.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Run optimization to see Pareto front
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="x"
                            name={AXIS_LABELS[xKey] ?? xKey}
                            tick={{ fontSize: 10 }}
                            label={{ value: AXIS_LABELS[xKey] ?? xKey, position: "insideBottom", offset: -10, fontSize: 10 }}
                        />
                        <YAxis
                            dataKey="y"
                            name={AXIS_LABELS[yKey] ?? yKey}
                            tick={{ fontSize: 10 }}
                            label={{ value: AXIS_LABELS[yKey] ?? yKey, angle: -90, position: "insideLeft", offset: 10, fontSize: 10 }}
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0]?.payload;
                                return (
                                    <div className="bg-popover border border-border rounded p-2 text-xs shadow-md">
                                        <p><span className="text-muted-foreground">{AXIS_LABELS[xKey]}:</span> {p?.x?.toFixed(1)}</p>
                                        <p><span className="text-muted-foreground">{AXIS_LABELS[yKey]}:</span> {p?.y?.toFixed(1)}</p>
                                    </div>
                                );
                            }}
                        />
                        <Scatter data={data} shape={<CustomDot />} />
                        {baseline && (
                            <ReferenceDot
                                x={baseline[xKey]}
                                y={baseline[yKey]}
                                r={6}
                                fill="hsl(var(--status-red))"
                                label={{ value: "Base", position: "top", fontSize: 10 }}
                            />
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
