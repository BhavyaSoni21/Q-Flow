import React from "react";
import { cn } from "@/lib/utils";

/**
 * StatusDot
 * @param {{ status?: any, label?: string, size?: "sm"|"md" }} [props]
 */
export function StatusDot({ status = undefined, label = "", size = "sm" } = {}) {
    const dotSize = size === "md" ? "w-2.5 h-2.5" : "w-2 h-2";
    const color =
        status === true
            ? "bg-[hsl(var(--status-green))]"
            : status === false
                ? "bg-[hsl(var(--status-red))]"
                : "bg-muted-foreground/40";

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={cn("rounded-full flex-shrink-0", dotSize, color)} />
            {label && (
                <span className="text-[11px] text-muted-foreground leading-none">{label}</span>
            )}
        </span>
    );
}

/**
 * Badge
 * @param {{ children?: any, variant?: string, className?: string, tone?: string }} [props]
 */
export function Badge({ children = null, variant = "default", className = "", tone = "" } = {}) {
    const variantStyles = {
        default: "bg-primary/10 text-primary border-primary/20",
        accent: "bg-[#0076a8]/10 text-[#0076a8] border-[#0076a8]/20",
        positive: "bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))] border-[hsl(var(--status-green))]/20",
        neutral: "bg-muted text-muted-foreground border-border",
        success: "bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))] border-[hsl(var(--status-green))]/20",
        warning: "bg-[hsl(var(--status-amber))]/10 text-[hsl(var(--status-amber))] border-[hsl(var(--status-amber))]/20",
        error: "bg-[hsl(var(--status-red))]/10 text-[hsl(var(--status-red))] border-[hsl(var(--status-red))]/20",
        outline: "bg-transparent text-foreground border-border",
    };

    const chosenStyle = tone && variantStyles[tone] ? variantStyles[tone] : (variantStyles[variant] || variantStyles.default);

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none",
                chosenStyle,
                className
            )}
        >
            {children}
        </span>
    );
}

export default StatusDot;
