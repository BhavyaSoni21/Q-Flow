import React from "react";
import { cn } from "@/lib/utils";

export function Panel({ title, actions, className, bodyClassName, children, loading }) {
    return (
        <section className={cn("border bg-card", className)}>
            <div className="panel-header-bar">
                <h3 className="label-eyebrow">{title}</h3>
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
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="h-3.5 bg-muted animate-pulse" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function EmptyState({ message }) {
    return (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-center">
            <p>{message || "No data"}</p>
        </div>
    );
}

export function ErrorState({ message }) {
    return (
        <div className="flex items-center justify-center py-10 text-status-red text-center border border-status-red/40 bg-status-red/5">
            <p>{message || "Error loading data"}</p>
        </div>
    );
}