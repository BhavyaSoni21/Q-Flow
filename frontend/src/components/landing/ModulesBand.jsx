import React from "react";
import { Link } from "react-router-dom";
import { Route, BrainCircuit, Atom, BarChart2, Leaf, ShieldCheck, Ship, Zap, Award, Share2, ClipboardCheck, Fuel, ChevronRight } from "lucide-react";

const MODULES = [
    { icon: Route,           title: "Scenario Builder",          sub: "Route, demand, deadline, fleet",    to: "/scenario" },
    { icon: BrainCircuit,    title: "Fuel Prediction Lab",        sub: "XGBoost + QPSO-tuned model",        to: "/prediction" },
    { icon: Atom,            title: "Quantum Optimizer",          sub: "MO-QPSO Pareto fleet search",       to: "/optimization" },
    { icon: BarChart2,       title: "Benchmark Lab",              sub: "QPSO vs NSGA-II comparison",        to: "/benchmarking" },
    { icon: Leaf,            title: "Lifecycle Emissions",        sub: "WtT • TtW • WtW • shore power",    to: "/emissions" },
    { icon: ShieldCheck,     title: "Data Provenance",            sub: "AIS • MRV • ERA5 • factors",       to: "/provenance" },
    { icon: Ship,            title: "Vessel Scenarios",           sub: "Hydrodynamics • draft • trim",      to: "/scenario" },
    { icon: Zap,             title: "Shore Power",                sub: "OPS cost & grid emissions",         to: "/emissions" },
    { icon: Award,           title: "CII & EEXI",                 sub: "IMO compliance ratings",            to: "/benchmarking" },
    { icon: Share2,          title: "Pareto Front",               sub: "Fuel • cost • GHG trade-offs",     to: "/optimization" },
    { icon: ClipboardCheck,  title: "Constraint Audit",           sub: "Cargo • schedule • bunkering",     to: "/scenario" },
    { icon: Fuel,            title: "Green Fuel Pathways",        sub: "Methanol • H2 • LNG • ammonia",    to: "/emissions" },
];

export default function ModulesBand() {
    return (
        <section id="features" className="bg-[#0B1120] font-['Open_Sans',sans-serif] relative overflow-hidden">
            
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#0076a8]/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-[1440px] mx-auto px-6 py-24 relative z-10">

                {/* Section heading */}
                <div className="flex flex-col items-center text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B]/50 border border-[#334155] mb-6">
                        <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-[0.15em]">
                            Platform Architecture
                        </span>
                    </div>
                    <h2 className="text-[36px] md:text-[42px] font-extrabold text-white tracking-tight leading-tight">
                        Maritime Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#0076a8]">Modules</span>
                    </h2>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                    {MODULES.map((s, idx) => (
                        <Link
                            key={idx}
                            to={s.to}
                            className="group flex flex-col p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#0076a8]/50 hover:bg-[#1E293B] transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0076a8]/5 rounded-bl-full translate-x-16 -translate-y-16 group-hover:scale-110 group-hover:bg-[#0076a8]/10 transition-transform duration-500 pointer-events-none" />
                            
                            <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-[#334155] text-[#94A3B8] group-hover:border-[#0076a8] group-hover:bg-[#0076a8] group-hover:text-white flex items-center justify-center shrink-0 mb-5 transition-all duration-300 shadow-lg">
                                <s.icon size={22} strokeWidth={2} />
                            </div>
                            
                            <h3 className="text-[16px] font-bold text-white group-hover:text-[#38BDF8] block leading-snug mb-2 transition-colors duration-300">
                                {s.title}
                            </h3>
                            <p className="text-[13px] text-[#94A3B8] group-hover:text-[#CBD5E1] block leading-relaxed transition-colors duration-300">
                                {s.sub}
                            </p>
                        </Link>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="flex justify-center">
                    <Link to="/features" 
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-[#334155] bg-[#0F172A] hover:bg-[#1E293B] hover:border-[#475569] text-[13px] font-bold text-white uppercase tracking-wider transition-all shadow-lg group">
                        <Atom size={16} className="text-[#38BDF8]" />
                        Explore Documentation
                        <ChevronRight size={16} className="text-[#94A3B8] group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>
                
            </div>
        </section>
    );
}


