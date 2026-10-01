import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
    return (
        <footer className="mt-auto font-['Open_Sans',sans-serif]">
            {/* Partner Logos Strip */}
            <div className="bg-white dark:bg-[#111827] py-5 border-t border-b border-[#eee] dark:border-[#1f2937]">
                <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap items-center justify-around gap-6">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/e/e4/India.gov.in_logo.svg"
                        alt="India.gov.in"
                        className="h-[36px] w-auto object-contain"
                    />
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Digital_India_logo.svg"
                        alt="Digital India"
                        className="h-[36px] w-auto object-contain"
                    />
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/1/1a/MyGov_India_Logo.svg"
                        alt="MyGov"
                        className="h-[36px] w-auto object-contain"
                    />
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Data.gov.in_logo.png"
                        alt="Data.gov.in"
                        className="h-[34px] w-auto object-contain"
                    />
                </div>
            </div>

            {/* Dark Navy Government Bar */}
            <div className="bg-[#23354b] text-[#ccc] py-7 text-[12px] text-center">
                <div className="max-w-[1440px] mx-auto px-4">
                    <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mb-4 text-white">
                        <Link to="/" className="hover:underline">About the Portal</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/scenario" className="hover:underline">Sitemap</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/provenance" className="hover:underline">Website Policies</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/optimization" className="hover:underline">Feedback</Link>
                        <span className="opacity-40">|</span>
                        <Link to="/login" className="hover:underline">Contact Us</Link>
                    </div>

                    <div className="max-w-[820px] mx-auto space-y-2 text-[#aaa] leading-relaxed mb-5">
                        <p>
                            This Portal is a <strong className="text-white">Mission Mode Project</strong> under the{" "}
                            <strong className="text-white">National E-Governance Plan</strong>, designed and developed for the{" "}
                            <strong className="text-white">National Informatics Centre (NIC)</strong>,{" "}
                            <strong className="text-white">Ministry of Electronics &amp; Information Technology</strong> &amp;{" "}
                            <strong className="text-white">Ministry of Ports, Shipping and Waterways</strong>,{" "}
                            <strong className="text-white">Government of India</strong>.
                        </p>
                        <p className="text-[11px] text-[#888]">
                            Last Updated: Oct 2026 | Smart India Hackathon Prototype (SIH26138)
                        </p>
                    </div>

                    <div className="flex justify-center items-center gap-5">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e4/National_Informatics_Centre_logo.png"
                            alt="NIC"
                            className="h-[34px] bg-white px-2 py-1 rounded-[2px] object-contain shadow-sm"
                        />
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/6/6c/Digital_India_logo.svg"
                            alt="Digital India"
                            className="h-[34px] bg-white px-2 py-1 rounded-[2px] object-contain shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}