import React from "react";
import { Link } from "react-router-dom";

const MODULES = [
    { icon: "fas fa-sliders-h",      title: "Scenario Builder",          sub: "Route, demand, deadline, fleet",    to: "/scenario" },
    { icon: "fas fa-brain",          title: "Fuel Prediction Lab",        sub: "XGBoost + QPSO-tuned model",        to: "/prediction" },
    { icon: "fas fa-atom",           title: "Quantum Optimizer",          sub: "MO-QPSO Pareto fleet search",       to: "/optimization" },
    { icon: "fas fa-chart-bar",      title: "Benchmark Lab",              sub: "QPSO vs NSGA-II comparison",        to: "/benchmarking" },
    { icon: "fas fa-leaf",           title: "Lifecycle Emissions",        sub: "WtT · TtW · WtW · shore power",    to: "/emissions" },
    { icon: "fas fa-shield-alt",     title: "Data Provenance",            sub: "AIS · MRV · ERA5 · factors",       to: "/provenance" },
    { icon: "fas fa-ship",           title: "Vessel Scenarios",           sub: "Hydrodynamics · draft · trim",      to: "/scenario" },
    { icon: "fas fa-bolt",           title: "Shore Power",                sub: "OPS cost & grid emissions",         to: "/emissions" },
    { icon: "fas fa-award",          title: "CII & EEXI",                 sub: "IMO compliance ratings",            to: "/benchmarking" },
    { icon: "fas fa-project-diagram","title": "Pareto Front",             sub: "Fuel · cost · GHG trade-offs",     to: "/optimization" },
    { icon: "fas fa-check-double",   title: "Constraint Audit",           sub: "Cargo · schedule · bunkering",     to: "/scenario" },
    { icon: "fas fa-gas-pump",       title: "Green Fuel Pathways",        sub: "Methanol · H₂ · LNG · ammonia",    to: "/emissions" },
];

export default function ModulesBand() {
    return (
        <section style={{ background: "linear-gradient(180deg, #0B2D4F 0%, #0A2340 100%)" }}
            className="font-['Open_Sans',sans-serif] border-t border-[#0D3460]">
            <div className="max-w-[1280px] mx-auto px-6 py-14">

                {/* Section heading */}
                <div className="text-center mb-10">
                    <p className="text-[11px] font-bold text-[#5BA4D4] uppercase tracking-[0.18em] mb-2">
                        Platform Capabilities
                    </p>
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                        Maritime Intelligence Modules
                    </h2>
                    <div className="w-10 h-[3px] bg-[#E86A00] mx-auto mt-3" />
                </div>

                {/* 6-Column Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6 mb-10">
                    {MODULES.map((s, idx) => (
                        <Link
                            key={idx}
                            to={s.to}
                            className="flex flex-col items-center text-center gap-2 group cursor-pointer py-3 px-2 transition-all duration-150 hover:bg-white/5 rounded"
                        >
                            <div className="w-[56px] h-[56px] rounded-full border border-[#1E4D7A] bg-[#0D3461] group-hover:border-[#E86A00] group-hover:bg-[#E86A00] flex items-center justify-center transition-all duration-200">
                                <i className={`${s.icon} text-[20px] text-[#5BA4D4] group-hover:text-white transition-colors duration-200`} />
                            </div>
                            <div>
                                <span className="text-[12px] font-semibold text-[#C8DFF0] group-hover:text-white block leading-tight transition-colors duration-150">
                                    {s.title}
                                </span>
                                <span className="text-[10px] text-[#5B8CB0] group-hover:text-[#A0C4E0] block leading-tight mt-0.5 transition-colors duration-150">
                                    {s.sub}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All */}
                <div className="text-center border-t border-[#1A4060] pt-7">
                    <Link
                        to="/scenario"
                        className="inline-flex items-center gap-2 border border-[#2A6090] text-[#8AC4E0] hover:bg-[#E86A00] hover:border-[#E86A00] hover:text-white px-7 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-all duration-200"
                    >
                        <i className="fas fa-th-large text-[11px]" />
                        View All Modules
                    </Link>
                </div>
            </div>
        </section>
    );
}