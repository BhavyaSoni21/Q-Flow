import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/shared/StatusDot";
import {
    User,
    Building2,
    Save,
    CheckCircle2,
    AlertCircle,
    Shield,
    Ship,
    MapPin,
    Target,
    Phone,
    Mail,
    FileText,
    ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        full_name: "Capt. Ashutosh Amale",
        email: "fleet@qflow.app",
        role: "admin",
        company_name: "Oceanic Green Logistics India Pvt Ltd",
        imo_number: "IMO-9842103",
        fleet_size: "18 Active Vessels (Panamax, Aframax, Capesize)",
        home_port: "Jawaharlal Nehru Port (JNPA / INNSA)",
        sustainability_target: "IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)",
        contact_person: "Capt. Ashutosh Amale",
        phone: "+91 98200 12345",
    });

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const data = await api.getProfile();
                if (data && Object.keys(data).length > 0) {
                    setForm((prev) => ({
                        ...prev,
                        ...data,
                    }));
                }
            } catch (err) {
                console.warn("Could not load profile from API:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await api.updateProfile(form);
            if (res) {
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 4000);
            }
        } catch (err) {
            setError(err.message || "Failed to save profile changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 flex flex-col gap-6 max-w-[1200px] mx-auto font-['Inter',sans-serif]">
            {/* Header breadcrumb & title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e2e8f0] dark:border-[#1f2d3d]">
                <div className="flex items-center gap-3">
                    <Link
                        to="/dashboard"
                        className="h-9 w-9 rounded-md border border-[#e2e8f0] dark:border-[#334155] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <span>User Profile & Enterprise Settings</span>
                            <Badge tone="accent">{form.role.toUpperCase()}</Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage your personal credentials, organizational fleet parameters, and sustainability objectives.
                        </p>
                    </div>
                </div>
            </div>

            {savedNotice && (
                <div className="p-3.5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-xs rounded-md flex items-center gap-2.5 shadow-xs">
                    <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                    <span><strong>Profile Updated Successfully!</strong> All changes have been committed to SQLite database storage and will reflect across the entire Q-Flow dashboard.</span>
                </div>
            )}

            {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs rounded-md flex items-center gap-2.5 shadow-xs">
                    <AlertCircle size={18} className="text-red-600 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Section 1: Personal / Account Details */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                    <Panel title="Personal Credentials & Role">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8f0] dark:border-[#1f2d3d]">
                                <div className="h-14 w-14 rounded-full bg-[#0076a8]/10 text-[#0076a8] flex items-center justify-center font-bold text-xl border border-[#0076a8]/20 shrink-0">
                                    <User size={26} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-foreground truncate">{form.full_name}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{form.email}</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#0076a8]">
                                        <Shield size={12} />
                                        <span>Verified Maritime Operator</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Official Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Contact Phone / Mobile
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        System Authority Role
                                    </label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                    >
                                        <option value="admin">Administrator & Fleet Director</option>
                                        <option value="operator">Naval Architect / Fleet Operator</option>
                                        <option value="viewer">Regulatory Auditor / Viewer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Section 2: Enterprise & Maritime Fleet Parameters */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
                    <Panel title="Maritime Enterprise & Fleet Configuration">
                        <div className="flex flex-col gap-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Company / Enterprise Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.company_name}
                                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Company IMO / Registry Number
                                    </label>
                                    <input
                                        type="text"
                                        value={form.imo_number}
                                        onChange={(e) => setForm({ ...form, imo_number: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background font-mono focus:ring-1 focus:ring-[#0076a8]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Home Port / Primary Hub
                                    </label>
                                    <input
                                        type="text"
                                        value={form.home_port}
                                        onChange={(e) => setForm({ ...form, home_port: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                        Fleet Composition & Size
                                    </label>
                                    <input
                                        type="text"
                                        value={form.fleet_size}
                                        onChange={(e) => setForm({ ...form, fleet_size: e.target.value })}
                                        className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                    Decarbonization / ESG Target
                                </label>
                                <input
                                    type="text"
                                    value={form.sustainability_target}
                                    onChange={(e) => setForm({ ...form, sustainability_target: e.target.value })}
                                    className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                                    Official Designated Contact Person
                                </label>
                                <input
                                    type="text"
                                    value={form.contact_person}
                                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                    className="w-full text-xs border border-[#cbd5e1] dark:border-[#334155] rounded-md px-3 h-9 bg-background focus:ring-1 focus:ring-[#0076a8]"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#e2e8f0] dark:border-[#1f2d3d] mt-2">
                                <Link
                                    to="/dashboard"
                                    className="px-4 py-2 text-xs font-semibold rounded-md border border-[#cbd5e1] dark:border-[#334155] hover:bg-muted/40 transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-md bg-[#0076a8] hover:bg-[#005e86] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    <span>{saving ? "Saving Changes..." : "Save Profile & Fleet Details"}</span>
                                </button>
                            </div>
                        </div>
                    </Panel>
                </div>
            </form>
        </div>
    );
}
