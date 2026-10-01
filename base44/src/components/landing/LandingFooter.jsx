import React from "react";
import { Link } from "react-router-dom";

const LINKS = ["About", "Help", "Sitemap", "Documentation", "Contact"];

export default function LandingFooter() {
    return (
        <footer className="mt-auto">
            <div className="bg-[#E9EDF1] border-b border-border">
                <div className="max-w-[1100px] mx-auto w-full px-4 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
                    {LINKS.map((l) => (
                        <Link key={l} to="/provenance" className="hover:text-primary hover:underline">
                            {l}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="bg-sidebar text-sidebar-foreground">
                <div className="max-w-[1100px] mx-auto w-full px-4 py-5 flex flex-col items-center text-center gap-1 text-[11px] text-sidebar-foreground/80">
                    <span>Prototype developed for Smart India Hackathon 2026 | Problem Statement SIH26138</span>
                    <span>Demo data is synthetic unless a source is marked</span>
                    <span>Last updated: 2026-09-30</span>
                    <span className="num">v0.1.0 (prototype)</span>
                </div>
            </div>
        </footer>
    );
}   