import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Play, Layers, Info } from "lucide-react";

const STATS = [
    { value: "3", label: "Specialized Models" },
    { value: "5", label: "Fuel Pathways" },
    { value: "12", label: "Platform Modules" },
    { value: "NSGA-II", label: "Baseline Benchmark" },
];

export default function CtaBand() {
    return (
        <section
            style={{ background: "linear-gradient(135deg, #0076a8 0%, #005e86 50%, #004564 100%)" }}
            className="text-white font-['Open_Sans',sans-serif]"
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">

                {/* Enterprise Metrics Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mb-20 bg-[#0F172A]/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x lg:divide-x divide-white/10 shadow-lg">
                    {STATS.map((s, i) => (
                        <div key={i} className="text-center py-8 px-6 hover:bg-white/5 transition-colors">
                            <div className="text-[32px] md:text-[40px] font-extrabold text-white tracking-tight leading-none mb-2 drop-shadow-sm">{s.value}</div>
                            <div className="text-[12px] text-[#BAE6FD] uppercase tracking-[0.15em] font-bold">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Primary CTA Block */}
                <div className="max-w-[800px] mx-auto text-center flex flex-col items-center">
                    <p className="text-[12px] font-bold text-[#7DD3FC] uppercase tracking-[0.2em] mb-4">
                        Auditable Decision-Support Platform
                    </p>
                    <h2 className="text-[36px] sm:text-[44px] md:text-[48px] font-extrabold tracking-tight mb-6 leading-tight drop-shadow-sm">
                        Accelerate Maritime Decarbonization
                    </h2>
                    <p className="text-[16px] md:text-[18px] leading-relaxed text-[#E0F2FE] mb-10 max-w-[700px] mx-auto opacity-95">
                        QFlow Fleet predicts vessel fuel consumption, evaluates lifecycle emissions and operating cost,
                        and uses a quantum-inspired multi-objective optimizer to select feasible vessel, speed, fuel,
                        and shore-power decisions — benchmarked against NSGA-II under reproducible scenarios.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 w-full sm:w-auto">
                        <Link
                            to="/optimization"
                            className="flex items-center justify-center bg-[#E86A00] hover:bg-[#CC5D00] text-white px-8 py-3.5 rounded-md text-[14px] font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Launch Route Simulator
                        </Link>
                        <Link
                            to="/features"
                            className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-md text-[14px] font-bold uppercase tracking-widest transition-all backdrop-blur-sm"
                        >
                            <Layers className="w-4 h-4 mr-2" />
                            Explore Features
                        </Link>
                        <Link
                            to="/about"
                            className="flex items-center justify-center bg-transparent border border-white/20 text-[#BAE6FD] hover:border-white/50 hover:text-white px-8 py-3.5 rounded-md text-[14px] font-bold uppercase tracking-widest transition-all"
                        >
                            <Info className="w-4 h-4 mr-2" />
                            About Team & Mission
                        </Link>
                    </div>

                    {/* Technical Metadata Row */}
                    <div className="w-full border-t border-white/10 pt-10">
                        <p className="text-[11px] font-bold text-[#7DD3FC] uppercase tracking-[0.2em] mb-5">Core Evaluation Pipeline</p>
                        <div className="flex flex-wrap justify-center items-center gap-3 text-[11px] font-mono">
                            {["Scenario Input", "Fuel Prediction", "Cost & Lifecycle GHG", "QPSO Optimizer", "Pareto Results"].map((step, i, arr) => (
                                <React.Fragment key={i}>
                                    <span className="px-3.5 py-1.5 bg-[#0F172A]/40 border border-white/10 rounded-md text-[#E0F2FE] text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm backdrop-blur-sm">
                                        {step}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <ChevronRight className="text-[#38BDF8] w-4 h-4 opacity-70" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Social & Legal Area */}
                <div className="mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[#BAE6FD]">
                    <div className="flex items-center gap-6">
                        <a href="https://github.com" target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 text-[13px] font-semibold hover:text-white transition-colors group">
                            <span className="w-9 h-9 rounded-full border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-[#0F172A]/40 transition-colors">
                                <i className="fab fa-github text-[16px]" />
                            </span>
                            @qflow-maritime
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 text-[13px] font-semibold hover:text-white transition-colors group">
                            <span className="w-9 h-9 rounded-full border border-white/20 bg-white/5 flex items-center justify-center group-hover:bg-[#0077b5] transition-colors">
                                <i className="fab fa-linkedin-in text-[16px]" />
                            </span>
                            /company/qflow-fleet
                        </a>
                    </div>
                    <span className="text-[12px] font-mono font-semibold tracking-wider opacity-80 uppercase text-center md:text-right">
                        SIH26138 <span className="mx-2 opacity-50">|</span> Egreen Quanta <span className="mx-2 opacity-50">|</span> Clean &amp; Green Tech
                    </span>
                </div>
            </div>
        </section>
    );
}
