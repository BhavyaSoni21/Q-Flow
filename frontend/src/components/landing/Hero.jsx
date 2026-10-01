import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const SEARCH_OPTIONS = [
    { label: "Fleet Optimization & Pareto Front", category: "Optimization", to: "/optimization" },
    { label: "Speed & Throttle Optimization (Case Study B)", category: "Optimization", to: "/optimization" },
    { label: "Vessel Scenario Setup & Hydrodynamics", category: "Scenario", to: "/scenario" },
    { label: "Fuel Prediction Lab (AI / Surrogate ML)", category: "Prediction", to: "/prediction" },
    { label: "Emissions Lifecycle & Clean Fuel Pathways", category: "Emissions", to: "/emissions" },
    { label: "CII & EEXI Compliance Benchmarking", category: "Benchmarking", to: "/benchmarking" },
    { label: "AIS Satellite Data Provenance & Verification", category: "Provenance", to: "/provenance" },
    { label: "Jawaharlal Nehru Port - Dubai Route", category: "Routes", to: "/scenario" },
    { label: "Green Methanol & Bio-LNG Transitions", category: "Fuels", to: "/emissions" },
    { label: "Quantum Route Solver (QUBO / Simulated Annealing)", category: "Quantum", to: "/optimization" },
    { label: "Hull Fouling & ISO 19030 Propeller Metrics", category: "Benchmarking", to: "/benchmarking" },
    { label: "Zero-Carbon Fleet Decarbonization Roadmap", category: "Emissions", to: "/emissions" },
];

export default function Hero() {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All Categories");
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const filtered = query.trim()
        ? SEARCH_OPTIONS.filter((item) => {
              const matchesCat = category === "All Categories" || item.category.toLowerCase().includes(category.toLowerCase());
              const matchesQuery = item.label.toLowerCase().includes(query.toLowerCase());
              return matchesCat && matchesQuery;
          })
        : [];

    const handleSearch = (e) => {
        e.preventDefault();
        if (filtered.length > 0) {
            navigate(filtered[0].to);
        } else if (query.trim()) {
            navigate("/optimization");
        }
    };

    return (
        <section
            className="relative w-full flex items-center justify-center font-['Open_Sans',sans-serif] overflow-hidden"
            style={{
                minHeight: "600px",
                backgroundImage: "url('/assets/ship-aerial.jpg')",
                backgroundPosition: "center 45%",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
            aria-label="QFlow Maritime Fleet Optimization Hero"
        >
            {/* Overlay: image clearly visible, white text readable */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.65) 100%)" }}
            />

            <div className="relative z-10 w-full max-w-[820px] px-6 py-16 flex flex-col items-center">
                {/* Headline */}
                <h1 className="text-[32px] sm:text-[42px] md:text-[46px] font-extrabold text-white tracking-tight leading-tight text-center mb-4 drop-shadow">
                    Navigate Smarter.{" "}
                    <span className="text-[#E86A00]">Sail Greener.</span>{" "}
                    Arrive Faster.
                </h1>

                {/* Sub-headline */}
                <p className="text-[14px] sm:text-[15px] text-white/80 text-center leading-relaxed mb-8 max-w-[640px]">
                    Quantum-inspired algorithms predicting fuel burn and dynamically optimizing
                    routes, speeds, and clean fuel transitions across the world's oceans.
                </p>

                {/* Search Bar */}
                <div className="w-full">
                    <form
                        onSubmit={handleSearch}
                        className="bg-white flex items-center shadow-lg relative"
                    >
                        {/* Category Select */}
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-[160px] h-[50px] px-3 bg-[#f8fafc] border-r border-[#e2e8f0] text-[13px] text-[#334155] font-medium focus:outline-none shrink-0"
                        >
                            <option value="All Categories">All Categories</option>
                            <option value="Optimization">Optimization</option>
                            <option value="Scenario">Scenario</option>
                            <option value="Benchmarking">Benchmarking</option>
                            <option value="Prediction">Prediction</option>
                            <option value="Emissions">Emissions</option>
                            <option value="Provenance">Provenance</option>
                            <option value="Quantum">Quantum</option>
                            <option value="Fuels">Clean Fuels</option>
                        </select>

                        {/* Input */}
                        <input
                            type="text"
                            placeholder="Search routes, vessel telemetry, fuel scenarios, CII benchmarks..."
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                            onFocus={() => setShowResults(true)}
                            className="flex-1 h-[50px] px-4 text-[13px] text-[#1e293b] focus:outline-none placeholder:text-[#94a3b8]"
                        />

                        {/* Submit */}
                        <button
                            type="submit"
                            className="h-[50px] px-7 bg-[#E86A00] hover:bg-[#c45a00] text-white text-[13px] font-bold uppercase tracking-wide transition-colors shrink-0 flex items-center gap-2"
                            aria-label="Search"
                        >
                            <i className="fas fa-search text-[12px]" />
                            Optimize
                        </button>

                        {/* Autocomplete */}
                        {showResults && filtered.length > 0 && (
                            <div className="absolute top-[50px] left-0 right-0 bg-white border border-[#e2e8f0] shadow-xl z-30 max-h-60 overflow-y-auto">
                                {filtered.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        to={item.to}
                                        onClick={() => setShowResults(false)}
                                        className="flex items-center justify-between px-4 py-2.5 text-[13px] border-b border-[#f1f5f9] hover:bg-[#f8fafc] text-[#1e293b] transition-colors"
                                    >
                                        <span className="font-medium">{item.label}</span>
                                        <span className="text-[11px] font-semibold text-[#E86A00] bg-[#fff7f0] border border-[#ffd0a8] px-2 py-0.5">
                                            {item.category}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </form>

                    {/* Below search bar meta */}
                    <div className="flex justify-between items-center mt-3 px-1">
                        <div className="flex items-center gap-2 text-[12px] text-white/70">
                            <span className="w-1.5 h-1.5 bg-[#22c55e] inline-block" />
                            <span className="font-mono">1,420+ Vessels Tracked via AIS</span>
                        </div>
                        <Link
                            to="/optimization"
                            className="text-white/80 hover:text-white text-[12px] font-semibold tracking-wide transition-colors"
                        >
                            Open Quantum Optimizer &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}