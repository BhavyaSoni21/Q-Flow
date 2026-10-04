import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import TopUtilityBar from "./TopUtilityBar";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import SectionBand from "@/components/shared/SectionBand";
import KpiStrip from "@/components/shared/KpiStrip";
import { NAV_ITEMS } from "@/lib/nav";
import { ChevronRight } from "lucide-react";

export default function AppLayout() {
    const { pathname } = useLocation();
    const current = NAV_ITEMS.find((n) => n.to === pathname) || NAV_ITEMS[0];

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f9fb] dark:bg-[#0f172a] text-foreground font-['Inter',sans-serif]">
            <TopUtilityBar />
            <SiteHeader />

            {/* Breadcrumb */}
            <nav
                aria-label="Breadcrumb"
                className="bg-white dark:bg-[#111827] border-b border-[#e8ecf0] dark:border-[#1f2d3d] shrink-0"
            >
                <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 h-8 flex items-center text-[11px] text-[#8898aa] dark:text-[#64748b] gap-1">
                    <Link
                        to="/"
                        className="text-[#0076a8] dark:text-[#38bdf8] font-medium hover:underline underline-offset-2 transition-colors"
                    >
                        Home
                    </Link>
                    {current.crumb.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
                            <ChevronRight size={11} className="opacity-40" />
                            <span
                                className={
                                    i === current.crumb.length - 1
                                        ? "text-[#333] dark:text-[#f1f5f9] font-semibold"
                                        : "text-[#0076a8] dark:text-[#38bdf8] hover:underline"
                                }
                            >
                                {c}
                            </span>
                        </span>
                    ))}
                </div>
            </nav>

            <main id="main-content" className="flex-1 min-w-0 flex flex-col">
                <SectionBand title={current.section} />
                <div className="max-w-[1440px] mx-auto w-full pb-12">
                    <KpiStrip />
                    <div className="px-0">
                        <Outlet />
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
