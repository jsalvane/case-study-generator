import { NumberField } from '../ui/fields.jsx'
import { HORIZON_MAX, HORIZON_MIN } from '../lib/validate.js'

const SENSITIVITY_OPTIONS = [
  { value: 'conservative', label: 'Worst case',   hint: 'Pessimistic — reduces Chesterton\'s projected benefit' },
  { value: 'expected',     label: 'Most likely',  hint: 'Point estimate from your inputs' },
  { value: 'aggressive',   label: 'Best case',    hint: 'Optimistic — increases Chesterton\'s projected benefit' },
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
            label="Years to compare"
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
          We'll use the actual costs you've logged below for the first <strong>{elapsedMonths || 0}</strong> months, then switch back to the projected rate.
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
          Adjusts how optimistic the savings estimate is. The chart always shows the full range.
        </div>
      </div>
    </div>
  )
}
