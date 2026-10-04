import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function LandingHeader() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <header className="bg-white border-b border-[#C8DDEF] font-['Open_Sans',sans-serif] shadow-sm">
            <div className="max-w-[1280px] mx-auto px-6 h-[60px] flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 shrink-0">
                    <img
                        src="/logo.png"
                        alt="QFlow Logo"
                        className="h-9 w-9 rounded-full object-contain"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[20px] font-extrabold tracking-tight">
                            <span className="text-[#111]">Q</span><span className="text-[#E86A00]">Flow</span>
                        </span>
                        <span className="text-[11px] text-[#64748b] font-medium tracking-wide mt-0.5">
                            Maritime Intelligence
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-0">
                    {[
                        { to: "/", label: "Home" },
                        { to: "/features", label: "Features" },
                        { to: "/about", label: "About Us" },
                    ].map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                `text-[13px] font-semibold px-3.5 py-4 border-b-2 transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? "text-[#1264AB] border-[#1264AB]"
                                        : "border-transparent text-[#1E3A5A] hover:text-[#1264AB] hover:border-[#1264AB]"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}

                    <div className="ml-4 pl-4 border-l border-[#e2e8f0] flex items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                <span className="text-[12px] font-medium text-[#334155] bg-[#f1f5f9] px-3 py-1.5 border border-[#e2e8f0]">
                                    {user?.full_name || "Fleet Officer"}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-[12px] font-semibold px-3 py-1.5 bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors uppercase"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="text-[12px] font-bold px-4 py-1.5 bg-[#E86A00] text-white hover:bg-[#c45a00] transition-colors uppercase tracking-wide"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
