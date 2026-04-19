import { useState } from 'react'
import { formatCurrency, formatMonths } from '../lib/calc.js'

export default function MobileResultsSticky({ results }) {
  const [open, setOpen] = useState(false)
  const { paybackMonths, savings, roiPct } = results

  return (
    <div
      className="roi-mobile-sticky"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
        background: '#fff', borderTop: '1px solid #ebebed',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          <Kpi label="Payback" value={formatMonths(paybackMonths)} />
          <Kpi label="Savings" value={formatCurrency(savings)} accent={savings > 0} />
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
