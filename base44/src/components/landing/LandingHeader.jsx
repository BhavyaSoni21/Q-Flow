import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useStore } from "@/lib/store";

export default function LandingHeader() {
    const { isMock } = useStore();
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);

    return (
        <header className="bg-white border-b border-border shrink-0">
            <div className="max-w-[1100px] mx-auto w-full px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5 min-w-0" aria-label="Q-GreenFleet home">
                    <span className="w-6 h-6 bg-primary block shrink-0" aria-hidden="true" />
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-semibold text-[16px] tracking-tight text-foreground">Q-GreenFleet</span>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground truncate">
                            Quantum-Inspired Green Fleet Decision Engine
                        </span>
                    </div>
                </Link>
                <div className="flex items-center gap-3">
                    {isMock && (
                        <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-semibold bg-status-amber text-black px-2 py-1 border border-status-amber/60">
                            Demo Data (Synthetic)
                        </span>
                    )}
                    <nav aria-label="Primary" className="hidden md:flex items-stretch h-16">
                        <NavLink
                            to="/"
                            end
                            className="flex items-center px-3 text-[12px] border-b-[3px] border-primary text-primary font-medium"
                        >
                            Home
                        </NavLink>
                        <a href="#modules" className="flex items-center px-3 text-[12px] border-b-[3px] border-transparent text-foreground/80 hover:text-primary transition-colors duration-150">
                            Modules
                        </a>
                        <Link to="/optimization" className="flex items-center px-3 text-[12px] border-b-[3px] border-transparent text-foreground/80 hover:text-primary transition-colors duration-150">
                            Case Studies
                        </Link>
                        <Link to="/provenance" className="flex items-center px-3 text-[12px] border-b-[3px] border-transparent text-foreground/80 hover:text-primary transition-colors duration-150">
                            Data Sources
                        </Link>
                        <Link to="/scenario" className="flex items-center px-3 text-[12px] border-b-[3px] border-transparent text-foreground/80 hover:text-primary transition-colors duration-150">
                            Launch Platform
                        </Link>
                    </nav>
                    <button
                        className="md:hidden p-1.5 border border-border"
                        onClick={() => setOpen((o) => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={open}
                    >
                        {open ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
                    </button>
                </div>
            </div>
            {open && (
                <div className="md:hidden border-t border-border bg-white">
                    <div className="max-w-[1100px] mx-auto px-4 flex flex-col">
                        <Link to="/" onClick={close} className="py-2.5 text-[13px] border-b border-border">Home</Link>
                        <a href="#modules" onClick={close} className="py-2.5 text-[13px] border-b border-border">Modules</a>
                        <Link to="/optimization" onClick={close} className="py-2.5 text-[13px] border-b border-border">Case Studies</Link>
                        <Link to="/provenance" onClick={close} className="py-2.5 text-[13px] border-b border-border">Data Sources</Link>
                        <Link to="/scenario" onClick={close} className="py-2.5 text-[13px]">Launch Platform</Link>
                    </div>
                </div>
            )}
        </header>
    );
}