'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, UploadCloud, FileText, Trash2, Loader2, FileCheck, ChevronRight, ArrowLeft, Play, Bot, DollarSign, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { Scenario, VendorProposal, DecisionDocument } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { parseVendorProposal } from '@/lib/documentParser';
import VendorEvaluationWorkspace from '@/components/negotiation/VendorEvaluationWorkspace';

export default function VendorEvalPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [vendors, setVendors] = useState<VendorProposal[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [finalizedScenario, setFinalizedScenario] = useState<Scenario | null>(null);

    // Context Inheritance
    useEffect(() => {
        const savedProject = sessionStorage.getItem('projectContext');
        if (savedProject) {
            const context = JSON.parse(savedProject);
            setScenario(prev => ({
                ...prev,
                title: context.title,
                description: context.goal
            }));
            setStep(2); // Skip Step 1 since context is provided
        }
    }, []);
    const [scenario, setScenario] = useState<Partial<Scenario>>({
        title: '',
        description: '',
        module: 'vendor_eval',
        constraints: {
            budget: 100000,
            timeline: 90,
            qualityMin: 70,
            riskMax: 30
        },
        priorities: {
            budget: 5,
            timeline: 5,
            quality: 7,
            risk: 8
        }
    });

    const handleBack = () => {
        if (finalizedScenario) setFinalizedScenario(null);
        else if (step === 1) router.push('/dashboard');
        else setStep(s => s - 1);
    };

    if (finalizedScenario) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans">
                <nav className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 hover:bg-[var(--border-subtle)] rounded-full transition-colors text-muted hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="h-6 w-[1px] bg-[var(--border-subtle)]" />
                        <div className="flex items-center gap-2">
                            <Bot size={18} className="text-secondary" />
                            <span className="font-bold tracking-tight uppercase text-xs text-muted">Vendor Evaluation Workspace</span>
                        </div>
                    </div>
                </nav>
                <main className="p-8">
                    <VendorEvaluationWorkspace scenario={finalizedScenario} />
                </main>
            </div>
        );
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsProcessing(true);
            const file = e.target.files[0];
            const vendorName = file.name.split('.')[0].replace(/[-_]/g, ' ');

            try {
                const proposal = await parseVendorProposal(file, vendorName);
                setVendors(prev => [...prev, proposal]);
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans selection:bg-primary/30">
            {/* Minimal Top Nav */}
            <nav className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 hover:bg-[var(--border-subtle)] rounded-full transition-colors text-muted hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-6 w-[1px] bg-[var(--border-subtle)]" />
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={18} className="text-secondary" />
                        <span className="font-bold tracking-tight uppercase text-xs text-muted">Vendor Evaluation Engine</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={clsx("h-1 w-12 rounded-full transition-all duration-500", s <= step ? "bg-secondary" : "bg-[var(--border-subtle)]")} />
                    ))}
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-8 py-16">
                <AnimatePresence mode="wait">
                    {/* STEP 1: OBJECTIVE */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto text-center"
                        >
                            <h1 className="text-5xl font-bold mb-8 tracking-tight">What are we evaluating?</h1>
                            <p className="text-xl text-muted mb-12 font-light">Define the strategic objective for this vendor selection process.</p>

                            <div className="space-y-12">
                                <input
                                    className="input-minimal text-4xl text-center border-b-2 border-secondary/20 focus:border-secondary transition-all"
                                    placeholder="Project Title (e.g. ERP Modernization)"
                                    value={scenario.title}
                                    onChange={e => setScenario({ ...scenario, title: e.target.value })}
                                    autoFocus
                                />
                                <textarea
                                    className="input-minimal text-xl text-center resize-none border-b border-[var(--border-subtle)] focus:border-secondary transition-all"
                                    placeholder="Briefly describe the business goal..."
                                    rows={3}
                                    value={scenario.description}
                                    onChange={e => setScenario({ ...scenario, description: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!scenario.title || !scenario.description}
                                className="btn btn-primary bg-secondary hover:bg-secondary/80 mt-12 py-4 px-10 rounded-full text-lg shadow-xl shadow-secondary/20 disabled:opacity-50"
                            >
                                Upload Proposals <ChevronRight />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: MULTI-VENDOR UPLOAD */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                        >
                            <div className="text-center mb-16">
                                <h2 className="text-4xl font-bold mb-4">Intake Vendor Proposals</h2>
                                <p className="text-muted text-lg">Upload 2 or more proposals. We'll extract commercial and technical metrics.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-card)]/50 hover:bg-secondary/5 hover:border-secondary transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="flex flex-col items-center justify-center p-8 text-center">
                                            <UploadCloud className="w-16 h-16 mb-4 text-muted group-hover:text-secondary transition-colors" />
                                            <p className="text-lg font-medium mb-1">Upload Proposal PDF</p>
                                            <p className="text-sm text-dim">Drag and drop or click to browse</p>
                                        </div>
                                        <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} disabled={isProcessing} />

                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-[var(--bg-app)]/80 backdrop-blur-md flex flex-col items-center justify-center">
                                                <Loader2 className="animate-spin text-secondary mb-3" size={40} />
                                                <p className="font-bold text-secondary uppercase tracking-widest text-xs">Analyzing Proposal...</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-dim mb-4">Draft Candidates ({vendors.length})</h3>
                                    {vendors.length === 0 ? (
                                        <div className="h-80 border border-[var(--border-subtle)] border-dashed rounded-3xl flex items-center justify-center p-12 text-center text-muted italic">
                                            No vendors added yet. At least 2 proposals are required for comparison.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {vendors.map(v => (
                                                <motion.div
                                                    layout
                                                    key={v.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-5 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] flex justify-between items-center group hover:border-secondary/30 transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                            <FileText size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-lg">{v.vendorName}</div>
                                                            <div className="flex gap-3 text-xs text-dim mt-1">
                                                                <span className="flex items-center gap-1"><FileCheck size={12} className="text-success" /> {v.extractedFacts.length} Parameters Found</span>
                                                                <span>•</span>
                                                                <span>${v.metrics.budget.toLocaleString()} Projected</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setVendors(prev => prev.filter(p => p.id !== v.id))} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-16 flex justify-center">
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={vendors.length < 2}
                                    className="btn btn-primary bg-secondary px-12 py-4 rounded-full text-lg disabled:opacity-30 flex items-center gap-2"
                                >
                                    Review Parameters <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: CONSTRAINTS & EXTRACTED FACTS */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-12"
                        >
                            <div className="text-center mb-12">
                                <h2 className="text-4xl font-bold mb-4">Grounding Verification</h2>
                                <p className="text-muted text-lg">Verify the extracted commercial parameters before running negotiation.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Global Constraints Pad */}
                                <div className="card p-10 bg-[var(--bg-panel)] border-secondary/20 border-2">
                                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                        <Bot className="text-secondary" /> Global Baseline
                                    </h3>

                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-dim flex items-center gap-1"><DollarSign size={12} /> Max Budget</label>
                                            <input
                                                type="number"
                                                className="input-minimal text-3xl font-light w-full"
                                                value={scenario.constraints?.budget}
                                                onChange={e => setScenario({ ...scenario, constraints: { ...scenario.constraints!, budget: Number(e.target.value) } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-dim flex items-center gap-1"><Clock size={12} /> Deadline (Days)</label>
                                            <input
                                                type="number"
                                                className="input-minimal text-3xl font-light w-full"
                                                value={scenario.constraints?.timeline}
                                                onChange={e => setScenario({ ...scenario, constraints: { ...scenario.constraints!, timeline: Number(e.target.value) } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-dim text-right">Vendor Metrics Breakdown</h3>
                                    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                        {vendors.map(v => (
                                            <div key={v.id} className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] group">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="font-bold text-secondary">{v.vendorName}</div>
                                                    <div className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded-full uppercase font-bold border border-success/20">Evidence Ready</div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-4">
                                                    <MetricSmall label="Cost" value={`$${Math.round(v.metrics.budget / 1000)}k`} color="text-success" />
                                                    <MetricSmall label="Days" value={v.metrics.timeline} color="text-warning" />
                                                    <MetricSmall label="Quality" value={`${v.metrics.quality}%`} color="text-secondary" />
                                                    <MetricSmall label="Risk" value={`${v.metrics.risk}%`} color="text-danger" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-6 mt-16">
                                <button onClick={() => setStep(2)} className="btn btn-secondary px-10 rounded-full">Back</button>
                                <button onClick={() => setStep(4)} className="btn btn-primary bg-secondary px-12 py-4 rounded-full text-lg shadow-xl shadow-secondary/20">
                                    Set Decision Priorities <ChevronRight />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: PRIORITIES & SUBMIT */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            <h2 className="text-4xl font-bold mb-4 text-center">Strategic Priorities</h2>
                            <p className="text-muted text-center text-lg mb-16">Weight the importance of each dimension to guide the evaluation agents.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                                <div className="space-y-10">
                                    <PrioritySlider label="Cost Efficiency" value={scenario.priorities?.budget!} onChange={(v: number) => setScenario({ ...scenario, priorities: { ...scenario.priorities!, budget: v } })} color="var(--success)" />
                                    <PrioritySlider label="Speed to Market" value={scenario.priorities?.timeline!} onChange={(v: number) => setScenario({ ...scenario, priorities: { ...scenario.priorities!, timeline: v } })} color="var(--warning)" />
                                    <PrioritySlider label="Technical Depth" value={scenario.priorities?.quality!} onChange={(v: number) => setScenario({ ...scenario, priorities: { ...scenario.priorities!, quality: v } })} color="var(--secondary)" />
                                    <PrioritySlider label="Risk Mitigation" value={scenario.priorities?.risk!} onChange={(v: number) => setScenario({ ...scenario, priorities: { ...scenario.priorities!, risk: v } })} color="var(--danger)" />
                                </div>

                                <div className="card p-10 bg-secondary/5 border-secondary/20 border-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Bot size={120} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-6 text-secondary">Negotiation Preflight</h3>
                                    <div className="space-y-6 relative z-10">
                                        <p className="text-muted leading-relaxed italic">
                                            "I will initialize 4 specialized agents to evaluate these {vendors.length} vendors.
                                            The Coordinator will prioritize {Object.entries(scenario.priorities!).sort((a, b) => b[1] - a[1])[0][0]} based on your weighting."
                                        </p>
                                        <div className="p-4 bg-[var(--bg-panel)] rounded-xl border border-secondary/10">
                                            <div className="text-xs font-bold uppercase text-dim mb-1">Grounding Confidence</div>
                                            <div className="text-2xl font-mono text-secondary">High (92%)</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const finalScenario = {
                                                    id: crypto.randomUUID(),
                                                    title: scenario.title || 'Vendor Evaluation',
                                                    description: scenario.description || '',
                                                    module: 'vendor_eval',
                                                    vendors,
                                                    documents: documentsFromVendors(vendors),
                                                    constraints: scenario.constraints || { budget: 100000, timeline: 90, qualityMin: 70, riskMax: 30 },
                                                    priorities: scenario.priorities || { budget: 5, timeline: 5, quality: 7, risk: 8 }
                                                } as Scenario;
                                                setFinalizedScenario(finalScenario);
                                            }}
                                            className="btn btn-primary bg-secondary w-full py-5 text-xl justify-center shadow-2xl shadow-secondary/40 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Run Multi-Agent Audit <Play size={20} fill="currentColor" className="ml-2" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function MetricSmall({ label, value, color }: any) {
    return (
        <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-dim mb-1">{label}</div>
            <div className={clsx("font-bold text-sm", color)}>{value}</div>
        </div>
    );
}

function PrioritySlider({ label, value, onChange, color }: any) {
    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-[var(--text-main)]">{label}</span>
                <span className="font-mono text-lg" style={{ color }}>{value}</span>
            </div>
            <input
                type="range" min="1" max="10"
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-2 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: color }}
            />
        </div>
    );
}

function documentsFromVendors(vendors: VendorProposal[]): DecisionDocument[] {
    // Mock converting vendor proposals back to decision documents for the engine
    return vendors.map(v => ({
        id: v.documentId,
        name: `${v.vendorName} Proposal`,
        type: 'rfp',
        uploadDate: new Date(),
        status: 'ready',
        extractedFacts: v.extractedFacts.map(f => ({
            field: f.field,
            value: f.value,
            confidence: 0.95,
            originalText: f.quote
        }))
    }));
}
