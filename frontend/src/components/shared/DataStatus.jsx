import React from "react";
import { api } from "@/lib/api";

/**
 * Determines the canonical data mode label for the current environment.
 * Returns one of: "LIVE" | "REPRESENTATIVE" | "SYNTHETIC · MOCK"
 */
export function resolveDataMode(overrideMode) {
    if (overrideMode) return overrideMode;
    return api.isMock ? "SYNTHETIC · MOCK" : "REPRESENTATIVE";
}

const MODE_STYLES = {
    "LIVE":             "bg-green-100  text-green-800  border-green-300  dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    "REPRESENTATIVE":   "bg-amber-100  text-amber-800  border-amber-300  dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    "SYNTHETIC · MOCK": "bg-red-100    text-red-800    border-red-300    dark:bg-red-900/30   dark:text-red-300   dark:border-red-700",
};

/**
 * Inline badge used to label individual charts, tables, or panels with their
 * data mode so reviewers/judges can never mistake illustrative numbers for
 * measured operational evidence.
 *
 * Usage:  <DataModeBadge />   — auto-detects from api.isMock
 *         <DataModeBadge mode="LIVE" />  — explicit override
 *
 * @param {{ mode?: string }} [props]
 */
export function DataModeBadge({ mode = undefined } = {}) {
    const label = resolveDataMode(mode);
    const cls = MODE_STYLES[label] || MODE_STYLES["REPRESENTATIVE"];
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${cls}`}
            title={`Data mode: ${label}`}
        >
            {label}
        </span>
    );
}

/**
 * Page-level banner shown at the top of every module page.
 * Displays overall data mode, model version (when live), and fallback note.
 *
 * @param {{ status?: any, mode?: string }} [props]
 */
export default function DataStatus({ status = null, mode = undefined } = {}) {
    const label = resolveDataMode(mode);
    const cls = MODE_STYLES[label] || MODE_STYLES["REPRESENTATIVE"];

    let detail;
    if (label === "LIVE" && status) {
        detail = `${status.model_version} · ${status.fleet_data_status?.replaceAll("_", " ")}`;
    } else if (label === "SYNTHETIC · MOCK") {
        detail = "All values on this page are seeded representative data and are illustrative only.";
    } else {
        detail = status
            ? `${status.model_version} · ${status.fleet_data_status?.replaceAll("_", " ")}`
            : "The API may fall back to representative data if a request fails.";
    }

    return (
        <div className="border bg-card px-3 py-2 text-[11px] flex flex-wrap items-center gap-2 mb-3">
            <span className="label-eyebrow shrink-0">Data status</span>
            <DataModeBadge mode={label} />
            <span className="text-muted-foreground">{detail}</span>
            {label !== "LIVE" && (
                <span className="ml-auto text-muted-foreground italic text-[10px]">
                    Not operational or regulatory values
                </span>
            )}
        </div>
    );
}
