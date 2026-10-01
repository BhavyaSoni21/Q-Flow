import React from "react";

export default function LandingUtilityBar() {
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
        <div className="bg-[#f8f8f8] dark:bg-[#1a2330] border-b border-[#ddd] dark:border-[#334155] text-[#666] dark:text-[#94a3b8] text-[12px] py-1.5 px-4 font-['Open_Sans',sans-serif]">
            <div className="max-w-[1200px] mx-auto flex justify-between items-center">
                {/* Left */}
                <div className="flex items-center gap-4" />

                {/* Right */}
                <div className="flex items-center gap-4">
                    {/* Font Resize */}
                    <div className="flex items-center gap-1.5 font-medium">
                        <button
                            type="button"
                            onClick={() => changeFontSize(-1)}
                            className="px-1.5 py-0.5 hover:bg-[#e0e0e0] dark:hover:bg-[#334155] rounded transition-colors text-[11px]"
                            title="Decrease text size"
                        >
                            A-
                        </button>
                        <button
                            type="button"
                            onClick={() => changeFontSize(0)}
                            className="px-1.5 py-0.5 hover:bg-[#e0e0e0] dark:hover:bg-[#334155] rounded transition-colors text-[11px]"
                            title="Reset text size"
                        >
                            A
                        </button>
                        <button
                            type="button"
                            onClick={() => changeFontSize(1)}
                            className="px-1.5 py-0.5 hover:bg-[#e0e0e0] dark:hover:bg-[#334155] rounded transition-colors text-[11px]"
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
                            className="w-4 h-4 bg-white border border-[#ccc] rounded-sm hover:scale-105 transition-transform"
                            title="Light Theme"
                        />
                        <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            aria-label="Dark theme"
                            className="w-4 h-4 bg-[#333] border border-[#ccc] rounded-sm hover:scale-105 transition-transform"
                            title="Dark Theme"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}