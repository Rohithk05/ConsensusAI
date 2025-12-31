import Link from "next/link";
import { Bot, Layers, Brain, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="container">
      <nav className="flex items-center justify-between" style={{ padding: '2rem 0' }}>
        <div className="flex items-center gap-sm">
          <Brain className="text-secondary" size={28} />
          <span className="text-xl font-bold">ConsensusAI</span>
        </div>
        <div className="flex gap-lg">
          <Link href="/dashboard" className="btn btn-primary">
            Launch Platform <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center animate-fade-in" style={{ minHeight: '60vh', gap: '2rem' }}>
        <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem' }}>
          <span className="text-muted">Internal Preview • v1.0.0</span>
        </div>

        <h1 style={{ fontSize: '4rem', lineHeight: 1.1, backgroundImage: 'linear-gradient(to right, white, #a5a5a5)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Multi-Agent<br />Decision Intelligence
        </h1>

        <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', lineHeight: 1.6 }}>
          Simulate autonomous negotiations between Budget, Timeline, Quality, and Risk agents to find the optimal strategic path.
        </p>

        <div className="flex gap-md" style={{ marginTop: '1rem' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}>
            Start New Scenario
          </Link>
          <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1.125rem' }}>
            View Documentation
          </a>
        </div>
      </section>

      <section id="how-it-works" style={{ padding: '4rem 0' }}>
        <h2 className="text-center text-2xl mb-5">Autonomous Stakeholders</h2>
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {[
            { title: "Budget Agent", role: "Minimizes Cost", color: "var(--success)" },
            { title: "Timeline Agent", role: "Accel. Delivery", color: "var(--warning)" },
            { title: "Quality Agent", role: "Enforces Standards", color: "var(--secondary)" },
            { title: "Risk Agent", role: "Mitigates Hazards", color: "var(--danger)" }
          ].map((agent) => (
            <div key={agent.title} className="card" style={{ borderTop: `3px solid ${agent.color}` }}>
              <div className="flex items-center gap-sm mb-3">
                <Bot size={20} color={agent.color} />
                <h3 className="text-lg">{agent.title}</h3>
              </div>
              <p className="text-muted">{agent.role}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
