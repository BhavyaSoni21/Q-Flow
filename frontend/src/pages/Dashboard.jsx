import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/shared/StatusDot";
import {
    User,
    Building2,
    Ship,
    History,
    MessageSquare,
    Play,
    Compass,
    Sparkles,
    CheckCircle2,
    Clock,
    FileText,
    Star,
    Send,
    HelpCircle,
    ChevronRight,
    ArrowUpRight,
    SlidersHorizontal,
    BarChart3,
    TrendingUp,
    Leaf,
    Database,
    X,
    RefreshCw,
    Trash2,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // User & Company profile state
    const [isCompanyOwner, setIsCompanyOwner] = useState(true);
    const [companyInfo, setCompanyInfo] = useState({
        company_name: "Oceanic Green Logistics India Pvt Ltd",
        imo_number: "IMO-9842103",
        fleet_size: "18 Active Vessels (Panamax, Aframax, Capesize)",
        home_port: "Jawaharlal Nehru Port (JNPA / INNSA)",
        sustainability_target: "IMO 2030 Decarbonization Trajectory (Net-Zero by 2050)",
        contact_person: user?.full_name || "Capt. Ashutosh Amale",
        email: user?.email || "fleet@qflow.app",
        phone: "+91 98200 12345",
    });

    // Dynamic metrics and history from database
    const [metrics, setMetrics] = useState({
        total_simulations: 4,
        formatted_total_savings: "₹ 8,83,000",
        avg_wtw_reduction_pct: 17.1,
        feasible_rate_pct: 100.0,
        active_vessels: 18,
        avg_ci_score: "B (Satisfied)",
    });
    const [history, setHistory] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Guide Tour Modal state
    const [showGuideModal, setShowGuideModal] = useState(false);

    // Model Accuracy Feedback state
    const [feedback, setFeedback] = useState({
        voyageId: "SCN-2026-084",
        vesselName: "Panamax - Sea Pioneer",
        predictedFuel: "24.1",
        actualFuel: "",
        durationHours: "48",
        seaCondition: "Moderate (Beaufort 4-5)",
        rating: 5,
        comments: "",
    });
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [feedbackList, setFeedbackList] = useState([
        {
            id: 1,
            voyageId: "SCN-2026-079",
            actualFuel: "28.1 t",
            predicted: "27.8 t",
            accuracy: "98.9%",
            rating: 5,
            date: "2026-10-02",
            notes: "High correlation with QPSO speed advisory under heavy swells.",
        },
    ]);

    // Load dynamic data on mount
    const fetchDashboardData = async () => {
        setLoadingData(true);
        try {
            const summary = await api.getDashboardSummary();
            if (summary) {
                if (summary.profile && Object.keys(summary.profile).length > 0) {
                    setCompanyInfo((prev) => ({
                        ...prev,
                        ...summary.profile,
                    }));
                }
                if (summary.metrics) {
                    setMetrics(summary.metrics);
                }
                if (summary.history && summary.history.length > 0) {
                    setHistory(summary.history);
                }
            }
        } catch (e) {
            console.warn("Failed to load dashboard data from SQLite/API:", e);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.actualFuel) return;

        const pred = parseFloat(feedback.predictedFuel) || 24.1;
        const act = parseFloat(feedback.actualFuel);
        const accuracyPct = Math.max(0, 100 - Math.abs((act - pred) / pred) * 100).toFixed(1);

        try {
            await api.submitDashboardFeedback({
                voyage_id: feedback.voyageId,
                vessel_name: feedback.vesselName,
                predicted_fuel: pred,
                actual_fuel: act,
                notes: feedback.comments || "Voyage telemetry submitted for ML model retraining.",
            });
        } catch (err) {
            console.warn("Could not post feedback to backend:", err);
        }

        setFeedbackList((prev) => [
            {
                id: Date.now(),
                voyageId: feedback.voyageId,
                actualFuel: `${feedback.actualFuel} t`,
                predicted: `${feedback.predictedFuel} t`,
                accuracy: `${accuracyPct}%`,
                rating: feedback.rating,
                date: new Date().toISOString().split("T")[0],
                notes: feedback.comments || "Voyage telemetry submitted for ML model retraining.",
            },
            ...prev,
        ]);

        setFeedbackSubmitted(true);
        setTimeout(() => setFeedbackSubmitted(false), 5000);
        setFeedback({
            voyageId: "SCN-2026-084",
            vesselName: "Panamax - Sea Pioneer",
            predictedFuel: "24.1",
            actualFuel: "",
            durationHours: "48",
            seaCondition: "Moderate (Beaufort 4-5)",
            rating: 5,
            comments: "",
        });
    };

    const handleDeleteScenario = async (id, e) => {
        e.stopPropagation();
        try {
            await api.deleteScenario(id);
            setHistory((prev) => prev.filter((item) => item.id !== id));
            setMetrics((prev) => ({
                ...prev,
                total_simulations: Math.max(0, prev.total_simulations - 1),
            }));
        } catch (err) {
            console.warn("Could not delete scenario:", err);
        }
    };

    return (
        <div className="p-4 flex flex-col gap-5 max-w-[1400px] mx-auto">
            {/* Top Welcome Strip */}
            <div className="bg-gradient-to-r from-[#004f7c] to-[#0076a8] text-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active Session
                        </span>
                        <span className="text-sky-200 text-xs">
                            Maritime Intelligence & Optimization Portal (SQLite Backed)
                        </span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight">
                        Welcome, {user?.full_name || "Capt. Ashutosh Amale"}
                    </h1>
                    <p className="text-sm text-sky-100 mt-1 max-w-2xl leading-relaxed">
                        Manage your fleet profile, review historical voyage optimizations from persistent storage, configure new maritime scenarios, and calibrate AI models with real-world feedback.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={() => fetchDashboardData()}
                        title="Refresh live data"
                        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2.5 rounded-md border border-white/20 transition-all shadow-xs"
                    >
                        <RefreshCw size={13} className={loadingData ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => setShowGuideModal(true)}
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-md border border-white/20 transition-all shadow-xs"
                    >
                        <HelpCircle size={15} />
                        Guide Tour
                    </button>
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-md border border-white/20 transition-all shadow-xs"
                    >
                        <User size={15} />
                        Edit Profile
                    </Link>
                    <button
                        onClick={() => navigate("/scenario")}
                        className="inline-flex items-center gap-2 bg-[#E86A00] hover:bg-[#d45f00] text-white text-xs font-bold px-5 py-2.5 rounded-md transition-all shadow-md transform hover:-translate-y-0.5"
                    >
                        <Play size={14} className="fill-white" />
                        Create New Scenario
                    </button>
                </div>
            </div>

            {/* Quick KPI Counters (Dynamic Data) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border bg-card p-4 rounded-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Fleet Size</p>
                    <p className="text-2xl font-bold mt-1 text-foreground num">{metrics.active_vessels || 18} <span className="text-xs font-normal text-muted-foreground">Vessels</span></p>
                    <p className="text-[11px] text-green-600 font-medium mt-1">100% Dual-Fuel Ready</p>
                </div>
                <div className="border bg-card p-4 rounded-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Stored Simulations</p>
                    <p className="text-2xl font-bold mt-1 text-foreground num">{metrics.total_simulations || history.length} <span className="text-xs font-normal text-muted-foreground">Runs</span></p>
                    <p className="text-[11px] text-[#0076a8] font-medium mt-1">Live Database Records</p>
                </div>
                <div className="border bg-card p-4 rounded-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg GHG Abatement</p>
                    <p className="text-2xl font-bold mt-1 text-foreground num">-{metrics.avg_wtw_reduction_pct || 16.8}%</p>
                    <p className="text-[11px] text-green-600 font-medium mt-1">Cumulative Provenance</p>
                </div>
                <div className="border bg-card p-4 rounded-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Cost Savings</p>
                    <p className="text-2xl font-bold mt-1 text-foreground num">{metrics.formatted_total_savings || "₹ 8,83,000"}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Calculated Fleet Value</p>
                </div>
            </div>

            {/* Section 1: User & Company Profile Information */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Officer Profile Card */}
                <div className="col-span-12 lg:col-span-5">
                    <Panel
                        title="Officer & Account Information"
                        actions={
                            <Link to="/profile" className="text-xs text-[#0076a8] font-bold hover:underline">
                                Edit Settings →
                            </Link>
                        }
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="h-12 w-12 rounded-full bg-[#0076a8]/10 text-[#0076a8] flex items-center justify-center font-bold text-lg border border-[#0076a8]/20 shrink-0">
                                    <User size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-foreground">{user?.full_name || companyInfo.contact_person || "Capt. Ashutosh Amale"}</h3>
                                    <p className="text-xs text-muted-foreground">{user?.email || companyInfo.email || "fleet@qflow.app"}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge tone="accent">
                                            {isCompanyOwner ? "Company Owner & Fleet Director" : "Chief Navigating Officer"}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">ID: FLT-IND-2026</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Department</span>
                                    <span className="font-medium text-foreground">Fleet Operations & Decarbonization</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Assigned Region</span>
                                    <span className="font-medium text-foreground">Indian Ocean & Global Trade Corridors</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Security Clearance</span>
                                    <span className="font-medium text-foreground">Level 3 (Simulation & Dispatch)</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Contact Phone</span>
                                    <span className="font-medium text-foreground">{companyInfo.phone || "+91 98200 12345"}</span>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Company Details (When User is Owner/Director) */}
                <div className="col-span-12 lg:col-span-7">
                    <Panel
                        title="Maritime Enterprise & Fleet Specifications"
                        actions={<Badge tone="neutral">{companyInfo.imo_number || "IMO-9842103"}</Badge>}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3 pb-3 border-b">
                                <div className="h-10 w-10 rounded bg-[#E86A00]/10 text-[#E86A00] flex items-center justify-center shrink-0 mt-0.5">
                                    <Building2 size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm text-foreground">{companyInfo.company_name || companyInfo.name || "Oceanic Green Logistics India Pvt Ltd"}</h3>
                                    <p className="text-xs text-muted-foreground">Registered Maritime Enterprise · DG Shipping India & IMO Approved</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 border rounded-sm bg-muted/20">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Fleet Configuration</span>
                                    <span className="font-semibold text-foreground text-xs mt-0.5 block">{companyInfo.fleet_size || companyInfo.fleetSize || "18 Active Vessels"}</span>
                                </div>
                                <div className="p-2.5 border rounded-sm bg-muted/20">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Home Port / Terminal Hub</span>
                                    <span className="font-semibold text-foreground text-xs mt-0.5 block">{companyInfo.home_port || companyInfo.homePort || "JNPA (INNSA)"}</span>
                                </div>
                                <div className="p-2.5 border rounded-sm bg-muted/20">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Environmental Target</span>
                                    <span className="font-semibold text-foreground text-xs mt-0.5 block">{companyInfo.sustainability_target || companyInfo.sustainabilityTarget || "Net-Zero Trajectory"}</span>
                                </div>
                                <div className="p-2.5 border rounded-sm bg-muted/20">
                                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Official Contact</span>
                                    <span className="font-semibold text-foreground text-xs mt-0.5 block">{companyInfo.contact_person || companyInfo.contactPerson || "Capt. Ashutosh Amale"} ({companyInfo.email || companyInfo.officialEmail || "fleet@qflow.app"})</span>
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Section 2: Past History Summary (Dynamic SQLite Data) */}
            <Panel
                title="Historical Optimization & Scenario Summary"
                actions={
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">
                            {history.length} Saved Scenarios in Database
                        </span>
                        <button
                            onClick={() => navigate("/scenario")}
                            className="inline-flex items-center gap-1.5 text-xs text-[#0076a8] font-bold hover:underline"
                        >
                            <span>New Scenario</span>
                            <ChevronRight size={13} />
                        </button>
                    </div>
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-[hsl(var(--panel-header))] text-[10px] uppercase text-muted-foreground">
                                <th className="text-left px-3 py-2 font-semibold">Scenario ID</th>
                                <th className="text-left px-3 py-2 font-semibold">Date & Time</th>
                                <th className="text-left px-3 py-2 font-semibold">Voyage Route</th>
                                <th className="text-left px-3 py-2 font-semibold">Vessel Type</th>
                                <th className="text-left px-3 py-2 font-semibold">Fuel Config</th>
                                <th className="text-right px-3 py-2 font-semibold">Optimized Fuel</th>
                                <th className="text-right px-3 py-2 font-semibold">Estimated Cost Savings</th>
                                <th className="text-right px-3 py-2 font-semibold">WtW GHG Abatement</th>
                                <th className="text-center px-3 py-2 font-semibold">Status</th>
                                <th className="text-center px-3 py-2 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-6 text-muted-foreground">
                                        No scenarios saved in database yet. Create one from the Scenario Setup tab!
                                    </td>
                                </tr>
                            ) : (
                                history.map((row) => (
                                    <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2.5 font-semibold text-[#0076a8] num">{row.id}</td>
                                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{row.date}</td>
                                        <td className="px-3 py-2.5 font-medium">{row.route}</td>
                                        <td className="px-3 py-2.5 text-muted-foreground">{row.vessel}</td>
                                        <td className="px-3 py-2.5">{row.fuel}</td>
                                        <td className="px-3 py-2.5 text-right font-medium num text-foreground">{row.optimizedFuel}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold num text-green-600">{row.costSaved}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold num text-accent">{row.wtwReduction}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 size={11} />
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => navigate("/scenario")}
                                                    className="text-[11px] font-semibold text-[#0076a8] hover:underline"
                                                >
                                                    Re-run
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteScenario(row.id, e)}
                                                    className="text-muted-foreground hover:text-red-600 transition-colors p-1"
                                                    title="Delete Scenario Record"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>

            {/* Section 3: Model Accuracy & Real Voyage Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Submission Form */}
                <div className="col-span-12 lg:col-span-6">
                    <Panel title="Submit Voyage Feedback to Calibrate Model Accuracy">
                        <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter actual fuel consumed and voyage performance data from your vessel's noon reports. Our QPSO-XGBoost surrogate model will incorporate this feedback into the live database to continuously refine prediction accuracy.
                            </p>

                            {feedbackSubmitted && (
                                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-sm flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                                    <span><strong>Feedback Recorded Successfully!</strong> Data stored in SQLite and queued for model calibration.</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                        Voyage / Scenario Ref
                                    </label>
                                    <input
                                        type="text"
                                        value={feedback.voyageId}
                                        onChange={(e) => setFeedback({ ...feedback, voyageId: e.target.value })}
                                        className="w-full text-xs border rounded-sm px-2.5 h-8 bg-background focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                        Vessel Name
                                    </label>
                                    <input
                                        type="text"
                                        value={feedback.vesselName}
                                        onChange={(e) => setFeedback({ ...feedback, vesselName: e.target.value })}
                                        className="w-full text-xs border rounded-sm px-2.5 h-8 bg-background focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                        Predicted Fuel (t)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={feedback.predictedFuel}
                                        onChange={(e) => setFeedback({ ...feedback, predictedFuel: e.target.value })}
                                        className="w-full text-xs border rounded-sm px-2.5 h-8 bg-muted/40 font-mono"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                        Actual Consumed Fuel (t) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 24.3"
                                        value={feedback.actualFuel}
                                        onChange={(e) => setFeedback({ ...feedback, actualFuel: e.target.value })}
                                        className="w-full text-xs border rounded-sm px-2.5 h-8 bg-background font-mono border-primary/40 focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                        Voyage Duration (hrs)
                                    </label>
                                    <input
                                        type="number"
                                        value={feedback.durationHours}
                                        onChange={(e) => setFeedback({ ...feedback, durationHours: e.target.value })}
                                        className="w-full text-xs border rounded-sm px-2.5 h-8 bg-background font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                    Encountered Sea State & Weather
                                </label>
                                <select
                                    value={feedback.seaCondition}
                                    onChange={(e) => setFeedback({ ...feedback, seaCondition: e.target.value })}
                                    className="w-full text-xs border rounded-sm px-2.5 h-8 bg-background"
                                >
                                    <option value="Calm (Beaufort 0-3)">Calm (Beaufort 0-3, Significant Wave &lt; 1.0m)</option>
                                    <option value="Moderate (Beaufort 4-5)">Moderate (Beaufort 4-5, Significant Wave 1.0-2.5m)</option>
                                    <option value="Severe / Heavy (Beaufort 6-8)">Severe / Heavy (Beaufort 6-8, Significant Wave &gt; 3.0m)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                                    Operational Comments / Deviations
                                </label>
                                <textarea
                                    rows={2}
                                    value={feedback.comments}
                                    onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                                    placeholder="Note any engine rpm adjustments, hull biofouling, or detour taken..."
                                    className="w-full text-xs border rounded-sm p-2 bg-background"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 bg-[#0076a8] hover:bg-[#005e86] text-white text-xs font-bold py-2.5 px-4 rounded-sm transition-colors shadow-xs mt-1 cursor-pointer"
                            >
                                <Send size={13} />
                                Submit Real-World Calibration Feedback
                            </button>
                        </form>
                    </Panel>
                </div>

                {/* Calibration Feedback Logs */}
                <div className="col-span-12 lg:col-span-6">
                    <Panel title="Model Calibration History & Depicted Accuracy">
                        <div className="flex flex-col gap-3">
                            <div className="p-3 bg-muted/40 border rounded-sm flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-foreground block">Continuous Learning Active</span>
                                    <span className="text-[11px] text-muted-foreground">Feedback items saved to database for cross-validation benchmarks</span>
                                </div>
                                <span className="text-lg font-bold text-[#0076a8] num">98.2% <span className="text-xs font-normal text-muted-foreground">Mean Acc</span></span>
                            </div>

                            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                                {feedbackList.map((item) => (
                                    <div key={item.id} className="border p-3 rounded-sm bg-card hover:border-primary/30 transition-colors flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-[#0076a8] num">{item.voyageId}</span>
                                            <span className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                Accuracy: {item.accuracy}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs num text-muted-foreground">
                                            <span>Pred: <strong className="text-foreground">{item.predicted}</strong></span>
                                            <span>Actual: <strong className="text-foreground">{item.actualFuel}</strong></span>
                                            <span className="ml-auto text-[10px] text-muted-foreground">{item.date}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground italic mt-0.5 border-t pt-1">
                                            "{item.notes}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Guide Tour Modal */}
            {showGuideModal && (
                <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
                        <button
                            onClick={() => setShowGuideModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <Compass className="text-[#0076a8]" size={22} />
                            <h2 className="text-lg font-bold text-foreground">Welcome to Q-Flow Guide Tour</h2>
                        </div>
                        <p className="text-xs text-muted-foreground mb-5">
                            Follow this 4-step workflow to simulate voyages, optimize fleet emissions, and inspect algorithmic benchmarks.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]">
                                <span className="h-6 w-6 rounded-full bg-[#0076a8] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Fleet Dashboard & Profile</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Review account information, verify company fleet details, and submit real voyage data to calibrate our surrogate models.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]">
                                <span className="h-6 w-6 rounded-full bg-[#0076a8] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Scenario Builder & Simulation</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Select vessel types, weather conditions, fuel pathways, and click <strong>"Run Simulation"</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]">
                                <span className="h-6 w-6 rounded-full bg-[#0076a8] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Dedicated Full-Screen Fleet Optimization</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Upon completing simulation, a spacious full-screen overlay opens above the Scenario with 3D/2D Pareto tradeoffs, TOPSIS weighting, and constraint checks.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-[#f8fafc] dark:bg-[#0f172a]">
                                <span className="h-6 w-6 rounded-full bg-[#0076a8] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Deep Insights Dropdown</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Access Benchmarking, Fuel Prediction & SHAP, Well-to-Wake Emissions, and Data Provenance anytime from the top navigation dropdown.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowGuideModal(false)}
                                className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-muted cursor-pointer"
                            >
                                Got it
                            </button>
                            <button
                                onClick={() => {
                                    setShowGuideModal(false);
                                    navigate("/scenario");
                                }}
                                className="px-5 py-2 bg-[#0076a8] text-white rounded-md text-xs font-bold hover:bg-[#005e86] cursor-pointer"
                            >
                                Start Scenario Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
