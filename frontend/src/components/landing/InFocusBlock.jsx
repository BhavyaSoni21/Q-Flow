import React from "react";
import { Link } from "react-router-dom";

const HIGHLIGHTS = [
    { to: "/prediction",    label: "XGBoost Fuel Predictor with QPSO Hyperparameter Tuning",       tag: "Prediction" },
    { to: "/emissions",     label: "Well-to-Wake Lifecycle GHG & Shore Power Cost Engine",          tag: "Emissions" },
    { to: "/optimization",  label: "Multi-Objective QPSO Pareto Fleet Optimizer",                   tag: "Optimizer" },
    { to: "/benchmarking",  label: "Fair QPSO vs. NSGA-II Benchmark — Multiple Seeds, HV Metric",  tag: "Benchmark" },
];

export default function InFocusBlock() {
    return (
        <section className="bg-[#F4F8FD] border-b border-[#D0E3F5] font-['Open_Sans',sans-serif]">
            <div className="max-w-[1280px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* IN FOCUS */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-[11px] font-bold text-[#1264AB] uppercase tracking-[0.14em] whitespace-nowrap">
                                IN FOCUS
                            </h2>
                            <span className="flex-1 h-px bg-[#C8DDEF]" />
                        </div>

                        <div className="bg-white border border-[#D0E3F5] flex flex-col sm:flex-row gap-0 flex-1 overflow-hidden shadow-sm">
                            {/* Image */}
                            <div className="sm:w-[200px] shrink-0 relative overflow-hidden">
                                <img
                                    src="/assets/ship-hero.jpg"
                                    alt="Container Vessel"
                                    className="w-full h-full object-cover min-h-[160px] sm:min-h-0"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A2340]/80 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest opacity-90">
                                        Q-GreenFleet · SIH26138
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-5">
                                <span className="inline-block text-[10px] font-bold text-[#1264AB] bg-[#EBF3FB] border border-[#B8D4EE] px-2 py-0.5 uppercase tracking-wider mb-2">
                                    Quantum-Inspired Optimizer
                                </span>
                                <h3 className="text-[16px] font-bold text-[#0A2340] mb-2 leading-snug">
                                    Multi-Objective Fleet Route &amp; Fuel Optimization
                                </h3>
                                <p className="text-[13px] text-[#4A6A85] leading-relaxed mb-4">
                                    Predict voyage fuel burn via XGBoost, evaluate lifecycle WtW emissions and cost,
                                    then run MO-QPSO to produce a Pareto frontier over fuel, cost, and GHG —
                                    benchmarked against NSGA-II under reproducible scenarios.
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <Link to="/optimization"
                                        className="inline-block bg-[#1264AB] hover:bg-[#0A4B8C] text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors">
                                        Open Optimizer →
                                    </Link>
                                    <Link to="/prediction"
                                        className="inline-block border border-[#1264AB] text-[#1264AB] hover:bg-[#1264AB] hover:text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors">
                                        Fuel Prediction Lab
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PLATFORM HIGHLIGHTS */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-[11px] font-bold text-[#1264AB] uppercase tracking-[0.14em] whitespace-nowrap">
                                PLATFORM HIGHLIGHTS
                            </h2>
                            <span className="flex-1 h-px bg-[#C8DDEF]" />
                        </div>

                        <div className="bg-white border border-[#D0E3F5] flex flex-col flex-1 shadow-sm">
                            <ul className="flex-1 divide-y divide-[#EBF3FB]">
                                {HIGHLIGHTS.map((item, idx) => (
                                    <li key={idx}>
                                        <Link to={item.to}
                                            className="flex items-center gap-3 px-5 py-3.5 text-[13px] text-[#1E3A5A] hover:bg-[#F4F8FD] transition-colors group">
                                            <span className="w-1 h-1 bg-[#1264AB] shrink-0 rounded-full" />
                                            <span className="font-medium flex-1 group-hover:text-[#1264AB] transition-colors">{item.label}</span>
                                            <span className="text-[10px] font-bold text-[#1264AB] bg-[#EBF3FB] border border-[#B8D4EE] px-2 py-0.5 shrink-0 uppercase tracking-wide">
                                                {item.tag}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            <div className="px-5 py-4 border-t border-[#EBF3FB] bg-[#F9FBFE] flex gap-2">
                                <Link to="/scenario"
                                    className="inline-block bg-[#1264AB] hover:bg-[#0A4B8C] text-white px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors">
                                    Build Scenario
                                </Link>
                                <Link to="/benchmarking"
                                    className="inline-block border border-[#C8DDEF] text-[#4A6A85] hover:border-[#1264AB] hover:text-[#1264AB] px-4 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors">
                                    Benchmark Lab
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}