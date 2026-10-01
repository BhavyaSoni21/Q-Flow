import React from "react";
import LandingUtilityBar from "@/components/landing/LandingUtilityBar";
import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import InFocusBlock from "@/components/landing/InFocusBlock";
import ModulesBand from "@/components/landing/ModulesBand";
import CtaBand from "@/components/landing/CtaBand";
import DataSourcesStrip from "@/components/landing/DataSourcesStrip";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col bg-[#F4F8FD] text-[#1E3A5A] font-['Open_Sans',sans-serif]">
            <LandingUtilityBar />
            <LandingHeader />
            <main id="main-content" className="flex-1 flex flex-col">
                <Hero />
                <InFocusBlock />
                <ModulesBand />
                <CtaBand />
                <DataSourcesStrip />
            </main>
            <LandingFooter />
        </div>
    );
}