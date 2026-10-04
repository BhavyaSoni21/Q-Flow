import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/shared/StatusDot";
import { ShapBarChart, ShapWaterfall, PredVsActualChart, ResidualChart } from "@/components/charts/PredictionCharts";
import { cn } from "@/lib/utils";
import DataStatus from "@/components/shared/DataStatus";

export default function Prediction() {
    const [result, setResult] = useState(null);
    const [loadingResult, setLoadingResult] = useState(false);
    const [scatter, setScatter] = useState(null);
    const [loadingScatter, setLoadingScatter] = useState(false);
    const [split, setSplit] = useState("time");
    const [dataStatus, setDataStatus] = useState(null);

    // Fetch validation scatter points and backend status
    useEffect(() => {
        setLoadingScatter(true);
        api.getPredictionScatter(42, split)
            .then(setScatter)
            .finally(() => setLoadingScatter(false));
        api.getStatus().then(setDataStatus);
    }, [split]);

    // Fetch baseline prediction on mount for Local SHAP explanation
    useEffect(() => {
        setLoadingResult(true);
        api.predictFuel({
            vesselType: "Panamax",
            loadFactor: 0.7,
            speed: 14,
            enginePower: 12000,
            wind: 8,
            waveHeight: 1.5,
            seaState: 3,
            fuelType: "VLSFO",
            distance: 600,
        })
            .then(setResult)
            .finally(() => setLoadingResult(false));
    }, []);

    const shap = api.getShapGlobal();

    return (
        <div className="p-4 flex flex-col gap-4">
            <DataStatus status={dataStatus} />

            {/* Header & Controls Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card border px-4 py-2.5 rounded-sm">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">Model Predictions & Explainability</h2>
                    <p className="text-xs text-muted-foreground">SHAP feature contributions and validation holdout performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Validation Split:</span>
                    <div className="inline-flex rounded-sm border bg-muted/60 p-0.5">
                        <button
                            type="button"
                            onClick={() => setSplit("time")}
                            className={cn(
                                "text-xs px-3 py-1 rounded-sm font-medium transition-colors",
                                split === "time"
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Time holdout
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplit("vessel")}
                            className={cn(
                                "text-xs px-3 py-1 rounded-sm font-medium transition-colors",
                                split === "vessel"
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Vessel holdout
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 Graphs: 2x2 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Global SHAP */}
                <Panel
                    title="Global SHAP ΓÇö Feature Importance"
                    actions={<Badge tone="neutral">All Features</Badge>}
                >
                    <ShapBarChart data={shap} />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Mean absolute SHAP value impact across the training corpus (higher = more influential).
                    </p>
                </Panel>

                {/* 2. Local SHAP Waterfall */}
                <Panel
                    title="Local SHAP ΓÇö Contribution Breakdown"
                    loading={loadingResult}
                    actions={<Badge tone="neutral">Base: {result?.fuel ? `${result.fuel.toFixed(1)} t` : "Baseline"}</Badge>}
                >
                    <ShapWaterfall data={result?.explanation || shap} />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Cumulative feature contributions to fuel consumption for standard Panamax voyage.
                    </p>
                </Panel>

                {/* 3. Predicted vs Actual */}
                <Panel
                    title="Predicted vs Actual"
                    loading={loadingScatter}
                    actions={<Badge tone="neutral">{split === "time" ? "Time holdout" : "Vessel holdout"}</Badge>}
                >
                    <PredVsActualChart data={scatter || []} />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Dashed line = y = x ideal reference. Split: {split === "time" ? "Time holdout" : "Vessel holdout"}.
                    </p>
                </Panel>

                {/* 4. Residuals */}
                <Panel
                    title="Model Residuals (Prediction Errors)"
                    loading={loadingScatter}
                    actions={<Badge tone="neutral">{split === "time" ? "Time holdout" : "Vessel holdout"}</Badge>}
                >
                    <ResidualChart data={scatter || []} />
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Dotted line = zero residual (actual ΓêÆ predicted = 0). Split: {split === "time" ? "Time holdout" : "Vessel holdout"}.
                    </p>
                </Panel>
            </div>
        </div>
    );
}
