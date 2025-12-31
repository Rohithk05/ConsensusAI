'use client';

import { useState, useEffect, useRef } from 'react';
import { AgentState, Scenario } from '@/types';
import { ConsensusEngine } from '@/lib/simulator';
import { Bot, CheckCircle, Activity, ArrowRight, Play, Pause, FileText, BarChart2, TrendingUp, Sparkles, ScrollText, LineChart, FileSearch, Quote, FileCheck, ExternalLink, FileDown, Copy, Share2 } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AgentChat from '@/components/negotiation/AgentChat';
import PredictiveAnalytics from '@/components/negotiation/PredictiveAnalytics';

interface NegotiationWorkspaceProps {
    scenario: Scenario;
}

export default function NegotiationWorkspace({ scenario }: NegotiationWorkspaceProps) {
    const engineRef = useRef<ConsensusEngine | null>(null);
    const [agents, setAgents] = useState<AgentState[]>([]);
    const [proposal, setProposal] = useState<any>(null);
    const [round, setRound] = useState(0);
    const [status, setStatus] = useState<'idle' | 'active' | 'converged'>('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [logs, setLogs] = useState<{ round: number, text: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'workspace' | 'summary'>('workspace');
    const [centerTab, setCenterTab] = useState<'logs' | 'predictive' | 'traceability'>('logs');
    const [confidenceScore, setConfidenceScore] = useState(0);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize
        const engine = new ConsensusEngine(scenario);
        engineRef.current = engine;
        setAgents(engine.getAgents());
        setProposal(engine.getCurrentProposal());
        setConfidenceScore(engine.getConfidenceScore());

        // Add initial log
        setLogs([{ round: 0, text: "Negotiation Initiated based on scenario constraints." }]);
    }, [scenario]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && status !== 'converged') {
            interval = setInterval(() => {
                handleNextRound();
            }, 8000); // 8 seconds per round (Rate Limit Safe)
        }
        return () => clearInterval(interval);
    }, [isPlaying, status]);

    const handleNextRound = async () => {
        if (!engineRef.current || status === 'converged') return;

        setStatus('active');
        const result = await engineRef.current.evaluateRound();

        // Update State
        setAgents([...engineRef.current.getAgents()]);
        setProposal({ ...engineRef.current.getCurrentProposal() }); // Trigger re-render
        setConfidenceScore(engineRef.current.getConfidenceScore());
        setRound(prev => prev + 1);
        setLogs(prev => [{ round: prev.length, text: result.summary }, ...prev]);

        if (result.converged) {
            setStatus('converged');
            setIsPlaying(false);
        }
    };

    if (!proposal) return <div>Loading Simulation Engine...</div>;

    return (
        <div className="flex flex-col h-full gap-5">
            {/* Header / Controls */}
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-[var(--border-subtle)]">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Activity className="text-primary" />
                        Round {round}
                        {status === 'converged' && <span className="text-success text-sm px-2 py-1 bg-success/10 rounded-full">Consensus Reached</span>}

                        {/* Confidence Score Pill */}
                        <div className="ml-4 flex items-center gap-2 px-3 py-1 bg-[var(--bg-panel)] rounded-full border border-[var(--border-subtle)]"
                            title="Decision Confidence Index based on consensus velocity and risk">
                            <BarChart2 size={14} className={confidenceScore > 80 ? "text-success" : confidenceScore > 50 ? "text-warning" : "text-danger"} />
                            <span className="text-sm font-mono">{confidenceScore}/100 Confidence</span>
                        </div>
                    </h2>
                </div>

                <div className="flex gap-2">
                    {status === 'converged' && (
                        <button
                            className={clsx("btn", activeTab === 'summary' ? "btn-primary" : "btn-secondary")}
                            onClick={() => setActiveTab(activeTab === 'workspace' ? 'summary' : 'workspace')}
                        >
                            <FileText size={16} /> {activeTab === 'workspace' ? "View Executive Summary" : "View Negotiation"}
                        </button>
                    )}

                    <button className="btn btn-secondary" onClick={handleNextRound} disabled={status === 'converged' || isPlaying}>
                        Next Step <ArrowRight size={16} />
                    </button>
                    <button className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setIsPlaying(!isPlaying)} disabled={status === 'converged'}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        {isPlaying ? 'Pause' : 'Auto-Negotiate'}
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-y-auto overflow-x-hidden pr-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'workspace' ? (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-full select-none pb-24"
                        >

                            {/* Left Agents */}
                            <div className="flex flex-col justify-center gap-5">
                                <AgentCard agent={agents.find(a => a.role === 'budget')!} />
                                <AgentCard agent={agents.find(a => a.role === 'timeline')!} />
                            </div>

                            {/* Center Proposal */}
                            <div className="flex flex-col justify-center gap-5">
                                <div className="card glass relative overflow-hidden flex flex-col justify-center" style={{ minHeight: '300px', border: '1px solid var(--primary)' }}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                    <h3 className="text-center text-lg mb-6 text-primary font-bold">Current Proposal</h3>

                                    <div className="space-y-4 px-4">
                                        <ProposalMetric label="Budget" value={proposal.budget} limit={scenario.constraints.budget} unit="$" reverse={true} />
                                        <ProposalMetric label="Timeline" value={proposal.timeline} limit={scenario.constraints.timeline} unit="Days" reverse={true} />
                                        <ProposalMetric label="Quality" value={proposal.quality} limit={scenario.constraints.qualityMin} unit="Score" reverse={false} />
                                        <ProposalMetric label="Risk" value={proposal.risk} limit={scenario.constraints.riskMax} unit="Index" reverse={true} />
                                    </div>

                                    {status === 'converged' && (
                                        <div className="mt-8 p-3 bg-success/20 border border-success rounded-lg text-center mx-4 animate-fade-in">
                                            <CheckCircle className="inline-block mb-1 text-success" />
                                            <p className="text-sm font-medium">Final Decision Locked</p>
                                        </div>
                                    )}
                                </div>

                                {/* Intelligent Module Deck (Logs + Predictive + Traceability) */}
                                <div className="card h-[320px] overflow-hidden flex flex-col p-0 bg-[var(--bg-panel)]">
                                    <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
                                        <button
                                            className={clsx("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", centerTab === 'logs' ? "border-primary text-primary bg-[var(--bg-panel)]" : "border-transparent text-muted hover:text-[var(--text-main)]")}
                                            onClick={() => setCenterTab('logs')}
                                        >
                                            <ScrollText size={14} /> Negotiation Log
                                        </button>
                                        <button
                                            className={clsx("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", centerTab === 'predictive' ? "border-primary text-primary bg-[var(--bg-panel)]" : "border-transparent text-muted hover:text-[var(--text-main)]")}
                                            onClick={() => setCenterTab('predictive')}
                                        >
                                            <LineChart size={14} /> FutureCast
                                        </button>
                                        <button
                                            className={clsx("px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2", centerTab === 'traceability' ? "border-primary text-primary bg-[var(--bg-panel)]" : "border-transparent text-muted hover:text-[var(--text-main)]")}
                                            onClick={() => setCenterTab('traceability')}
                                        >
                                            <FileSearch size={14} /> Evidence Trace
                                            {scenario.documents && scenario.documents.length > 0 && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-hidden relative">
                                        {centerTab === 'logs' ? (
                                            <div className="h-full overflow-y-auto p-4 space-y-3 font-mono text-sm custom-scrollbar">
                                                <AnimatePresence>
                                                    {logs.map((log, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex gap-3 text-muted"
                                                        >
                                                            <span className="text-dim opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                                            <span>{log.text}</span>
                                                        </motion.div>
                                                    ))}
                                                    <div ref={logEndRef} />
                                                </AnimatePresence>
                                            </div>
                                        ) : centerTab === 'predictive' ? (
                                            <div className="h-full p-4 overflow-y-auto">
                                                <PredictiveAnalytics scenario={scenario} currentRisk={proposal.risk} />
                                            </div>
                                        ) : (
                                            <div className="h-full p-4 overflow-y-auto">
                                                <TraceabilityPanel scenario={scenario} agents={agents} round={round} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Agents */}
                            <div className="flex flex-col justify-center gap-5">
                                <AgentCard agent={agents.find(a => a.role === 'quality')!} />
                                <AgentCard agent={agents.find(a => a.role === 'risk')!} />
                            </div>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full max-w-5xl mx-auto"
                        >
                            <div className="card p-0 overflow-hidden bg-[var(--bg-panel)] relative min-h-[800px] shadow-2xl">
                                {/* Artifact Header */}
                                <div className="p-10 border-b border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Bot size={200} />
                                    </div>

                                    <div className="relative z-10 flex justify-between items-end">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
                                                    {scenario.module.replace('_', ' ')} Artifact
                                                </span>
                                                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-widest border border-success/20">
                                                    Finalized
                                                </span>
                                            </div>
                                            <h1 className="text-5xl font-bold mb-2 tracking-tight text-[var(--text-main)]">
                                                {scenario.title}
                                            </h1>
                                            <p className="text-xl text-muted max-w-2xl font-light">
                                                Strategic consensus reached via multi-agent negotiation.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-dim uppercase tracking-widest mb-1">Confidence Score</div>
                                            <div className="text-6xl font-black font-mono text-primary leading-none">
                                                {confidenceScore}<span className="text-2xl">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Artifact Body */}
                                <div className="p-12 pb-24">
                                    <div className="prose prose-invert max-w-none prose-headings:text-primary prose-strong:text-[var(--text-main)] prose-p:text-muted prose-p:leading-relaxed">
                                        <div
                                            className="artifact-content"
                                            dangerouslySetInnerHTML={{
                                                __html: (engineRef.current?.getExecutiveSummary() || '')
                                                    .replace(/^# (.*$)/gm, '<h1 class="text-4xl font-bold mt-12 mb-6 text-primary">$1</h1>')
                                                    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-[var(--text-main)] border-b border-[var(--border-subtle)] pb-2">$1</h2>')
                                                    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-8 mb-3 text-secondary">$1</h3>')
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-bold">$1</strong>')
                                                    .replace(/\n\n/g, '<br/><br/>')
                                                    .replace(/\| (.*) \|/g, (match) => { // Basic table support
                                                        const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
                                                        return `<div class="grid grid-cols-${cells.length} gap-4 p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50 font-medium">${cells.map(c => `<span>${c}</span>`).join('')}</div>`;
                                                    })
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Floating Action Bar */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-[var(--bg-card)] border border-[var(--border-active)] rounded-full shadow-2xl shadow-black/50 z-20">
                                    <button
                                        className="btn btn-primary px-6 py-2 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                        onClick={() => window.print()}
                                    >
                                        <FileDown size={18} /> Export PDF
                                    </button>
                                    <button
                                        className="btn btn-secondary px-6 py-2 rounded-full flex items-center gap-2 hover:bg-[var(--bg-app)] transition-all"
                                        onClick={() => {
                                            navigator.clipboard.writeText(engineRef.current?.getExecutiveSummary() || '');
                                            // TODO: Add toast notification
                                        }}
                                    >
                                        <Copy size={18} /> Copy Mockups
                                    </button>
                                    <div className="w-[1px] h-6 bg-[var(--border-subtle)] self-center mx-1" />
                                    <button
                                        className="p-2 text-muted hover:text-primary transition-colors"
                                        title="Share Secure Link"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Artifact Footer */}
                            <div className="mt-8 mb-20 text-center text-dim text-sm font-mono uppercase tracking-[0.2em] opacity-40">
                                End of Document • Generated by ConsensusAI • {new Date().toLocaleDateString()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI Assistant */}
                <AgentChat scenario={scenario} />
            </div>
        </div >
    );
}

function AgentCard({ agent }: { agent: AgentState }) {
    if (!agent) return null;

    const isReject = agent.latestResponse?.decision === 'reject';

    return (
        <motion.div
            layout
            className="card relative transition-all duration-300 hover:bg-[var(--bg-card-hover)]"
            style={{ borderLeft: `4px solid ${agent.color}` }}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--bg-panel)]">
                        <Bot size={20} color={agent.color} />
                    </div>
                    <div>
                        <span className="font-bold block leading-none">{agent.name}</span>
                        <span className="text-xs text-muted uppercase">{agent.role}</span>
                    </div>
                </div>
                {agent.latestResponse && (
                    <span className={clsx("text-xs px-2 py-1 rounded-full border font-bold tracking-wide",
                        isReject ? "border-danger text-danger bg-danger/10" : "border-success text-success bg-success/10"
                    )}>
                        {agent.latestResponse.decision.toUpperCase()}
                    </span>
                )}
            </div>

            <div className="min-h-[80px] flex items-center bg-[var(--bg-panel)] p-3 rounded-lg border border-[var(--border-subtle)]">
                {agent.latestResponse ? (
                    <p className="text-sm text-muted italic leading-relaxed">"{agent.latestResponse.content}"</p>
                ) : (
                    <p className="text-sm text-dim flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        Waiting for proposal...
                    </p>
                )}
            </div>
        </motion.div>
    );
}

