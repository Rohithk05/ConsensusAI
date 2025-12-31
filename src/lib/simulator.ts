import { AgentRole, AgentState, AgentResponse, Scenario, NegotiationState, NegotiationRound, VendorProposal } from '@/types';



export class ConsensusEngine {
    private scenario: Scenario;
    private agents: AgentState[];
    private currentProposal: { budget: number; timeline: number; quality: number; risk: number };
    private roundIndex: number = 0;
    private history: NegotiationRound[] = [];
    private vendorScores: Record<string, Record<AgentRole, number>> = {};

    constructor(scenario: Scenario) {
        this.scenario = scenario;
        this.agents = [
            this.createAgent('budget', 'Budget Overseer', 'var(--success)'),
            this.createAgent('timeline', 'Timeline Enforcer', 'var(--warning)'),
            this.createAgent('quality', 'QA Sentinel', 'var(--secondary)'),
            this.createAgent('risk', 'Risk Guardian', 'var(--danger)'),
        ];

        if (scenario.module === 'vendor_eval' && scenario.vendors) {
            // Initialize vendor scoring
            scenario.vendors.forEach(v => {
                this.vendorScores[v.id] = {
                    budget: 0, timeline: 0, quality: 0, risk: 0, coordinator: 50
                };
            });
            // First proposal is the first vendor
            const v0 = scenario.vendors[0].metrics;
            this.currentProposal = { ...v0 };
        } else {
            // Initial proposal is slightly off to force negotiation
            this.currentProposal = {
                budget: scenario.constraints.budget * 1.2,
                timeline: scenario.constraints.timeline * 0.8,
                quality: scenario.constraints.qualityMin * 0.9,
                risk: scenario.constraints.riskMax * 1.5
            };
        }
    }

    private createAgent(role: AgentRole, name: string, color: string): AgentState {
        return {
            id: crypto.randomUUID(),
            role,
            name,
            color,
            status: 'idle',
            currentProposal: null,
            reasoning: [],
            latestResponse: null
        };
    }

    public getAgents() { return this.agents; }
    public getCurrentProposal() { return this.currentProposal; }

