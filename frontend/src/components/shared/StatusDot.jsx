import React from "react";
import { cn } from "@/lib/utils";

/**
 * StatusDot ΓÇö a coloured dot + optional label, used to represent pass/fail or on/off status.
 * Props:
 *   status  {boolean|null|undefined}  true = green, false = red, null/undefined = grey
 *   label   {string}                  optional text shown next to the dot
 *   size    {"sm"|"md"}               dot size (default "sm")
 */
export function StatusDot({ status, label, size = "sm" }) {
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
 * Badge ΓÇö a small pill badge, styled by variant.
 * Props:
 *   children  {ReactNode}
 *   variant   {"default"|"success"|"warning"|"error"|"outline"}
 *   className {string}
 */
export function Badge({ children, variant = "default", className }) {
    const variantStyles = {
        default: "bg-primary/10 text-primary border-primary/20",
        success: "bg-[hsl(var(--status-green))]/10 text-[hsl(var(--status-green))] border-[hsl(var(--status-green))]/20",
        warning: "bg-[hsl(var(--status-amber))]/10 text-[hsl(var(--status-amber))] border-[hsl(var(--status-amber))]/20",
        error: "bg-[hsl(var(--status-red))]/10 text-[hsl(var(--status-red))] border-[hsl(var(--status-red))]/20",
        outline: "bg-transparent text-foreground border-border",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none",
                variantStyles[variant] ?? variantStyles.default,
                className
            )}
        >
            {children}
        </span>
    );
}

export default StatusDot;
