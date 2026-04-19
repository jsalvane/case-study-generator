import { NumberField } from '../ui/fields.jsx'

export default function ModeToggle({ mode, onMode, horizonYears, onHorizon, elapsedMonths, onElapsed }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e73', marginBottom: '8px' }}>Mode</div>
        <div style={{ display: 'inline-flex', background: '#f5f5f7', borderRadius: '10px', padding: '3px' }}>
          {['projected', 'tracked'].map(v => (
            <button
              key={v}
              onClick={() => onMode(v)}
              style={{
                padding: '7px 14px', fontSize: '13px', fontWeight: 600,
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: mode === v ? '#fff' : 'transparent',
                color: mode === v ? '#1c1c1e' : '#6e6e73',
                boxShadow: mode === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              {v === 'projected' ? 'Projected' : 'Tracked'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mode === 'tracked' ? '1fr 1fr' : '1fr', gap: '12px', maxWidth: '360px' }}>
        <NumberField label="Horizon (years)" value={horizonYears} onChange={v => onHorizon(Math.min(10, Math.max(1, Number(v) || 1)))} min={1} />
        {mode === 'tracked' && (
          <NumberField label="Elapsed months" value={elapsedMonths} onChange={onElapsed} min={0} />
        )}
      </div>
    </div>
  )
}
