import React, { useState } from "react";
import { Link } from "react-router-dom";
import LandingUtilityBar from "@/components/landing/LandingUtilityBar";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import {
    Cpu,
    GitMerge,
    Leaf,
    Zap,
    ShieldCheck,
    Gauge,
    Layers,
    BarChart3,
    ArrowRight,
    TrendingUp,
    Anchor,
    RefreshCw,
    SlidersHorizontal,
    Database,
    Sparkles,
    Check
} from "lucide-react";

const FEATURE_CATEGORIES = [
    { id: "all", label: "All Capabilities" },
    { id: "optimization", label: "Quantum Optimizer" },
    { id: "prediction", label: "Fuel & Power AI" },
    { id: "emissions", label: "Lifecycle & Clean Fuels" },
    { id: "provenance", label: "Audit & Benchmarking" }
];

const FEATURES_DATA = [
    {
        category: "optimization",
        badge: "Core Solver",
        title: "Multi-Objective QPSO (Quantum-Behaved PSO)",
        description: "Employs delta-potential-well quantum-inspired particle dynamics without velocity bounds, exploring non-convex maritime solution spaces to locate global Pareto frontiers.",
        metrics: ["3-Objective Pareto Search", "Delta-Potential Dynamics", "Sub-second Convergence"],
        icon: Cpu,
        link: "/optimization",
        linkText: "Launch Optimizer"
    },
    {
        category: "optimization",
        badge: "Constraint Engine",
        title: "Mixed-Variable Decoder & Constraint Repair",
        description: "Transforms continuous [0,1] multidimensional genotypes into discrete vessel allocations, continuous speed throttles, fuel switches, and cold-ironing shore power schedules with instant constraint repair.",
        metrics: ["100% Feasibility Guarantee", "Cargo Demand Matching", "ETA Deadline Enforcement"],
        icon: SlidersHorizontal,
        link: "/scenario",
        linkText: "Configure Constraints"
    },
    {
        category: "prediction",
        badge: "Surrogate ML",
        title: "Speed-Resolved Operational Power Model",
        description: "High-accuracy XGBoost surrogate trained on speed-resolved telemetry and validated on real-world FuelCast vessels, capturing weather resistance, wave slamming, and hull fouling.",
        metrics: ["R² ≈ 0.98 (In-Domain)", "sMAPE ≈ 5.0%", "Real-time Inference"],
        icon: Gauge,
        link: "/prediction",
        linkText: "Predict Fuel Burn"
    },
    {
        category: "prediction",
        badge: "Explainability",
        title: "SHAP Feature Importance & Attribution",
        description: "Provides both global TreeSHAP summaries and local waterfall feature attributions for vessel draft, swell height, wind direction, and speed, giving naval architects total interpretability.",
        metrics: ["Global Beeswarm Plots", "Local Force Decomposition", "Hydrodynamic Consistency"],
        icon: Sparkles,
        link: "/prediction",
        linkText: "Inspect SHAP Lab"
    },
    {
        category: "emissions",
        badge: "IMO MEPC.391(81)",
        title: "Well-to-Wake (WtW) Lifecycle GHG Accounting",
        description: "Tracks both upstream Well-to-Tank (production, bunkering) and operational Tank-to-Wake combustion emissions across MGO, VLSFO, LNG, Bio-Methanol, and Green Ammonia.",
        metrics: ["5 Clean Fuel Pathways", "Tonnes CO₂e Tracking", "Carbon Tax Sensitivity"],
        icon: Leaf,
        link: "/emissions",
        linkText: "Analyze Emissions"
    },
    {
        category: "emissions",
        badge: "Cold-Ironing",
        title: "OPS Shore-Power & Berth Emissions Calculator",
        description: "Models auxiliary engine turn-off at port berths with onshore power supply (OPS) cost modeling in INR and regional grid emission factors (e.g. CEA India 710 gCO₂/kWh).",
        metrics: ["Zero Port Emissions", "Grid Factor Provenance", "Berth Stay Costing"],
        icon: Zap,
        link: "/emissions",
        linkText: "View Shore Power"
    },
    {
        category: "provenance",
        badge: "Fair Evaluation",
        title: "Independent Multi-Seed Benchmark Suite",
        description: "Rigorously benchmarks MO-QPSO against NSGA-II and standard MOPSO across 10/25/50 unit fleets with hypervolume (HV), generational distance, and runtime metrics across 10 random seeds.",
        metrics: ["Hypervolume (HV) Metrics", "Convergence Histories", "10-Seed Boxplots"],
        icon: BarChart3,
        link: "/benchmarking",
        linkText: "View Benchmarks"
    },
    {
        category: "provenance",
        badge: "Regulatory Audit",
        title: "Data Provenance & Traceability Ledger",
        description: "Every input and factor tagged with exact origin: measured (EMSA MRV, AIS), derived (ERA5 wave/wind interpolation), or synthetic (labeled sandbox fleets) with immutable run logging.",
        metrics: ["Audit Trail Compliance", "Seed-Pinned Reproducibility", "Source Citations"],
        icon: Database,
        link: "/provenance",
        linkText: "Review Provenance"
    }
];

