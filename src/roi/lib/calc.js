import {
  monthlyCostAt,
  annualCostInYear,
  downtimeHoursPerYear,
  annualEnergyKwh,
  annualCo2eKg,
  actualToDate,
} from './costItems.js'
import { CURRENCIES } from './theme.js'

// Sensitivity multipliers applied symmetrically to the A→B advantage (delta).
// Conservative shrinks the delta toward zero; aggressive amplifies it.
export const SENSITIVITY_MULTIPLIERS = {
  conservative: 0.7,
  expected: 1,
  aggressive: 1.2,
}

export function computeRoi({
  horizonYears,
  scenarioA,
  scenarioB,
  mode = 'projected',
  elapsedMonths = 0,
  sensitivity = 'expected',
}) {
  const years = Math.max(1, Math.min(15, Number(horizonYears) || 5))
  const months = Math.max(1, Math.round(years * 12))

  const multiplier = SENSITIVITY_MULTIPLIERS[sensitivity] ?? 1

  const seriesA = buildSeries(scenarioA.items, months, mode, elapsedMonths)
  const seriesB = buildSeries(scenarioB.items, months, mode, elapsedMonths)

  // Apply sensitivity multiplier to the A→B delta. Positive or negative delta shrinks/amplifies consistently.
  const projectedBAdj = seriesB.projected.map((v, i) => applyMultiplier(seriesA.projected[i], v, multiplier))

  const cumA = cumulative(seriesA.projected)
  const cumB = cumulative(projectedBAdj)
  const cumAActual = mode === 'tracked' ? cumulative(seriesA.blended) : null
  const cumBActual = mode === 'tracked' ? cumulative(seriesB.blended) : null

  const tcoA = cumA[cumA.length - 1]
  const tcoB = cumB[cumB.length - 1]
  const savings = tcoA - tcoB

  // Investment basis for ROI % — prefer items explicitly flagged isInvestment on side B.
  // Falls back to one-time costs on B if nothing is explicitly flagged (back-compat).
  const explicitInvestment = scenarioB.items
    .filter(i => i.isInvestment)
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const fallbackInvestment = scenarioB.items
    .filter(i => i.typeId === 'oneTime')
    .reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const investmentBasis = explicitInvestment > 0 ? explicitInvestment : fallbackInvestment
  const investmentBasisSource = explicitInvestment > 0 ? 'explicit' : (fallbackInvestment > 0 ? 'oneTimeB' : 'none')
  const roiPct = investmentBasis > 0 ? (savings / investmentBasis) * 100 : null

  // Payback with interpolation and edge-case handling.
  const payback = computePayback(cumA, cumB, months)

  // Horizon-level totals for hours / energy / CO2e avoided.
  const downtimeHoursA = scenarioA.items.reduce((s, i) => s + downtimeHoursPerYear(i), 0) * years
  const downtimeHoursB = scenarioB.items.reduce((s, i) => s + downtimeHoursPerYear(i), 0) * years
  const downtimeHoursAvoided = Math.max(0, downtimeHoursA - downtimeHoursB)

  const energyKwhA = scenarioA.items.reduce((s, i) => s + annualEnergyKwh(i), 0) * years
  const energyKwhB = scenarioB.items.reduce((s, i) => s + annualEnergyKwh(i), 0) * years
  const energyKwhAvoided = Math.max(0, energyKwhA - energyKwhB)

  const co2eKgA = scenarioA.items.reduce((s, i) => s + annualCo2eKg(i), 0) * years
  const co2eKgB = scenarioB.items.reduce((s, i) => s + annualCo2eKg(i), 0) * years
  const co2eKgAvoided = Math.max(0, co2eKgA - co2eKgB)

  // Confidence band: always computed from conservative / aggressive multipliers, regardless of selected sensitivity.
  const projectedBLow = seriesB.projected.map((v, i) => applyMultiplier(seriesA.projected[i], v, SENSITIVITY_MULTIPLIERS.aggressive))     // most savings → B cheapest
  const projectedBHigh = seriesB.projected.map((v, i) => applyMultiplier(seriesA.projected[i], v, SENSITIVITY_MULTIPLIERS.conservative)) // least savings → B most expensive
  const cumBLow = cumulative(projectedBLow)
  const cumBHigh = cumulative(projectedBHigh)

  // Cumulative chart rows (month-level).
  const chartData = []
  for (let i = 0; i <= months; i++) {
    const row = {
      month: i,
      year: +(i / 12).toFixed(3),
      current: cumA[i],
      chesterton: cumB[i],
      chestertonBandLow: cumBLow[i],
      chestertonBandHigh: cumBHigh[i],
      savingsBand: [cumB[i], cumA[i]], // [lower, upper] — empty if current < chesterton, still valid for Recharts Area range
      chestertonBand: [cumBLow[i], cumBHigh[i]],
    }
    if (mode === 'tracked') {
      row.currentActual = i <= elapsedMonths ? cumAActual[i] : null
      row.chestertonActual = i <= elapsedMonths ? cumBActual[i] : null
    }
    chartData.push(row)
  }

  // Per-year aggregated spend for the annual bar view.
  const yearlyData = []
  for (let y = 0; y < years; y++) {
    const start = y * 12
    const end = Math.min(months, (y + 1) * 12)
    let a = 0
    let b = 0
    for (let i = start; i < end; i++) {
      a += seriesA.projected[i]
      b += projectedBAdj[i]
    }
    yearlyData.push({ year: y + 1, current: a, chesterton: b, savings: a - b })
  }

  return {
    months,
    years,
    chartData,
    yearlyData,
    tcoA,
    tcoB,
    savings,
    roiPct,
    paybackMonths: payback.paybackMonths,
    paybackReason: payback.reason,
    downtimeHoursAvoided,
    energyKwhAvoided,
    co2eKgAvoided,
    annualizedSavings: savings / years,
    investmentBasis,
    investmentBasisSource,
    subtotalAnnualA: scenarioA.items.reduce((s, i) => s + (i.typeId === 'oneTime' ? 0 : annualCostInYear(i, 0)), 0),
    subtotalAnnualB: scenarioB.items.reduce((s, i) => s + (i.typeId === 'oneTime' ? 0 : annualCostInYear(i, 0)), 0),
    oneTimeA: scenarioA.items.filter(i => i.typeId === 'oneTime').reduce((s, i) => s + (Number(i.amount) || 0), 0),
    oneTimeB: scenarioB.items.filter(i => i.typeId === 'oneTime').reduce((s, i) => s + (Number(i.amount) || 0), 0),
    sensitivity,
    sensitivityMultiplier: multiplier,
  }
}

