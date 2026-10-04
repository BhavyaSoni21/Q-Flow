import React from "react";

// Shared Recharts styling constants optimized for enterprise presentation
export const CHART = {
    grid: "#E2E8F0", // lighter, subtle gridlines
    axis: "#64748B", // readable slate for axis text
    // General palette
    line1: "#0F172A", 
    line2: "#0284C7", 
    line3: "#E86A00", 
    line4: "#10B981", 
    line5: "#F43F5E",
    // Strict Algorithm Colors
    algo: {
        "Classical PSO": "#64748B", // Slate
        "NSGA-II": "#0284C7",       // Ocean Blue
        "QPSO": "#E86A00",          // QFlow Orange
    },
    // Emissions specific
    wtt: "#94A3B8", // Well-to-Tank (Slate)
    ttw: "#0284C7", // Tank-to-Wake (Blue)
    
    fontFamily: "Inter, 'Open_Sans', sans-serif",
    monoFont: "'IBM Plex Mono', monospace",
};

// Premium Enterprise Tooltip
export function FlatTooltip({ active, payload, label, unit }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="border border-[#CBD5E1] bg-white/95 backdrop-blur-md px-4 py-3 text-[13px] shadow-lg rounded-md">
            {label != null && <div className="font-bold text-[#0F172A] mb-2">{label}</div>}
            <div className="flex flex-col gap-1.5">
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-sm shadow-sm" style={{ background: p.color || p.fill }} />
                            <span className="text-[#475569] font-medium">{p.name}:</span>
                        </div>
                        <span className="font-mono font-semibold text-[#0F172A]">
                            {typeof p.value === "number" ? Number(p.value).toFixed(p.value < 10 && p.value % 1 !== 0 ? 3 : 1) : p.value}
                            {unit ? ` ${unit}` : ""}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const axisProps = {
    tick: { fontSize: 12, fill: CHART.axis, fontFamily: CHART.fontFamily, fontWeight: 500 },
    axisLine: { stroke: CHART.axis, strokeWidth: 1.5, opacity: 0.3 },
    tickLine: false,
    tickMargin: 8,
};

export const gridProps = {
    stroke: CHART.grid,
    strokeDasharray: "3 3",
    vertical: false, // mostly disable vertical grids for cleaner look
};
