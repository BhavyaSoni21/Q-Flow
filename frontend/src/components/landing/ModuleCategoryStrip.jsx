import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MODULES } from "@/lib/nav";

export default function ModuleCategoryStrip() {
    const [open, setOpen] = useState(false);
    return (
        <section className="bg-background border-b border-border">
            <div className="max-w-[1100px] mx-auto w-full px-4 py-3 flex justify-center">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        className="flex items-center gap-2 h-9 px-4 border border-border bg-white text-[12px] uppercase tracking-[0.06em] font-medium hover:bg-muted transition-colors duration-150"
                    >
                        Platform Modules
                        <ChevronDown size={14} strokeWidth={1.5} />
                    </button>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
                            <div className="absolute top-10 left-0 right-0 min-w-[280px] bg-white border border-border z-20">
                                {MODULES.map((m) => (
                                    <Link
                                        key={m.to}
                                        to={m.to}
                                        onClick={() => setOpen(false)}
                                        className="block px-3 py-2 text-[12px] border-b last:border-b-0 hover:bg-muted"
                                    >
                                        {m.label}
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}