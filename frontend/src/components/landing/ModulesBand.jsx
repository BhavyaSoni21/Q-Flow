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
    { icon: "fas fa-project-diagram",title: "Pareto Front",               sub: "Fuel · cost · GHG trade-offs",     to: "/optimization" },
    { icon: "fas fa-check-double",   title: "Constraint Audit",           sub: "Cargo · schedule · bunkering",     to: "/scenario" },
    { icon: "fas fa-gas-pump",       title: "Green Fuel Pathways",        sub: "Methanol · H2 · LNG · ammonia",    to: "/emissions" },
];

export default function ModulesBand() {
    return (
        <section id="features" className="bg-[#0F172A] font-['Open_Sans',sans-serif] border-t border-[#1E293B]">
            <div className="max-w-[1440px] mx-auto px-6 py-20">

                {/* Section heading */}
                <div className="flex flex-col items-center text-center mb-16">
                    <p className="text-[12px] font-bold text-[#E86A00] uppercase tracking-[0.2em] mb-3">
                        Platform Capabilities
                    </p>
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight">
                        Maritime Intelligence Modules
                    </h2>
                    <div className="w-12 h-[3px] bg-[#334155] mt-6 rounded-full" />
                </div>

                {/* 4-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12 mb-16">
                    {MODULES.map((s, idx) => (
                        <Link
                            key={idx}
                            to={s.to}
                            className="flex items-start gap-4 group cursor-pointer p-4 rounded-xl hover:bg-[#1E293B]/50 transition-all duration-300"
                        >
                            <div className="w-[52px] h-[52px] rounded-lg border border-[#334155] bg-[#1E293B] group-hover:border-[#0076a8] group-hover:bg-[#0076a8] flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                                <i className={`${s.icon} text-[22px] text-[#94A3B8] group-hover:text-white transition-colors duration-300`} />
                            </div>
                            <div className="flex flex-col mt-0.5">
                                <span className="text-[15px] font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] block leading-snug transition-colors duration-300">
                                    {s.title}
                                </span>
                                <span className="text-[13px] text-[#94A3B8] block leading-relaxed mt-1 transition-colors duration-300">
                                    {s.sub}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All */}
                <div className="flex justify-center border-t border-[#1E293B] pt-12">
                    <Link
                        to="/scenario"
                        className="inline-flex items-center justify-center gap-2 border border-[#475569] text-[#CBD5E1] hover:bg-[#0076a8] hover:border-[#0076a8] hover:text-white px-8 py-3 rounded-md text-[12px] font-bold uppercase tracking-widest transition-all duration-300 shadow-sm"
                    >
                        <i className="fas fa-th-large text-[12px] opacity-80" />
                        View All Modules
                    </Link>
                </div>
            </div>
        </section>
    );
}