export default function Features() {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const filteredFeatures = selectedCategory === "all"
        ? FEATURES_DATA
        : FEATURES_DATA.filter((f) => f.category === selectedCategory);

    return (
        <div className="min-h-screen flex flex-col bg-[#F4F8FD] dark:bg-[#0b1320] text-[#1E3A5A] dark:text-[#cbd5e1] font-['Inter',sans-serif]">
            <LandingUtilityBar />
            <LandingHeader />

            <main id="main-content" className="flex-1 flex flex-col">
                {/* Hero Header */}
                <section className="relative bg-gradient-to-r from-[#071D35] via-[#0D3B66] to-[#1264AB] text-white py-16 px-6 border-b border-[#0D3460] overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="max-w-[1280px] mx-auto relative z-10 text-center max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-mono font-semibold tracking-wide uppercase text-[#8AC4E0] mb-4">
                            <Layers size={13} className="text-[#E86A00]" />
                            Comprehensive Maritime Suite
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                            Platform Features &amp; Capabilities
                        </h1>
                        <p className="text-base sm:text-lg text-[#C8DFF0] leading-relaxed">
                            Discover the cutting-edge modules powering Q-Flow's decision engine—from quantum-inspired multi-objective Pareto optimization to Well-to-Wake lifecycle carbon accounting.
                        </p>
                    </div>
                </section>

                {/* Filter Categories Bar */}
                <section className="bg-white dark:bg-[#111c2e] border-b border-[#D0E3F5] dark:border-[#1e2d42] sticky top-0 z-30 shadow-xs">
                    <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                        {FEATURE_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                                    selectedCategory === cat.id
                                        ? "bg-[#1264AB] text-white shadow-xs"
                                        : "text-[#4A6A85] dark:text-[#94a3b8] hover:bg-[#F4F8FD] dark:hover:bg-[#16273d]"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-12 px-6 max-w-[1280px] mx-auto w-full flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFeatures.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-[#111c2e] border border-[#D0E3F5] dark:border-[#1e2d42] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#EBF3FB] dark:bg-[#16273d] flex items-center justify-center text-[#1264AB] dark:text-[#38bdf8]">
                                                <Icon size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1264AB] dark:text-[#38bdf8] bg-[#EBF3FB] dark:bg-[#16273d] px-2.5 py-1 rounded border border-[#B8D4EE] dark:border-[#223955]">
                                                {item.badge}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-[#0A2340] dark:text-white mb-2 leading-snug">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-[#4A6A85] dark:text-[#94a3b8] leading-relaxed mb-5">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="space-y-1.5 pt-4 border-t border-[#F0F6FC] dark:border-[#1a283e] mb-5">
                                            {item.metrics.map((m, mIdx) => (
                                                <div key={mIdx} className="flex items-center gap-2 text-[11px] text-[#5B8CB0] dark:text-[#829bb5]">
                                                    <Check size={13} className="text-[#22c55e] shrink-0" />
                                                    <span>{m}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Link
                                            to={item.link}
                                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-[#F4F8FD] dark:bg-[#16273d] hover:bg-[#1264AB] hover:text-white text-[#1264AB] dark:text-[#38bdf8] border border-[#C8DDEF] dark:border-[#223955] rounded text-xs font-bold uppercase tracking-wider transition-colors"
                                        >
                                            {item.linkText} <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Architecture Pipeline Strip */}
                <section className="bg-white dark:bg-[#0e1726] border-t border-[#D0E3F5] dark:border-[#1e2d42] py-12 px-6">
                    <div className="max-w-[1280px] mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#1264AB] dark:text-[#38bdf8] block mb-2">
                                Seamless Execution Flow
                            </span>
                            <h2 className="text-2xl font-bold text-[#0A2340] dark:text-white tracking-tight">
                                How Q-Flow Evaluates Every Plan
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                            <div className="p-4 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <span className="text-xs font-mono font-bold text-[#1264AB] block mb-1">01. Inputs</span>
                                <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">Scenario Setup</h4>
                                <p className="text-[11px] text-[#5B8CB0]">Port corridor, cargo demand, and deadline limits.</p>
                            </div>

                            <div className="p-4 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <span className="text-xs font-mono font-bold text-[#1264AB] block mb-1">02. Prediction</span>
                                <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">Fuel Surrogate</h4>
                                <p className="text-[11px] text-[#5B8CB0]">XGBoost &amp; physics calculate exact fuel burn.</p>
                            </div>

                            <div className="p-4 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <span className="text-xs font-mono font-bold text-[#1264AB] block mb-1">03. Pricing</span>
                                <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">Emissions &amp; Cost</h4>
                                <p className="text-[11px] text-[#5B8CB0]">Prices INR expenditure &amp; WtW CO₂e footprints.</p>
                            </div>

                            <div className="p-4 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <span className="text-xs font-mono font-bold text-[#1264AB] block mb-1">04. Search</span>
                                <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">MO-QPSO Solver</h4>
                                <p className="text-[11px] text-[#5B8CB0]">Explores quantum delta-well particle updates.</p>
                            </div>

                            <div className="p-4 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <span className="text-xs font-mono font-bold text-[#1264AB] block mb-1">05. Output</span>
                                <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">Pareto Decision</h4>
                                <p className="text-[11px] text-[#5B8CB0]">Presents TOPSIS-ranked balanced deployment.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
