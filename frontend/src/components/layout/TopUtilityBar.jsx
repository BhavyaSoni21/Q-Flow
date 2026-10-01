import React, { useState } from "react";

export default function TopUtilityBar() {
    const [lang, setLang] = useState("English");

    const changeFontSize = (delta) => {
        const root = document.documentElement;
        const currentSize = parseFloat(window.getComputedStyle(root).fontSize) || 16;
        if (delta === 0) {
            root.style.fontSize = "16px";
        } else {
            const nextSize = Math.max(13, Math.min(20, currentSize + delta));
            root.style.fontSize = nextSize + "px";
        }
    };

    const setTheme = (theme) => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    return (
        <div className="bg-[#f8f8f8] dark:bg-[#1a2330] border-b border-[#ddd] dark:border-[#334155] text-[#666] dark:text-[#94a3b8] text-[12px] py-1 px-4 font-['Open_Sans',sans-serif] shrink-0">
            <div className="max-w-[1440px] mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-[#0076a8] dark:text-[#38bdf8] text-[11px] tracking-wide">
                        GOVERNMENT OF INDIA
                    </span>
                    <span className="opacity-40">|</span>
                    <a href="#main-content" className="hover:text-[#0076a8] transition-colors text-[11px]">
                        Skip to main content
                    </a>
                    <span className="opacity-40">|</span>
                    <button
                        type="button"
                        onClick={() => changeFontSize(0)}
                        title="Accessibility"
                        className="hover:text-[#0076a8]"
                    >
                        <i className="fas fa-wheelchair text-[12px]" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Font Resize */}
                    <div className="flex items-center gap-1 font-medium">
                        <button
                            type="button"
                            onClick={() => changeFontSize(-1)}
                            className="px-1.5 py-0.5 hover:bg-[#e0e0e0] dark:hover:bg-[#334155] rounded text-[11px]"
                            title="Decrease text size"
                        >
                            A-
                        </button>
                        <button
                            type="button"
                            onClick={() => changeFontSize(0)}
                            className="px-1.5 py-0.5 hover:bg-[#e0e0e0] dark:hover:bg-[#334155] rounded text-[11px]"
                            title="Reset text size"
                        >
                            A
                        </button>
                        <button
                            type="button"
                            onClick={() => changeFontSize(1)}
                            className="px-1.5 py-0.5 hover:bg-[#e0e0e0] dark:hover:bg-[#334155] rounded text-[11px]"
                            title="Increase text size"
                        >
                            A+
                        </button>
                    </div>

                    <span className="opacity-30">|</span>

                    {/* Theme Switch */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setTheme("light")}
                            aria-label="Light theme"
                            className="w-3.5 h-3.5 bg-white border border-[#ccc] rounded-sm hover:scale-105"
                            title="Light Theme"
                        />
                        <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            aria-label="Dark theme"
                            className="w-3.5 h-3.5 bg-[#333] border border-[#ccc] rounded-sm hover:scale-105"
                            title="Dark Theme"
                        />
                    </div>

                    <span className="opacity-30">|</span>

                    <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="bg-transparent text-[11px] border border-[#ccc] dark:border-[#475569] rounded px-1 text-[#555] dark:text-[#cbd5e1] focus:outline-none"
                    >
                        <option value="English">English</option>
                        <option value="Hindi">हिन्दी</option>
                    </select>
                </div>
            </div>
        </div>
    );
}