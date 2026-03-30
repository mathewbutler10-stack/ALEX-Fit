import { PortalCard } from '@/components/ui/PortalCard'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '720px', width: '100%', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '3rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>APEX</span>
        </div>
        <p style={{ color: 'var(--text2)', marginBottom: '48px', fontSize: '1.1rem' }}>
          The complete PT coaching platform
        </p>

        {/* Portal Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <PortalCard
            href="/owner/dashboard"
            icon="🏢"
            title="Owner Portal"
            description="Manage your gym, PTs, clients & revenue"
            color="#4ade80"
          />
          <PortalCard
            href="/pt/clients"
            icon="🧑‍💼"
            title="PT Portal"
            description="Coach clients, schedule sessions & track progress"
            color="#22d3ee"
          />
          <PortalCard
            href="/client/today"
            icon="💪"
            title="Client Portal"
            description="Track workouts, meals & sessions"
            color="#f97316"
          />
          <PortalCard
            href="/roadmap"
            icon="🗺️"
            title="Roadmap"
            description="See what's planned for APEX"
            color="#a78bfa"
          />
        </div>

        <p style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>
          APEX Platform v1.0 · Phase 1
        </p>
      </div>
    </main>
  )
}
