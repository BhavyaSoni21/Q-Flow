import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SEARCH_OPTIONS = [
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
            className="relative w-full flex items-center font-['Open_Sans',sans-serif] overflow-hidden"
            style={{
                minHeight: "680px",
                backgroundImage: "url('/assets/ship-aerial.jpg')",
                backgroundPosition: "center right",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
            aria-label="QFlow Maritime Fleet Optimization Hero"
        >
            {/* Directional Overlay: Dark navy on the left fading to transparent on the right */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                    background: "linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 45%, rgba(15, 23, 42, 0.2) 100%)" 
                }}
            />
            
            {/* Mobile bottom overlay to ensure text readability on small screens */}
            <div 
                className="absolute inset-0 pointer-events-none md:hidden"
                style={{ 
                    background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)" 
                }}
            />

            <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 py-20 flex flex-col items-start justify-center">
                <div className="w-full max-w-[700px] flex flex-col gap-6">
                    {/* Headline */}
                    <h1 className="text-[36px] sm:text-[44px] md:text-[52px] lg:text-[58px] font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-sm">
                        Navigate Smarter.<br />
                        <span className="text-[#E86A00]">Sail Greener.</span><br />
                        Arrive Faster.
                    </h1>

                    {/* Sub-headline */}
                    <p className="text-[15px] sm:text-[16px] md:text-[18px] text-[#E2E8F0] leading-relaxed max-w-[580px] font-medium opacity-90">
                        Quantum-inspired algorithms predicting fuel burn and dynamically optimizing
                        routes, speeds, and clean fuel transitions across global oceans.
                    </p>

                    {/* Operational Search/Optimize Control */}
                    <div className="w-full mt-4">
                        <form
                            onSubmit={handleSearch}
                            className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl flex flex-col sm:flex-row items-center border border-[#CBD5E1]/20 p-1.5 focus-within:ring-2 focus-within:ring-[#0076a8]/50 transition-all relative z-20"
                        >
                            {/* Category Select */}
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full sm:w-[170px] h-[48px] px-4 bg-transparent text-[14px] text-[#334155] font-semibold focus:outline-none cursor-pointer border-b sm:border-b-0 sm:border-r border-[#E2E8F0] shrink-0 appearance-none"
                                style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem top 50%", backgroundSize: "0.65rem auto" }}
                            >
                                <option value="All Categories">All Modules</option>
                                <option value="Optimization">Optimization</option>
                                <option value="Scenario">Scenario</option>
                                <option value="Benchmarking">Benchmarking</option>
                                <option value="Prediction">Prediction</option>
                                <option value="Emissions">Emissions</option>
                                <option value="Provenance">Provenance</option>
                                <option value="Quantum">Quantum Logic</option>
                                <option value="Fuels">Clean Fuels</option>
                            </select>

                            {/* Input */}
                            <input
                                type="text"
                                placeholder="Search routes, vessel telemetry, CII benchmarks..."
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                                onFocus={() => setShowResults(true)}
                                className="flex-1 w-full h-[48px] px-4 bg-transparent text-[14px] text-[#0F172A] font-medium focus:outline-none placeholder:text-[#94A3B8]"
                            />

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full sm:w-auto h-[48px] px-8 bg-[#E86A00] hover:bg-[#CC5D00] text-white text-[14px] font-bold tracking-wide transition-colors rounded-md shrink-0 flex items-center justify-center gap-2 shadow-sm"
                                aria-label="Run Optimization"
                            >
                                <i className="fas fa-bolt text-[13px] opacity-90" />
                                OPTIMIZE
                            </button>

                            {/* Autocomplete */}
                            {showResults && filtered.length > 0 && (
                                <div className="absolute top-[60px] left-0 right-0 bg-white rounded-lg border border-[#E2E8F0] shadow-2xl z-30 max-h-[300px] overflow-y-auto overflow-x-hidden">
                                    {filtered.map((item, idx) => (
                                        <Link
                                            key={idx}
                                            to={item.to}
                                            onClick={() => setShowResults(false)}
                                            className="flex items-center justify-between px-4 py-3 text-[14px] border-b border-[#F1F5F9] hover:bg-[#F8FAFC] text-[#0F172A] transition-colors last:border-b-0"
                                        >
                                            <span className="font-semibold">{item.label}</span>
                                            <span className="text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-md uppercase tracking-wide">
                                                {item.category}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </form>

                        {/* Below search bar meta */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 px-1 gap-4">
                            {/* Live Status Indicator */}
                            <div className="flex items-center gap-2.5 bg-[#0F172A]/40 backdrop-blur-sm border border-[#334155]/60 px-3 py-1.5 rounded-md">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                                </span>
                                <span className="text-[11px] font-bold text-[#E2E8F0] tracking-widest uppercase">
                                    Live AIS Data <span className="opacity-50 mx-1">|</span> 1,420+ Vessels Tracked
                                </span>
                            </div>
                            
                            {/* Secondary Action */}
                            <Link
                                to="/optimization"
                                className="flex items-center gap-2 text-[#94A3B8] hover:text-white text-[13px] font-semibold tracking-wide transition-colors group"
                            >
                                Open Quantum Optimizer 
                                <i className="fas fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