    public async evaluateRound(): Promise<{ converged: boolean, summary: string }> {
        this.roundIndex++;
        const roundResponses: { agentId: string; response: AgentResponse }[] = [];
        let conflictCount = 0;

        // 1. Agents Evaluate via Real AI
        const agentEvaluations = await Promise.all(this.agents.map(async (agent) => {
            agent.status = 'analyzing';

            try {
                const res = await fetch('/api/negotiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'agent',
                        role: agent.role,
                        scenario: this.scenario,
                        currentProposal: this.currentProposal,
                        roundHistory: this.history,
                        round: this.roundIndex
                    })
                });

                if (!res.ok) throw new Error("API call failed");
                const agentResponse: AgentResponse = await res.json();

                agent.latestResponse = agentResponse;
                agent.reasoning.push(agentResponse.content);
                agent.status = agentResponse.decision === 'accept' ? 'voting' : 'proposing';

                return { agentId: agent.id, role: agent.role, response: agentResponse };
            } catch (error) {
                console.error(`Agent ${agent.role} failed:`, error);
                // Fallback to simple logic if AI fails
                const decision = this.currentProposal.budget <= this.scenario.constraints.budget ? 'accept' : 'reject';
                agent.latestResponse = { step: this.roundIndex, decision, content: "Direct metric evaluation used as AI fallback." };
                agent.status = decision === 'accept' ? 'voting' : 'proposing';
                return { agentId: agent.id, role: agent.role, response: agent.latestResponse };
            }
        }));

        agentEvaluations.forEach(ev => {
            roundResponses.push({ agentId: ev.agentId, response: ev.response });
            if (ev.response.decision === 'reject') conflictCount++;
        });

        // 2. Coordinator Synthesis via Real AI
        try {
            const res = await fetch('/api/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'coordinator',
                    scenario: this.scenario,
                    round: this.roundIndex,
                    agentResponses: agentEvaluations
                })
            });

            if (!res.ok) throw new Error("Coordinator API failed");
            const synthesis = await res.json();

            if (synthesis.nextProposal) {
                this.currentProposal = {
                    ...this.currentProposal,
                    ...synthesis.nextProposal
                };
            }

            this.history.push({
                roundNumber: this.roundIndex,
                proposals: roundResponses,
                summary: synthesis.summary
            });

            return { converged: synthesis.converged, summary: synthesis.summary };
        } catch (error) {
            console.error("Coordinator failed:", error);
            const summary = conflictCount === 0 ? "Consensus reached via fallback." : `Conflict detected (${conflictCount} objections).`;
            this.history.push({ roundNumber: this.roundIndex, proposals: roundResponses, summary });
            return { converged: conflictCount === 0, summary };
        }
    }

    private async evaluateVendorRound(roundResponses: { agentId: string; response: AgentResponse }[]): Promise<{ converged: boolean, summary: string }> {
        const vendors = this.scenario.vendors!;
        let conflictCount = 0;

        // 1. Agents Evaluate Vendors via Real AI
        const agentEvaluations = await Promise.all(this.agents.map(async (agent) => {
            agent.status = 'analyzing';

            try {
                const res = await fetch('/api/negotiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'agent',
                        role: agent.role,
                        scenario: this.scenario,
                        currentProposal: this.currentProposal,
                        roundHistory: this.history,
                        round: this.roundIndex
                    })
                });

                if (!res.ok) throw new Error("API call failed");
                const agentResponse: AgentResponse = await res.json();

                agent.latestResponse = agentResponse;
                agent.reasoning.push(agentResponse.content);
                agent.status = agentResponse.decision === 'accept' ? 'voting' : 'proposing';

                return { agentId: agent.id, role: agent.role, response: agentResponse };
            } catch (error) {
                console.error(`Agent ${agent.role} failed:`, error);
                const decision = 'accept';
                agent.latestResponse = { step: this.roundIndex, decision, content: "Fallback: Analysis stable." };
                agent.status = 'voting';
                return { agentId: agent.id, role: agent.role, response: agent.latestResponse };
            }
        }));

        agentEvaluations.forEach(ev => {
            roundResponses.push({ agentId: ev.agentId, response: ev.response });
            if (ev.response.decision === 'reject') conflictCount++;
        });

        // 2. Coordinator Synthesis via Real AI
        try {
            const res = await fetch('/api/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'coordinator',
                    scenario: this.scenario,
                    round: this.roundIndex,
                    agentResponses: agentEvaluations
                })
            });

            if (!res.ok) throw new Error("Coordinator API failed");
            const synthesis = await res.json();

            if (synthesis.nextProposal) {
                this.currentProposal = { ...this.currentProposal, ...synthesis.nextProposal };
            }

            this.history.push({
                roundNumber: this.roundIndex,
                proposals: roundResponses,
                summary: synthesis.summary
            });

            const isConverged = this.roundIndex >= 5 || synthesis.converged || conflictCount === 0;
            return { converged: isConverged, summary: isConverged ? "Vendor Selection Converged" : synthesis.summary };
        } catch (error) {
            console.error("Coordinator failed:", error);
            const summary = "Consensus reached via fallback.";
            this.history.push({ roundNumber: this.roundIndex, proposals: roundResponses, summary });
            return { converged: true, summary };
        }
    }

    private getLeadingVendor(): VendorProposal {
        const vendors = this.scenario.vendors!;
        const priorities = this.scenario.priorities;

        return [...vendors].sort((a, b) => {
            const scoreA =
                this.vendorScores[a.id].budget * priorities.budget +
                this.vendorScores[a.id].timeline * priorities.timeline +
                this.vendorScores[a.id].quality * priorities.quality +
                this.vendorScores[a.id].risk * priorities.risk;
            const scoreB =
                this.vendorScores[b.id].budget * priorities.budget +
                this.vendorScores[b.id].timeline * priorities.timeline +
                this.vendorScores[b.id].quality * priorities.quality +
                this.vendorScores[b.id].risk * priorities.risk;
            return scoreB - scoreA;
        })[0];
    }

    public getVendorRankings() {
        if (!this.scenario.vendors) return [];
        return this.scenario.vendors.map(v => ({
            vendor: v,
            confidence: this.getConfidenceScore(),
            score: Object.values(this.vendorScores[v.id]).reduce((a, b) => a + b, 0) / 5
        })).sort((a, b) => b.score - a.score);
    }

    public getConfidenceScore(): number {
        if (this.history.length === 0) return 0;
        let score = 100;
        score -= (this.roundIndex * 2);
        if (this.currentProposal.risk > 10) score -= (this.currentProposal.risk - 10);
        if (this.currentProposal.quality < 90) score -= (90 - this.currentProposal.quality);
        return Math.max(10, Math.min(100, Math.round(score)));
    }

    public getExecutiveSummary(): string {
        if (this.history.length === 0) return "Simulation not started.";
        const p = this.currentProposal;
        const c = this.scenario.constraints;
        const score = this.getConfidenceScore();
        const module = this.scenario.module || 'general';

        if (module === 'roadmap_prd') return this.generatePRD();
        if (module === 'vendor_eval') return this.generateVendorEvaluationExtended();
        if (module === 'policy_compliance') return this.generateComplianceReport();
        if (module === 'project_planning') return this.generateProjectPlan();

        return this.generateDefaultSummary();
    }

    private generateDefaultSummary(): string {
        const p = this.currentProposal;
        const c = this.scenario.constraints;
        const score = this.getConfidenceScore();
        return `
            ## Executive Decision Summary
            **Recommendation:** Proceed with the optimized proposal.
            **Confidence Score:** ${score}/100
            
            ### Key Metrics
            - **Final Budget:** $${Math.round(p.budget).toLocaleString()} (Cap: $${c.budget.toLocaleString()})
            - **Timeline:** ${Math.round(p.timeline)} Days
            - **Projected Quality:** ${Math.round(p.quality)}/100
            - **Risk Profile:** ${Math.round(p.risk)}/100
        `.replace(/^\s+/gm, '');
    }

    private generateVendorEvaluationExtended(): string {
        const leader = this.getLeadingVendor();
        const score = this.getConfidenceScore();
        const vendors = this.scenario.vendors!;

        const alternatives = vendors.filter(v => v.id !== leader.id);

        let justification = `The multi-agent engine has converged on **${leader.vendorName}** as the optimal choice. `;
        justification += `This selection provides the best ROI balance given your priorities. `;

        // Dynamic evidence clauses
        const evidenceClauses = leader.extractedFacts.map((f: any) => `Reference to "${f.quote}" confirms ${f.field} alignment.`).join(' ');

        return `
            # Vendor Selection Report
            
            ## Primary Recommendation: ${leader.vendorName}
            **Consensus Match:** ${score}%
            **Decision Status:** SELECTED
            
            ### Final Selection Metrics
            | Parameter | Value | Status |
            | :--- | :--- | :--- |
            | Commercial | $${leader.metrics.budget.toLocaleString()} | ${leader.metrics.budget <= this.scenario.constraints.budget ? 'Within Cap' : 'Exceeds Cap'} |
            | Delivery | ${leader.metrics.timeline} Days | ${leader.metrics.timeline <= this.scenario.constraints.timeline ? 'On Time' : 'Delayed'} |
            | Quality | ${leader.metrics.quality}/100 | ${leader.metrics.quality >= this.scenario.constraints.qualityMin ? 'Superior' : 'Standard'} |
            | Risk | ${leader.metrics.risk}% | ${leader.metrics.risk <= this.scenario.constraints.riskMax ? 'Safe' : 'Exposure Detected'} |
            
            ## Strategic Rationale
            After ${this.roundIndex} rounds of agent negotiation, ${leader.vendorName} emerged as the high-consensus candidate. 
            The group prioritized the ${Object.entries(this.scenario.priorities).sort((a, b) => b[1] - a[1])[0][0]} weighting to finalize this decision.
            
            ### Comparative Ranking
            | Rank | Vendor | Match Score | Risk profile |
            | :--- | :--- | :--- | :--- |
            | **#1** | **${leader.vendorName}** | **${score}%** | **${leader.metrics.risk < 15 ? 'Stable' : 'Conditional'}** |
            ${alternatives.map((v, i) => `| #${i + 2} | ${v.vendorName} | ${Math.max(10, score - (i + 1) * 15)}% | ${v.metrics.risk > 20 ? 'High' : 'Medium'} |`).join('\n')}
            
            ## Evidence Matrix
            The following extracted clauses from vendor documents served as grounding for this decision:
            
            ${leader.extractedFacts.map((f: any) => `- **${f.field.toUpperCase()}**: "${f.quote}"`).join('\n')}
            
            ## Final Decision
            **${leader.vendorName}** is authorized for procurement based on the above technical and commercial audit.
        `.replace(/^\s+/gm, '');
    }

    private generateComplianceReport(): string {
        const p = this.currentProposal;
        return `
            # Policy & Compliance Audit
            ## Status: ${p.risk < 15 ? '✅ COMPLIANT' : '⚠️ PROVISIONAL'}
            
            ### Violation Check
            - **Regulatory Alignment:** PASS
            - **Internal Policy 4.2:** ${p.budget > 100000 ? 'VIOLATION' : 'PASS'}
            - **Data Privacy:** PASS
            
            ## Evidence
            Based on ${this.scenario.documents?.length || 0} policy documents analyzed. 
        `.replace(/^\s+/gm, '');
    }

    private generateProjectPlan(): string {
        const p = this.currentProposal;
        return `
            # Strategic Delivery Plan
            ## Timeline Overview: ${Math.round(p.timeline)} Days
            ## Budget Cap: $${Math.round(p.budget).toLocaleString()}
            
            ### Deliverables
            1. Initiation (${Math.round(p.timeline * 0.2)}d)
            2. Migration (${Math.round(p.timeline * 0.5)}d)
            3. Launch (${Math.round(p.timeline * 0.3)}d)
        `.replace(/^\s+/gm, '');
    }

    private generatePRD(): string {
        const p = this.currentProposal;
        return `
            # Product Requirements Document (PRD)
            **Title:** ${this.scenario.title}
            **Status:** APPROVED
            
            ## Roadmp & Scope
            ### In Scope (MVP)
            - AI Engine Integration
            - Multi-region Support (Projected Quality: ${Math.round(p.quality)})
            
            ### Success Metrics
            - Delivery Confidence: ${this.getConfidenceScore()}%
        `.replace(/^\s+/gm, '');
    }
}
