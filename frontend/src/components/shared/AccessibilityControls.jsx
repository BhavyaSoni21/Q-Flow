import React from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AccessibilityControls({ onDark = true }) {
    const { contrastMode, cycleContrast, fontScale, setFontScale } = useStore();
    const contrastLabel =
        contrastMode === "normal" ? "Normal" : contrastMode === "high-contrast" ? "High" : "Dark";

    const base = "px-1.5 border text-[11px] leading-none h-5 transition-colors duration-150";
    const activeCls = onDark
        ? "border-sidebar-primary bg-sidebar-primary text-white"
        : "border-primary bg-primary text-primary-foreground";
    const idleCls = onDark
        ? "border-sidebar-border hover:bg-sidebar-accent text-sidebar-foreground"
        : "border-border hover:bg-muted text-foreground";
    const sepCls = onDark ? "opacity-30 text-sidebar-foreground" : "opacity-30 text-foreground";

    const SizeBtn = ({ val, label }) => (
        <button
            type="button"
            onClick={() => setFontScale(val)}
            aria-label={label}
            aria-pressed={fontScale === val}
            className={cn(base, fontScale === val ? activeCls : idleCls)}
        >
            {val === 0.9 ? "A-" : val === 1 ? "A" : "A+"}
        </button>
    );

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1" role="group" aria-label="Text size">
                <span className={cn("opacity-60 mr-0.5", onDark && "text-sidebar-foreground")}>Text</span>
                <SizeBtn val={0.9} label="Decrease text size" />
                <SizeBtn val={1} label="Normal text size" />
                <SizeBtn val={1.1} label="Increase text size" />
            </div>
            <span className={sepCls}>|</span>
            <button
                type="button"
                onClick={cycleContrast}
                aria-label="Cycle contrast mode"
                className={cn(base, idleCls)}
            >
                {contrastLabel}
            </button>
        </div>
    );
}