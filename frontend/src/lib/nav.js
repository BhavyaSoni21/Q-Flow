import { SlidersHorizontal, GitCompareArrows, BarChart3, BrainCircuit, Leaf, Database } from "lucide-react";

export const NAV_ITEMS = [
    { to: "/scenario", label: "Scenario", end: true, section: "Scenario", crumb: ["Scenario"] },
    { to: "/optimization", label: "Optimization", section: "Optimization Results", crumb: ["Optimization", "Results"] },
    { to: "/benchmarking", label: "Benchmarking", section: "Benchmarking", crumb: ["Benchmarking"] },
    { to: "/prediction", label: "Prediction", section: "Fuel Prediction", crumb: ["Prediction"] },
    { to: "/emissions", label: "Emissions", section: "Emissions and Fuels", crumb: ["Emissions"] },
    { to: "/provenance", label: "Data and Provenance", section: "Data and Provenance", crumb: ["Data and Provenance"] },
];

export const MODULES = [
    { to: "/scenario", label: "Scenario Setup", icon: SlidersHorizontal },
    { to: "/optimization", label: "Fleet Optimization", icon: GitCompareArrows },
    { to: "/benchmarking", label: "Benchmarking Lab", icon: BarChart3 },
    { to: "/prediction", label: "Fuel Prediction", icon: BrainCircuit },
    { to: "/emissions", label: "Emissions and Fuels", icon: Leaf },
    { to: "/provenance", label: "Data and Provenance", icon: Database },
];