import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
    return (
        <footer className="mt-auto font-['Open_Sans',sans-serif]">
            <div className="bg-[#23354b] text-[#ccc] py-7 text-[12px] text-center">
                <div className="max-w-[1440px] mx-auto px-4">
                    <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mb-4 text-white">
                        <Link to="/" className="hover:underline">About</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/scenario" className="hover:underline">Scenario</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/benchmarking" className="hover:underline">Benchmarks</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/provenance" className="hover:underline">Data &amp; Provenance</Link>
                    </div>

                    <div className="max-w-[820px] mx-auto space-y-2 text-[#aaa] leading-relaxed">
                        <p>
                            <strong className="text-white">Q-Flow</strong> — Quantum-Inspired Fuel Prediction &amp;
                            Green Fleet Optimization. An auditable, multi-modal decision-support platform.
                        </p>
                        <p className="text-[11px] text-[#888]">
                            SIH26138 · benchmarked and reproducible · updated Oct 2026
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
