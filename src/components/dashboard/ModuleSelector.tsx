import { ShoppingBag, KanbanSquare, Scale, CalendarRange, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { DecisionModule } from '@/types';

interface ModuleSelectorProps {
    selected: DecisionModule;
    onSelect: (module: DecisionModule) => void;
}

const modules = [
    {
        id: 'general',
        title: 'Strategic Decision',
        icon: Sparkles,
        desc: 'General-purpose multi-agent negotiation for complex trade-offs.',
        color: 'text-primary'
    },
    {
        id: 'vendor_eval',
        title: 'Vendor Evaluation',
        icon: ShoppingBag,
        desc: 'Compare proposals, extract costs, and rank vendors against KPIs.',
        color: 'text-secondary'
    },
    {
        id: 'roadmap_prd',
        title: 'PRD Generator',
        icon: KanbanSquare,
        desc: 'Negotiate scope, auto-generate requirements, and build roadmaps.',
        color: 'text-warning'
    },
    {
        id: 'policy_compliance',
        title: 'Policy Review',
        icon: Scale,
        desc: 'Check decisions against extracted regulations and compliance docs.',
        color: 'text-danger'
    },
    {
        id: 'project_planning',
        title: 'Project Audit',
        icon: CalendarRange,
        desc: 'Scope vs Timeline negotiation for realistic delivery planning.',
        color: 'text-success'
    }
] as const;

export default function ModuleSelector({ selected, onSelect }: ModuleSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {modules.map((mod) => (
                <button
                    key={mod.id}
                    onClick={() => onSelect(mod.id as DecisionModule)}
                    className={clsx(
                        "text-left p-6 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                        selected === mod.id
                            ? "bg-[var(--bg-panel)] border-primary shadow-lg shadow-primary/10"
                            : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]"
                    )}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className={clsx("p-3 rounded-lg bg-[var(--bg-app)]", mod.color)}>
                            <mod.icon size={24} />
                        </div>
                        {selected === mod.id && (
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full animate-fade-in">Selected</span>
                        )}
                    </div>
                    <h3 className={clsx("text-lg font-bold mb-1 group-hover:text-[var(--text-main)] transition-colors", selected === mod.id ? "text-primary" : "text-[var(--text-main)]")}>
                        {mod.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                        {mod.desc}
                    </p>

                    {selected === mod.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                    )}
                </button>
            ))}
        </div>
    );
}
