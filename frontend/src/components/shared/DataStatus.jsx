import React from "react";
import { api } from "@/lib/api";

/** Shows whether a screen is using representative data or the live backend. */
export default function DataStatus({ status = null }) {
    const mock = api.isMock;
    const label = mock ? "Representative data" : status ? "Live backend" : "Live mode · status unavailable";
    const detail = mock
        ? "This screen is using seeded mock data."
        : status
            ? `${status.model_version} · ${status.fleet_data_status.replaceAll("_", " ")}`
            : "The API may fall back to representative data if a request fails.";
    return (
        <div className="border bg-card px-3 py-2 text-[11px] text-muted-foreground">
            <span className="label-eyebrow mr-2">Data status</span>
            <span className={mock ? "text-status-amber" : "text-status-green"}>{label}</span>
            <span className="mx-2">·</span>
            <span>{detail}</span>
        </div>
    );
}
