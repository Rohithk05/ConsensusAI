'use client';

import { useState } from 'react';
import { Bot, DollarSign, Clock, Play, ChevronRight, ArrowLeft, UploadCloud, FileText, Trash2, Loader2, FileCheck, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { Scenario, DecisionDocument, DecisionModule } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { parseDocument } from '@/lib/documentParser';
import { useRouter } from 'next/navigation';
import ModuleSelector from './ModuleSelector';

interface ScenarioBuilderProps {
    onStart: (scenario: Omit<Scenario, 'id'>) => void;
    initialData?: Partial<Scenario>;
    activeModule?: DecisionModule;
}

export default function ScenarioBuilder({ onStart, initialData, activeModule }: ScenarioBuilderProps) {
    const router = useRouter();

    // Logic to determine initial step
    // If we have a project context (title/goal), we can skip to Step 3 (Constraints)
    const hasContext = initialData?.title && initialData?.description;
    const initialStep = activeModule ? (hasContext ? 3 : 1) : 0;

    const [step, setStep] = useState(initialStep);
    const [documents, setDocuments] = useState<DecisionDocument[]>(initialData?.documents || []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedModule, setSelectedModule] = useState<DecisionModule>(activeModule || 'general');

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        budget: initialData?.constraints?.budget || 0, // Reset to 0 to show extraction effect
        timeline: initialData?.constraints?.timeline || 0,
        minQuality: initialData?.constraints?.qualityMin || 80,
        maxRisk: initialData?.constraints?.riskMax || 20
    });

    const [priorities, setPriorities] = useState({
        budget: initialData?.priorities?.budget || 5,
        timeline: initialData?.priorities?.timeline || 5,
        quality: initialData?.priorities?.quality || 8,
        risk: initialData?.priorities?.risk || 7
    });

    // Decision Readiness Logic
    const isStep1Ready = formData.title.length > 3 && formData.description.length > 10;

    // Handle File Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsProcessing(true);
            const file = e.target.files[0];
            try {
                // Simulate intelligent parsing
                const doc = await parseDocument(file);
                setDocuments(prev => [...prev, doc]);

                // Auto-map constraints from extracted facts
                const newFormData = { ...formData };
                doc.extractedFacts.forEach(fact => {
                    if (fact.field === 'budget') newFormData.budget = fact.value;
                    if (fact.field === 'timeline') newFormData.timeline = fact.value;
                    if (fact.field === 'quality') newFormData.minQuality = fact.value;
                    if (fact.field === 'risk') newFormData.maxRisk = fact.value;
                });
                setFormData(newFormData);
            } catch (error) {
                console.error("Extraction failed", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // Trade-off Prediction
    const getPrediction = () => {
        const sorted = Object.entries(priorities).sort((a, b) => b[1] - a[1]);
        const top = sorted[0];
        const bottom = sorted[3];
        return {
            likelyWinner: top[0],
            likelySacrifice: bottom[0]
        }
    };
    const prediction = getPrediction();

    const handleSubmit = () => {
        onStart({
            title: formData.title || 'Untitled Decision',
            description: formData.description || 'No description provided',
            module: selectedModule, // Include selected module
            documents, // Attach documents
            constraints: {
                budget: formData.budget || 50000,
                timeline: formData.timeline || 30,
                qualityMin: formData.minQuality,
                riskMax: formData.maxRisk
            },
            priorities
        });
    };

    return (
        <div className="canvas-container justify-center relative">

            {/* Readiness Indicator (Floating Header) */}
            <div className="absolute top-0 left-0 right-0 py-6 flex justify-between items-center px-4">
                <div className="flex items-center gap-2 text-muted">
                    <span className={clsx("w-2 h-2 rounded-full", step >= 4 ? "bg-success" : "bg-warning")}></span>
                    <span className="text-sm font-mono uppercase tracking-widest text-xs">
                        {step === 0 ? "Select Context" : step === 1 ? "Drafting Intent" : step === 2 ? "Document Intelligence" : step === 3 ? "Defining Constraints" : "Finalizing Strategy"}
                    </span>
                </div>

                <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map(s => (
                        <div key={s} className={clsx("h-1 w-8 rounded-full transition-all", s <= step ? "bg-primary" : "bg-[var(--border-subtle)]")} />
                    ))}
                </div>
            </div>

            {hasContext && step > 0 && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-4 py-2 px-4 rounded-full bg-primary/5 border border-primary/10 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase text-muted">Inherited Context:</span>
                        <span className="text-xs font-bold text-white max-w-[150px] truncate">{initialData.title}</span>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">

                {/* SCREEN 0: MODULE SELECTION */}
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full max-w-6xl mx-auto"
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold mb-4">Choose Decision Context</h1>
                            <p className="text-muted text-lg">Select a specialized module to guide the negotiation logic.</p>
                        </div>

                        <ModuleSelector selected={selectedModule} onSelect={setSelectedModule} />

                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => {
                                    if (selectedModule === 'vendor_eval') {
                                        router.push('/vendor-eval');
                                    } else {
                                        setStep(1);
                                    }
                                }}
                                className="btn btn-primary text-lg px-12 py-4 rounded-full transition-all shadow-xl shadow-primary/20 hover:scale-105"
                            >
                                Start '{selectedModule === 'general' ? 'General' : selectedModule === 'vendor_eval' ? 'Vendor' : selectedModule === 'roadmap_prd' ? 'PRD' : selectedModule === 'policy_compliance' ? 'Compliance' : 'Project'}' Decision <ChevronRight />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* SCREEN 1: DECISION INTENT */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-2xl mx-auto text-center"
                    >
                        <h1 className="text-4xl font-bold mb-8">What are we deciding today?</h1>

                        <div className="space-y-8 mb-12">
                            <div>
                                <input
                                    className="input-minimal text-center text-3xl placeholder:text-[var(--border-active)]"
                                    placeholder="Enter Decision Title..."
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <textarea
                                    className="input-minimal text-xl text-center resize-none"
                                    rows={2}
                                    placeholder="What is the primary business goal?"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ minHeight: '100px', borderBottom: '1px solid var(--border-subtle)' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => isStep1Ready && setStep(2)}
                            disabled={!isStep1Ready}
                            className={clsx("btn btn-primary text-lg px-8 py-4 rounded-full transition-all", !isStep1Ready && "opacity-50 cursor-not-allowed")}
                        >
                            Upload Supporting Docs <ChevronRight />
                        </button>
                    </motion.div>
                )}

                {/* SCREEN 2: SUPPORTING DOCUMENTS (NEW) */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full max-w-3xl mx-auto"
                    >
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-bold mb-2">Evidence & Grounding</h1>
                            <p className="text-muted">Upload contracts, RFPs, or policies. We'll extract the constraints.</p>
                        </div>

                        {/* Upload Zone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="space-y-4">
                                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-card-hover)] hover:border-primary transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-12 h-12 mb-4 text-muted group-hover:text-primary transition-colors" />
                                        <p className="mb-2 text-sm text-[var(--text-main)]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted">PDF, TXT (MAX. 10MB)</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".pdf,.txt,.doc,.docx" onChange={handleFileUpload} disabled={isProcessing} />

                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                            <Loader2 className="animate-spin text-primary mb-2" size={32} />
                                            <span className="text-sm font-bold text-white">Extracting Business Facts...</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Document List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-2">Processed Documents</h3>
                                {documents.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-card)] text-muted italic text-sm p-8 text-center">
                                        No documents uploaded. Agents will rely solely on manual inputs.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {documents.map(doc => (
                                            <motion.div
                                                layout
                                                key={doc.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="p-4 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] flex justify-between items-start group"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="p-2 bg-primary/10 rounded text-primary h-fit">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm mb-1">{doc.name}</div>
                                                        <div className="flex gap-2 text-xs">
                                                            <span className="px-1.5 py-0.5 bg-[var(--bg-app)] rounded border border-[var(--border-subtle)] uppercase text-[10px]">{doc.type}</span>
                                                            <span className="text-success flex items-center gap-1"><FileCheck size={10} /> {doc.extractedFacts.length} Facts Extracted</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setDocuments(docs => docs.filter(d => d.id !== doc.id))} className="text-muted hover:text-danger p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 mt-12">
                            <button onClick={() => setStep(1)} className="btn btn-secondary px-6">Back</button>
                            <button onClick={() => setStep(3)} className="btn btn-primary px-8 text-lg">
                                Review Constraints <ChevronRight />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* SCREEN 3: CONSTRAINTS */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full max-w-4xl mx-auto"
                    >
                        <h1 className="text-3xl font-bold mb-12 text-center">Establish Hard Boundaries</h1>

                        <div className="grid grid-cols-2 gap-16 mb-12">
                            {/* Budget */}
                            <div className="group">
                                <label className="label text-success mb-4 flex items-center gap-2">
                                    <DollarSign size={18} /> Max Budget
                                    {documents.some(d => d.extractedFacts.some(f => f.field === 'budget')) && (
                                        <span className="ml-auto text-xs px-2 py-0.5 bg-success/10 text-success rounded-full flex items-center gap-1">
                                            <FileCheck size={12} /> Auto-filled from Doc
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl text-muted font-light">$</span>
                                    <input
                                        type="number"
                                        className="input-minimal pl-12 text-5xl font-light"
                                        value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-muted mt-2">Ceiling for total expenditure.</p>
                            </div>

                            {/* Timeline */}
                            <div className="group">
                                <label className="label text-warning mb-4 flex items-center gap-2">
                                    <Clock size={18} /> Deadline
                                    {documents.some(d => d.extractedFacts.some(f => f.field === 'timeline')) && (
                                        <span className="ml-auto text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full flex items-center gap-1">
                                            <FileCheck size={12} /> Auto-filled from Doc
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="input-minimal text-5xl font-light"
                                        value={formData.timeline}
                                        onChange={e => setFormData({ ...formData, timeline: Number(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl text-muted font-light">Days</span>
                                </div>
                                <p className="text-muted mt-2">Hard stop for completion.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-16 mb-12 pt-8 border-t border-[var(--border-subtle)]">
                            <div>
                                <label className="label text-secondary mb-2">Min Quality (0-100)</label>
                                <input type="range" min="0" max="100" className="w-full h-2 bg-[var(--bg-card)] rounded-lg appearance-none cursor-pointer"
                                    style={{ accentColor: 'var(--secondary)' }}
                                    value={formData.minQuality} onChange={e => setFormData({ ...formData, minQuality: Number(e.target.value) })} />
                                <div className="text-right text-xl font-bold text-secondary mt-2">{formData.minQuality}</div>
                            </div>
                            <div>
                                <label className="label text-danger mb-2">Max Risk Tolerance (0-100)</label>
                                <input type="range" min="0" max="100" className="w-full h-2 bg-[var(--bg-card)] rounded-lg appearance-none cursor-pointer"
                                    style={{ accentColor: 'var(--danger)' }}
                                    value={formData.maxRisk} onChange={e => setFormData({ ...formData, maxRisk: Number(e.target.value) })} />
                                <div className="text-right text-xl font-bold text-danger mt-2">{formData.maxRisk}</div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => setStep(2)} className="btn btn-secondary px-6">Back</button>
                            <button onClick={() => setStep(4)} className="btn btn-primary px-8 text-lg" disabled={formData.budget <= 0 || formData.timeline <= 0}>
                                Set Priorities <ChevronRight />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* SCREEN 4: PRIORITIES & PREVIEW */}
                {step === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-5xl mx-auto"
                    >
                        <h1 className="text-3xl font-bold mb-2 text-center">Strategic Weighting</h1>
                        <p className="text-center text-muted mb-12">Who has the final say?</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                            {/* Sliders Area */}
                            <div className="space-y-8">
                                <PriorityRow label="Cost Efficiency" color="var(--success)" value={priorities.budget} onChange={v => setPriorities({ ...priorities, budget: v })} />
                                <PriorityRow label="Speed to Market" color="var(--warning)" value={priorities.timeline} onChange={v => setPriorities({ ...priorities, timeline: v })} />
                                <PriorityRow label="Quality Assurance" color="var(--secondary)" value={priorities.quality} onChange={v => setPriorities({ ...priorities, quality: v })} />
                                <PriorityRow label="Risk Mitigation" color="var(--danger)" value={priorities.risk} onChange={v => setPriorities({ ...priorities, risk: v })} />
                            </div>

                            {/* Predictive Preview Panel */}
                            <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border-subtle)] flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <Bot className="text-primary" /> Simulation Preview
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-[var(--bg-panel)] rounded-lg border-l-4 border-success">
                                            <div className="text-xs uppercase text-muted font-bold mb-1">Likely Priority</div>
                                            <div className="text-lg capitalize text-main">{prediction.likelyWinner} Optimization</div>
                                        </div>

                                        <div className="p-4 bg-[var(--bg-panel)] rounded-lg border-l-4 border-danger">
                                            <div className="text-xs uppercase text-muted font-bold mb-1">Likely Compromise</div>
                                            <div className="text-lg capitalize text-main">{prediction.likelySacrifice} Constraints</div>
                                        </div>

                                        <div className="mt-4 text-sm text-muted italic">
                                            "Based on your inputs, the Coordinator Agent will statistically favor {prediction.likelyWinner} over {prediction.likelySacrifice} during conflict resolution."
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] space-y-4">
                                    <button onClick={handleSubmit} className="btn btn-primary w-full py-4 text-lg justify-center shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                        <Play size={20} fill="currentColor" /> Run Negotiation
                                    </button>
                                    <button onClick={() => setStep(3)} className="btn btn-secondary w-full justify-center border-none text-muted"> <ArrowLeft size={16} /> Adjust Constraints</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}

function PriorityRow({ label, color, value, onChange }: { label: string, color: string, value: number, onChange: (v: number) => void }) {
    return (
        <div className="group">
            <div className="flex justify-between mb-2">
                <label className="font-bold text-lg" style={{ color: value > 7 ? color : 'var(--text-muted)' }}>{label}</label>
                <span className="font-mono text-xl">{value}</span>
            </div>
            <input
                type="range" min="1" max="10"
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-[var(--bg-panel)] border border-[var(--border-subtle)]"
                style={{ accentColor: color }}
            />
        </div>
    )
}
