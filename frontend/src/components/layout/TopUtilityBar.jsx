import React from "react";

export default function TopUtilityBar() {
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
            root.classList.remove("high-contrast");
        } else if (theme === "high-contrast") {
            root.classList.add("high-contrast");
            root.classList.remove("dark");
        } else {
            root.classList.remove("dark");
            root.classList.remove("high-contrast");
        }
    };

    return (
        <div className="bg-[#1f2d3d] dark:bg-[#111827] text-[#b0bec5] dark:text-[#64748b] text-[11px] py-1 px-4 font-['Inter',sans-serif] shrink-0 border-b border-[#2d3f52] dark:border-[#1f2d3d]">
            <div className="max-w-[1440px] mx-auto flex justify-between items-center">
                {/* Left: Government indicator */}
                <div className="flex items-center gap-2 opacity-70">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50] inline-block" />
                    <span className="tracking-wide text-[10px] font-medium uppercase text-[#90a4b0]">SIH26138 ┬╖ Maritime Fuel Optimization</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Font Resize */}
                    <div className="flex items-center gap-0.5 font-medium" aria-label="Text size controls">
                        <button
                            type="button"
                            onClick={() => changeFontSize(-1)}
                            className="px-1.5 py-0.5 hover:bg-white/10 rounded text-[10px] transition-colors"
                            title="Decrease text size"
                            aria-label="Decrease text size"
                        >
                            A-
                        </button>
                        <button
                            type="button"
                            onClick={() => changeFontSize(0)}
                            className="px-1.5 py-0.5 hover:bg-white/10 rounded text-[11px] transition-colors"
                            title="Reset text size"
                            aria-label="Reset text size"
                        >
                            A
                        </button>
                        <button
                            type="button"
                            onClick={() => changeFontSize(1)}
                            className="px-1.5 py-0.5 hover:bg-white/10 rounded text-[12px] transition-colors"
                            title="Increase text size"
                            aria-label="Increase text size"
                        >
                            A+
                        </button>
                    </div>

                    <span className="opacity-30 text-xs">|</span>

                    {/* Theme buttons */}
                    <div className="flex items-center gap-1.5" aria-label="Theme selector">
                        <button
                            type="button"
                            onClick={() => setTheme("light")}
                            aria-label="Light theme"
                            className="w-4 h-4 bg-white border border-[#90a4b0]/60 rounded-sm hover:scale-110 transition-transform"
                            title="Light Theme"
                        />
                        <button
                            type="button"
                            onClick={() => setTheme("dark")}
                            aria-label="Dark theme"
                            className="w-4 h-4 bg-[#1a1a2e] border border-[#90a4b0]/60 rounded-sm hover:scale-110 transition-transform"
                            title="Dark Theme"
                        />
                        <button
                            type="button"
                            onClick={() => setTheme("high-contrast")}
                            aria-label="High contrast theme"
                            className="w-4 h-4 bg-black border-2 border-yellow-400 rounded-sm hover:scale-110 transition-transform"
                            title="High Contrast"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
