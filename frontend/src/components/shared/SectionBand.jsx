import React from "react";

export default function SectionBand({ title }) {
    return (
        <section
            className="bg-[#e6f7ff] dark:bg-[#0f172a] text-[#0076a8] dark:text-[#38bdf8] border-b border-[#cde8f7] dark:border-[#1e293b] font-['Open_Sans',sans-serif]"
            aria-label={title}
        >
            <div className="max-w-[1440px] mx-auto w-full px-4 h-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#0076a8] dark:bg-[#38bdf8] rounded-sm inline-block" />
                    <h1 className="text-[14px] font-bold uppercase tracking-[0.06em] text-[#0076a8] dark:text-[#38bdf8]">
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#555] dark:text-[#94a3b8]">
                    <span className="bg-white dark:bg-[#1e293b] px-2 py-0.5 rounded border border-[#bae7ff] dark:border-[#334155] font-semibold text-[#0076a8] dark:text-[#38bdf8]">
                        QFLOW / SIH26138
                    </span>
                    <span>Maritime Intelligence</span>
                </div>
            </div>
        </section>
    );
}