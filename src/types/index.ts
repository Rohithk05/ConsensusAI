export type AgentRole = 'budget' | 'timeline' | 'quality' | 'risk' | 'coordinator';

export interface AgentState {
    id: string;
    role: AgentRole;
    name: string;
    color: string;
    status: 'idle' | 'analyzing' | 'proposing' | 'voting' | 'waiting';
    currentProposal: string | null;
    reasoning: string[]; // Internal logs of thought process
    latestResponse: AgentResponse | null;
}

export interface DecisionDocument {
    id: string;
    name: string;
    type: 'contract' | 'rfp' | 'policy' | 'spec';
    uploadDate: Date;
    status: 'processing' | 'ready' | 'error';
    extractedFacts: {
        field: 'budget' | 'timeline' | 'quality' | 'risk';
        value: number;
        confidence: number;
        originalText: string;
    }[];
}

export interface AgentResponse {
    step: number; // Negotiation round
    decision: 'accept' | 'reject' | 'propose';
    content: string; // The text explanation
    modifications?: Record<string, any>; // Proposed numerical changes
    evidence?: {
        documentId: string;
        quote: string;
        explanation: string;
    }[]; // New: Evidence backing the decision
}

export type DecisionModule = 'general' | 'vendor_eval' | 'roadmap_prd' | 'policy_compliance' | 'project_planning';

export interface VendorProposal {
    id: string;
    vendorName: string;
    documentId: string;
    metrics: {
        budget: number;
        timeline: number;
        quality: number;
        risk: number;
    };
    extractedFacts: {
        field: 'budget' | 'timeline' | 'quality' | 'risk';
        value: number;
        quote: string;
    }[];
}

export interface Scenario {
    id: string;
    title: string;
    description: string;
    module: DecisionModule; // New: Context of the decision
    documents: DecisionDocument[];
    vendors?: VendorProposal[]; // New: For vendor evaluation module
    constraints: {
        budget: number; // Max budget in USD
        timeline: number; // Max days
        qualityMin: number; // 0-100 score
        riskMax: number; // 0-100 score
    };
    priorities: {
        budget: number; // 1-10
        timeline: number;
        quality: number;
        risk: number;
    };
}

export interface NegotiationState {
    scenario: Scenario;
    round: number;
    status: 'active' | 'converged' | 'failed';
    agents: AgentState[];
    history: NegotiationRound[];
}

export interface NegotiationRound {
    roundNumber: number;
    proposals: { agentId: string; response: AgentResponse }[];
    summary: string;
}
