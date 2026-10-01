import React from "react";
import { Link } from "react-router-dom";

const LINKS = [
    { to: "/", label: "Home" },
    { to: "/scenario", label: "Scenario Builder" },
    { to: "/optimization", label: "Fleet Optimizer" },
    { to: "/prediction", label: "Fuel Prediction" },
    { to: "/emissions", label: "Lifecycle Emissions" },
    { to: "/benchmarking", label: "Benchmark Lab" },
    { to: "/provenance", label: "Data Provenance" },
];

export default function LandingFooter() {
    return (
        <footer
            style={{ background: "linear-gradient(180deg, #071D35 0%, #051428 100%)" }}
            className="text-[#5B8CB0] text-[12px] font-['Open_Sans',sans-serif] border-t border-[#0D2D4A]"
        >
            <div className="max-w-[1280px] mx-auto px-6 py-10">
                {/* Top row: logo + links */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-7 pb-7 border-b border-[#0D2D4A]">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpeg" alt="QFlow Logo" className="h-9 w-9 rounded-full object-contain opacity-90" />
                        <div>
                            <div className="text-[18px] font-extrabold tracking-tight leading-none">
                                <span className="text-white">Q</span><span className="text-[#E86A00]">Flow</span>
                            </div>
                            <div className="text-[10px] text-[#3A6A90] font-medium tracking-wide mt-0.5">
                                Maritime Intelligence Platform
                            </div>
                        </div>
                    </div>

                    {/* Nav links */}
                    <nav className="flex flex-wrap gap-x-5 gap-y-1">
                        {LINKS.map((item) => (
                            <Link key={item.to} to={item.to}
                                className="text-[11px] text-[#4A7A9B] hover:text-[#8AC4E0] transition-colors duration-150 font-medium">
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Middle: description */}
                <div className="text-center mb-7">
                    <p className="text-[13px] text-[#8AB8D4] font-semibold mb-2">
                        QFlow / Q-GreenFleet &mdash; Quantum-Inspired Fuel Consumption Prediction and Green Fleet Optimization
                    </p>
                    <p className="text-[12px] text-[#3A6A90] max-w-[680px] mx-auto leading-relaxed">
                        An auditable decision-support platform predicting vessel fuel consumption, evaluating fuel-pathway
                        lifecycle emissions and operating cost, and using a quantum-inspired multi-objective optimizer
                        to select feasible vessel, speed, fuel, and shore-power decisions.
                    </p>
                </div>

                {/* Compliance badges */}
                <div className="flex flex-wrap justify-center items-center gap-3 mb-7">
                    {[
                        "IMO MEPC.328(76)",
                        "ISO 19030 Compliant",
                        "MO-QPSO · NSGA-II Benchmark",
                        "WtT · TtW · WtW Lifecycle",
                        "EMSA THETIS-MRV",
                    ].map((badge) => (
                        <span key={badge}
                            className="px-2.5 py-1 border border-[#0D3460] text-[10px] text-[#3A6A90] font-mono bg-[#071828] tracking-wide">
                            {badge}
                        </span>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-[#0D2D4A] pt-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-[#2A4A65]">
                    <span className="font-mono">SIH 2026 · Problem Statement SIH26138 · Clean &amp; Green Technology · Egreen Quanta</span>
                    <span className="font-mono">Data: EMSA MRV · NOAA AIS · Copernicus ERA5 · Synthetic (labeled)</span>
                </div>
            </div>
        </footer>
    );
}