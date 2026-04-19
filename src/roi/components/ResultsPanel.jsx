import { forwardRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatMonths } from '../lib/calc.js'

const ResultsPanel = forwardRef(function ResultsPanel({ results, labels, mode }, ref) {
  const { paybackMonths, tcoA, tcoB, savings, roiPct, downtimeHoursAvoided, annualizedSavings, chartData } = results

  const kpis = [
    { label: 'Payback period', value: formatMonths(paybackMonths) },
    { label: 'Total savings', value: formatCurrency(savings), accent: savings > 0 },
    { label: 'ROI', value: roiPct == null ? '—' : `${Math.round(roiPct)}%`, accent: roiPct > 0 },
    { label: 'Annualized savings', value: formatCurrency(annualizedSavings) },
    { label: `${labels.A} TCO`, value: formatCurrency(tcoA) },
    { label: `${labels.B} TCO`, value: formatCurrency(tcoB) },
    { label: 'Downtime hours avoided', value: `${Math.round(downtimeHoursAvoided).toLocaleString()} hr` },
  ]

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px', marginBottom: '20px',
      }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#f5f5f7', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{k.label}</div>
            <div style={{
              fontSize: '18px', fontWeight: 700, marginTop: '4px',
              color: k.accent === true ? '#15803d' : k.accent === false ? '#c8102e' : '#1c1c1e',
            }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div ref={ref} style={{ background: '#fff', borderRadius: '12px', padding: '12px', border: '1px solid #ebebed', height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#ebebed" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#6e6e73' }}
              label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6e6e73' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6e6e73' }}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v) => formatCurrency(v)}
              labelFormatter={(v) => `Year ${v}`}
              contentStyle={{ borderRadius: '10px', border: '1px solid #ebebed', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="current" name={labels.A} stroke="#6e6e73" strokeWidth={2} dot={false} strokeDasharray={mode === 'tracked' ? '4 4' : undefined} />
            <Line type="monotone" dataKey="chesterton" name={labels.B} stroke="#c8102e" strokeWidth={2.5} dot={false} strokeDasharray={mode === 'tracked' ? '4 4' : undefined} />
            {mode === 'tracked' && (
              <>
                <Line type="monotone" dataKey="currentActual" name={`${labels.A} (actual)`} stroke="#6e6e73" strokeWidth={2.5} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="chestertonActual" name={`${labels.B} (actual)`} stroke="#c8102e" strokeWidth={3} dot={false} connectNulls={false} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

export default ResultsPanel
