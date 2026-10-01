import React from "react";
import { cn } from "@/lib/utils";

export function LabeledInput({ label, value, onChange, type = "text", unit, error, min, max, step, disabled }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="label-eyebrow">{label}{unit && <span className="text-muted-foreground/70 normal-case tracking-normal"> ({unit})</span>}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn(
                    "h-8 px-2 border bg-background text-foreground num text-xs",
                    "focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed",
                    error ? "border-status-red" : "border-input"
                )}
            />
            {error && <span className="text-[11px] text-status-red">{error}</span>}
        </div>
    );
}

export function LabeledSelect({ label, value, onChange, options, disabled }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="label-eyebrow">{label}</label>}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    "h-8 px-2 border bg-background text-foreground text-xs",
                    "focus:outline-none focus:border-accent disabled:opacity-50"
                )}
            >
                {options.map((o) => (
                    <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
                        {typeof o === "string" ? o : o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function Checkbox({ checked, onChange, label, disabled }) {
    return (
        <label className={cn("inline-flex items-center gap-2 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="w-3.5 h-3.5 accent-[hsl(var(--accent))]"
            />
            {label && <span className="text-xs">{label}</span>}
        </label>
    );
}

export function SquareButton({ children, onClick, variant = "primary", disabled, className, type = "button" }) {
    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
        secondary: "bg-background text-foreground border-input hover:bg-muted",
        ghost: "bg-transparent text-foreground border-transparent hover:bg-muted",
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-8 px-3 text-xs font-medium border transition-colors duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
        >
            {children}
        </button>
    );
}