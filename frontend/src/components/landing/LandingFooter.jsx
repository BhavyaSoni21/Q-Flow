import React from "react";
import { Link } from "react-router-dom";

export default function LandingFooter() {
    return (
        <footer className="bg-[#0F172A] text-[#94A3B8] font-['Open_Sans',sans-serif] border-t border-[#1E293B]">
            <div className="max-w-[1440px] mx-auto px-6 py-16">
                
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    
                    {/* Brand & Description Column (Span 4) */}
                    <div className="md:col-span-4 flex flex-col gap-5">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/logo.png" alt="QFlow Logo" className="h-10 w-10 object-contain" />
                            <div>
                                <div className="text-[22px] font-extrabold tracking-tight leading-none">
                                    <span className="text-white">Q</span><span className="text-[#E86A00]">Flow</span>
                                </div>
                                <div className="text-[11px] text-[#CBD5E1] font-bold tracking-widest uppercase mt-1.5">
                                    Maritime Intelligence
                                </div>
                            </div>
                        </Link>
                        <p className="text-[13px] leading-relaxed text-[#94A3B8] max-w-[320px]">
                            An auditable decision-support platform predicting voyage fuel burn, evaluating Well-to-Wake lifecycle GHG emissions and INR operating costs, and using MO-QPSO to select Pareto-optimal fleet deployments.
                        </p>
                    </div>

                    {/* Navigation Columns */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-2">Platform</h4>
                        <Link to="/features" className="text-[13px] hover:text-[#38BDF8] transition-colors">Features</Link>
                        <Link to="/about" className="text-[13px] hover:text-[#38BDF8] transition-colors">About Us</Link>
                        <a href="https://youtu.be/OxfIHP9-YHs" target="_blank" rel="noreferrer" className="text-[13px] hover:text-[#38BDF8] transition-colors">YouTube</a>
                        <Link to="/scenario" className="text-[13px] hover:text-[#38BDF8] transition-colors">Scenario Builder</Link>
                        <Link to="/optimization" className="text-[13px] hover:text-[#38BDF8] transition-colors">Fleet Optimizer</Link>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-4">
                        <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-2">Intelligence</h4>
                        <Link to="/prediction" className="text-[13px] hover:text-[#38BDF8] transition-colors">Fuel Prediction</Link>
                        <Link to="/emissions" className="text-[13px] hover:text-[#38BDF8] transition-colors">Lifecycle Emissions</Link>
                        <Link to="/benchmarking" className="text-[13px] hover:text-[#38BDF8] transition-colors">Benchmark Lab</Link>
                        <Link to="/provenance" className="text-[13px] hover:text-[#38BDF8] transition-colors">Data Provenance</Link>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-4">
                        <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-2">Compliance & Standards</h4>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "IMO MEPC.391(81)",
                                "FuelEU Maritime 2025/2030",
                                "ISO 19030 Propeller Metrics",
                                "MO-QPSO vs NSGA-II Benchmark",
                                "WtT · TtW · WtW Lifecycle",
                                "EMSA THETIS-MRV · NOAA AIS",
                                "CEA India Grid (710 gCO2/kWh)"
                            ].map((badge) => (
                                <span key={badge} className="px-2.5 py-1.5 border border-[#334155] rounded-md text-[11px] text-[#CBD5E1] font-mono bg-[#1E293B]">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Legal/Meta */}
                <div className="border-t border-[#1E293B] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-[#64748B] font-mono">
                    <span>
                        SIH 2026 · Problem Statement SIH26138 · Egreen Quanta
                    </span>
                    <span className="text-center md:text-right">
                        Sources: EMSA MRV · NOAA AIS · Copernicus ERA5 · Synthetic
                    </span>
                </div>
            </div>
        </footer>
    );
}
