import React from "react";
import { Link } from "react-router-dom";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f5] text-[#333] font-['Open_Sans',sans-serif]">
            {/* Top Bar */}
            <div className="bg-white border-b border-[#e2e8f0] py-1.5 px-4 text-[12px] text-[#64748b]">
                <div className="max-w-[1200px] mx-auto flex justify-between items-center">
                    <span className="font-semibold text-[11px] text-[#64748b] tracking-wide">
                        QFlow Maritime Intelligence Platform
                    </span>
                    <Link to="/" className="text-[#E86A00] hover:underline text-[11px] font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-4 my-8">
                <div className="w-full max-w-md">
                    {/* Header with Logo */}
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-flex items-center gap-3 justify-center mb-4 group">
                            <img
                                src="/logo.jpeg"
                                alt="QFlow Logo"
                                className="h-11 w-11 rounded-full object-contain"
                            />
                            <div className="text-left">
                                <span className="font-extrabold text-[24px] tracking-tight leading-none">
                                    <span className="text-[#111]">Q</span><span className="text-[#E86A00]">Flow</span>
                                </span>
                                <p className="text-[12px] font-medium text-[#64748b] leading-none mt-0.5">
                                    Maritime Intelligence
                                </p>
                            </div>
                        </Link>
                        <h1 className="text-[22px] font-bold tracking-tight text-[#111]">{title}</h1>
                        {subtitle && <p className="text-[#64748b] text-[13px] mt-1">{subtitle}</p>}
                    </div>

                    {/* Card */}
                    <div className="bg-white border border-[#e2e8f0] shadow-sm p-6 sm:p-8">
                        {children}
                    </div>

                    {footer && (
                        <div className="text-center text-[12px] text-[#64748b] mt-5">
                            {footer}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1a2332] py-3 text-center text-[11px] text-[#4a6080] border-t border-[#111e2e]">
                <p>QFlow &mdash; Quantum-Inspired Fleet Optimization &bull; SIH26138</p>
            </div>
        </div>
    );
}
