import React from "react";

const SOURCES = [
    { icon: "fas fa-database",          label: "EMSA THETIS-MRV",           sub: "Fuel & CO₂ reporting" },
    { icon: "fas fa-satellite-dish",    label: "NOAA Marine AIS",            sub: "Vessel movement & speed" },
    { icon: "fas fa-cloud-sun-rain",    label: "Copernicus ERA5",            sub: "Wind, wave, ocean data" },
    { icon: "fas fa-atom",              label: "MO-QPSO Engine",             sub: "Quantum-inspired optimizer" },
    { icon: "fas fa-balance-scale",     label: "IMO LCA Framework",          sub: "WtW lifecycle factors" },
];

export default function DataSourcesStrip() {
    return (
        <section className="bg-[#EBF3FB] border-y border-[#C8DDEF] py-5">
            <div className="max-w-[1280px] mx-auto px-6">
                <div className="flex flex-wrap items-stretch justify-around gap-0 divide-x divide-[#C8DDEF]">
                    {SOURCES.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-6 py-1">
                            <i className={`${s.icon} text-[#1264AB] text-[16px] shrink-0`} />
                            <div>
                                <div className="text-[11px] font-bold text-[#0A3870] uppercase tracking-wider leading-tight">
                                    {s.label}
                                </div>
                                <div className="text-[10px] text-[#4A7A9B] leading-tight mt-0.5">
                                    {s.sub}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}