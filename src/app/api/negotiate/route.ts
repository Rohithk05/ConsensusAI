import { NextRequest, NextResponse } from 'next/server';
import { getAgentReasoning, getCoordinatorSynthesis } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, role, scenario, currentProposal, roundHistory, round, agentResponses } = body;

        if (type === 'agent') {
            const result = await getAgentReasoning(role, scenario, currentProposal, roundHistory, round);
            return NextResponse.json(result);
        }

        if (type === 'coordinator') {
            const result = await getCoordinatorSynthesis(scenario, round, agentResponses);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    } catch (error: any) {
        console.error("Negotiation API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
