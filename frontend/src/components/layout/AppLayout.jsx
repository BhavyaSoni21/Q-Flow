import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import TopUtilityBar from "./TopUtilityBar";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import SectionBand from "@/components/shared/SectionBand";
import KpiStrip from "@/components/shared/KpiStrip";
import { NAV_ITEMS } from "@/lib/nav";

export default function AppLayout() {
    const { pathname } = useLocation();
    const current = NAV_ITEMS.find((n) => n.to === pathname) || NAV_ITEMS[0];

    return (
        <div className="min-h-screen flex flex-col bg-[#fdfdfd] dark:bg-[#0f172a] text-[#333] dark:text-[#f3f4f6] font-['Open_Sans',sans-serif]">
            <TopUtilityBar />
            <SiteHeader />
            <nav aria-label="Breadcrumb" className="bg-[#f8f8f8] dark:bg-[#1a2330] border-b border-[#ddd] dark:border-[#334155] shrink-0">
                <div className="max-w-[1440px] mx-auto w-full px-4 h-8 flex items-center text-[11px] text-[#666] dark:text-[#94a3b8]">
                    <Link to="/" className="text-[#0076a8] dark:text-[#38bdf8] font-medium hover:underline">Home</Link>
                    {current.crumb.map((c, i) => (
                        <span key={i} className="flex items-center">
                            <span className="mx-1.5 opacity-50">/</span>
                            <span className={i === current.crumb.length - 1 ? "text-[#333] dark:text-[#f3f4f6] font-semibold" : "text-[#0076a8] dark:text-[#38bdf8]"}>
                                {c}
                            </span>
                        </span>
                    ))}
                </div>
            </nav>
            <main id="main-content" className="flex-1 min-w-0 flex flex-col">
                <SectionBand title={current.section} />
                <div className="max-w-[1440px] mx-auto w-full pb-10">
                    <KpiStrip />
                    <Outlet />
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}