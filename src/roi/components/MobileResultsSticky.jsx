import { useState } from 'react'
import { formatCurrency, formatMonths } from '../lib/calc.js'

export default function MobileResultsSticky({ results, labels = {}, currency = 'USD' }) {
  const [open, setOpen] = useState(false)
  const {
    paybackMonths, savings, roiPct, annualizedSavings,
    tcoA, tcoB, downtimeHoursAvoided, energyKwhAvoided, co2eKgAvoided,
  } = results

  const fullKpis = [
    { label: 'Pays for itself', value: formatMonths(paybackMonths) },
    { label: 'Savings',         value: formatCurrency(savings, currency), accent: savings > 0 },
    { label: 'ROI',             value: roiPct == null ? '—' : `${Math.round(roiPct)}%`, accent: roiPct > 0 },
    { label: 'Per year',        value: formatCurrency(annualizedSavings, currency) },
    { label: `${labels.A || 'Current'} total cost`,    value: formatCurrency(tcoA, currency) },
    { label: `${labels.B || 'Chesterton'} total cost`, value: formatCurrency(tcoB, currency) },
    { label: 'Downtime hr avoided', value: `${Math.round(downtimeHoursAvoided || 0).toLocaleString()} hr` },
    ...(energyKwhAvoided > 0 ? [{ label: 'kWh avoided', value: `${Math.round(energyKwhAvoided).toLocaleString()}` }] : []),
    ...(co2eKgAvoided > 0 ? [{ label: 'CO₂e avoided', value: `${Math.round(co2eKgAvoided).toLocaleString()} kg` }] : []),
  ]

  return (
    <div
      className="roi-mobile-sticky"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
        background: '#fff', borderTop: '1px solid #ebebed',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
      }}
    >
      {open && (
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #ebebed',
            maxHeight: '60vh', overflowY: 'auto',
            animation: 'app-fade-in 0.18s ease-out both',
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px',
          }}>
            {fullKpis.map(k => (
              <div key={k.label} style={{ background: '#f5f5f7', borderRadius: '10px', padding: '8px 10px' }}>
                <div style={{ fontSize: '9px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{k.label}</div>
                <div style={{
                  fontSize: '13px', fontWeight: 700, marginTop: '2px',
                  color: k.accent === true ? '#15803d' : k.accent === false ? '#c8102e' : '#1c1c1e',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          <Kpi label="Pays for itself" value={formatMonths(paybackMonths)} />
          <Kpi label="Savings" value={formatCurrency(savings, currency)} accent={savings > 0} />
          <Kpi label="ROI" value={roiPct == null ? '—' : `${Math.round(roiPct)}%`} accent={roiPct > 0} />
        </div>
        <span style={{ fontSize: '12px', color: '#6e6e73', fontWeight: 600 }}>{open ? 'Hide' : 'Details'}</span>
      </button>
    </div>
  )
}

function Kpi({ label, value, accent }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '9px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</div>
      <div style={{
        fontSize: '14px', fontWeight: 700,
        color: accent === true ? '#15803d' : accent === false ? '#c8102e' : '#1c1c1e',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
    </div>
  )
}
