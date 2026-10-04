import React from "react";

export default function SectionBand({ title }) {
    return (
        <section
            className="bg-gradient-to-r from-[#e8f4fb] to-[#f0f7fd] dark:from-[#0f1e2d] dark:to-[#0f172a] border-b border-[#c8e2f5] dark:border-[#1e293b] font-['Inter',sans-serif]"
            aria-label={title}
        >
            <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 h-11 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-4 bg-gradient-to-b from-[#0076a8] to-[#005e86] dark:from-[#38bdf8] dark:to-[#0ea5e9] rounded-full" />
                    <h1 className="text-[13px] font-bold tracking-[0.04em] text-[#0076a8] dark:text-[#38bdf8]">
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#64748b] dark:text-[#94a3b8]">
                    <span className="bg-white dark:bg-[#1e293b] px-2 py-0.5 rounded border border-[#bae7ff] dark:border-[#334155] font-semibold text-[#0076a8] dark:text-[#38bdf8] tracking-wide">
                        QFLOW / SIH26138
                    </span>
                    <span className="hidden sm:inline font-medium">Maritime Intelligence</span>
                </div>
            </div>
        </section>
    );
}