function ProposalMetric({ label, value, limit, unit, reverse }: any) {
    const isGood = reverse ? value <= limit : value >= limit;
    const color = isGood ? 'var(--success)' : 'var(--danger)';

    return (
        <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)]">
            <span className="text-sm font-medium text-muted">{label}</span>
            <div className="text-right">
                <div className="font-mono font-bold text-lg leading-none mb-1" style={{ color }}>
                    {unit === '$' && '$'}{Math.round(value).toLocaleString()}{unit !== '$' && unit}
                </div>
                <div className="text-xs text-dim">
                    Goal: {reverse ? '≤' : '≥'} {Math.round(limit).toLocaleString()}
                </div>
            </div>
        </div>
    )
}

function TraceabilityPanel({ scenario, agents, round }: { scenario: Scenario, agents: AgentState[], round: number }) {
    if (!scenario.documents || scenario.documents.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted">
                <FileSearch size={48} className="mb-4 opacity-20" />
                <p>No documents attached.</p>
                <p className="text-xs mt-2">Agents are relying on manual constraints.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Evidence Chain</h3>
                <span className="text-xs bg-[var(--bg-app)] border border-[var(--border-subtle)] px-2 py-1 rounded text-dim">
                    {scenario.documents.length} Source Docs
                </span>
            </div>

            {/* Document List */}
            <div className="grid grid-cols-1 gap-2">
                {scenario.documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-[var(--bg-card)] rounded border border-[var(--border-subtle)] hover:border-primary transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3 items-center">
                                <FileText size={16} className="text-primary" />
                                <div>
                                    <div className="text-sm font-bold group-hover:text-primary transition-colors">{doc.name}</div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted uppercase">
                                        {doc.type}
                                        <span className="mx-1">•</span>
                                        <span className="text-success">{doc.extractedFacts.length} Facts Used</span>
                                    </div>
                                </div>
                            </div>
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Live trace updates based on agents */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Active Citations</h3>

                {agents.filter(a => a.latestResponse?.decision === 'reject').map(agent => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={agent.id}
                        className="p-3 bg-danger/5 border border-danger/20 rounded-lg"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-danger" />
                            <span className="font-bold text-xs uppercase" style={{ color: agent.color }}>{agent.name}</span>
                            <span className="text-danger text-xs font-bold">BLOCKER</span>
                        </div>
                        <div className="flex gap-3">
                            <Quote size={16} className="text-danger shrink-0 mt-1" />
                            <div>
                                <p className="text-sm text-[var(--text-main)] italic">
                                    "Constraint violation detected in {scenario.documents[0]?.name || 'Contract'}..."
                                </p>
                                <p className="text-xs text-muted mt-1">Ref: {agent.role === 'budget' ? 'Section 4.1 (Finance)' : agent.role === 'timeline' ? 'Schedule A' : 'Quality Addendum'}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {agents.every(a => !a.latestResponse || a.latestResponse.decision !== 'reject') && (
                    <div className="text-center p-4 text-xs text-muted italic border border-dashed border-[var(--border-subtle)] rounded-lg">
                        All active proposals align with documented constraints.
                    </div>
                )}
            </div>
        </div>
    );
}
