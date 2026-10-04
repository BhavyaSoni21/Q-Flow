import React from "react";
import { Link } from "react-router-dom";
import LandingUtilityBar from "@/components/landing/LandingUtilityBar";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import {
    Users,
    Target,
    Compass,
    ShieldCheck,
    Cpu,
    GitBranch,
    Award,
    Database,
    Zap,
    Scale,
    ExternalLink,
    ArrowRight,
    CheckCircle2
} from "lucide-react";

export default function About() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F4F8FD] dark:bg-[#0b1320] text-[#1E3A5A] dark:text-[#cbd5e1] font-['Inter',sans-serif]">
            <LandingUtilityBar />
            <LandingHeader />

            <main id="main-content" className="flex-1 flex flex-col">
                {/* Hero / Banner */}
                <section className="relative bg-gradient-to-r from-[#071D35] via-[#0D3B66] to-[#1264AB] text-white py-16 px-6 border-b border-[#0D3460] overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="max-w-[1280px] mx-auto relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-mono font-semibold tracking-wide uppercase text-[#8AC4E0] mb-4">
                            <Compass size={13} className="text-[#E86A00]" />
                            Problem Statement SIH26138 · Team Egreen Quanta
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                            About <span className="text-white">Q</span><span className="text-[#E86A00]">Flow</span>
                        </h1>
                        <p className="text-base sm:text-lg text-[#C8DFF0] max-w-3xl leading-relaxed">
                            A quantum-inspired, auditable decision-support platform engineered to predict vessel fuel consumption,
                            price Well-to-Wake lifecycle emissions, and solve multi-objective fleet deployment problems under stringent maritime environmental regulations.
                        </p>
                    </div>
                </section>

                {/* Core Mission & Problem Context */}
                <section className="py-14 px-6 max-w-[1280px] mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* Left column: Narrative */}
                        <div className="lg:col-span-7 space-y-6">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1264AB] dark:text-[#38bdf8] mb-2">
                                    Our Core Purpose
                                </h2>
                                <h3 className="text-2xl sm:text-3xl font-bold text-[#0A2340] dark:text-white tracking-tight leading-snug">
                                    Bridging Quantum-Inspired Mathematics and Real-World Maritime Decarbonization
                                </h3>
                            </div>

                            <p className="text-[14px] leading-relaxed text-[#4A6A85] dark:text-[#94a3b8]">
                                Global maritime logistics accounts for approximately 3% of worldwide greenhouse gas emissions. Tightening environmental mandates—including the <strong>IMO MEPC.391(81) GHG Strategy</strong>, <strong>FuelEU Maritime (2025/2030)</strong>, and India's <strong>Maritime Amrit Kaal Vision 2047</strong>—compel vessel operators to balance conflicting objectives: fuel economy, operating expenditure in INR, and Well-to-Wake lifecycle emissions.
                            </p>

                            <p className="text-[14px] leading-relaxed text-[#4A6A85] dark:text-[#94a3b8]">
                                Traditional fleet routing treats fuel burns with simplified polynomial formulas or static tables. <strong>Q-Flow</strong> introduces a <em>Predictor-in-the-Loop</em> optimization paradigm: every candidate route, speed, fuel blend, and shore-power configuration is actively evaluated by high-fidelity ML surrogates and physics-informed models before entering our Multi-Objective Quantum-Behaved Particle Swarm Optimization (MO-QPSO) solver.
                            </p>

                            {/* Core Pillars */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="p-4 bg-white dark:bg-[#111c2e] border border-[#D0E3F5] dark:border-[#1e2d42] rounded-lg shadow-sm">
                                    <div className="w-8 h-8 rounded bg-[#EBF3FB] dark:bg-[#16273d] flex items-center justify-center text-[#1264AB] mb-3">
                                        <Cpu size={18} />
                                    </div>
                                    <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">Scientific Integrity</h4>
                                    <p className="text-xs text-[#5B8CB0] dark:text-[#829bb5] leading-relaxed">
                                        Classical QPSO delta-potential-well metaheuristics—never claiming false quantum speedups.
                                    </p>
                                </div>

                                <div className="p-4 bg-white dark:bg-[#111c2e] border border-[#D0E3F5] dark:border-[#1e2d42] rounded-lg shadow-sm">
                                    <div className="w-8 h-8 rounded bg-[#FFF4E6] dark:bg-[#2d2215] flex items-center justify-center text-[#E86A00] mb-3">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <h4 className="text-sm font-bold text-[#0A2340] dark:text-white mb-1">Complete Provenance</h4>
                                    <p className="text-xs text-[#5B8CB0] dark:text-[#829bb5] leading-relaxed">
                                        All factors sourced from IMO, FuelEU, and CEA India Grid with transparent dataset lineage.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right column: Key Technical Stats Card */}
                        <div className="lg:col-span-5 bg-white dark:bg-[#111c2e] border border-[#C8DDEF] dark:border-[#1e2d42] rounded-xl p-6 shadow-md">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1264AB] dark:text-[#38bdf8] mb-4 pb-2 border-b border-[#EBF3FB] dark:border-[#1e2d42]">
                                Platform Architecture &amp; Verification
                            </h4>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-[#0A2340] dark:text-white block">Operational Power Model</span>
                                        <span className="text-xs text-[#5B8CB0] dark:text-[#829bb5]">In-domain R² ≈ 0.98, shifted R² ≈ 0.95, sMAPE ≈ 5% on real FuelCast vessels.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-[#0A2340] dark:text-white block">Sourced Lifecycle Factors</span>
                                        <span className="text-xs text-[#5B8CB0] dark:text-[#829bb5]">Well-to-Tank &amp; Tank-to-Wake factors aligned with IMO MEPC.391(81) &amp; CEA India grid (710 gCO₂/kWh).</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-[#0A2340] dark:text-white block">Multi-Objective Pareto Solver</span>
                                        <span className="text-xs text-[#5B8CB0] dark:text-[#829bb5]">Generates non-dominated fronts for Fuel, INR Cost, and WtW GHG, benchmarked vs NSGA-II.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-[#0A2340] dark:text-white block">Multi-Modal Portability</span>
                                        <span className="text-xs text-[#5B8CB0] dark:text-[#829bb5]">Unified core engine for maritime container fleets and commercial heavy road freight.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-[#EBF3FB] dark:border-[#1e2d42] flex flex-col gap-2">
                                <Link
                                    to="/features"
                                    className="w-full py-2.5 px-4 bg-[#1264AB] hover:bg-[#0e528c] text-white text-xs font-bold uppercase tracking-wider rounded text-center transition-colors flex items-center justify-center gap-2"
                                >
                                    Explore Detailed Features <ArrowRight size={14} />
                                </Link>
                                <Link
                                    to="/benchmarking"
                                    className="w-full py-2 px-4 bg-transparent hover:bg-[#F4F8FD] dark:hover:bg-[#1a283e] text-[#1264AB] dark:text-[#38bdf8] border border-[#C8DDEF] dark:border-[#2a3c54] text-xs font-semibold uppercase tracking-wider rounded text-center transition-colors"
                                >
                                    Open Benchmark Lab
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team & SIH 2026 Problem Statement */}
                <section className="bg-white dark:bg-[#0e1726] border-y border-[#D0E3F5] dark:border-[#1e2d42] py-14 px-6">
                    <div className="max-w-[1280px] mx-auto">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#1264AB] dark:text-[#38bdf8] block mb-2">
                                Team Egreen Quanta
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2340] dark:text-white tracking-tight">
                                Smart India Hackathon 2026 · Problem SIH26138
                            </h2>
                            <div className="w-12 h-1 bg-[#E86A00] mx-auto mt-3 mb-4" />
                            <p className="text-xs sm:text-sm text-[#4A6A85] dark:text-[#94a3b8]">
                                Developed under the theme <em>Clean &amp; Green Technology</em> with a commitment to mathematical rigor, environmental fidelity, and reproducible code.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-[#1264AB] text-white flex items-center justify-center font-bold text-sm mb-4">
                                    01
                                </div>
                                <h3 className="text-base font-bold text-[#0A2340] dark:text-white mb-2">Physics-Informed AI</h3>
                                <p className="text-xs text-[#5B8CB0] dark:text-[#829bb5] leading-relaxed">
                                    Surrogate modeling powered by XGBoost with QPSO hyperparameter search, coupled to hydrodynamic Holtrop-Mennen resistance formulas.
                                </p>
                            </div>

                            <div className="p-6 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-[#E86A00] text-white flex items-center justify-center font-bold text-sm mb-4">
                                    02
                                </div>
                                <h3 className="text-base font-bold text-[#0A2340] dark:text-white mb-2">Lifecycle GHG Accounting</h3>
                                <p className="text-xs text-[#5B8CB0] dark:text-[#829bb5] leading-relaxed">
                                    Complete Well-to-Tank (upstream extraction, bunkering) and Tank-to-Wake (combustion) tracking across MGO, VLSFO, LNG, Bio-Methanol, and Ammonia.
                                </p>
                            </div>

                            <div className="p-6 bg-[#F4F8FD] dark:bg-[#132032] border border-[#D0E3F5] dark:border-[#1f3047] rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-sm mb-4">
                                    03
                                </div>
                                <h3 className="text-base font-bold text-[#0A2340] dark:text-white mb-2">Auditable Provenance</h3>
                                <p className="text-xs text-[#5B8CB0] dark:text-[#829bb5] leading-relaxed">
                                    Every data point labeled as measured, derived, or synthetic. Seed-pinned simulations guarantee deterministic reproducibility for regulators and audits.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Bar */}
                <section className="bg-gradient-to-r from-[#0B2D4F] to-[#0A2340] text-white py-12 px-6">
                    <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
                                Ready to test the optimizer on live vessel corridors?
                            </h3>
                            <p className="text-xs sm:text-sm text-[#8AC4E0]">
                                Run multi-objective scenario simulations across international shipping lanes with real-time Pareto visualizations.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                to="/scenario"
                                className="px-6 py-3 bg-[#E86A00] hover:bg-[#cf5e00] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm"
                            >
                                Setup Scenario
                            </Link>
                            <Link
                                to="/features"
                                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors"
                            >
                                View Features
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
