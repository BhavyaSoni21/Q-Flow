import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function CtaBand() {
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");

    const handleFeedbackSubmit = (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setFeedbackSent(true);
        setTimeout(() => { setFeedbackOpen(false); setFeedbackSent(false); setFeedbackText(""); }, 2000);
    };

    const STATS = [
        { value: "3", label: "Specialized Models" },
        { value: "5", label: "Fuel Pathways" },
        { value: "12", label: "Platform Modules" },
        { value: "NSGA-II", label: "Baseline Benchmark" },
    ];

    return (
        <section
            style={{ background: "linear-gradient(135deg, #1264AB 0%, #0D4D8C 50%, #0A3870 100%)" }}
            className="text-white font-['Open_Sans',sans-serif]"
        >
            <div className="max-w-[1280px] mx-auto px-6 py-16">

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mb-14 border border-white/20 divide-x divide-y sm:divide-y-0 divide-white/20">
                    {STATS.map((s, i) => (
                        <div key={i} className="text-center py-5 px-4">
                            <div className="text-[24px] sm:text-[28px] font-extrabold text-white tracking-tight">{s.value}</div>
                            <div className="text-[11px] text-[#A8CCE8] uppercase tracking-widest font-semibold mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA Content */}
                <div className="max-w-[700px] mx-auto text-center">
                    <p className="text-[11px] font-bold text-[#7AB8E0] uppercase tracking-[0.18em] mb-3">
                        Auditable Decision-Support Platform
                    </p>
                    <h2 className="text-[26px] sm:text-[30px] font-bold tracking-tight mb-4">
                        Accelerate Maritime Decarbonization
                    </h2>
                    <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#B8D8F0] mb-8 max-w-[600px] mx-auto">
                        Q-GreenFleet predicts vessel fuel consumption, evaluates lifecycle emissions and operating cost,
                        and uses a quantum-inspired multi-objective optimizer to select feasible vessel, speed, fuel,
                        and shore-power decisions — benchmarked against NSGA-II under reproducible scenarios.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        <Link
                            to="/optimization"
                            className="bg-[#E86A00] hover:bg-[#c45a00] text-white px-8 py-3 text-[13px] font-bold uppercase tracking-wide transition-colors shadow-md"
                        >
                            <i className="fas fa-play-circle mr-2" />
                            Launch Route Simulator
                        </Link>
                        <Link
                            to="/benchmarking"
                            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors"
                        >
                            <i className="fas fa-chart-bar mr-2" />
                            View Benchmarks
                        </Link>
                        <button
                            type="button"
                            onClick={() => setFeedbackOpen(true)}
                            className="border border-white/25 text-[#A8CCE8] hover:border-white/60 hover:text-white px-8 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors"
                        >
                            Share Feedback
                        </button>
                    </div>

                    {/* Core Pipeline */}
                    <div className="border-t border-white/15 pt-8">
                        <p className="text-[10px] font-bold text-[#5B9DC8] uppercase tracking-[0.18em] mb-4">Core Evaluation Pipeline</p>
                        <div className="flex flex-wrap justify-center items-center gap-0 text-[11px] font-mono">
                            {["Scenario Input", "Fuel Prediction", "Cost & Lifecycle GHG", "QPSO Optimizer", "Pareto Results"].map((step, i, arr) => (
                                <React.Fragment key={i}>
                                    <span className="px-2.5 py-1 bg-white/10 border border-white/20 text-[#C8E0F4] text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                                        {step}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <span className="text-[#E86A00] px-1 font-bold">→</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Connect */}
                <div className="mt-12 pt-8 border-t border-white/15 flex flex-wrap justify-center items-center gap-8">
                    <a href="https://github.com" target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 text-[13px] text-[#A8CCE8] hover:text-white transition-colors">
                        <span className="w-8 h-8 rounded border border-white/20 bg-white/10 flex items-center justify-center">
                            <i className="fab fa-github text-[14px]" />
                        </span>
                        @qflow-maritime
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 text-[13px] text-[#A8CCE8] hover:text-white transition-colors">
                        <span className="w-8 h-8 rounded border border-white/20 bg-white/10 flex items-center justify-center">
                            <i className="fab fa-linkedin-in text-[14px]" />
                        </span>
                        /company/qflow-fleet
                    </a>
                    <span className="text-[11px] text-[#5B8CB0] font-mono">SIH26138 · Egreen Quanta · Clean &amp; Green Technology</span>
                </div>
            </div>

            {/* Feedback Modal */}
            {feedbackOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-white text-[#111] max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
                        <h3 className="text-[16px] font-bold mb-3">QFlow Fleet Feedback</h3>
                        {feedbackSent ? (
                            <div className="p-4 bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-center font-medium text-sm">
                                Thank you! Your feedback has been recorded.
                            </div>
                        ) : (
                            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                <p className="text-[12px] text-[#64748b]">Suggest new shipping corridors, fuel scenarios, or algorithm parameters.</p>
                                <textarea rows={4} value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Enter your suggestion..."
                                    className="w-full p-3 border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#1264AB]" required />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setFeedbackOpen(false)}
                                        className="px-4 py-2 border border-[#e2e8f0] text-[12px] font-semibold text-[#64748b] hover:bg-[#f8fafc]">
                                        Cancel
                                    </button>
                                    <button type="submit"
                                        className="px-5 py-2 bg-[#1264AB] text-white text-[12px] font-bold hover:bg-[#0D4D8C] transition-colors">
                                        Submit
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}