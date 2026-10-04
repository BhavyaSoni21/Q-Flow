import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
    BarChart3,
    TrendingUp,
    Leaf,
    Database,
    ChevronDown,
    ChevronUp,
    Menu,
    X,
    LogOut,
    User,
    LayoutDashboard,
    SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INSIGHTS_NAV = [
    { to: "/benchmarking", label: "BENCHMARKING", icon: BarChart3 },
    { to: "/prediction", label: "PREDICTION", icon: TrendingUp },
    { to: "/emissions", label: "EMISSIONS", icon: Leaf },
    { to: "/provenance", label: "DATA AND PROVENANCE", icon: Database },
];

export default function SiteHeader() {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [insightsOpen, setInsightsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Check if current route is inside Insights
    const isInsightsActive = INSIGHTS_NAV.some((item) => location.pathname === item.to);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setInsightsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setInsightsOpen(false);
        setMobileOpen(false);
    }, [location.pathname]);

    return (
        <header
            className="bg-white dark:bg-[#111827] border-b border-[#e2e8f0] dark:border-[#1f2d3d] font-['Inter',sans-serif] shrink-0 sticky top-0 z-50"
            style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
        >
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex justify-between items-center h-[60px]">
                {/* Brand Logo */}
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0 group" aria-label="QFlow Home">
                    <img
                        src="/logo.png"
                        alt="QFlow Logo"
                        className="h-8 w-8 rounded-full object-contain ring-2 ring-[#0076a8]/20 group-hover:ring-[#0076a8]/40 transition-all duration-200"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[17px] font-extrabold tracking-tight">
                            <span className="text-[#111] dark:text-white">Q</span>
                            <span className="text-[#E86A00]">Flow</span>
                        </span>
                        <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8] font-medium tracking-wide mt-0.5">
                            Maritime Intelligence
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1.5" aria-label="Main navigation">
                    {!isAuthenticated ? (
                        /* ΓöÇΓöÇ Public Visitor Navbar (Before Login) ΓöÇΓöÇ */
                        <>
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    cn(
                                        "text-[12px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-md transition-colors",
                                        isActive
                                            ? "text-[#0076a8] bg-[#e6f4fe]"
                                            : "text-[#334155] dark:text-[#cbd5e1] hover:text-[#0076a8] hover:bg-muted"
                                    )
                                }
                            >
                                Home
                            </NavLink>
                            <a
                                href="/#about"
                                className="text-[12px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-md text-[#334155] dark:text-[#cbd5e1] hover:text-[#0076a8] hover:bg-muted transition-colors"
                            >
                                About
                            </a>
                            <a
                                href="/#features"
                                className="text-[12px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-md text-[#334155] dark:text-[#cbd5e1] hover:text-[#0076a8] hover:bg-muted transition-colors"
                            >
                                Features
                            </a>
                            <div className="ml-3 pl-3 border-l border-[#e2e8f0]">
                                <Link
                                    to="/login"
                                    className="text-[12px] font-bold px-4 py-1.5 rounded-full bg-[#0076a8] text-white hover:bg-[#005e86] transition-colors shadow-xs uppercase tracking-wide"
                                >
                                    Login
                                </Link>
                            </div>
                        </>
                    ) : (
                        /* ΓöÇΓöÇ Authenticated Post-Login Navbar (Replicating Reference Image) ΓöÇΓöÇ */
                        <>
                            {/* 1. DASHBOARD */}
                            <NavLink
                                to="/dashboard"
                                end
                                className={({ isActive }) =>
                                    cn(
                                        "text-[12px] font-bold tracking-wider uppercase px-4 py-2 rounded-md transition-colors",
                                        isActive
                                            ? "bg-[#e6f4fe] text-[#0076a8]"
                                            : "text-[#334155] dark:text-[#cbd5e1] hover:text-[#0076a8] hover:bg-[#f1f5f9]"
                                    )
                                }
                            >
                                Dashboard
                            </NavLink>

                            {/* 2. SCENARIO */}
                            <NavLink
                                to="/scenario"
                                end
                                className={({ isActive }) =>
                                    cn(
                                        "text-[12px] font-bold tracking-wider uppercase px-4 py-2 rounded-md transition-colors",
                                        isActive
                                            ? "bg-[#e6f4fe] text-[#0076a8]"
                                            : "text-[#334155] dark:text-[#cbd5e1] hover:text-[#0076a8] hover:bg-[#f1f5f9]"
                                    )
                                }
                            >
                                Scenario
                            </NavLink>

                            {/* 3. INSIGHTS DROPDOWN (Matches Reference Image) */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setInsightsOpen((prev) => !prev)}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wider uppercase px-4 py-2 transition-all cursor-pointer",
                                        insightsOpen || isInsightsActive
                                            ? "bg-[#e6f4fe] text-[#0076a8] rounded-t-lg"
                                            : "text-[#334155] dark:text-[#cbd5e1] hover:text-[#0076a8] hover:bg-[#f1f5f9] rounded-md"
                                    )}
                                    aria-expanded={insightsOpen}
                                    aria-haspopup="true"
                                >
                                    <span>Insights</span>
                                    {insightsOpen ? (
                                        <ChevronUp size={15} className="text-[#0076a8] stroke-[2.5]" />
                                    ) : (
                                        <ChevronDown size={15} className="text-[#0076a8] stroke-[2.5]" />
                                    )}
                                </button>

                                {/* Dropdown Menu Panel (Exact Match to Reference Image) */}
                                {insightsOpen && (
                                    <div className="absolute top-full left-0 mt-0 min-w-[270px] bg-white border border-[#e2e8f0] shadow-2xl rounded-b-xl rounded-tr-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="flex flex-col py-1">
                                            {INSIGHTS_NAV.map((item, idx) => {
                                                const Icon = item.icon;
                                                const active = location.pathname === item.to;
                                                return (
                                                    <Link
                                                        key={item.to}
                                                        to={item.to}
                                                        onClick={() => setInsightsOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-3.5 px-4 py-3.5 border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f0f9ff] transition-colors group",
                                                            active ? "bg-[#f0f9ff]" : ""
                                                        )}
                                                    >
                                                        <Icon
                                                            size={20}
                                                            className="text-[#0284c7] group-hover:scale-110 transition-transform shrink-0"
                                                        />
                                                        <span
                                                            className={cn(
                                                                "text-[12px] font-bold tracking-wider uppercase transition-colors",
                                                                active
                                                                    ? "text-[#0284c7]"
                                                                    : "text-[#1e293b] group-hover:text-[#0284c7]"
                                                            )}
                                                        >
                                                            {item.label}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User & Logout Section */}
                            <div className="flex items-center gap-2.5 ml-4 pl-4 border-l border-[#e2e8f0] dark:border-[#334155]">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0076a8] dark:text-[#38bdf8] bg-[#e6f7ff] dark:bg-[#1e293b] px-3 py-1 rounded-full border border-[#bae7ff] dark:border-[#334155]">
                                    <User size={12} />
                                    {user?.full_name || "Fleet Officer"}
                                </span>
                                <button
                                    onClick={logout}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                                    aria-label="Logout"
                                >
                                    <LogOut size={11} />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </nav>

                {/* Mobile menu toggle */}
                <button
                    className="md:hidden p-2 rounded-lg text-[#555] dark:text-[#d1d5db] hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setMobileOpen((o) => !o)}
                    aria-label="Toggle navigation"
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Nav Drawer */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[#e2e8f0] dark:border-[#1f2d3d] bg-white dark:bg-[#111827] px-4 py-3 flex flex-col gap-1 fade-in">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/" className="text-xs font-bold uppercase tracking-wider py-2" onClick={() => setMobileOpen(false)}>
                                Home
                            </Link>
                            <a href="/#about" className="text-xs font-bold uppercase tracking-wider py-2" onClick={() => setMobileOpen(false)}>
                                About
                            </a>
                            <a href="/#features" className="text-xs font-bold uppercase tracking-wider py-2" onClick={() => setMobileOpen(false)}>
                                Features
                            </a>
                            <div className="pt-2 border-t mt-1">
                                <Link to="/login" className="inline-block text-xs font-bold px-4 py-2 bg-[#0076a8] text-white rounded-md" onClick={() => setMobileOpen(false)}>
                                    Login
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    cn("text-xs font-bold uppercase tracking-wider py-2 px-2 rounded", isActive ? "text-[#0076a8] bg-[#e6f4fe]" : "text-[#334155]")
                                }
                                onClick={() => setMobileOpen(false)}
                            >
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/scenario"
                                className={({ isActive }) =>
                                    cn("text-xs font-bold uppercase tracking-wider py-2 px-2 rounded", isActive ? "text-[#0076a8] bg-[#e6f4fe]" : "text-[#334155]")
                                }
                                onClick={() => setMobileOpen(false)}
                            >
                                Scenario
                            </NavLink>

                            <div className="py-2 border-t border-b my-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-1">
                                    Insights
                                </span>
                                {INSIGHTS_NAV.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            className={({ isActive }) =>
                                                cn(
                                                    "flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider py-2 px-2 rounded",
                                                    isActive ? "text-[#0284c7] bg-[#f0f9ff]" : "text-[#334155]"
                                                )
                                            }
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <Icon size={16} className="text-[#0284c7]" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <span className="text-xs text-[#0076a8] font-medium">{user?.full_name || "Fleet Officer"}</span>
                                <button onClick={logout} className="text-xs font-bold text-red-600 hover:text-red-700">Logout</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
