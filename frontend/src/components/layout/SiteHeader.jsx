import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { NAV_ITEMS } from "@/lib/nav";

export default function SiteHeader() {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <header className="bg-white dark:bg-[#111827] border-b border-[#e2e8f0] dark:border-[#374151] font-['Open_Sans',sans-serif] shrink-0">
            <div className="max-w-[1440px] mx-auto px-6 flex justify-between items-center h-[56px]">
                {/* Brand Area */}
                <Link to="/" className="flex items-center gap-3 shrink-0">
                    <img
                        src="/assets/logo.png"
                        alt="QFlow Logo"
                        className="h-8 w-8 rounded-full object-contain"
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

                {/* Pill Navigation */}
                <nav className="flex items-center flex-wrap gap-1.5 md:gap-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `text-[12px] font-semibold px-3 py-1.5 rounded-[20px] transition-all duration-200 uppercase tracking-wide ${
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
                            className={({ isActive }) =>
                                `text-[12px] font-semibold px-3 py-1.5 rounded-[20px] transition-all duration-200 uppercase tracking-wide ${
                                    isActive
                                        ? "bg-[#0076a8] text-white shadow-sm"
                                        : "text-[#444] dark:text-[#d1d5db] hover:bg-[#0076a8] hover:text-white"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#ddd] dark:border-[#374151]">
                        {isAuthenticated ? (
                            <>
                                <span className="text-[11px] font-medium text-[#0076a8] dark:text-[#38bdf8] bg-[#e6f7ff] dark:bg-[#1e293b] px-2.5 py-1 rounded-[15px] border border-[#bae7ff]">
                                    {user?.full_name || "Demo Officer"}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-[11px] font-semibold px-2.5 py-1 rounded-[15px] bg-red-600 text-white hover:bg-red-700 transition-colors uppercase"
                                >
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="text-[12px] font-semibold px-3.5 py-1.5 rounded-[20px] bg-[#0076a8] text-white hover:bg-[#005e86] uppercase"
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