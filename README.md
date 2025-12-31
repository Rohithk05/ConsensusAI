# ConsensusAI – Multi-Agent Negotiation Platform

A decision intelligence platform demonstrating how autonomous AI agents interpret conflicting constraints to reach an optimal consensus.

## 🚀 Overview

ConsensusAI simulates a boardroom of stakeholders—Budget, Timeline, Quality, and Risk—negotiating a project's parameters. A Coordinator Agent (Meta-Agent) synthesizes their feedback to drive the group toward a converged decision.

The application serves as a demonstration of **multi-agent orchestration**, where distinct personas with hard constraints interact to solve complex optimization problems.

## 🤖 Agent Roles

| Agent | Responsibility | Core Constraint |
|-------|----------------|-----------------|
| **Budget Agent** | Minimizes Cost | Proposal cost ≤ Max Budget |
| **Timeline Agent** | Accelerates Delivery | Proposal duration ≤ Deadline |
| **Quality Agent** | Enforces Standards | Quality Score ≥ Minimum |
| **Risk Agent** | Mitigates Hazards | Risk Index ≤ Safety Threshold |
| **Coordinator** | Orchestration | Analyzes feedback, detects deadlocks, and generates compromise proposals. |

## 🧠 Negotiation Logic

The system operates on a round-based negotiation loop:

1. **Proposal**: The system (or Coordinator) puts forward an initial plan (Budget/Time/Quality/Risk).
2. **Evaluation**: Each agent independently assesses the proposal against their specific constraints.
3. **Voting**: Agents vote `Accept` or `Reject`.
4. **Reasoning**: If rejecting, an agent generates a reasoning log and a counter-demand.
5. **Synthesis**:
   - IF all agents accept → **Consensus Reached**.
   - IF conflict exists → The Coordinator applies weighted compromise logic (e.g., "Increase budget by 10% to satisfy Quality Agent").
   - The loop repeats with the new proposal.

## 🛠 Tech Stack

- **Frontend**: Next.js (React), TypeScript
- **Styling**: Vanilla CSS (Premium Dark Theme), Lucide Icons, Framer Motion
- **State Management**: React State (Client-Side Simulation Engine)
- **Deployment**: Vercel / Supabase (Ready)

## 🚦 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` to launch the platform.

## 📁 System Structure

- `src/agents/`: Logic for agent reasoning and simulating constraints.
- `src/components/negotiation/`: The core visualization workspace.
- `src/lib/simulator.ts`: The consensus engine driving the negotiation loop.
- `src/app/globals.css`: Premium design system tokens.
