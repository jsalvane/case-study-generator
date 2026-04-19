import { monthlyCostAt, annualCost, downtimeHoursPerYear } from './costItems.js'

export function computeRoi({ horizonYears, scenarioA, scenarioB, mode = 'projected', elapsedMonths = 0 }) {
  const months = Math.max(1, Math.round((Number(horizonYears) || 5) * 12))
  const seriesA = buildSeries(scenarioA.items, months, mode, elapsedMonths)
  const seriesB = buildSeries(scenarioB.items, months, mode, elapsedMonths)

  const cumA = cumulative(seriesA.projected)
  const cumB = cumulative(seriesB.projected)
  const cumAActual = mode === 'tracked' ? cumulative(seriesA.blended) : null
  const cumBActual = mode === 'tracked' ? cumulative(seriesB.blended) : null

  const tcoA = cumA[cumA.length - 1]
  const tcoB = cumB[cumB.length - 1]
  const savings = tcoA - tcoB

  const chestertonOneTime = scenarioB.items
    .filter(i => i.typeId === 'oneTime')
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)

  const roiPct = chestertonOneTime > 0 ? (savings / chestertonOneTime) * 100 : null

  let paybackMonths = null
  for (let i = 0; i < months; i++) {
    if (cumA[i] - cumB[i] >= 0 && cumB[i] > 0) {
      paybackMonths = i
      break
    }
  }

  const downtimeHoursA = scenarioA.items.reduce((s, i) => s + downtimeHoursPerYear(i), 0) * (horizonYears || 5)
  const downtimeHoursB = scenarioB.items.reduce((s, i) => s + downtimeHoursPerYear(i), 0) * (horizonYears || 5)
  const downtimeHoursAvoided = Math.max(0, downtimeHoursA - downtimeHoursB)

  const chartData = []
  for (let i = 0; i <= months; i++) {
    const row = {
      month: i,
      year: +(i / 12).toFixed(2),
      current: cumA[i] ?? cumA[cumA.length - 1],
      chesterton: cumB[i] ?? cumB[cumB.length - 1],
    }
    if (mode === 'tracked') {
      row.currentActual = i <= elapsedMonths ? cumAActual[i] : null
      row.chestertonActual = i <= elapsedMonths ? cumBActual[i] : null
    }
    chartData.push(row)
  }

  return {
    months,
    chartData,
    tcoA,
    tcoB,
    savings,
    roiPct,
    paybackMonths,
    downtimeHoursAvoided,
    annualizedSavings: savings / (horizonYears || 5),
    subtotalAnnualA: scenarioA.items.reduce((s, i) => s + (i.typeId === 'oneTime' ? 0 : annualCost(i)), 0),
    subtotalAnnualB: scenarioB.items.reduce((s, i) => s + (i.typeId === 'oneTime' ? 0 : annualCost(i)), 0),
    oneTimeA: scenarioA.items.filter(i => i.typeId === 'oneTime').reduce((s, i) => s + (Number(i.amount) || 0), 0),
    oneTimeB: chestertonOneTime,
  }
}

function buildSeries(items, months, mode, elapsedMonths) {
  const projected = new Array(months + 1).fill(0)
  const blended = new Array(months + 1).fill(0)
  for (let i = 0; i <= months; i++) {
    let p = 0
    let b = 0
    for (const item of items) {
      const cost = monthlyCostAt(item, i)
      p += cost
      if (mode === 'tracked' && i <= elapsedMonths && item.actual != null && item.actual !== '') {
        b += (Number(item.actual) || 0) / Math.max(1, elapsedMonths)
      } else {
        b += cost
      }
    }
    projected[i] = p
    blended[i] = b
  }
  return { projected, blended }
}

function cumulative(series) {
  const out = new Array(series.length).fill(0)
  let running = 0
  for (let i = 0; i < series.length; i++) {
    running += series[i]
    out[i] = running
  }
  return out
}

export function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function formatMonths(m) {
  if (m == null) return 'No payback in horizon'
  if (m === 0) return 'Immediate'
  const years = Math.floor(m / 12)
  const rem = m % 12
  if (years === 0) return `${m} mo`
  if (rem === 0) return `${years} yr`
  return `${years} yr ${rem} mo`
}
