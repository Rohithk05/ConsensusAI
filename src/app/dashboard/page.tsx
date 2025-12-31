'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ScenarioBuilder from '@/components/dashboard/ScenarioBuilder';
import NegotiationWorkspace from '@/components/negotiation/NegotiationWorkspace';
import ModuleSelector from '@/components/dashboard/ModuleSelector';
import { Scenario, DecisionModule, DecisionDocument } from '@/types';
import { LayoutDashboard, History, Settings, SplitSquareHorizontal, X, Layers, ChevronRight, UploadCloud, FileText, Trash2, Loader2, Bot, Plus, ArrowRight } from 'lucide-react';
import { clsx } from "clsx";
import { parseDocument } from '@/lib/documentParser';

interface ProjectContext {
    title: string;
    goal: string;
    documents: DecisionDocument[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
    const [activeModule, setActiveModule] = useState<DecisionModule | null>(null);
    const [primary, setPrimary] = useState<Scenario | null>(null);
    const [secondary, setSecondary] = useState<Scenario | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [setupData, setSetupData] = useState({ title: '', goal: '' });
    const [setupDocs, setSetupDocs] = useState<DecisionDocument[]>([]);

    // Persistence Logic
    useEffect(() => {
        const savedProject = sessionStorage.getItem('projectContext');
        if (savedProject) setProjectContext(JSON.parse(savedProject));
        const savedModule = sessionStorage.getItem('activeModule') as DecisionModule | null;
        if (savedModule) setActiveModule(savedModule);
    }, []);

    const handleSetActiveModule = (mod: DecisionModule) => {
        setActiveModule(mod);
        sessionStorage.setItem('activeModule', mod);
        if (mod === 'vendor_eval') {
            router.push('/vendor-eval');
        }
    };

    const handleProjectSubmit = () => {
        const context = { ...setupData, documents: setupDocs };
        setProjectContext(context);
        sessionStorage.setItem('projectContext', JSON.stringify(context));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsProcessing(true);
            try {
                const doc = await parseDocument(e.target.files[0]);
                setSetupDocs(prev => [...prev, doc]);
            } catch (err) {
                console.error(err);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleStartPrimary = (data: Omit<Scenario, 'id'>) => {
        setPrimary({ ...data, id: crypto.randomUUID() });
    };

    const handleStartSecondary = (data: Omit<Scenario, 'id'>) => {
        setSecondary({ ...data, id: crypto.randomUUID() });
    };

    const enableComparison = () => {
        setIsComparing(true);
    };

    const closeComparison = () => {
        setIsComparing(false);
        setSecondary(null);
    };

    const handleReset = () => {
        setPrimary(null);
        setSecondary(null);
        setIsComparing(false);
    };

    const handleExitModule = () => {
        handleReset();
        setActiveModule(null);
        sessionStorage.removeItem('activeModule');
    };

    const handleNewProject = () => {
        handleExitModule();
        setProjectContext(null);
        setSetupData({ title: '', goal: '' });
        setSetupDocs([]);
        sessionStorage.removeItem('projectContext');
    };

    const getContextTitle = (id: DecisionModule | null) => {
        if (!id) return '';
        const titles: Record<string, string> = {
            general: 'Strategic Decision',
            vendor_eval: 'Vendor Evaluation',
            roadmap_prd: 'PRD Generator',
            policy_compliance: 'Policy Review',
            project_planning: 'Project Audit'
        };
        return titles[id] || id;
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] font-sans">
            {/* Minimal Logic Rail */}
            <aside className="w-[200px] flex flex-col pt-8 pb-4 px-4 hidden md:flex">
                <div className="mb-8 px-2">
                    <h1 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] opacity-50 uppercase">ConsensusAI</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem icon={<Plus size={16} />} label="New Project" onClick={handleNewProject} />
                    <div className="h-4" />
                    <SidebarItem icon={<LayoutDashboard size={16} />} label="Scenarios" active={!!projectContext && !primary} onClick={handleExitModule} disabled={!projectContext} />
                    <SidebarItem icon={<History size={16} />} label="History" disabled={!projectContext} />

                    {projectContext && (
                        <div className="pt-8 px-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 opacity-40">Active Project</h2>
                            <div className="p-3 rounded-md bg-[var(--bg-card)] border border-primary/10">
                                <p className="text-xs font-bold text-white truncate mb-1">{projectContext.title}</p>
                                <p className="text-[10px] text-muted truncate">{projectContext.goal}</p>
                            </div>
                        </div>
                    )}

                    {activeModule && (
                        <div className="pt-4 px-2">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 opacity-40">Selected Scenario</h2>
                            <button
                                onClick={handleExitModule}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-all group"
                            >
                                <span className="flex items-center gap-2">
                                    <Layers size={14} /> {getContextTitle(activeModule)}
                                </span>
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    )}
                </nav>

                <div className="mt-auto px-2">
                    <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-[var(--border-active)] flex items-center justify-center text-[10px] text-white">U</div>
                        <span className="text-sm font-medium text-[var(--text-muted)]">User</span>
                    </div>
                </div>
            </aside>

            {/* Main Decision Canvas */}
            <main className="flex-1 overflow-hidden flex flex-col relative">
                <header className="h-20 flex items-center justify-between px-16 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-medium tracking-tight">
                            {primary ? primary.title : activeModule ? getContextTitle(activeModule) : projectContext ? 'Select Negotiation Scenario' : 'Project Definition'}
                        </h2>
                        {projectContext && !primary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                                Project: {projectContext.title}
                            </span>
                        )}
                        {isComparing && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
                                Comparison Active
                            </span>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {primary && !isComparing && (
                            <button onClick={enableComparison} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-2">
                                <SplitSquareHorizontal size={16} /> Compare
                            </button>
                        )}
                        {isComparing && (
                            <button onClick={closeComparison} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-2">
                                <X size={16} /> Exit
                            </button>
                        )}
                        {primary && (
                            <button onClick={handleReset} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                                End Session
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto relative">
                    {!projectContext ? (
                        <div className="h-full flex flex-col items-center justify-center p-16 animate-fade-in max-w-4xl mx-auto">
                            <div className="w-full space-y-12">
                                <div className="text-center">
                                    <h2 className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4">Step 1: Context Definition</h2>
                                    <h1 className="text-5xl font-black mb-6 tracking-tighter text-white">Initialize Project Reasoning</h1>
                                    <p className="text-[var(--text-muted)] text-xl font-light">Ground the ConsensusAI engine in your project's specific objectives and data.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary">Project Title</label>
                                            <input
                                                className="w-full bg-[var(--bg-card)] border-b-2 border-[var(--border-subtle)] focus:border-primary px-4 py-3 text-2xl font-medium transition-all outline-none text-white"
                                                placeholder="e.g. Q1 Infra Modernization"
                                                value={setupData.title}
                                                onChange={e => setSetupData({ ...setupData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary">Primary Goal</label>
                                            <textarea
                                                className="w-full bg-[var(--bg-card)] border-b-2 border-[var(--border-subtle)] focus:border-primary px-4 py-3 text-lg transition-all outline-none text-muted resize-none h-32"
                                                placeholder="What is the strategic outcome we are optimizing for?"
                                                value={setupData.goal}
                                                onChange={e => setSetupData({ ...setupData, goal: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-xs font-bold uppercase tracking-widest text-primary">Supporting Documents (Optional)</label>
                                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-card)]/30 hover:bg-primary/5 hover:border-primary transition-all cursor-pointer group relative overflow-hidden">
                                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                                <UploadCloud className="w-12 h-12 mb-3 text-muted group-hover:text-primary transition-colors" />
                                                <p className="text-sm font-medium mb-1">Upload PRD, Proposal, or Spec</p>
                                                <p className="text-[10px] text-dim">Drag and drop or click to browse</p>
                                            </div>
                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
                                            {isProcessing && (
                                                <div className="absolute inset-0 bg-[var(--bg-app)]/80 backdrop-blur-md flex flex-col items-center justify-center">
                                                    <Loader2 className="animate-spin text-primary mb-2" size={32} />
                                                    <p className="font-bold text-primary uppercase tracking-widest text-[10px]">Processing...</p>
                                                </div>
                                            )}
                                        </label>

                                        <div className="space-y-2">
                                            {setupDocs.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] group">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={16} className="text-primary" />
                                                        <span className="text-sm font-medium text-white truncate max-w-[200px]">{doc.name}</span>
                                                    </div>
                                                    <button onClick={() => setSetupDocs(prev => prev.filter(d => d.id !== doc.id))} className="p-1 hover:text-danger hover:bg-danger/10 rounded transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-center">
                                    <button
                                        disabled={!setupData.title || !setupData.goal}
                                        onClick={handleProjectSubmit}
                                        className="btn btn-primary text-xl px-16 py-5 rounded-full shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale group"
                                    >
                                        Establish Decision Context <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : !activeModule ? (
                        <div className="h-full flex flex-col animate-fade-in max-w-6xl mx-auto py-12 px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4">Step 2: Negotiation Scenario</h2>
                                <h1 className="text-6xl font-black mb-4 tracking-tighter text-white">Target Your Decision</h1>
                                <p className="text-[var(--text-muted)] text-xl font-light">Select a specialized reasoning module for your <strong>{projectContext.title}</strong> context.</p>
                            </div>

                            <ModuleSelector selected={activeModule || 'general'} onSelect={handleSetActiveModule} />
                        </div>
                    ) : !primary ? (
                        <div className="h-full flex flex-col animate-fade-in max-w-5xl mx-auto py-12 px-8">
                            <ScenarioBuilder
                                onStart={handleStartPrimary}
                                activeModule={activeModule}
                                initialData={{
                                    title: projectContext.title,
                                    description: projectContext.goal,
                                    documents: projectContext.documents
                                }}
                            />
                        </div>
                    ) : (
                        <div className={clsx("h-full grid", isComparing ? "grid-cols-2 divide-x divide-[var(--border-subtle)]" : "grid-cols-1")}>
                            {/* Primary Workspace */}
                            <div className="h-full overflow-hidden p-8 relative">
                                {isComparing && <div className="absolute top-4 right-8 z-10 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Baseline</div>}
                                <NegotiationWorkspace scenario={primary} />
                            </div>

                            {/* Secondary Workspace or Builder */}
                            {isComparing && (
                                <div className="h-full overflow-hidden p-8 relative bg-[var(--bg-app)]">
                                    <div className="absolute top-4 right-8 z-10 text-[10px] font-bold tracking-widest text-primary uppercase">Challenger</div>
                                    {!secondary ? (
                                        <div className="h-full flex flex-col justify-center animate-fade-in">
                                            <div className="max-w-xl mx-auto w-full">
                                                <h3 className="text-center text-lg text-[var(--text-muted)] mb-8 font-normal">Configure alternative parameters</h3>
                                                <ScenarioBuilder
                                                    onStart={handleStartSecondary}
                                                    initialData={primary!}
                                                    activeModule={activeModule!}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <NegotiationWorkspace scenario={secondary} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200",
                active
                    ? "text-white bg-[var(--bg-card)] font-medium shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]",
                disabled && "opacity-30 cursor-not-allowed grayscale"
            )}
        >
            <span className={clsx("transition-colors", active ? "text-primary" : "text-[var(--text-dim)]")}>{icon}</span>
            {label}
        </button>
    )
}
