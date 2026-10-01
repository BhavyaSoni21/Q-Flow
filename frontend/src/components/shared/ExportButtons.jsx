import React from "react";
import { Download, Image as ImageIcon } from "lucide-react";

export function ExportCsv({ rows, filename = "export.csv" }) {
    const handle = () => {
        if (!rows || !rows.length) return;
        const keys = Object.keys(rows[0]);
        const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "")}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (
        <button onClick={handle} title="Export CSV" className="p-1 border border-transparent hover:border-border hover:bg-muted text-muted-foreground">
            <Download size={13} strokeWidth={1.5} />
        </button>
    );
}

export function ExportPng({ targetRef, filename = "chart.png" }) {
    const handle = () => {
        const el = targetRef?.current;
        if (!el) return;
        // Minimal PNG export via SVG serialization
        const svg = el.querySelector("svg");
        if (!svg) return;
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(encodeURIComponent(xml).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = svg.clientWidth || 800;
            canvas.height = svg.clientHeight || 400;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = filename;
            a.click();
        };
        image.src = `data:image/svg+xml;base64,${svg64}`;
    };
    return (
        <button onClick={handle} title="Export PNG" className="p-1 border border-transparent hover:border-border hover:bg-muted text-muted-foreground">
            <ImageIcon size={13} strokeWidth={1.5} />
        </button>
    );
}