import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function LandingHeader() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <header className="bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] font-['Open_Sans',sans-serif] shadow-sm sticky top-0 z-50 transition-all">
            <div className="max-w-[1440px] mx-auto px-6 h-[64px] flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 shrink-0 group">
                    <img
                        src="/logo.png"
                        alt="QFlow Logo"
                        className="h-9 w-9 object-contain"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[20px] font-extrabold tracking-tight text-[#0F172A] group-hover:text-[#0076a8] transition-colors">
                            Q<span className="text-[#E86A00]">Flow</span>
                        </span>
                        <span className="text-[10px] text-[#64748b] font-semibold tracking-widest uppercase mt-0.5">
                            Maritime Intelligence
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-2">
                    {[
                        { to: "/", label: "Home" },
                        { to: "/features", label: "Features" },
                        { to: "/about", label: "About Us" },
                    ].map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                `text-[13px] font-semibold px-4 py-2 rounded-md transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? "text-[#0076a8] bg-[#F0F9FF]"
                                        : "text-[#334155] hover:text-[#0076a8] hover:bg-[#F1F5F9]"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="ml-4 pl-4 border-l border-[#E2E8F0] flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <span className="text-[12px] font-semibold text-[#0076a8] bg-[#F0F9FF] px-3 py-1.5 rounded-md border border-[#B9E6FE]">
                                    {user?.full_name || "Fleet Officer"}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-[12px] font-semibold px-4 py-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0] transition-all"
                                >
                                    Log Out
                                </button>
                                <Link
                                    to="/scenario"
                                    className="text-[12px] font-bold px-4 py-1.5 rounded-md bg-[#0076a8] text-white hover:bg-[#005e86] shadow-sm transition-all"
                                >
                                    Dashboard
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="text-[12px] font-bold px-5 py-2 rounded-md bg-[#0076a8] text-white hover:bg-[#005e86] shadow-sm hover:shadow transition-all tracking-wide"
                            >
                                Secure Login
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Mobile placeholder */}
                <div className="md:hidden flex items-center gap-3">
                    {isAuthenticated ? (
                        <Link to="/scenario" className="text-[12px] font-bold px-4 py-1.5 rounded-md bg-[#0076a8] text-white hover:bg-[#005e86]">
                            Dashboard
                        </Link>
                    ) : (
                        <Link to="/login" className="text-[12px] font-bold px-4 py-1.5 rounded-md bg-[#0076a8] text-white hover:bg-[#005e86]">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
