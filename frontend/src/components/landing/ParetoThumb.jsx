import React from "react";

const PTS = [[40, 110], [70, 80], [100, 62], [130, 50], [160, 42], [190, 36], [220, 32]];

export default function ParetoThumb() {
    return (
        <svg
            viewBox="0 0 240 140"
            className="w-full h-32 border border-border bg-white"
            role="img"
            aria-label="Pareto front chart thumbnail"
        >
            <line x1="28" y1="120" x2="232" y2="120" stroke="#C9D2DA" strokeWidth="1" />
            <line x1="28" y1="12" x2="28" y2="120" stroke="#C9D2DA" strokeWidth="1" />
            {PTS.map(([x, y], i) => (
                <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill="#0A6EA8" />
            ))}
            <rect x="62" y="74" width="6" height="6" fill="none" stroke="#1F2D3D" strokeWidth="1.2" />
            <text x="120" y="135" textAnchor="middle" fontSize="8" fill="#6B7785" fontFamily="IBM Plex Mono, monospace">
                cost →   GHG ↑
            </text>
        </svg>
    );
}