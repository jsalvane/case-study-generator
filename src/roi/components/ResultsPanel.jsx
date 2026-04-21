import { forwardRef, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area, ReferenceLine, BarChart, Bar,
} from 'recharts'
import { formatCurrency, formatMonths, formatShortMoney } from '../lib/calc.js'

const ResultsPanel = forwardRef(function ResultsPanel({ results, labels, mode, currency = 'USD' }, ref) {
  const {
    paybackMonths, paybackReason, tcoA, tcoB, savings, roiPct,
    downtimeHoursAvoided, annualizedSavings, chartData, yearlyData,
    energyKwhAvoided, co2eKgAvoided,
  } = results

  const [view, setView] = useState('cumulative') // 'cumulative' | 'annual'
  const [showBand, setShowBand] = useState(true)

  const paybackSubtitle = ({
    immediate: 'Chesterton never exceeds current',
    crossover: null,
    none: 'Current stays cheaper over horizon',
    flat: 'Both sides are zero',
  })[paybackReason]

  const kpis = [
    { label: 'Payback period',         value: formatMonths(paybackMonths), subtitle: paybackSubtitle },
    { label: 'Total savings',          value: formatCurrency(savings, currency), accent: savings > 0 },
    { label: 'ROI',                    value: roiPct == null ? '—' : `${Math.round(roiPct)}%`, accent: roiPct > 0 },
    { label: 'Annualized savings',     value: formatCurrency(annualizedSavings, currency) },
    { label: `${labels.A} TCO`,        value: formatCurrency(tcoA, currency) },
    { label: `${labels.B} TCO`,        value: formatCurrency(tcoB, currency) },
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'inline-flex', background: '#f5f5f7', borderRadius: '10px', padding: '3px' }}>
          {[
            { v: 'cumulative', l: 'Cumulative' },
            { v: 'annual',     l: 'Annual spend' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => setView(opt.v)}
              style={{
                padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: view === opt.v ? '#fff' : 'transparent',
                color: view === opt.v ? '#1c1c1e' : '#6e6e73',
                boxShadow: view === opt.v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >{opt.l}</button>
          ))}
        </div>
        {view === 'cumulative' && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6e6e73', cursor: 'pointer' }}>
            <input type="checkbox" checked={showBand} onChange={e => setShowBand(e.target.checked)} style={{ accentColor: '#c8102e' }} />
            Confidence band
          </label>
        )}
      </div>

      <div ref={ref} style={{ background: '#fff', borderRadius: '12px', padding: '12px', border: '1px solid #ebebed', height: '380px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {view === 'cumulative' ? (
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
                name="Savings zone"
                fill="rgba(21,128,61,0.14)"
                stroke="none"
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
              />

              {/* Confidence band on Chesterton */}
              {showBand && (
                <Area
                  type="monotone"
                  dataKey="chestertonBand"
                  name="Chesterton range"
                  fill="rgba(200,16,46,0.10)"
                  stroke="none"
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}

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
                  label={{ value: `Payback · ${formatMonths(paybackMonths)}`, position: 'top', fill: '#15803d', fontSize: 11, fontWeight: 600 }}
                />
              )}
            </ComposedChart>
          ) : (
            <BarChart data={yearlyData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid stroke="#ebebed" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6e6e73' }}
                label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6e6e73' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} tickFormatter={v => formatShortMoney(v, currency)} />
              <Tooltip
                formatter={(v, name) => [formatCurrency(v, currency), name]}
                labelFormatter={(v) => `Year ${v}`}
                contentStyle={{ borderRadius: '10px', border: '1px solid #ebebed', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="current" name={labels.A} fill="#6e6e73" radius={[4, 4, 0, 0]} />
              <Bar dataKey="chesterton" name={labels.B} fill="#c8102e" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
})

export default ResultsPanel
