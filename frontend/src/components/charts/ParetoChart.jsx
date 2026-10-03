import React from "react";
import { ScatterChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

const AXIS_LABELS = {
    fuel: "Fuel (t)",
    cost: "Cost (INR k)",
    wtw: "WtW GHG (tCO₂e)",
    speed: "Speed (kn)",
};

const FUEL_COLORS = { VLSFO: "#2563eb", LNG: "#0891b2", METHANOL: "#16a34a", AMMONIA: "#9333ea", HYDROGEN: "#ea580c", HFO: "#64748b" };

export default function ParetoChart({ pareto = [], baseline = null, selected = null, onSelect }) {
    const xKey = "cost";
    const yKey = "wtw";

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
                fill={FUEL_COLORS[payload.fuelId] || "#475569"}
                stroke={isSelected ? "#111827" : "#ffffff"}
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
                    <ScatterChart margin={{ top: 14, right: 28, bottom: 42, left: 34 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="x"
                            name={AXIS_LABELS[xKey] ?? xKey}
                            height={42}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`}
                            label={{ value: "Operating cost (INR)", position: "insideBottom", offset: -18, fontSize: 10 }}
                        />
                        <YAxis
                            dataKey="y"
                            name={AXIS_LABELS[yKey] ?? yKey}
                            width={72}
                            tick={{ fontSize: 10 }}
                            label={{ value: "WtW GHG (tCO2e)", angle: -90, position: "insideLeft", offset: -2, fontSize: 10 }}
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0]?.payload;
                                return (
                                    <div className="bg-popover border border-border rounded p-2 text-xs shadow-md">
                                        <p className="font-semibold">{p?.fuelId || "Unknown fuel"}</p>
                                        <p><span className="text-muted-foreground">Fuel:</span> {Number(p?.fuel || 0).toLocaleString()} t</p>
                                        <p><span className="text-muted-foreground">Cost:</span> {Number(p?.cost || 0).toLocaleString()} INR</p>
                                        <p><span className="text-muted-foreground">WtW GHG:</span> {Number(p?.wtw || 0).toFixed(2)} tCO2e</p>
                                        <p><span className="text-muted-foreground">Status:</span> {p?.feasible ? "Feasible" : "Review"}</p>
                                    </div>
                                );
                            }}
                        />
                        <Line
                            data={data.slice().sort((a, b) => a.x - b.x)}
                            dataKey="y"
                            type="monotone"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
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
            {data.length > 0 && <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] mt-1">
                {[...new Set(data.map((p) => p.fuelId).filter(Boolean))].map((fuel) => <span key={fuel} className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full" style={{ background: FUEL_COLORS[fuel] || "#475569" }} />{fuel}</span>)}
            </div>}
        </div>
    );
}
