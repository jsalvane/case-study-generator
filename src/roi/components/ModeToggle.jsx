import { NumberField } from '../ui/fields.jsx'
import { HORIZON_MAX, HORIZON_MIN } from '../lib/validate.js'

const SENSITIVITY_OPTIONS = [
  { value: 'conservative', label: 'Conservative', hint: '−30% to Chesterton advantage' },
  { value: 'expected',     label: 'Expected',     hint: 'Point estimate from inputs' },
  { value: 'aggressive',   label: 'Aggressive',   hint: '+20% to Chesterton advantage' },
]

export default function ModeToggle({
  mode, onMode,
  horizonYears, onHorizon,
  elapsedMonths, onElapsed,
  sensitivity = 'expected', onSensitivity,
}) {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
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
        <div>
          <NumberField
            label={`Horizon (${HORIZON_MIN}–${HORIZON_MAX} yrs)`}
            value={horizonYears}
            onChange={onHorizon}
            min={HORIZON_MIN}
            suffix="yr"
          />
        </div>
        {mode === 'tracked' && (
          <NumberField label="Elapsed months" value={elapsedMonths} onChange={onElapsed} min={0} suffix="mo" />
        )}
      </div>

      {mode === 'tracked' && (
        <div style={{ fontSize: '12px', color: '#6e6e73', background: '#f5f5f7', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5 }}>
          Tracked mode replaces the projection for the first <strong>{elapsedMonths || 0}</strong> month(s) with a blended monthly allocation of each item's dated actuals. This is a smoothed view — use the event log on each item for a precise audit trail.
        </div>
      )}

      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6e6e73', marginBottom: '8px' }}>
          Sensitivity
        </div>
        <div style={{ display: 'inline-flex', background: '#f5f5f7', borderRadius: '10px', padding: '3px', flexWrap: 'wrap' }}>
          {SENSITIVITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSensitivity?.(opt.value)}
              title={opt.hint}
              style={{
                padding: '7px 14px', fontSize: '13px', fontWeight: 600,
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: sensitivity === opt.value ? '#fff' : 'transparent',
                color: sensitivity === opt.value ? '#1c1c1e' : '#6e6e73',
                boxShadow: sensitivity === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '6px' }}>
          Scales the A→B advantage for a what-if. The chart always shows the full confidence band.
        </div>
      </div>
    </div>
  )
}
