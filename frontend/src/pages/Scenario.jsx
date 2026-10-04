import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { LabeledInput, LabeledSelect, Checkbox } from "@/components/shared/Field";
import { WEATHER_SCENARIOS, ALGORITHMS, PORTS, getRouteDistance, calculateFeasibleDeadline } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    AlertTriangle, Play, RotateCcw, CheckCircle2,
    X, ExternalLink, Ship, Settings2, ChevronDown, ChevronUp, Save
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Section({ num, title, children }) {
    return (
        <div className="mb-10 last:mb-0">
            <div className="flex items-baseline gap-3 mb-4 border-b border-[#E2E8F0] pb-2">
                <span className="text-[14px] font-mono font-bold text-[#0076a8] opacity-70">{num}</span>
                <h2 className="text-[16px] font-bold text-[#0F172A] uppercase tracking-wide">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function OptimizationToast({ type, message, onDismiss, onNavigate }) {
    const [progress, setProgress] = useState(100);
    useEffect(() => {
        const start = Date.now();
        const duration = 8000;
        const interval = setInterval(() => {
            const passed = Date.now() - start;
            const remaining = Math.max(0, 100 - (passed / duration) * 100);
            setProgress(remaining);
            if (passed >= duration) {
                clearInterval(interval);
                onDismiss();
            }
        }, 16);
        return () => clearInterval(interval);
    }, [onDismiss]);

    if (type === "error") {
        return (
            <div className="fixed bottom-24 right-6 z-[200] w-[400px] max-w-[calc(100vw-2rem)] fade-in shadow-xl">
                <div className="bg-white border border-[#FECDD3] rounded-lg overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                        <div className="w-8 h-8 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} className="text-[#E11D48]" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[14px] font-bold text-[#E11D48]">Optimization Failed</p>
                            <p className="text-[13px] text-[#64748B] mt-1">{message}</p>
                        </div>
                        <button onClick={onDismiss} className="p-1 text-[#64748B] hover:text-[#0F172A]"><X size={14}/></button>
                    </div>
                    <div className="h-1 bg-[#FEE2E2]"><div className="h-full bg-[#E11D48]" style={{ width: `${progress}%` }} /></div>
                </div>
            </div>
        );
    }
    return null;
}

export default function Scenario() {
    const { config, updateConfig, runOptimization, running, results, error, reset, mode, setMode } = useStore();
    const navigate = useNavigate();
    
    const [fuels, setFuels] = useState(null);
    const [vessels, setVessels] = useState(null);
    const [validation, setValidation] = useState({});
    const [advOpen, setAdvOpen] = useState(false);
    
    const [toast, setToast] = useState(null);
    const prevRunning = useRef(false);

    useEffect(() => {
        if (prevRunning.current === true && !running) {
            if (error) setToast({ type: "error", message: error });
            else if (results) navigate("/optimization"); // Navigate directly on success
        }
        prevRunning.current = running;
    }, [running, results, error, navigate]);

    useEffect(() => {
        if (mode === "road") {
            api.getRoadFuels().then(setFuels);
            api.getRoadVessels().then(setVessels);
        } else {
            api.getFuels().then(setFuels);
            api.getVessels().then(setVessels);
        }
    }, [mode]);

    const fuelList = fuels || [];
    const vesselList = vessels || [];
    
    // Live validation
    useEffect(() => {
        const v = {};
        if (config.distance <= 0) v.distance = "Must be positive";
        if (config.deadline <= 0) v.deadline = "Must be positive";
        if (config.cargoDemand <= 0) v.cargoDemand = "Must be positive";
        if (config.selectedVessels.length === 0) v.vessels = "Select at least one vessel";
        if (config.selectedFuels.length === 0) v.fuels = "Select at least one fuel pathway";
        
        if (mode === "ship" && vesselList.length > 0) {
            const maxSpeed = Math.max(...vesselList.filter(vs => config.selectedVessels.includes(vs.id)).map(vs => vs.maxSpeed || 20), 1);
            const sailWindow = config.deadline - (config.portTime || 0) - (config.bufferTime || 0);
            if (sailWindow <= 0 || config.distance / sailWindow > maxSpeed) {
                v.deadline = `Deadline too tight for selected vessels`;
            }
        }
        setValidation(v);
    }, [config, vesselList, mode]);

    const isValid = Object.keys(validation).length === 0;

    const handleRun = () => {
        if (isValid) {
            setToast(null);
            runOptimization();
        }
    };

    const toggleVessel = (id) => updateConfig({ selectedVessels: config.selectedVessels.includes(id) ? config.selectedVessels.filter((v) => v !== id) : [...config.selectedVessels, id] });
    const toggleFuel = (id) => updateConfig({ selectedFuels: config.selectedFuels.includes(id) ? config.selectedFuels.filter((v) => v !== id) : [...config.selectedFuels, id] });

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-['Open_Sans',sans-serif]">
            {toast && <OptimizationToast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} onNavigate={() => { setToast(null); navigate("/optimization"); }} />}

            {/* Page Header */}
            <div className="bg-white border-b border-[#E2E8F0]">
                <div className="max-w-[1440px] mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A]">Scenario Setup</h1>
                                <span className="px-2.5 py-0.5 bg-[#E0F2FE] text-[#0369A1] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#BAE6FD]">Demo Data</span>
                            </div>
                            <p className="text-[14px] text-[#475569]">Configure your voyage, fleet and optimization parameters.</p>
                        </div>
                        
                        <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md">
                            {["ship", "road"].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMode(m)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-sm text-[13px] font-bold transition-colors flex items-center gap-2",
                                        mode === m ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                                    )}
                                >
                                    {m === "ship" ? <Ship size={14} /> : <Settings2 size={14} />}
                                    {m === "ship" ? "Maritime" : "Road"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* LEFT COLUMN: CONFIGURATION (approx 65%) */}
                    <div className="w-full lg:w-[65%] flex-none flex flex-col gap-2">
                        
                        <Section num="01" title="Voyage & Schedule">
                            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {mode === "ship" && (
                                    <>
                                        <LabeledSelect
                                            label="From"
                                            value={config.originPort}
                                            onChange={(v) => {
                                                const d = getRouteDistance(v, config.destinationPort);
                                                const dl = calculateFeasibleDeadline(d, config.portTime, config.bufferTime);
                                                updateConfig({ originPort: v, distance: d, deadline: dl });
                                            }}
                                            options={PORTS.filter(p => p !== config.destinationPort).map(p => ({ value: p, label: p }))}
                                        />
                                        <LabeledSelect
                                            label="To"
                                            value={config.destinationPort}
                                            onChange={(v) => {
                                                const d = getRouteDistance(config.originPort, v);
                                                const dl = calculateFeasibleDeadline(d, config.portTime, config.bufferTime);
                                                updateConfig({ destinationPort: v, distance: d, deadline: dl });
                                            }}
                                            options={PORTS.filter(p => p !== config.originPort).map(p => ({ value: p, label: p }))}
                                        />
                                    </>
                                )}
                                <LabeledInput label="Distance" unit="nm" type="number" value={config.distance} onChange={v => updateConfig({ distance: v })} />
                                <LabeledInput label="Deadline" unit="hrs" type="number" value={config.deadline} onChange={v => updateConfig({ deadline: v })} error={validation.deadline} />
                                <LabeledInput label="Port Time" unit="hrs" type="number" value={config.portTime} onChange={v => updateConfig({ portTime: v })} />
                                <LabeledInput label="Buffer Time" unit="hrs" type="number" value={config.bufferTime} onChange={v => updateConfig({ bufferTime: v })} />
                                {mode === "ship" && (
                                    <div className="md:col-span-2">
                                        <LabeledSelect label="Weather Scenario" value={config.weather} onChange={v => updateConfig({ weather: v })} options={WEATHER_SCENARIOS} />
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section num="02" title="Cargo">
                            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
                                <div className="max-w-[50%]">
                                    <LabeledInput label="Cargo Demand" unit="tonnes" type="number" value={config.cargoDemand} onChange={v => updateConfig({ cargoDemand: v })} error={validation.cargoDemand} />
                                </div>
                            </div>
                        </Section>

                        <Section num="03" title="Fleet">
                            <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                                <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] flex justify-between items-center">
                                    <span className="text-[13px] font-semibold text-[#0F172A]">{config.selectedVessels.length} vessels selected</span>
                                    <div className="flex gap-4 text-[12px] font-semibold text-[#0076a8]">
                                        <button onClick={() => updateConfig({ selectedVessels: vesselList.map(v => v.id) })} className="hover:underline">Select All</button>
                                        <button onClick={() => updateConfig({ selectedVessels: [] })} className="hover:underline">Clear</button>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#E2E8F0] max-h-[300px] overflow-y-auto">
                                    {vesselList.map((vs) => {
                                        const selected = config.selectedVessels.includes(vs.id);
                                        return (
                                            <div key={vs.id} onClick={() => toggleVessel(vs.id)} className={cn("px-4 py-3 cursor-pointer flex items-center gap-4 transition-colors", selected ? "bg-[#F0F9FF]" : "hover:bg-[#F8FAFC]")}>
                                                <div className="shrink-0 flex items-center justify-center w-5 h-5 border rounded-sm" style={{borderColor: selected ? '#0076a8' : '#CBD5E1', backgroundColor: selected ? '#0076a8' : 'transparent'}}>
                                                    {selected && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[14px] font-bold text-[#0F172A]">{vs.name} <span className="text-[12px] font-normal text-[#64748B] ml-1">({vs.id})</span></div>
                                                    <div className="text-[12px] text-[#475569] mt-0.5">{vs.type} · {vs.capacity?.toLocaleString()} DWT · {vs.maxSpeed} kn max</div>
                                                </div>
                                                {vs.available ? (
                                                    <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Available</span>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full">Unavailable</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Section>

                        <Section num="04" title="Fuel & Energy">
                            <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                                <div className="divide-y divide-[#E2E8F0]">
                                    {fuelList.map((fl) => {
                                        const selected = config.selectedFuels.includes(fl.id);
                                        return (
                                            <div key={fl.id} onClick={() => toggleFuel(fl.id)} className={cn("px-4 py-3 cursor-pointer flex items-center gap-4 transition-colors", selected ? "bg-[#F0F9FF]" : "hover:bg-[#F8FAFC]")}>
                                                <div className="shrink-0 flex items-center justify-center w-5 h-5 border rounded-sm" style={{borderColor: selected ? '#0076a8' : '#CBD5E1', backgroundColor: selected ? '#0076a8' : 'transparent'}}>
                                                    {selected && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[14px] font-bold text-[#0F172A]">{fl.name}</div>
                                                    <div className="text-[12px] text-[#475569] mt-0.5">{fl.type || "Fossil"} · Base price: ${fl.basePrice}/t</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Section>

                        <Section num="05" title="Constraints">
                            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 flex flex-col gap-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={config.shorePowerEnabled} onChange={(e) => updateConfig({ shorePowerEnabled: e.target.checked })} className="w-4 h-4 text-[#0076a8] border-[#CBD5E1] rounded focus:ring-[#0076a8]" />
                                    <div>
                                        <div className="text-[14px] font-bold text-[#0F172A]">Shore Power at Berth</div>
                                        <div className="text-[12px] text-[#64748B]">Force vessels to connect to grid power while docked if available.</div>
                                    </div>
                                </label>
                                {config.shorePowerEnabled && (
                                    <div className="ml-7 pl-4 border-l-2 border-[#E2E8F0] max-w-[50%]">
                                        <LabeledInput label="Grid Emission Factor" unit="gCO₂/kWh" type="number" value={config.gridEmissionFactor} onChange={v => updateConfig({ gridEmissionFactor: v })} />
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section num="06" title="Optimization Objective">
                            <div className="bg-white border border-[#E2E8F0] rounded-lg p-6">
                                <p className="text-[13px] text-[#475569] mb-4">Select the primary metrics QFlow MO-QPSO should co-optimize. Multi-objective selections will generate Pareto frontiers.</p>
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {[
                                        { id: 'fuel', label: 'Minimum Fuel' },
                                        { id: 'cost', label: 'Minimum Cost' },
                                        { id: 'wtw', label: 'Minimum WTW GHG' }
                                    ].map(obj => (
                                        <button 
                                            key={obj.id}
                                            onClick={() => updateConfig({ objectives: { ...config.objectives, [obj.id]: !config.objectives[obj.id] } })}
                                            className={cn("px-4 py-2 rounded-md text-[13px] font-bold border transition-colors flex items-center gap-2", config.objectives?.[obj.id] ? "bg-[#0F172A] text-white border-[#0F172A]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]")}
                                        >
                                            <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center", config.objectives?.[obj.id] ? "border-white bg-white" : "border-[#94A3B8]")}>
                                                {config.objectives?.[obj.id] && <div className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />}
                                            </div>
                                            {obj.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {config.objectives?.cost && (
                                    <div className="max-w-[50%] border-t border-[#E2E8F0] pt-4 mt-2">
                                        <LabeledInput label="Carbon Price (EUA)" unit="€ / tCO₂e" type="number" value={config.carbonPrice} onChange={v => updateConfig({ carbonPrice: v })} />
                                    </div>
                                )}
                            </div>
                        </Section>

                        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden mb-10">
                            <button onClick={() => setAdvOpen(!advOpen)} className="w-full px-6 py-4 flex justify-between items-center bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
                                <span className="text-[14px] font-bold text-[#475569]">Advanced Optimization Settings</span>
                                {advOpen ? <ChevronUp size={18} className="text-[#64748B]"/> : <ChevronDown size={18} className="text-[#64748B]"/>}
                            </button>
                            {advOpen && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#E2E8F0]">
                                    <LabeledSelect label="Algorithm" value={config.algorithm} onChange={v => updateConfig({ algorithm: v })} options={ALGORITHMS} />
                                    <LabeledInput label="Population" type="number" value={config.population} onChange={v => updateConfig({ population: v })} min={10} />
                                    <LabeledInput label="Iterations" type="number" value={config.iterations} onChange={v => updateConfig({ iterations: v })} min={10} />
                                    <LabeledInput label="Random seed" type="number" value={config.seed} onChange={v => updateConfig({ seed: v })} min={0} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SCENARIO REVIEW (approx 35%) */}
                    <div className="w-full lg:w-[35%] flex-1 lg:sticky lg:top-8 flex flex-col gap-6">
                        
                        <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-[#0F172A] text-white px-5 py-4">
                                <h3 className="text-[15px] font-bold uppercase tracking-wider">Scenario Review</h3>
                            </div>
                            
                            <div className="p-5 flex flex-col gap-5">
                                <div>
                                    <div className="text-[16px] font-bold text-[#0F172A]">{config.originPort} → {config.destinationPort}</div>
                                    <div className="text-[13px] text-[#64748B] mt-0.5">{config.distance} nm · {config.deadline} h deadline</div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[13px]">
                                    <div>
                                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Cargo</div>
                                        <div className="font-semibold text-[#0F172A]">{config.cargoDemand.toLocaleString()} t</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Weather</div>
                                        <div className="font-semibold text-[#0F172A]">{config.weather}</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Fleet</div>
                                        <div className="font-semibold text-[#0F172A]">{config.selectedVessels.length} vessels selected</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Fuel</div>
                                        <div className="font-semibold text-[#0F172A]">{config.selectedFuels.length} pathways selected</div>
                                    </div>
                                </div>

                                <hr className="border-[#E2E8F0]" />

                                <div>
                                    <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-3">Constraint Check</h4>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { label: "Cargo demand satisfied", passed: config.cargoDemand > 0 && config.selectedVessels.length > 0 },
                                            { label: "Deadline feasible", passed: !validation.deadline },
                                            { label: "Vessel availability", passed: config.selectedVessels.length > 0 },
                                            { label: "Fuel compatibility", passed: config.selectedFuels.length > 0 },
                                        ].map((check, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[13px]">
                                                {check.passed ? <CheckCircle2 size={16} className="text-[#10B981]" /> : <AlertTriangle size={16} className="text-[#F59E0B]" />}
                                                <span className={check.passed ? "text-[#0F172A]" : "text-[#F59E0B] font-semibold"}>{check.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-[#E2E8F0]" />

                                <div className="text-center pt-2">
                                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Scenario Status</div>
                                    {isValid ? (
                                        <div className="text-[15px] font-extrabold text-[#10B981] uppercase tracking-wide">Ready to Optimize</div>
                                    ) : (
                                        <div className="text-[15px] font-extrabold text-[#F59E0B] uppercase tracking-wide">Configuration Incomplete</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Previous Run Section (De-emphasized) */}
                        {results && (
                            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
                                <h4 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider mb-2">Previous Optimization Run</h4>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-[#64748B]">Status:</span>
                                    <span className={cn("font-semibold", results.feasible ? "text-[#10B981]" : "text-[#EF4444]")}>{results.feasible ? "Feasible" : "Infeasible"}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px] mt-1">
                                    <span className="text-[#64748B]">Pareto Points:</span>
                                    <span className="font-semibold text-[#0F172A]">{results.pareto?.length ?? 0}</span>
                                </div>
                                <button onClick={() => navigate("/optimization")} className="mt-4 text-[13px] font-semibold text-[#0076a8] hover:underline flex items-center gap-1">
                                    View Full Results <ExternalLink size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        {isValid ? <CheckCircle2 size={18} className="text-[#10B981]" /> : <AlertTriangle size={18} className="text-[#F59E0B]" />}
                        <span className="text-[14px] font-bold text-[#0F172A]">{isValid ? "Scenario ready" : "Configuration requires attention"}</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={reset} className="flex-1 sm:flex-none text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 border border-transparent">
                            <RotateCcw size={15} /> Reset
                        </button>
                        <button className="flex-1 sm:flex-none text-[13px] font-semibold text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <Save size={15} /> Save Draft
                        </button>
                        <button 
                            onClick={handleRun} 
                            disabled={!isValid || running}
                            className={cn(
                                "flex-[2] sm:flex-none text-[14px] font-bold px-8 py-2.5 rounded-md transition-all flex items-center justify-center gap-2 shadow-sm",
                                isValid && !running ? "bg-[#0076a8] hover:bg-[#005e86] text-white" : "bg-[#CBD5E1] text-[#94A3B8] cursor-not-allowed"
                            )}
                        >
                            {running ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Optimizing...</>
                            ) : (
                                <>Run Optimization <Play size={15} className="fill-current" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

