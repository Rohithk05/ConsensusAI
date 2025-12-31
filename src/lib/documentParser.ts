import { DecisionDocument, VendorProposal } from '@/types';

// Mock simulation of parsing delay and extraction logic
export async function parseDocument(file: File): Promise<DecisionDocument> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/parse', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error("Parse API failed");
        const data = await res.json();

        return {
            id: crypto.randomUUID(),
            name: file.name,
            type: detectType(file.name),
            uploadDate: new Date(),
            status: 'ready',
            extractedFacts: data.extractedFacts || []
        };
    } catch (error) {
        console.error("AI Parse failed, falling back:", error);
        return {
            id: crypto.randomUUID(),
            name: file.name,
            type: detectType(file.name),
            uploadDate: new Date(),
            status: 'ready',
            extractedFacts: extractMockFacts(file.name)
        };
    }
}

export async function parseVendorProposal(file: File, vendorName: string): Promise<VendorProposal> {
    const doc = await parseDocument(file);

    // Simulate characteristic metrics per vendor based on name
    const metrics = {
        budget: Math.floor(Math.random() * 40000) + 40000, // 40k-80k
        timeline: Math.floor(Math.random() * 60) + 20,     // 20-80 days
        quality: Math.floor(Math.random() * 30) + 65,     // 65-95 score
        risk: Math.floor(Math.random() * 25)               // 0-25% risk
    };

    // Override with extracted facts if available
    doc.extractedFacts.forEach(fact => {
        if (fact.field === 'budget') metrics.budget = fact.value;
        if (fact.field === 'timeline') metrics.timeline = fact.value;
        if (fact.field === 'quality') metrics.quality = fact.value;
        if (fact.field === 'risk') metrics.risk = fact.value;
    });

    return {
        id: crypto.randomUUID(),
        vendorName,
        documentId: doc.id,
        metrics,
        extractedFacts: doc.extractedFacts.map(f => ({
            field: f.field as any,
            value: f.value,
            quote: f.originalText
        }))
    };
}

function detectType(filename: string): 'contract' | 'rfp' | 'policy' | 'spec' {
    const lower = filename.toLowerCase();
    if (lower.includes('contract') || lower.includes('msa') || lower.includes('agreement')) return 'contract';
    if (lower.includes('rfp') || lower.includes('proposal') || lower.includes('bid')) return 'rfp';
    if (lower.includes('policy') || lower.includes('compliance') || lower.includes('rule')) return 'policy';
    return 'spec';
}

function extractMockFacts(filename: string): any[] {
    const facts = [];
    const lower = filename.toLowerCase();

    // Deterministic mock data based on filename to make demos predictable
    if (lower.includes('budget') || lower.includes('finance')) {
        facts.push({
            field: 'budget',
            value: 75000,
            confidence: 0.98,
            originalText: "Total authorized expenditure shall not exceed $75,000 USD including expenses."
        });
    }

    if (lower.includes('schedule') || lower.includes('timeline')) {
        facts.push({
            field: 'timeline',
            value: 45,
            confidence: 0.92,
            originalText: "All deliverables must be completed within 45 calendar days of signature."
        });
    }

    if (lower.includes('quality') || lower.includes('qa')) {
        facts.push({
            field: 'quality',
            value: 90,
            confidence: 0.88,
            originalText: "Minimum acceptance score for QA audit is 90/100."
        });
    }

    if (lower.includes('risk') || lower.includes('sla')) {
        facts.push({
            field: 'risk',
            value: 10,
            confidence: 0.95,
            originalText: "Risk tolerance index must stay below 10% for critical path items."
        });
    }

    // Default facts if generic name
    if (facts.length === 0) {
        facts.push({
            field: 'budget',
            value: 50000,
            confidence: 0.85,
            originalText: "Standard allocation: $50,000"
        });
    }

    return facts;
}
