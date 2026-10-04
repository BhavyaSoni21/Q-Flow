import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User as UserIcon, Save, Shield, CheckCircle2, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [form, setForm] = useState({
        full_name: "Capt. Ashutosh Amale",
        email: user?.email || "fleet@qflow.app",
        phone: "+91 98200 12345",
        role: "admin",
        company_name: "Oceanic Green Logistics India Pvt Ltd",
        imo_number: "IMO-9842183",
        home_port: "Jawaharlal Nehru Port (JNPA / INNSA)",
        fleet_size: "18 Active Vessels (Panamax, Aframax, Capesize)",
        sustainability_target: "IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)",
        contact_person: "Capt. Ashutosh Amale",
    });

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast({
                title: "Profile & Fleet Details Saved",
                description: "Your enterprise settings have been successfully updated.",
            });
            navigate("/");
        }, 800);
    };

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-[#F8FAFC] pb-32 font-['Open_Sans',sans-serif]">
            
            {/* Page Header */}
            <div className="bg-white border-b border-[#E2E8F0] mb-8">
                <div className="max-w-[1200px] mx-auto px-6 py-8">
                    <div className="flex items-center gap-4 mb-2">
                        <button type="button" onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] transition-colors">
                            <ArrowLeft size={16} />
                        </button>
                        <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A]">User Profile & Enterprise Settings</h1>
                        <span className="px-2.5 py-0.5 bg-[#E0F2FE] text-[#0369A1] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#BAE6FD]">
                            ADMIN
                        </span>
                    </div>
                    <p className="text-[14px] text-[#475569] ml-12">
                        Manage your personal credentials, organizational fleet parameters, and sustainability objectives.
                    </p>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT COLUMN: PERSONAL CREDENTIALS */}
                    <div className="w-full lg:w-[40%] flex flex-col gap-6">
                        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4">
                                <h2 className="text-[14px] font-bold text-[#0F172A] uppercase tracking-wide">Personal Credentials & Role</h2>
                            </div>
                            
                            <div className="p-6">
                                {/* Avatar Block */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#0076a8] flex flex-col items-center justify-center shrink-0">
                                        <UserIcon size={24} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-[16px] font-bold text-[#0F172A] leading-tight">{form.full_name}</h3>
                                        <p className="text-[13px] text-[#64748B] mt-0.5">{form.email}</p>
                                        <div className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0] w-fit">
                                            <Shield size={12} /> Verified Maritime Operator
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="flex flex-col gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Official Email Address</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-[#F8FAFC] cursor-not-allowed focus:outline-none"
                                            required
                                            disabled
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Contact Phone / Mobile</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">System Authority Role</label>
                                        <select
                                            value={form.role}
                                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all cursor-pointer"
                                        >
                                            <option value="admin">Administrator & Fleet Director</option>
                                            <option value="operator">Naval Architect / Fleet Operator</option>
                                            <option value="viewer">Regulatory Auditor / Viewer</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ENTERPRISE CONFIGURATION */}
                    <div className="w-full lg:w-[60%] flex flex-col gap-6">
                        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden h-full">
                            <div className="bg-[#0F172A] px-6 py-4">
                                <h2 className="text-[14px] font-bold text-white uppercase tracking-wide">Maritime Enterprise & Fleet Configuration</h2>
                            </div>

                            <div className="p-6 flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Company / Enterprise Name</label>
                                        <input
                                            type="text"
                                            value={form.company_name}
                                            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Company IMO / Registry Number</label>
                                        <input
                                            type="text"
                                            value={form.imo_number}
                                            onChange={(e) => setForm({ ...form, imo_number: e.target.value })}
                                            className="w-full text-[13px] font-mono font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Home Port / Primary Hub</label>
                                        <input
                                            type="text"
                                            value={form.home_port}
                                            onChange={(e) => setForm({ ...form, home_port: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Fleet Composition & Size</label>
                                        <input
                                            type="text"
                                            value={form.fleet_size}
                                            onChange={(e) => setForm({ ...form, fleet_size: e.target.value })}
                                            className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Decarbonization / ESG Target</label>
                                    <input
                                        type="text"
                                        value={form.sustainability_target}
                                        onChange={(e) => setForm({ ...form, sustainability_target: e.target.value })}
                                        className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-[#64748B] tracking-wider">Official Designated Contact Person</label>
                                    <input
                                        type="text"
                                        value={form.contact_person}
                                        onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                                        className="w-full text-[13px] font-medium text-[#0F172A] border border-[#CBD5E1] rounded-md px-3 h-10 bg-white focus:outline-none focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8]/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-[#10B981]" />
                        <span className="text-[14px] font-bold text-[#0F172A]">All settings are valid</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button type="button" onClick={() => navigate("/")} className="flex-1 sm:flex-none text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2">
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={saving}
                            className={cn(
                                "flex-[2] sm:flex-none text-[14px] font-bold px-8 py-2.5 rounded-md transition-all flex items-center justify-center gap-2 shadow-sm",
                                !saving ? "bg-[#0076a8] hover:bg-[#005e86] text-white" : "bg-[#CBD5E1] text-[#94A3B8] cursor-not-allowed"
                            )}
                        >
                            {saving ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                            ) : (
                                <>Save Profile Details <Save size={15} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
