import { forwardRef } from 'react'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, ReferenceLine,
} from 'recharts'
import { formatCurrency, formatMonths, formatShortMoney } from '../lib/calc.js'

const ResultsPanel = forwardRef(function ResultsPanel({ results, labels, mode, currency = 'USD' }, ref) {
  const {
    paybackMonths, paybackReason, tcoA, tcoB, savings, roiPct,
    downtimeHoursAvoided, annualizedSavings, chartData,
    energyKwhAvoided, co2eKgAvoided,
  } = results

  const paybackSubtitle = ({
    immediate: 'Chesterton never exceeds current',
    crossover: null,
    none: 'Current stays cheaper over horizon',
    flat: 'Both sides are zero',
  })[paybackReason]

  const kpis = [
    { label: 'Pays for itself',        value: formatMonths(paybackMonths), subtitle: paybackSubtitle },
    { label: 'Total savings',          value: formatCurrency(savings, currency), accent: savings > 0 },
    { label: 'ROI',                    value: roiPct == null ? '—' : `${Math.round(roiPct)}%`, accent: roiPct > 0 },
    { label: 'Savings per year',       value: formatCurrency(annualizedSavings, currency) },
    { label: `${labels.A} total cost`, value: formatCurrency(tcoA, currency) },
    { label: `${labels.B} total cost`, value: formatCurrency(tcoB, currency) },
    { label: 'Downtime hrs avoided',   value: `${Math.round(downtimeHoursAvoided).toLocaleString()} hr` },
    ...(energyKwhAvoided > 0 ? [{ label: 'Energy kWh avoided', value: `${Math.round(energyKwhAvoided).toLocaleString()} kWh` }] : []),
    ...(co2eKgAvoided > 0 ? [{ label: 'CO₂e avoided',         value: `${Math.round(co2eKgAvoided).toLocaleString()} kg` }] : []),
  ]

  const paybackYears = paybackMonths != null ? paybackMonths / 12 : null

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
            {k.subtitle && (
              <div style={{ fontSize: '11px', color: '#6e6e73', marginTop: '2px' }}>{k.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      <div ref={ref} style={{ background: '#fff', borderRadius: '12px', padding: '12px', border: '1px solid #ebebed', height: '380px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#ebebed" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, 'dataMax']}
              tick={{ fontSize: 11, fill: '#6e6e73' }}
              label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6e6e73' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6e6e73' }}
              tickFormatter={v => formatShortMoney(v, currency)}
            />
            <Tooltip
              formatter={(v, name) => {
                if (Array.isArray(v)) return [`${formatCurrency(v[0], currency)} – ${formatCurrency(v[1], currency)}`, name]
                return [formatCurrency(v, currency), name]
              }}
              labelFormatter={(v) => `Year ${(+v).toFixed(1)}`}
              contentStyle={{ borderRadius: '10px', border: '1px solid #ebebed', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* Savings shade between chesterton (lower) and current (upper) */}
            <Area
              type="monotone"
              dataKey="savingsBand"
              name="Savings"
              fill="rgba(21,128,61,0.14)"
              stroke="none"
              activeDot={false}
              isAnimationActive={false}
              legendType="none"
            />

            <Line type="monotone" dataKey="current" name={labels.A} stroke="#6e6e73" strokeWidth={2} dot={false} strokeDasharray={mode === 'tracked' ? '4 4' : undefined} isAnimationActive={false} />
            <Line type="monotone" dataKey="chesterton" name={labels.B} stroke="#c8102e" strokeWidth={2.5} dot={false} strokeDasharray={mode === 'tracked' ? '4 4' : undefined} isAnimationActive={false} />
            {mode === 'tracked' && (
              <>
                <Line type="monotone" dataKey="currentActual" name={`${labels.A} (actual)`} stroke="#6e6e73" strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="chestertonActual" name={`${labels.B} (actual)`} stroke="#c8102e" strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} />
              </>
            )}

            {paybackYears != null && paybackYears > 0 && (
              <ReferenceLine
                x={paybackYears}
                stroke="#15803d"
                strokeDasharray="4 4"
                label={{ value: `Pays for itself · ${formatMonths(paybackMonths)}`, position: 'top', fill: '#15803d', fontSize: 11, fontWeight: 600 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

export default ResultsPanel
