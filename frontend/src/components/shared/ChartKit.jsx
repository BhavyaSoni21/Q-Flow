import React from "react";

// Shared flat Recharts styling constants.
export const CHART = {
    grid: "#D5DAE0",
    axis: "#5F6B7A",
    line1: "#12324F",
    line2: "#2F6F9F",
    line3: "#2E7D32",
    line4: "#B26A00",
    line5: "#B3261E",
    fontFamily: "Inter, sans-serif",
    monoFont: "IBM Plex Mono, monospace",
};

export function FlatTooltip({ active, payload, label, unit, valueKeys }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="border bg-card px-2 py-1.5 text-xs shadow-none">
            {label != null && <div className="font-semibold mb-1 num">{label}</div>}
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5" style={{ background: p.color || p.fill }} />
                    <span className="text-muted-foreground">{p.name}:</span>
                    <span className="num">{Number(p.value).toFixed(p.value < 10 ? 3 : 1)}{unit ? ` ${unit}` : ""}</span>
                </div>
            ))}
        </div>
    );
}

export const axisProps = {
    tick: { fontSize: 11, fill: CHART.axis, fontFamily: CHART.monoFont },
    axisLine: { stroke: CHART.grid },
    tickLine: false,
};