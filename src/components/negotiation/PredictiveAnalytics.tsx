'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle, Calendar, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Scenario } from '@/types';
import { clsx } from 'clsx';

interface PredictiveAnalyticsProps {
    scenario: Scenario;
    currentRisk: number;
}

export default function PredictiveAnalytics({ scenario, currentRisk }: PredictiveAnalyticsProps) {
    // Simulate predictive data based on scenario constraints
    const forecast = useMemo(() => {
        const months = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];
        const baseRisk = currentRisk || 20;

        return months.map((month, i) => {
            // Risk increases over time if budget is low or timeline is tight
            let riskFactor = baseRisk + (i * 5);
            if (scenario.constraints.budget < 50000) riskFactor += (i * 3);
            if (scenario.constraints.timeline < 30) riskFactor += (i * 8); // Tight deadlines degrade fast

            return {
                month,
                riskScore: Math.min(100, Math.round(riskFactor)),
                resourceUtil: Math.min(120, 60 + (i * 10)), // Resources get squeezed
                velocity: Math.max(0, 100 - (i * 12)) // Velocity drops as tech debt grows
            };
        });
    }, [scenario, currentRisk]);

    const criticalEventMonth = forecast.findIndex(f => f.riskScore > 80);

    return (
        <div className="card h-full flex flex-col animate-fade-in relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="text-primary" size={20} />
                        Prophet™ Predictive Forecast
                    </h3>
                    <p className="text-sm text-muted">6-Month Trajectory & Risk Horizon</p>
                </div>
                {criticalEventMonth !== -1 && (
                    <div className="px-3 py-1 bg-danger/10 border border-danger/20 rounded-full flex items-center gap-2 text-xs font-bold text-danger animate-pulse">
                        <AlertTriangle size={14} />
                        CRITICAL FAILURE PREDICTED: {forecast[criticalEventMonth].month}
                    </div>
                )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <MetricCard
                    label="Project Velocity"
                    value={`${forecast[0].velocity}%`}
                    trend="decreasing"
                    trendValue="-12% / mo"
                    icon={<ArrowDownRight size={16} className="text-danger" />}
                />
                <MetricCard
                    label="Resource Load"
                    value={`${forecast[0].resourceUtil}%`}
                    trend="increasing"
                    trendValue="+10% / mo"
                    icon={<Users size={16} className="text-warning" />}
                />
                <MetricCard
                    label="Est. Completion"
                    value={`${Math.round(scenario.constraints.timeline * 1.2)} Days`}
                    trend="neutral"
                    trendValue="+20% Buffer"
                    icon={<Calendar size={16} className="text-primary" />}
                />
            </div>

            {/* Visual Graph: Risk Horizon */}
            <div className="flex-1 flex items-end gap-2 relative min-h-[150px] border-b border-[var(--border-subtle)] pb-2 px-2">
                <div className="absolute top-0 left-0 text-xs text-muted font-mono tracking-widest opacity-50">RISK INDEX (0-100)</div>
                {forecast.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-2 group relative">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${d.riskScore}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={clsx(
                                "w-full rounded-t-sm transition-all relative",
                                d.riskScore > 80 ? "bg-danger" : d.riskScore > 50 ? "bg-warning" : "bg-success"
                            )}
                        >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border-subtle)] z-10">
                                Risk: {d.riskScore}
                            </span>
                        </motion.div>
                        <span className="text-xs text-center text-muted font-mono uppercase truncate">{d.month}</span>
                    </div>
                ))}

                {/* Horizontal Threshold Line */}
                <div className="absolute top-[20%] left-0 right-0 border-t border-dashed border-danger/50 pointer-events-none">
                    <span className="text-[10px] text-danger/70 absolute -top-4 right-0">CRITICAL THRESHOLD</span>
                </div>
            </div>

            <div className="mt-4 p-4 bg-[var(--bg-panel)] rounded-lg text-sm text-[var(--text-dim)] border-l-4 border-primary italic">
                "Based on current constraints, resource saturation is predicted by {forecast[2].month}. Recommendation: Increase Budget by 15% to maintain velocity."
            </div>
        </div>
    );
}

function MetricCard({ label, value, trend, trendValue, icon }: any) {
    return (
        <div className="p-4 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)]">
            <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-muted uppercase">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-mono font-light text-main mb-1">{value}</div>
            <div className={clsx("text-xs flex items-center gap-1",
                trend === 'increasing' ? "text-warning" : trend === 'decreasing' ? "text-danger" : "text-success"
            )}>
                {trendValue}
            </div>
        </div>
    )
}
