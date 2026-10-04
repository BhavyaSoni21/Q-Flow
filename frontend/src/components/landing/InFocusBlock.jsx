import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Activity, Globe, Database, SlidersHorizontal } from "lucide-react";

const HIGHLIGHTS = [
    { to: "/prediction",    label: "XGBoost Fuel Predictor with QPSO Hyperparameter Tuning",       tag: "Prediction", icon: Activity },
    { to: "/emissions",     label: "Well-to-Wake Lifecycle GHG & Shore Power Cost Engine",          tag: "Emissions", icon: Globe },
    { to: "/optimization",  label: "Multi-Objective QPSO Pareto Fleet Optimizer",                   tag: "Optimizer", icon: SlidersHorizontal },
    { to: "/benchmarking",  label: "Fair QPSO vs. NSGA-II Benchmark — Multiple Seeds, HV Metric",  tag: "Benchmark", icon: Database },
];

export default function InFocusBlock() {
    return (
        <section className="bg-white font-['Open_Sans',sans-serif] relative z-10 -mt-8 pt-8">
            <div className="max-w-[1440px] mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14">

                    {/* IN FOCUS */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-[0.15em] whitespace-nowrap">
                                In Focus
                            </h2>
                            <span className="flex-1 h-[1px] bg-[#E2E8F0]" />
                        </div>

                        <div className="group bg-white border border-[#E2E8F0] rounded-lg flex flex-col sm:flex-row flex-1 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                            {/* Image */}
                            <div className="sm:w-[260px] shrink-0 relative overflow-hidden bg-[#0F172A]">
                                <img
                                    src="/assets/ship-hero.jpg"
                                    alt="Container Vessel"
                                    className="w-full h-full object-cover min-h-[220px] sm:min-h-0 opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-90" />
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-[#0076a8]/80 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                                        Q-GreenFleet
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-7 flex flex-col justify-center">
                                <span className="self-start text-[11px] font-bold text-[#0076a8] bg-[#F0F9FF] border border-[#B9E6FE] px-2.5 py-1 rounded uppercase tracking-widest mb-4">
                                    Quantum Optimization
                                </span>
                                <h3 className="text-[20px] font-bold text-[#0F172A] mb-3 leading-tight group-hover:text-[#0076a8] transition-colors">
                                    Multi-Objective Fleet Route &amp; Fuel Optimization
                                </h3>
                                <p className="text-[14px] text-[#475569] leading-relaxed mb-6">
                                    Predict voyage fuel burn via AI, evaluate lifecycle WtW emissions and costs, 
                                    and deploy MO-QPSO to generate a Pareto frontier. Benchmark against NSGA-II baselines.
                                </p>
                                <div className="flex gap-3 mt-auto">
                                    <Link to="/optimization"
                                        className="inline-flex items-center justify-center bg-[#E86A00] hover:bg-[#CC5D00] text-white px-5 py-2.5 rounded-md text-[12px] font-bold uppercase tracking-wide transition-colors shadow-sm">
                                        Open Optimizer <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                    <Link to="/prediction"
                                        className="inline-flex items-center justify-center border border-[#CBD5E1] hover:border-[#0076a8] text-[#475569] hover:text-[#0076a8] hover:bg-[#F8FAFC] px-5 py-2.5 rounded-md text-[12px] font-bold uppercase tracking-wide transition-all">
                                        Prediction Lab
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PLATFORM HIGHLIGHTS */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-[0.15em] whitespace-nowrap">
                                Platform Highlights
                            </h2>
                            <span className="flex-1 h-[1px] bg-[#E2E8F0]" />
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-lg flex flex-col flex-1 shadow-sm overflow-hidden h-full">
                            <ul className="flex-1 flex flex-col divide-y divide-[#E2E8F0]">
                                {HIGHLIGHTS.map((item, idx) => (
                                    <li key={idx} className="flex-1 flex">
                                        <Link to={item.to}
                                            className="flex-1 flex items-center gap-4 px-6 py-4 hover:bg-[#F8FAFC] transition-colors group">
                                            <div className="w-8 h-8 rounded bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0 group-hover:bg-[#0076a8] group-hover:border-[#0076a8] transition-colors">
                                                <item.icon className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" />
                                            </div>
                                            <span className="font-semibold text-[14px] text-[#334155] flex-1 group-hover:text-[#0F172A] transition-colors pr-2">
                                                {item.label}
                                            </span>
                                            <span className="text-[11px] font-bold text-[#0076a8] bg-[#F0F9FF] border border-[#B9E6FE] px-2.5 py-1 rounded shrink-0 uppercase tracking-wide hidden sm:block">
                                                {item.tag}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0076a8] shrink-0 ml-1 transition-colors" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            <div className="px-6 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex gap-3">
                                <Link to="/scenario"
                                    className="inline-flex items-center justify-center bg-[#0F172A] hover:bg-[#1E293B] text-white px-5 py-2.5 rounded-md text-[12px] font-bold uppercase tracking-wide transition-colors shadow-sm">
                                    Build Scenario
                                </Link>
                                <Link to="/benchmarking"
                                    className="inline-flex items-center justify-center border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:border-[#94A3B8] hover:bg-white px-5 py-2.5 rounded-md text-[12px] font-bold uppercase tracking-wide transition-all shadow-sm">
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