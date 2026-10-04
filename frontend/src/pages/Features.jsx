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
    Check,
    ChevronRight
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
        description: "Models auxiliary engine turn-off at port berths with onshore power supply (OPS) cost modeling in INR and regional grid emission factors (e.g. CEA India 710 gCO₂e/kWh).",
        metrics: ["Zero Port Emissions", "Grid Factor Provenance", "Berth Stay Costing"],
        icon: Zap,
        link: "/emissions",
        linkText: "View Shore Power"
    },
    {
        category: "provenance",
        badge: "Fair Evaluation",
        title: "Independent Multi-Seed Benchmark Suite",
        description: "Rigorously benchmarks MO-QPSO against NSGA-II and standard MOPSO across fleets with hypervolume (HV), generational distance, and runtime metrics across 10 random seeds.",
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
        : FEATURES_DATA.filter(f => f.category === selectedCategory);

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-['Open_Sans',sans-serif]">
            <LandingUtilityBar />
            <LandingHeader />

            <main className="flex-1 flex flex-col pt-16">
                
                {/* Hero Section */}
                <section className="relative bg-gradient-to-r from-[#0F172A] via-[#0D3B66] to-[#0076a8] text-white py-20 px-6 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="max-w-[1440px] mx-auto relative z-10 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase text-[#38BDF8] mb-6 shadow-sm">
                            <Layers size={14} className="text-[#38BDF8]" />
                            Comprehensive Maritime Suite
                        </div>
                        <h1 className="text-[36px] md:text-[46px] font-extrabold text-white tracking-tight leading-tight mb-6">
                            Enterprise Maritime <span className="text-[#38BDF8]">Intelligence</span>
                        </h1>
                        <p className="text-[16px] text-[#CBD5E1] leading-relaxed max-w-2xl mx-auto font-medium">
                            Explore the computational engines powering QFlow. From quantum-behaved swarm optimizers to lifecycle GHG accounting, built for real-world fleet deployments.
                        </p>
                    </div>
                </section>

                {/* Filter Categories Bar */}
                <section className="sticky top-[73px] z-30 bg-white/80 backdrop-blur-md border-y border-[#E2E8F0] shadow-sm mb-12">
                    <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar">
                        {FEATURE_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2 text-[12px] font-bold uppercase tracking-wider rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                    selectedCategory === cat.id
                                        ? "bg-[#0F172A] text-white shadow-md scale-105"
                                        : "bg-white border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="px-6 max-w-[1440px] mx-auto w-full flex-1 mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredFeatures.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={idx}
                                    to={item.link}
                                    className="group bg-white border border-[#E2E8F0] rounded-2xl p-7 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#CBD5E1] transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#B9E6FE] flex items-center justify-center text-[#0076a8] group-hover:bg-[#0076a8] group-hover:text-white transition-colors duration-300">
                                                <Icon size={24} strokeWidth={2} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-1 rounded-md">
                                                {item.badge}
                                            </span>
                                        </div>

                                        <h3 className="text-[16px] font-extrabold text-[#0F172A] mb-3 leading-snug group-hover:text-[#0076a8] transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-[13px] text-[#64748B] leading-relaxed mb-6 font-medium">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="space-y-2 pt-5 border-t border-[#F1F5F9] mb-6">
                                            {item.metrics.map((m, mIdx) => (
                                                <div key={mIdx} className="flex items-start gap-2.5 text-[12px] font-semibold text-[#475569]">
                                                    <Check size={14} className="text-[#059669] shrink-0 mt-0.5" strokeWidth={3} />
                                                    <span>{m}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#0076a8] group-hover:text-[#005e86]">
                                            {item.linkText} 
                                            <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Architecture Pipeline Strip */}
                <section className="bg-[#0F172A] border-t border-[#1E293B] py-20 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0076a8]/10 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="max-w-[1440px] mx-auto relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-14">
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#38BDF8] block mb-3">
                                Seamless Execution Flow
                            </span>
                            <h2 className="text-[32px] font-extrabold text-white tracking-tight">
                                How Q-Flow Evaluates Every Plan
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-left">
                            
                            <div className="p-6 bg-[#1E293B] border border-[#334155] rounded-xl hover:border-[#0076a8]/50 transition-colors">
                                <span className="w-8 h-8 rounded bg-[#0076a8]/20 text-[#38BDF8] flex items-center justify-center font-mono font-bold text-[13px] mb-4">01</span>
                                <h4 className="text-[15px] font-bold text-white mb-2">Scenario Setup</h4>
                                <p className="text-[13px] text-[#94A3B8] leading-relaxed">Port corridor, cargo demand, and strict ETA deadline limits defined by user.</p>
                            </div>

                            <div className="p-6 bg-[#1E293B] border border-[#334155] rounded-xl hover:border-[#0076a8]/50 transition-colors">
                                <span className="w-8 h-8 rounded bg-[#0076a8]/20 text-[#38BDF8] flex items-center justify-center font-mono font-bold text-[13px] mb-4">02</span>
                                <h4 className="text-[15px] font-bold text-white mb-2">Fuel Surrogate</h4>
                                <p className="text-[13px] text-[#94A3B8] leading-relaxed">XGBoost &amp; physics logic calculate exact fuel burn for any genotype.</p>
                            </div>

                            <div className="p-6 bg-[#1E293B] border border-[#334155] rounded-xl hover:border-[#0076a8]/50 transition-colors">
                                <span className="w-8 h-8 rounded bg-[#0076a8]/20 text-[#38BDF8] flex items-center justify-center font-mono font-bold text-[13px] mb-4">03</span>
                                <h4 className="text-[15px] font-bold text-white mb-2">Emissions &amp; Cost</h4>
                                <p className="text-[13px] text-[#94A3B8] leading-relaxed">Prices INR expenditure &amp; WtW CO₂e footprints across alternative fuels.</p>
                            </div>

                            <div className="p-6 bg-[#1E293B] border border-[#334155] rounded-xl hover:border-[#0076a8]/50 transition-colors">
                                <span className="w-8 h-8 rounded bg-[#0076a8]/20 text-[#38BDF8] flex items-center justify-center font-mono font-bold text-[13px] mb-4">04</span>
                                <h4 className="text-[15px] font-bold text-white mb-2">MO-QPSO Search</h4>
                                <p className="text-[13px] text-[#94A3B8] leading-relaxed">Swarm explores quantum delta-well particle updates to find global optima.</p>
                            </div>

                            <div className="p-6 bg-[#1E293B] border border-[#334155] rounded-xl hover:border-[#0076a8]/50 transition-colors">
                                <span className="w-8 h-8 rounded bg-[#0076a8]/20 text-[#38BDF8] flex items-center justify-center font-mono font-bold text-[13px] mb-4">05</span>
                                <h4 className="text-[15px] font-bold text-white mb-2">Pareto Extraction</h4>
                                <p className="text-[13px] text-[#94A3B8] leading-relaxed">Decodes constraints and serves the optimal fleet Pareto frontier.</p>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}

