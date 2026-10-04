import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
    return (
        <footer className="mt-auto font-['Inter',sans-serif] border-t border-[#1f2d3d]">
            <div className="bg-[#1f2d3d] dark:bg-[#0d1a26] text-[#94a3b8] py-8 text-[12px]">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
                    {/* Top row: brand + nav links */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[16px] font-extrabold tracking-tight">
                                <span className="text-white">Q</span>
                                <span className="text-[#E86A00]">Flow</span>
                            </span>
                            <span className="text-[#475569] text-[11px] pl-2 border-l border-[#334155]">Maritime Intelligence</span>
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[#94a3b8]">
                            <Link to="/" className="hover:text-white transition-colors hover:underline underline-offset-2">Home</Link>
                            <Link to="/features" className="hover:text-white transition-colors hover:underline underline-offset-2">Features</Link>
                            <Link to="/about" className="hover:text-white transition-colors hover:underline underline-offset-2">About</Link>
                            <Link to="/scenario" className="hover:text-white transition-colors hover:underline underline-offset-2">Scenario</Link>
                            <Link to="/optimization" className="hover:text-white transition-colors hover:underline underline-offset-2">Optimization</Link>
                            <Link to="/benchmarking" className="hover:text-white transition-colors hover:underline underline-offset-2">Benchmarks</Link>
                            <Link to="/emissions" className="hover:text-white transition-colors hover:underline underline-offset-2">Emissions</Link>
                            <Link to="/provenance" className="hover:text-white transition-colors hover:underline underline-offset-2">Provenance</Link>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#2d3f52] mb-5" />

                    {/* Bottom row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#64748b]">
                        <p className="text-center sm:text-left leading-relaxed">
                            <strong className="text-[#94a3b8]">Q-Flow</strong> &mdash; Quantum-Inspired Fuel Prediction &amp; Green Fleet Optimization.
                            Auditable, multi-modal decision-support platform for IMO MEPC.391(81) and FuelEU compliance.
                        </p>
                        <p className="shrink-0 text-[10px] text-[#475569] tracking-wide font-mono">
                            SIH26138 · Team Egreen Quanta · Reproducible &amp; Auditable
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