// Scale the (A - B) delta by `mul` and return the adjusted B: Bnew = A - (A - B) * mul.
function applyMultiplier(a, b, mul) {
  return a - (a - b) * mul
}

function buildSeries(items, months, mode, elapsedMonths) {
  const projected = new Array(months + 1).fill(0)
  const blended = new Array(months + 1).fill(0)
  const safeElapsed = Math.max(1, elapsedMonths)
  for (let i = 0; i <= months; i++) {
    let p = 0
    let b = 0
    for (const item of items) {
      const cost = monthlyCostAt(item, i)
      p += cost
      if (mode === 'tracked' && i <= elapsedMonths) {
        const act = actualToDate(item)
        if (act != null) {
          b += act / safeElapsed
          continue
        }
      }
      b += cost
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

/**
 * Interpolated payback with explicit edge-case labeling.
 * Returns { paybackMonths, reason } where reason is one of:
 *   - 'immediate'   — B is cheaper or equal from month 0 and never exceeds A
 *   - 'crossover'   — normal case, paybackMonths is the (interpolated) crossing month
 *   - 'none'        — A stays cheaper for the full horizon
 *   - 'flat'        — both sides are zero cost (trivial)
 */
function computePayback(cumA, cumB, months) {
  const diff = cumA.map((v, i) => v - cumB[i]) // positive = B is cheaper so far
  const last = diff[diff.length - 1]

  // Trivial: both curves are flat at zero.
  if (cumA[months] === 0 && cumB[months] === 0) {
    return { paybackMonths: null, reason: 'flat' }
  }

  // Immediate: B is never more expensive than A across the whole horizon and cumB > 0 at end.
  if (diff.every(d => d >= 0) && cumB[months] > 0) {
    return { paybackMonths: 0, reason: 'immediate' }
  }

  // Never pays back in horizon.
  if (last < 0) {
    return { paybackMonths: null, reason: 'none' }
  }

  // Find the first month where diff crosses from negative to non-negative and interpolate.
  for (let i = 1; i <= months; i++) {
    if (diff[i - 1] < 0 && diff[i] >= 0 && cumB[i] > 0) {
      const denom = diff[i] - diff[i - 1]
      const frac = denom === 0 ? 0 : -diff[i - 1] / denom
      return { paybackMonths: Math.max(0, (i - 1) + frac), reason: 'crossover' }
    }
  }

  // Fallback: if diff is non-negative throughout but didn't trigger 'immediate' (e.g., cumB still 0 at end) — no payback.
  return { paybackMonths: null, reason: 'none' }
}

// -----------------------------------------------------------------------------
// Formatters
// -----------------------------------------------------------------------------

export function formatCurrency(n, currency = 'USD') {
  if (n == null || Number.isNaN(n)) return '—'
  const cfg = CURRENCIES[currency] || CURRENCIES.USD
  try {
    return n.toLocaleString(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: 0 })
  } catch {
    return `${cfg.symbol}${Math.round(n).toLocaleString('en-US')}`
  }
}

export function formatShortMoney(n, currency = 'USD') {
  if (n == null || Number.isNaN(n)) return '—'
  const cfg = CURRENCIES[currency] || CURRENCIES.USD
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${cfg.symbol}${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000)     return `${cfg.symbol}${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return `${cfg.symbol}${Math.round(n)}`
}

export function formatMonths(m) {
  if (m == null) return 'No payback in horizon'
  if (m < 0.5) return 'Immediate'
  const round = Math.round(m)
  const y = Math.floor(round / 12)
  const r = round % 12
  if (y === 0) return `${round} mo`
  if (r === 0) return `${y} yr`
  return `${y} yr ${r} mo`
}
