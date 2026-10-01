import React from "react";
import { cn } from "@/lib/utils";

export function StatusDot({ status, label }) {
    const color =
        status === "pass" || status === true ? "bg-status-green" : status === "fail" || status === false ? "bg-status-red" : "bg-status-amber";
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={cn("inline-block w-2.5 h-2.5", color)} />
            {label && <span className="text-xs">{label}</span>}
        </span>
    );
}

export function Badge({ children, tone = "neutral" }) {
    const tones = {
        neutral: "border-border text-muted-foreground",
        green: "border-status-green/50 text-status-green",
        amber: "border-status-amber/50 text-status-amber",
        red: "border-status-red/50 text-status-red",
        accent: "border-accent/50 text-accent",
    };
    return (
        <span className={cn("inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-wide border num", tones[tone])}>
            {children}
        </span>
    );
}