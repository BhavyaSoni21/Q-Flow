import React from "react";
import { Database, Radio, CloudRain, Cpu, Scale } from "lucide-react";

const SOURCES = [
    { icon: Database,     label: "EMSA THETIS-MRV",           sub: "Fuel & CO2 reporting" },
    { icon: Radio,        label: "NOAA Marine AIS",            sub: "Vessel movement & speed" },
    { icon: CloudRain,    label: "Copernicus ERA5",            sub: "Wind, wave, ocean data" },
    { icon: Cpu,          label: "MO-QPSO Engine",             sub: "Quantum-inspired optimizer" },
    { icon: Scale,        label: "IMO LCA Framework",          sub: "WtW lifecycle factors" },
];

export default function DataSourcesStrip() {
    return (
        <section className="bg-[#F8FAFC] border-y border-[#E2E8F0] py-10">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 md:divide-x divide-[#CBD5E1]">
                    {SOURCES.map((s, i) => (
                        <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-4 px-8 w-full md:w-1/5 text-center md:text-left group cursor-default">
                            <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#0076a8] group-hover:shadow transition-all">
                                <s.icon className="text-[#64748B] group-hover:text-[#0076a8] w-4 h-4 transition-colors" />
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[12px] font-bold text-[#0F172A] uppercase tracking-widest leading-tight group-hover:text-[#0076a8] transition-colors">
                                    {s.label}
                                </div>
                                <div className="text-[12px] text-[#64748B] font-medium leading-tight mt-1.5">
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
