import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { NAV_ITEMS } from "@/lib/nav";
import { Menu, X } from "lucide-react";

export default function SiteHeader() {
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMenu = () => setMobileMenuOpen(false);

    return (
        <header className="bg-white dark:bg-[#111827] border-b border-[#e2e8f0] dark:border-[#374151] font-['Open_Sans',sans-serif] shrink-0 relative z-50">
            <div className="max-w-[1440px] mx-auto px-4 md:px-6 flex justify-between items-center h-[56px]">
                {/* Brand Area */}
                <Link to="/" className="flex items-center gap-3 shrink-0" onClick={closeMenu}>
                    <img
                        src="/logo.png"
                        alt="QFlow Logo"
                        className="h-8 w-8 rounded-full object-contain"
                        loading="lazy"
                        width="32"
                        height="32"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[18px] font-extrabold tracking-tight">
                            <span className="text-[#111] dark:text-white">Q</span><span className="text-[#E86A00]">Flow</span>
                        </span>
                        <span className="text-[10px] text-[#64748b] font-medium tracking-wide mt-0.5">
                            Maritime Intelligence
                        </span>
                    </div>
                </Link>

                {/* Mobile Hamburger Toggle */}
                <button
                    className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                    onClick={toggleMenu}
                    aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Pill Navigation - Desktop & Mobile Drawer */}
                <nav className={`
                    absolute md:static top-[56px] left-0 w-full md:w-auto bg-white dark:bg-[#111827] md:bg-transparent
                    border-b md:border-none border-[#e2e8f0] dark:border-[#374151]
                    flex-col md:flex-row items-start md:items-center p-4 md:p-0 gap-3 md:gap-1.5 lg:gap-2
                    ${mobileMenuOpen ? "flex shadow-lg md:shadow-none" : "hidden md:flex"}
                `}>
                    <NavLink
                        to="/"
                        end
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            `block w-full md:w-auto text-[12px] font-semibold px-3 py-2 md:py-1.5 rounded-[20px] transition-all duration-200 uppercase tracking-wide text-center ${
                                isActive
                                    ? "bg-[#0076a8] text-white shadow-sm"
                                    : "text-[#444] dark:text-[#d1d5db] hover:bg-[#0076a8] hover:text-white"
                            }`
                        }
                    >
                        HOME
                    </NavLink>

                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `block w-full md:w-auto text-[12px] font-semibold px-3 py-2 md:py-1.5 rounded-[20px] transition-all duration-200 uppercase tracking-wide text-center ${
                                    isActive
                                        ? "bg-[#0076a8] text-white shadow-sm"
                                        : "text-[#444] dark:text-[#d1d5db] hover:bg-[#0076a8] hover:text-white"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="w-full md:w-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-[#ddd] dark:border-[#374151] md:ml-2 md:pl-2">
                        {isAuthenticated ? (
                            <>
                                <span className="text-[11px] font-medium text-[#0076a8] dark:text-[#38bdf8] bg-[#e6f7ff] dark:bg-[#1e293b] px-2.5 py-1 rounded-[15px] border border-[#bae7ff]">
                                    {user?.full_name || "Fleet Officer"}
                                </span>
                                <button
                                    onClick={() => { logout(); closeMenu(); }}
                                    className="w-full md:w-auto text-[11px] font-semibold px-2.5 py-1.5 md:py-1 rounded-[15px] bg-red-600 text-white hover:bg-red-700 transition-colors uppercase"
                                >
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                onClick={closeMenu}
                                className="w-full md:w-auto text-center text-[12px] font-semibold px-3.5 py-2 md:py-1.5 rounded-[20px] bg-[#0076a8] text-white hover:bg-[#005e86] uppercase"
                            >
                                LOGIN
                            </Link>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}