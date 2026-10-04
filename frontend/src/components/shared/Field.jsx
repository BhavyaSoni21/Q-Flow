import React from "react";
import { cn } from "@/lib/utils";

export function LabeledInput({ label, value, onChange, type = "text", unit, error, min, max, step, disabled }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="label-eyebrow">
                {label}
                {unit && <span className="text-muted-foreground/60 normal-case tracking-normal ml-1">({unit})</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn(
                    "h-8 px-2.5 border bg-background text-foreground num text-xs rounded-sm",
                    "focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted",
                    "placeholder:text-muted-foreground/50",
                    error ? "border-[hsl(var(--status-red))] bg-[hsl(var(--status-red))/5]" : "border-input"
                )}
            />
            {error && (
                <span className="text-[11px] text-[hsl(var(--status-red))] flex items-center gap-1">
                    {error}
                </span>
            )}
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
                    "h-8 px-2.5 border border-input bg-background text-foreground text-xs rounded-sm",
                    "focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20",
                    "disabled:opacity-50 disabled:bg-muted cursor-pointer"
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
        <label className={cn("inline-flex items-center gap-2 cursor-pointer select-none group", disabled && "opacity-50 cursor-not-allowed")}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="w-3.5 h-3.5 accent-[hsl(var(--accent))] cursor-pointer"
            />
            {label && (
                <span className="text-xs group-hover:text-foreground transition-colors">{label}</span>
            )}
        </label>
    );
}

export function SquareButton({ children, onClick, variant = "primary", disabled, className, type = "button" }) {
    const variants = {
        primary: "bg-[#0076a8] text-white hover:bg-[#005e86] border-[#0076a8] hover:border-[#005e86] shadow-sm",
        secondary: "bg-background text-foreground border-input hover:bg-muted hover:border-[#0076a8]/30",
        ghost: "bg-transparent text-foreground border-transparent hover:bg-muted",
        danger: "bg-red-600 text-white border-red-600 hover:bg-red-700",
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-8 px-3 text-xs font-semibold border rounded-sm transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
        >
            {children}
        </button>
    );
}
