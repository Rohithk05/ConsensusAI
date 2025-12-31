'use client';

import { useState, useEffect, useRef } from 'react';
import { Scenario, VendorProposal, AgentState, AgentResponse } from '@/types';
import { ConsensusEngine } from '@/lib/simulator';
import { Bot, CheckCircle, Activity, ArrowRight, Play, Pause, FileText, BarChart2, TrendingUp, Sparkles, ScrollText, LineChart, FileSearch, Quote, FileCheck, ExternalLink, FileDown, Copy, Share2, Medal, AlertCircle, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface VendorEvaluationWorkspaceProps {
    scenario: Scenario;
}

export default function VendorEvaluationWorkspace({ scenario }: VendorEvaluationWorkspaceProps) {
    const engineRef = useRef<ConsensusEngine | null>(null);
    const [agents, setAgents] = useState<AgentState[]>([]);
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'converged'>('idle');
    const [round, setRound] = useState(0);
    const [activeTab, setActiveTab] = useState<'audit' | 'ranking' | 'summary'>('audit');
    const [vendorResults, setVendorResults] = useState<any[]>([]);
    const [currentVendorIndex, setCurrentVendorIndex] = useState(0);

    const vendors = scenario.vendors || [];

    const runFullAudit = async () => {
        setStatus('analyzing');
        const engine = new ConsensusEngine(scenario);
        engineRef.current = engine;
        setAgents(engine.getAgents());

        // Simulate 5 rounds of group negotiation
        for (let r = 0; r < 5; r++) {
            setRound(r + 1);
            await new Promise(res => setTimeout(res, 1200)); // Longer delay for "thinking"
            await engine.evaluateRound();
            setAgents([...engine.getAgents()]);
            // Logic to update currentVendorIndex if needed for UI feedback
            setCurrentVendorIndex(r % vendors.length);
        }

        const results = engine.getVendorRankings();
        setVendorResults(results);
        setStatus('converged');
        setActiveTab('ranking');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-6">
            {/* Context Header */}
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-subtle)] flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{scenario.title}</h2>
                    <p className="text-muted text-sm">{scenario.description}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-dim tracking-widest">Global Cap</div>
                        <div className="font-mono text-success">${scenario.constraints.budget.toLocaleString()}</div>
                    </div>
                    <div className="h-8 w-[1px] bg-[var(--border-subtle)]" />
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-dim tracking-widest">Time Buffer</div>
                        <div className="font-mono text-warning">{scenario.constraints.timeline} Days</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left side: Vendor Cards or Audit Log */}
                <div className="w-[400px] flex flex-col gap-4">
                    <div className="flex-1 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted">Candidates Under Audit</span>
                            <span className="text-xs text-secondary font-mono">{vendors.length} Total</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
                            {vendors.map((v, i) => (
                                <div key={v.id} className={clsx(
                                    "p-4 rounded-xl border transition-all relative overflow-hidden",
                                    status === 'analyzing' && currentVendorIndex === i ? "border-secondary bg-secondary/5" : "border-[var(--border-subtle)] bg-[var(--bg-card)]",
                                    status === 'converged' && vendorResults.findIndex((r: any) => r.vendor.id === v.id) === 0 ? "border-success bg-success/5" : ""
                                )}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-subtle)]">
                                            <Building2 size={20} className="text-muted" />
                                        </div>
                                        <div className="font-bold">{v.vendorName}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Detail label="Proposed" value={`$${Math.round(v.metrics.budget / 1000)}k`} />
                                        <Detail label="Timeline" value={`${v.metrics.timeline}d`} />
                                    </div>

                                    {status === 'analyzing' && currentVendorIndex === i && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1">
                                            <motion.div
                                                className="h-full bg-secondary"
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                    )}

                                    {status === 'converged' && (
                                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex justify-between items-baseline">
                                            <span className="text-[10px] uppercase font-bold text-dim">Rank #{vendorResults.findIndex((r: any) => r.vendor.id === v.id) + 1}</span>
                                            <span className="text-xs font-bold text-secondary">Match: {Math.round(vendorResults.find((r: any) => r.vendor.id === v.id)?.score || 0)}%</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {status === 'idle' && (
                        <button
                            onClick={runFullAudit}
                            className="btn btn-primary bg-secondary py-4 rounded-xl text-lg flex items-center justify-center gap-2 group"
                        >
                            <Play fill="currentColor" size={18} /> Begin Multi-Agent Audit
                        </button>
                    )}
                </div>

                {/* Right Side: Results Display */}
                <div className="flex-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xl overflow-hidden flex flex-col relative">
                    {status === 'idle' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-50">
                            <Bot size={80} className="mb-6" />
                            <h3 className="text-2xl font-bold mb-2">Ready for Evaluation</h3>
                            <p className="max-w-md">Click begin to start a parallel audit of all vendor proposals against your constraints.</p>
                        </div>
                    )}

                    {status === 'analyzing' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                            <div className="relative mb-8">
                                <motion.div
                                    className="w-24 h-24 border-4 border-secondary/20 border-t-secondary rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <Bot size={40} className="absolute inset-0 m-auto text-secondary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Multi-Agent Negotiation Round {round}</h3>
                            <p className="text-muted">Agents are debating trade-offs between {vendors.length} candidate proposals...</p>

                            <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg mx-auto">
                                {agents.map(agent => (
                                    <div key={agent.id} className="p-4 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-subtle)] flex items-center gap-3">
                                        <Bot size={16} color={agent.color} />
                                        <div className="text-left">
                                            <div className="text-[10px] font-bold uppercase text-dim">{agent.role}</div>
                                            <div className="text-xs italic truncate w-32">"{agent.latestResponse?.content || 'Thinking...'}"</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {status === 'converged' && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 overflow-y-auto p-10 font-sans"
                            >
                                {/* Ranking View */}
                                {activeTab === 'ranking' && (
                                    <div className="space-y-12">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h1 className="text-4xl font-extrabold tracking-tight mb-2">Vendor Ranking</h1>
                                                <p className="text-muted">Consensus-driven selection based on weighted priorities.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setActiveTab('audit')} className="btn btn-secondary text-xs">Technical Audit</button>
                                                <button onClick={() => setActiveTab('summary')} className="btn btn-primary bg-secondary text-xs">Executive Summary</button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {vendorResults.map((res: any, i: number) => (
                                                <div key={res.vendor.id} className={clsx(
                                                    "p-8 rounded-3xl border transition-all flex items-center justify-between group",
                                                    i === 0 ? "border-success bg-success/5 shadow-2xl shadow-success/5 ring-1 ring-success/20" : "border-[var(--border-subtle)] bg-[var(--bg-panel)]"
                                                )}>
                                                    <div className="flex items-center gap-8">
                                                        <div className={clsx(
                                                            "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black",
                                                            i === 0 ? "bg-success text-white" : "bg-[var(--border-subtle)]"
                                                        )}>
                                                            {i === 0 ? <Medal size={32} /> : i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-bold mb-1">{res.vendor.vendorName}</div>
                                                            <div className="flex gap-4 text-sm font-sans">
                                                                <span className="text-muted">Confidence: <b className="text-[var(--text-main)]">{res.confidence}%</b></span>
                                                                <span className="text-muted">Risk Profile: <b className={res.vendor.metrics.risk > 20 ? 'text-danger' : 'text-success'}>{res.vendor.metrics.risk}%</b></span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-[10px] uppercase font-bold text-dim mb-1 tracking-widest">Decision Index</div>
                                                        <div className={clsx("text-4xl font-black font-mono", i === 0 ? "text-success" : "text-muted")}>{Math.round(res.score)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Technical Audit View (Traceability) */}
                                {activeTab === 'audit' && (
                                    <div className="space-y-8">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <FileSearch className="text-secondary" /> Evidence-Based Reasoning Trace
                                        </h2>

                                        <div className="grid grid-cols-1 gap-6">
                                            {vendorResults[0].vendor.extractedFacts.map((fact: any, i: number) => (
                                                <div key={i} className="p-6 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)]">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase rounded-full tracking-wider">{fact.field} Extraction</span>
                                                        <span className="text-xs text-dim italic">Verified via Document Audit</span>
                                                    </div>
                                                    <p className="text-lg font-medium mb-4 italic text-muted">"{fact.quote}"</p>
                                                    <div className="flex items-center gap-2 text-xs text-success bg-success/5 p-3 rounded-lg border border-success/10">
                                                        <CheckCircle size={14} /> Agent Reasoning: Grounded decision on verified contract clause for {fact.field}.
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-center mt-6">
                                            <button onClick={() => setActiveTab('ranking')} className="btn btn-secondary">Back to Ranking</button>
                                        </div>
                                    </div>
                                )}

                                {/* Executive Summary View */}
                                {activeTab === 'summary' && (
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="text-center font-sans">
                                            <div className="w-20 h-20 rounded-3xl bg-secondary/10 flex items-center justify-center mx-auto mb-6 text-secondary">
                                                <Bot size={40} />
                                            </div>
                                            <h1 className="text-4xl font-bold mb-2">Executive Recommendation</h1>
                                            <p className="text-muted">Generated by Multi-Agent Consensus Engine</p>
                                        </div>

                                        <div className="card p-0 bg-[var(--bg-panel)] relative overflow-hidden border-2 border-primary/20 shadow-2xl">
                                            <div className="absolute top-0 right-0 p-8 opacity-5"><Medal size={150} /></div>

                                            <div className="p-10 relative z-10 space-y-10">
                                                <div>
                                                    <h3 className="text-xs uppercase font-extrabold text-secondary tracking-[0.3em] mb-4">Primary Recommendation</h3>
                                                    <div className="text-5xl font-black tracking-tighter text-primary">{vendorResults[0].vendor.vendorName}</div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-8">
                                                    <SummaryStat label="Confidence" value={`${vendorResults[0].confidence}%`} />
                                                    <SummaryStat label="Risk Status" value={vendorResults[0].vendor.metrics.risk < 15 ? 'Stable' : 'Conditional'} />
                                                    <SummaryStat label="Market Fit" value="Optimal" />
                                                </div>

                                                <div className="space-y-4 prose prose-invert max-w-none">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: (engineRef.current?.getExecutiveSummary() || '')
                                                                .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                                                                .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3 border-b border-[var(--border-subtle)] pb-2">$1</h2>')
                                                                .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                                                                .replace(/\n\n/g, '<br/>')
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex gap-4 pt-6">
                                                    <button className="btn btn-primary bg-secondary flex-1 py-4 rounded-full flex items-center justify-center gap-2">
                                                        <FileDown size={18} /> Export Selection PDF
                                                    </button>
                                                    <button className="btn btn-secondary flex-1 py-4 rounded-full flex items-center justify-center gap-2" onClick={() => {
                                                        navigator.clipboard.writeText(engineRef.current?.getExecutiveSummary() || '');
                                                    }}>
                                                        <Copy size={18} /> Copy Rationale
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button onClick={() => setActiveTab('ranking')} className="text-sm text-dim hover:text-secondary block mx-auto transition-colors underlined">View Detailed Comparison Grid</button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}

function Detail({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="flex justify-between items-center bg-[var(--bg-app)]/50 p-2 rounded-lg border border-[var(--border-subtle)] font-sans">
            <span className="text-[10px] uppercase font-bold text-dim">{label}</span>
            <span className="text-xs font-mono">{value}</span>
        </div>
    );
}

function SummaryStat({ label, value }: { label: string, value: string }) {
    return (
        <div className="font-sans">
            <div className="text-[10px] uppercase font-bold text-dim mb-1 tracking-widest">{label}</div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );
}
