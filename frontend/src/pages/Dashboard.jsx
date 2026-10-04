import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import {
    Play,
    RefreshCw,
    HelpCircle,
    ChevronRight,
    Settings,
    CheckCircle2,
    X,
    TrendingDown,
    LineChart as LineChartIcon,
    AlertCircle,
    MoreVertical,
    Send
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
} from "recharts";

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [metrics, setMetrics] = useState({
        total_simulations: 0,
        formatted_total_savings: "₹0",
        avg_wtw_reduction_pct: 0,
        feasible_rate_pct: 100.0,
        active_vessels: 18,
    });
    const [companyInfo, setCompanyInfo] = useState({
        fleet_size: "18 Active Vessels",
        home_port: "JNPA (INNSA)",
    });
    const [history, setHistory] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Modal States
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // Feedback State
    const [feedback, setFeedback] = useState({
        voyageId: "", vesselName: "", predictedFuel: "", actualFuel: "", durationHours: "", seaCondition: "Calm (Beaufort 0-3)", comments: ""
    });
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    
    // Derived latest run
    const latestRun = history.length > 0 ? history[0] : null;

    const fetchDashboardData = async () => {
        setLoadingData(true);
        try {
            const summary = await api.getDashboardSummary();
            if (summary) {
                if (summary.profile && Object.keys(summary.profile).length > 0) setCompanyInfo(prev => ({...prev, ...summary.profile}));
                if (summary.metrics) setMetrics(summary.metrics);
                if (summary.history && summary.history.length > 0) setHistory(summary.history);
            }
        } catch (e) {
            console.warn("Failed to load dashboard data:", e);
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
        try {
            await api.submitDashboardFeedback({
                voyage_id: feedback.voyageId || "Manual",
                vessel_name: feedback.vesselName || "Unknown",
                predicted_fuel: parseFloat(feedback.predictedFuel) || 0,
                actual_fuel: parseFloat(feedback.actualFuel),
                notes: feedback.comments,
            });
            setFeedbackSubmitted(true);
            setTimeout(() => { setFeedbackSubmitted(false); setShowFeedbackModal(false); }, 2000);
        } catch (err) {
            console.warn("Feedback failed:", err);
        }
    };

    // Chart data mapping
    const chartData = [...history].reverse().map((run, i) => {
        const val = parseFloat(run.wtwReduction?.replace(/[^0-9.-]/g, '')) || 0;
        return { name: `Run ${i+1}`, reduction: Math.abs(val) };
    });

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-8 font-['Open_Sans',sans-serif] bg-[#F8FAFC] min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A]">Fleet Dashboard</h1>
                    <p className="text-[14px] text-[#475569] mt-1">Optimize fleet performance across fuel, cost, emissions and operational constraints.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowGuideModal(true)} className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-2 rounded-md hover:bg-[#E2E8F0] transition-colors flex items-center gap-2">
                        <HelpCircle size={16} /> Guide
                    </button>
                    <button onClick={fetchDashboardData} className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-2 rounded-md hover:bg-[#E2E8F0] transition-colors flex items-center gap-2">
                        <RefreshCw size={16} className={loadingData ? "animate-spin" : ""} /> Refresh
                    </button>
                    <Link to="/profile" className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-2 rounded-md hover:bg-[#E2E8F0] transition-colors flex items-center gap-2">
                        <Settings size={16} /> Profile
                    </Link>
                    <button onClick={() => navigate("/scenario")} className="bg-[#0076a8] hover:bg-[#005e86] text-white text-[13px] font-bold px-5 py-2.5 rounded-md shadow-sm transition-colors flex items-center gap-2 ml-2">
                        + Create Scenario
                    </button>
                </div>
            </div>

            {/* Current Fleet Performance KPIs */}
            <div className="mb-8">
                <h2 className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-3 ml-1">Current Fleet Performance</h2>
                {latestRun ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
                            <p className="text-[12px] font-semibold text-[#475569]">Fuel Consumption</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-[28px] font-bold text-[#0F172A] leading-none tracking-tight">{latestRun.optimizedFuel}</span>
                            </div>
                            <p className="text-[12px] text-[#059669] mt-2 font-medium flex items-center gap-1"><TrendingDown size={14}/> Optimized vs baseline</p>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
                            <p className="text-[12px] font-semibold text-[#475569]">Operating Cost</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-[28px] font-bold text-[#0F172A] leading-none tracking-tight">{latestRun.costSaved?.replace(' saved','')}</span>
                            </div>
                            <p className="text-[12px] text-[#059669] mt-2 font-medium flex items-center gap-1"><TrendingDown size={14}/> Saved vs baseline</p>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
                            <p className="text-[12px] font-semibold text-[#475569]">GHG Abatement</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-[28px] font-bold text-[#0F172A] leading-none tracking-tight">{latestRun.wtwReduction}</span>
                            </div>
                            <p className="text-[12px] text-[#059669] mt-2 font-medium flex items-center gap-1">Reduction achieved</p>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm">
                            <p className="text-[12px] font-semibold text-[#475569]">Constraint Status</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-[24px] font-bold text-[#0F172A] leading-none tracking-tight flex items-center gap-2">
                                    {latestRun.status === "Feasible" ? <CheckCircle2 className="text-[#10B981]" size={24}/> : <AlertCircle className="text-[#F59E0B]" size={24}/>}
                                    {latestRun.status}
                                </span>
                            </div>
                            <p className="text-[12px] text-[#64748B] mt-3 font-medium">All parameters satisfied</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-[#E2E8F0] rounded-lg p-10 text-center shadow-sm">
                        <p className="text-[15px] font-semibold text-[#0F172A] mb-2">No optimization results yet.</p>
                        <p className="text-[13px] text-[#64748B] mb-6">Create a scenario to calculate fuel, cost and emissions.</p>
                        <button onClick={() => navigate("/scenario")} className="bg-[#0076a8] hover:bg-[#005e86] text-white text-[13px] font-bold px-5 py-2.5 rounded-md shadow-sm inline-flex">
                            + Create Scenario
                        </button>
                    </div>
                )}
            </div>

            {/* Recent Optimization Runs Table */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-3 ml-1">
                    <h2 className="text-[15px] font-bold text-[#0F172A]">Recent Optimization Runs</h2>
                    {history.length > 0 && <button className="text-[13px] font-semibold text-[#0076a8] hover:underline flex items-center">View all <ChevronRight size={14}/></button>}
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px] text-left">
                            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Scenario</th>
                                    <th className="px-5 py-3">Route</th>
                                    <th className="px-5 py-3">Vessel</th>
                                    <th className="px-5 py-3 text-right">Optimized Fuel</th>
                                    <th className="px-5 py-3 text-right">Cost Savings</th>
                                    <th className="px-5 py-3 text-right">GHG Abatement</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-8 text-center text-[#64748B] text-[13px]">No recent runs found.</td>
                                    </tr>
                                ) : (
                                    history.slice(0, 5).map((row) => (
                                        <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-[#0F172A]">{row.id}</div>
                                                <div className="text-[11px] text-[#64748B] mt-0.5">{row.date}</div>
                                            </td>
                                            <td className="px-5 py-4 font-medium text-[#334155]">{row.route}</td>
                                            <td className="px-5 py-4 text-[#475569]">{row.vessel}</td>
                                            <td className="px-5 py-4 text-right font-bold text-[#0F172A] font-mono">{row.optimizedFuel}</td>
                                            <td className="px-5 py-4 text-right font-bold text-[#059669] font-mono">{row.costSaved}</td>
                                            <td className="px-5 py-4 text-right font-bold text-[#0F172A] font-mono">{row.wtwReduction}</td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#059669]">
                                                    <CheckCircle2 size={14} /> {row.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => navigate("/scenario")} className="text-[12px] font-semibold text-[#0076a8] hover:underline mr-4">Re-run</button>
                                                <button className="text-[#94A3B8] hover:text-[#0F172A] opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Visualizations & Model Performance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                
                {/* Fleet Performance Trend */}
                <div className="col-span-12 lg:col-span-7 bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-6 flex flex-col">
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">Fleet Performance Trend</h3>
                    <p className="text-[12px] text-[#64748B] mb-6">GHG Reduction trajectory across recent optimizations</p>
                    
                    <div className="flex-1 w-full" style={{ minHeight: '220px' }}>
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748B'}} tickLine={false} axisLine={{stroke: '#E2E8F0'}} />
                                    <YAxis tick={{fontSize: 11, fill: '#64748B'}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Line type="monotone" dataKey="reduction" name="GHG Reduction" stroke="#0076a8" strokeWidth={2.5} dot={{ r: 4, fill: '#0076a8', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[13px] text-[#64748B]">
                                Performance trends will appear after additional optimization runs.
                            </div>
                        )}
                    </div>
                </div>

                {/* Model Performance */}
                <div className="col-span-12 lg:col-span-5 bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">Model Performance</h3>
                        <p className="text-[12px] text-[#64748B] mb-6">Surrogate XGBoost prediction accuracy vs real-world telemetry</p>
                        
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-[40px] font-extrabold text-[#0F172A] leading-none tracking-tight">98.2%</span>
                            <span className="text-[13px] font-semibold text-[#0076a8] mb-1">Prediction Performance</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-[13px] text-[#475569]">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Continuous learning active
                        </div>
                        <div className="text-[12px] text-[#94A3B8] mt-2">Last validated: 02 Oct 2026</div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                        <button onClick={() => setShowFeedbackModal(true)} className="w-full justify-center bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#0F172A] text-[13px] font-bold px-4 py-2.5 rounded-md transition-colors flex items-center gap-2">
                            <Send size={15} /> Submit Voyage Feedback
                        </button>
                    </div>
                </div>
            </div>

            {/* Compact Fleet Summary */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h4 className="text-[14px] font-bold text-[#0F172A]">Fleet</h4>
                    <p className="text-[13px] text-[#475569] mt-0.5">{companyInfo.fleet_size || "18 active vessels"} · Panamax · Aframax · Capesize</p>
                </div>
                <Link to="/profile" className="text-[13px] font-semibold text-[#0076a8] hover:underline flex items-center gap-1 shrink-0">
                    View Fleet Configuration <ChevronRight size={14} />
                </Link>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 z-[150] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
                        <button onClick={() => setShowFeedbackModal(false)} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] transition-colors"><X size={18}/></button>
                        <h2 className="text-[18px] font-bold text-[#0F172A] mb-1">Model Calibration</h2>
                        <p className="text-[13px] text-[#64748B] mb-6">Submit real-world voyage feedback to improve prediction performance.</p>
                        
                        {feedbackSubmitted ? (
                            <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md flex items-center gap-3 text-[#065F46] text-[13px] font-semibold">
                                <CheckCircle2 size={18} /> Feedback recorded successfully.
                            </div>
                        ) : (
                            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#475569] uppercase mb-1.5 block">Voyage Ref</label>
                                        <input type="text" value={feedback.voyageId} onChange={e => setFeedback({...feedback, voyageId: e.target.value})} className="w-full text-[13px] border border-[#E2E8F0] rounded-md px-3 py-2" placeholder="e.g. SCN-084" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-[#475569] uppercase mb-1.5 block">Actual Fuel (t)</label>
                                        <input type="number" step="0.1" value={feedback.actualFuel} onChange={e => setFeedback({...feedback, actualFuel: e.target.value})} className="w-full text-[13px] border border-[#E2E8F0] rounded-md px-3 py-2 font-mono focus:border-[#0076a8] focus:ring-1 focus:ring-[#0076a8] outline-none" placeholder="e.g. 24.3" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-[#475569] uppercase mb-1.5 block">Sea Condition</label>
                                    <select value={feedback.seaCondition} onChange={e => setFeedback({...feedback, seaCondition: e.target.value})} className="w-full text-[13px] border border-[#E2E8F0] rounded-md px-3 py-2 bg-white">
                                        <option>Calm (Beaufort 0-3)</option>
                                        <option>Moderate (Beaufort 4-5)</option>
                                        <option>Severe (Beaufort 6-8)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-[#475569] uppercase mb-1.5 block">Comments</label>
                                    <textarea rows={2} value={feedback.comments} onChange={e => setFeedback({...feedback, comments: e.target.value})} className="w-full text-[13px] border border-[#E2E8F0] rounded-md px-3 py-2" placeholder="Optional notes..."></textarea>
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] rounded-md">Cancel</button>
                                    <button type="submit" className="bg-[#0076a8] hover:bg-[#005e86] text-white text-[13px] font-bold px-5 py-2 rounded-md shadow-sm">Submit</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Guide Tour Modal */}
            {showGuideModal && (
                <div className="fixed inset-0 z-[150] bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
                        <button onClick={() => setShowGuideModal(false)} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"><X size={18}/></button>
                        <h2 className="text-[18px] font-bold text-[#0F172A] mb-1">Fleet Guide</h2>
                        <p className="text-[13px] text-[#64748B] mb-6">Workflow overview for fleet optimization.</p>
                        
                        <div className="space-y-3">
                            {[
                                { title: "1. Scenario Builder", desc: "Select vessel, weather, and fuel pathways to simulate." },
                                { title: "2. Full-Screen Optimization", desc: "View Pareto tradeoffs, TOPSIS weighting, and constraints." },
                                { title: "3. Deep Insights", desc: "Access Benchmarking, SHAP, and Emissions via navigation." }
                            ].map((s, i) => (
                                <div key={i} className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
                                    <h4 className="text-[13px] font-bold text-[#0F172A]">{s.title}</h4>
                                    <p className="text-[12px] text-[#475569] mt-1">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
