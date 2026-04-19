export default function LandingPicker({ onPick }) {
  const tools = [
    {
      id: 'caseStudy',
      title: 'Case Study Generator',
      description: 'Draft and export a branded mechanical seals case study from a guided form.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      id: 'roi',
      title: 'ROI Calculator',
      description: 'Compare TCO between a current solution and a Chesterton solution — project or track.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="app-fade-in" style={{ maxWidth: '880px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8102e', margin: 0 }}>
          A.W. Chesterton
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1c1c1e', margin: '6px 0 0', letterSpacing: '-0.025em' }}>
          Choose a tool
        </h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {tools.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            className="card-enter"
            style={{
              textAlign: 'left', padding: '24px',
              background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '16px', cursor: 'pointer',
              boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
              transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              animationDelay: `${idx * 60}ms`,
              display: 'flex', flexDirection: 'column', gap: '12px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.10)'
              e.currentTarget.style.borderColor = 'rgba(200,16,46,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 24px rgba(0,0,0,0.06)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '12px',
              background: 'rgba(200,16,46,0.08)', color: '#c8102e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1e' }}>{t.title}</div>
              <div style={{ fontSize: '13px', color: '#6e6e73', marginTop: '4px', lineHeight: 1.5 }}>{t.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
