import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Activity, Globe, Database, SlidersHorizontal, Settings2, Sparkles, Layers } from "lucide-react";

const HIGHLIGHTS = [
    { to: "/prediction",    label: "XGBoost Fuel Predictor with QPSO Hyperparameter Tuning",       tag: "Prediction", icon: Activity },
    { to: "/emissions",     label: "Well-to-Wake Lifecycle GHG & Shore Power Cost Engine",          tag: "Emissions", icon: Globe },
    { to: "/optimization",  label: "Multi-Objective QPSO Pareto Fleet Optimizer",                   tag: "Optimizer", icon: Layers },
    { to: "/benchmarking",  label: "Fair QPSO vs. NSGA-II Benchmark Multiple Seeds, HV Metric",     tag: "Benchmark", icon: Database },
];

export default function InFocusBlock() {
    return (
        <section className="bg-[#F8FAFC] font-['Open_Sans',sans-serif] relative z-10 py-20 border-t border-[#E2E8F0]">
            <div className="max-w-[1440px] mx-auto px-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">

                    {/* IN FOCUS FEATURE CARD */}
                    <div className="lg:col-span-7 flex flex-col">
                        <div className="mb-6 flex items-center gap-3">
                            <Sparkles size={18} className="text-[#0076a8]" />
                            <h2 className="text-[14px] font-bold text-[#0F172A] uppercase tracking-wide">
                                In Focus Platform Capability
                            </h2>
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row flex-1 overflow-hidden shadow-md group">
                            {/* Image Side */}
                            <div className="sm:w-[45%] relative overflow-hidden bg-[#0F172A]">
                                <div className="absolute inset-0 bg-[#0076a8]/20 mix-blend-multiply z-10" />
                                <img
                                    src="/assets/ship-hero.jpg"
                                    alt="Container Vessel"
                                    className="w-full h-full object-cover min-h-[260px] sm:min-h-full opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-in-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent z-20" />
                                <div className="absolute bottom-6 left-6 z-30">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
                                        Q-GreenFleet Engine
                                    </span>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                                <span className="self-start text-[11px] font-bold text-[#0076a8] bg-[#F0F9FF] border border-[#B9E6FE] px-3 py-1.5 rounded-full uppercase tracking-wider mb-5">
                                    Quantum Optimization
                                </span>
                                <h3 className="text-[24px] font-extrabold text-[#0F172A] mb-4 leading-tight tracking-tight">
                                    Multi-Objective Fleet Route &amp; Fuel Optimization
                                </h3>
                                <p className="text-[14px] text-[#475569] leading-relaxed mb-8 font-medium">
                                    Predict voyage fuel burn via AI, evaluate lifecycle WtW emissions and costs, 
                                    and deploy MO-QPSO to generate a Pareto frontier. Benchmark directly against NSGA-II baselines.
                                </p>
                                <div className="flex flex-wrap gap-3 mt-auto">
                                    <Link to="/optimization"
                                        className="inline-flex items-center justify-center bg-[#0076a8] hover:bg-[#005e86] text-white px-6 py-3 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
                                        Open Optimizer <ArrowRight size={16} className="ml-2" />
                                    </Link>
                                    <Link to="/prediction"
                                        className="inline-flex items-center justify-center border border-[#CBD5E1] hover:border-[#0F172A] hover:bg-[#F8FAFC] text-[#0F172A] px-6 py-3 rounded-lg text-[13px] font-bold transition-all">
                                        Prediction Lab
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PLATFORM HIGHLIGHTS */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="mb-6 flex items-center gap-3">
                            <Settings2 size={18} className="text-[#0076a8]" />
                            <h2 className="text-[14px] font-bold text-[#0F172A] uppercase tracking-wide">
                                Key Platform Features
                            </h2>
                        </div>

                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-2 flex flex-col flex-1 shadow-sm">
                            <div className="flex-1 flex flex-col gap-1">
                                {HIGHLIGHTS.map((item, idx) => (
                                    <Link key={idx} to={item.to}
                                        className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-[#F8FAFC] hover:shadow-[inset_0_0_0_1px_#E2E8F0] transition-all group">
                                        
                                        <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0 group-hover:bg-[#0076a8] group-hover:border-[#0076a8] transition-colors shadow-sm">
                                            <item.icon size={18} strokeWidth={2.5} className="text-[#64748B] group-hover:text-white transition-colors" />
                                        </div>
                                        
                                        <span className="font-semibold text-[14px] text-[#334155] flex-1 group-hover:text-[#0F172A] transition-colors leading-snug">
                                            {item.label}
                                        </span>
                                        
                                        <span className="text-[11px] font-bold text-[#475569] bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wide hidden sm:block group-hover:bg-white group-hover:border-[#94A3B8] transition-colors">
                                            {item.tag}
                                        </span>
                                        
                                        <ChevronRight size={18} className="text-[#CBD5E1] group-hover:text-[#0076a8] shrink-0 ml-1 transition-colors" />
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-2 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex gap-3">
                                <Link to="/scenario"
                                    className="flex-1 flex items-center justify-center bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-3 rounded-lg text-[13px] font-bold transition-colors">
                                    Build Scenario
                                </Link>
                                <Link to="/benchmarking"
                                    className="flex-1 flex items-center justify-center border border-[#CBD5E1] hover:border-[#0F172A] text-[#0F172A] bg-white px-4 py-3 rounded-lg text-[13px] font-bold transition-colors">
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
