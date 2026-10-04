import React from "react";
import { cn } from "@/lib/utils";

/**
 * @param {{ title?: any, actions?: any, className?: string, bodyClassName?: string, children?: any, loading?: boolean }} [props]
 */
export function Panel({ title = "", actions = null, className = "", bodyClassName = "", children = null, loading = false } = {}) {
    return (
        <section className={cn("border border-border/80 bg-card rounded-sm card-elevated fade-in", className)}>
            <div className="panel-header-bar rounded-t-sm">
                <h3 className="label-eyebrow text-foreground/70">{title}</h3>
                <div className="flex items-center gap-1.5">{actions}</div>
            </div>
            <div className={cn("p-3", bodyClassName)}>
                {loading ? <SkeletonRows rows={6} cols={4} /> : children}
            </div>
        </section>
    );
}

export function SkeletonRows({ rows = 5, cols = 4 }) {
    return (
        <div className="space-y-2.5">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="h-3.5 bg-muted/70 animate-pulse rounded-sm" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function EmptyState({ message = "", icon = null } = {}) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center gap-2">
            {icon && <div className="opacity-30 mb-1">{icon}</div>}
            <p className="text-sm">{message || "No data"}</p>
        </div>
    );
}

export function ErrorState({ message = "" } = {}) {
    return (
        <div className="flex items-center justify-center py-8 text-status-red text-center border border-status-red/30 bg-status-red/5 rounded-sm gap-2 px-4">
            <p className="text-xs">{message || "Error loading data"}</p>
        </div>
    );
}
