import { Scenario, AgentRole, AgentResponse } from "@/types";

const API_KEY = process.env.GROQ_API_KEY || "";
const MODEL = "llama-3.3-70b-versatile";

async function generateContent(prompt: string) {
    if (!API_KEY) throw new Error("GROQ_API_KEY not set");

    const url = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API Error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

export async function getAgentReasoning(
    role: AgentRole,
    scenario: Scenario,
    currentProposal: any,
    roundHistory: any[],
    round: number
): Promise<AgentResponse> {
    const personas = {
        budget: "Budget Overseer: You care about cost efficiency and staying under the $ budget limit. You are frugal and prioritize ROI.",
        timeline: "Timeline Enforcer: You focus on deadlines and schedule feasibility. You hate delays and prioritize speed.",
        quality: "QA Sentinel: You focus on technical excellence, feature richness, and reliability. You hate cutting corners.",
        risk: "Risk Guardian: You focus on security, compliance, stability, and SLA commitments. You are cautious and risk-averse.",
        coordinator: "Executive Coordinator: You synthesize all viewpoints and propose compromises to reach consensus."
    };

    const prompt = `
        You are acting as the ${role.toUpperCase()} agent in a multi-agent negotiation system called ConsensusAI.
        
        CONTEXT:
        Project: ${scenario.title}
        Goal: ${scenario.description}
        
        CONSTRAINTS:
        - Budget: $${scenario.constraints.budget}
        - Timeline: ${scenario.constraints.timeline} Days
        - Quality Min: ${scenario.constraints.qualityMin}/100
        - Risk Max: ${scenario.constraints.riskMax}%
        
        PRIORITIES (1-10):
        - Budget: ${scenario.priorities.budget}
        - Timeline: ${scenario.priorities.timeline}
        - Quality: ${scenario.priorities.quality}
        - Risk: ${scenario.priorities.risk}
        
        CURRENT PROPOSAL BEING EVALUATED:
        - Budget: $${Math.round(currentProposal.budget)}
        - Timeline: ${Math.round(currentProposal.timeline)} Days
        - Quality: ${Math.round(currentProposal.quality)}/100
        - Risk: ${Math.round(currentProposal.risk)}%
        
        ${scenario.module === 'vendor_eval' && scenario.vendors ? `
        VENDORS INVOLVED:
        ${scenario.vendors.map(v => `- ${v.vendorName}: $${v.metrics.budget}, ${v.metrics.timeline}d, ${v.metrics.quality} quality, ${v.metrics.risk}% risk`).join('\n')}
        ` : ''}

        NEGOTIATION HISTORY:
        ${roundHistory.map(h => `Round ${h.roundNumber}: ${h.summary}`).join('\n')}

        YOUR PERSONA:
        ${personas[role]}

        YOUR TASK:
        Evaluate the current proposal based on your persona and priorities. 
        Decide whether to 'accept' or 'reject' the proposal.
        Provide a concise, professional justification (under 50 words).
        If you reject, explain what needs to change from your perspective.
        
        Return your response in strictly JSON format:
        {
            "decision": "accept" | "reject",
            "content": "your reasoning here",
            "evidence": [] 
        }
    `;

    try {
        const text = await generateContent(prompt);
        // Simple heuristic to clear markdown
        const cleanerText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanerText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("Failed to parse AI response as JSON: " + text.substring(0, 50));

        const responseData = JSON.parse(jsonMatch[0]);
        return {
            step: round,
            decision: responseData.decision,
            content: responseData.content,
            evidence: responseData.evidence
        };
    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        throw error; // Let simulator handle fallback
    }
}

export async function getCoordinatorSynthesis(
    scenario: Scenario,
    round: number,
    agentResponses: any[]
): Promise<{ summary: string, converged: boolean, nextProposal?: any }> {
    const prompt = `
        You are the Executive Coordinator for ConsensusAI.
        
        SCENARIO: ${scenario.title}
        
        AGENT FEEDBACK FOR ROUND ${round}:
        ${agentResponses.map(r => `- ${r.role}: ${r.response.decision} - ${r.response.content}`).join('\n')}
        
        YOUR TASK:
        1. Summarize the state of the negotiation (under 30 words).
        2. Determine if consensus has been reached (all agents must accept).
        3. If no consensus, suggest numerical adjustments to the proposal (Budget, Timeline, Quality, Risk) to appease the objecting agents while staying within the project constraints.
        
        Return your response in strictly JSON format:
        {
            "summary": "your summary here",
            "converged": true | false,
            "nextProposal": {
                "budget": number,
                "timeline": number,
                "quality": number,
                "risk": number
            }
        }
    `;

    try {
        const text = await generateContent(prompt);
        const cleanerText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanerText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Gemini Coordinator Error:", error);
        throw error; // Let simulator handle fallback
    }
}
