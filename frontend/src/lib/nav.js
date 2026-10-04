import {
    LayoutDashboard,
    SlidersHorizontal,
    GitCompareArrows,
    BarChart3,
    TrendingUp,
    Leaf,
    Database
} from "lucide-react";

export const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", end: true, section: "Fleet Dashboard", crumb: ["Dashboard"] },
    { to: "/scenario", label: "Scenario", end: true, section: "Scenario Setup", crumb: ["Scenario"] },
    { to: "/optimization", label: "Optimization", section: "Optimization Results", crumb: ["Optimization", "Results"], hiddenFromNav: true },
    { to: "/benchmarking", label: "Benchmarking", section: "Benchmarking Lab", crumb: ["Insights", "Benchmarking"] },
    { to: "/prediction", label: "Prediction", section: "Fuel Prediction & SHAP", crumb: ["Insights", "Prediction"] },
    { to: "/emissions", label: "Emissions", section: "Emissions & Alternative Fuels", crumb: ["Insights", "Emissions"] },
    { to: "/provenance", label: "Data and Provenance", section: "Data and Provenance", crumb: ["Insights", "Data and Provenance"] },
];

export const INSIGHTS_ITEMS = [
    { to: "/benchmarking", label: "BENCHMARKING", icon: BarChart3, desc: "Algorithmic benchmarking & Pareto hypervolume" },
    { to: "/prediction", label: "PREDICTION", icon: TrendingUp, desc: "XGBoost ML fuel prediction & SHAP explainability" },
    { to: "/emissions", label: "EMISSIONS", icon: Leaf, desc: "Well-to-Wake lifecycle GHG & alternative fuels" },
    { to: "/provenance", label: "DATA AND PROVENANCE", icon: Database, desc: "AIS, weather, engine telemetry & audit trails" },
];

export const MODULES = [
    { to: "/dashboard", label: "Fleet Dashboard", icon: LayoutDashboard },
    { to: "/scenario", label: "Scenario Setup", icon: SlidersHorizontal },
    { to: "/optimization", label: "Fleet Optimization", icon: GitCompareArrows },
    { to: "/benchmarking", label: "Benchmarking Lab", icon: BarChart3 },
    { to: "/prediction", label: "Fuel Prediction", icon: TrendingUp },
    { to: "/emissions", label: "Emissions and Fuels", icon: Leaf },
    { to: "/provenance", label: "Data and Provenance", icon: Database },
];
