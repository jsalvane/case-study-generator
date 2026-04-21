export const COST_TYPES = {
  oneTime: {
    id: 'oneTime',
    label: 'One-time cost',
    description: 'Purchase price, install, or a one-off expense.',
    hint: 'Use for the seal purchase, installation labor, or a planned rebuild.',
    defaults: () => ({ amount: 0, occursAt: 0 }),
  },
  recurring: {
    id: 'recurring',
    label: 'Regular service or repair',
    description: 'A fixed cost that repeats on a schedule.',
    hint: 'Example: $2,400 repair × 4 times per year = $9,600/yr.',
    defaults: () => ({ amount: 0, frequency: 'year', timesPerPeriod: 1 }),
  },
  consumption: {
    id: 'consumption',
    label: 'Water, flush, or consumable',
    description: 'Usage rate × running hours × unit price.',
    hint: 'Example: 50 gal/hr × 8,760 hr/yr × $0.03/gal = $13,140/yr. Continuous running is 8,760 hr/yr.',
    defaults: () => ({ rate: 0, rateUnit: 'gal/hr', hoursPerYear: 8760, unitPrice: 0 }),
  },
  downtime: {
    id: 'downtime',
    label: 'Downtime cost',
    description: 'How much each shutdown event costs.',
    hint: 'What one hour of downtime costs — lost production $/hr when the line is down, or a labor rate for repair time.',
    defaults: () => ({ eventsPerYear: 0, hoursPerEvent: 0, hourlyRate: 0 }),
  },
  energy: {
    id: 'energy',
    label: 'Energy / electricity',
    description: 'Motor power × hours × electricity price.',
    hint: 'Annual cost = kW × hours × $/kWh × load factor. US grid average CO₂ ≈ 0.40 kg/kWh.',
    defaults: () => ({ kW: 0, hoursPerYear: 8760, pricePerKwh: 0.09, loadFactor: 1, co2eKgPerKwh: 0.4 }),
  },
}

// Shared defaults applied to every new item, regardless of type.
const COMMON_DEFAULTS = {
  escalationPct: 0,      // annual escalation applied to this item's cost stream
  sourceNote: '',        // optional citation / justification rendered as a footnote in PDF
  categoryId: null,      // optional; items on A & B with matching categoryId render as a paired row
  actualEvents: [],      // tracked mode: [{ id, date: 'YYYY-MM-DD', amount, note }]
}

export function createItem(typeId, partial = {}) {
  const type = COST_TYPES[typeId]
  if (!type) throw new Error(`Unknown cost type: ${typeId}`)
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    typeId,
    label: partial.label || type.label,
    isInvestment: typeId === 'oneTime',   // default investments are one-time costs; user can toggle
    ...COMMON_DEFAULTS,
    ...type.defaults(),
    ...partial,
    actual: partial.actual ?? null,       // legacy single-value actual (pre-event-log); retained for back-compat
  }
}

function frequencyToPerYear(freq, times) {
  switch (freq) {
    case 'year': return times
    case 'quarter': return times * 4
    case 'month': return times * 12
    default: return times
  }
}

// Base (year-0, un-escalated) annual cost for the item.
export function baseAnnualCost(item) {
  switch (item.typeId) {
    case 'oneTime':
      return Number(item.amount) || 0
    case 'recurring': {
      const timesPerYear = frequencyToPerYear(item.frequency, Number(item.timesPerPeriod) || 1)
      return (Number(item.amount) || 0) * timesPerYear
    }
    case 'consumption':
      return (Number(item.rate) || 0) * (Number(item.hoursPerYear) || 0) * (Number(item.unitPrice) || 0)
    case 'downtime':
      return (Number(item.eventsPerYear) || 0) * (Number(item.hoursPerEvent) || 0) * (Number(item.hourlyRate) || 0)
    case 'energy':
      return (Number(item.kW) || 0) * (Number(item.hoursPerYear) || 0) * (Number(item.pricePerKwh) || 0) * (Number(item.loadFactor) || 1)
    default:
      return 0
  }
}

// Back-compat: callers using this continue to get the year-0 value (no escalation).
export function annualCost(item) {
  return baseAnnualCost(item)
}

// Escalation-aware annual cost for a given 0-based year index.
export function annualCostInYear(item, yearIndex) {
  const base = baseAnnualCost(item)
  const esc = Number(item.escalationPct) || 0
  return base * Math.pow(1 + esc / 100, yearIndex)
}

// Monthly cost stream for a given month; supports escalation and one-time pulses.
export function monthlyCostAt(item, monthIndex) {
  if (item.typeId === 'oneTime') {
    const at = Math.round(Number(item.occursAt) || 0)
    if (at !== monthIndex) return 0
    const yrAt = Math.floor(at / 12)
    const esc = Number(item.escalationPct) || 0
    return (Number(item.amount) || 0) * Math.pow(1 + esc / 100, yrAt)
  }
  const yearIndex = Math.floor(monthIndex / 12)
  return annualCostInYear(item, yearIndex) / 12
}

export function downtimeHoursPerYear(item) {
  if (item.typeId !== 'downtime') return 0
  return (Number(item.eventsPerYear) || 0) * (Number(item.hoursPerEvent) || 0)
}

export function annualEnergyKwh(item) {
  if (item.typeId !== 'energy') return 0
  return (Number(item.kW) || 0) * (Number(item.hoursPerYear) || 0) * (Number(item.loadFactor) || 1)
}

export function annualCo2eKg(item) {
  if (item.typeId !== 'energy') return 0
  return annualEnergyKwh(item) * (Number(item.co2eKgPerKwh) || 0)
}

// Sum of dated actual events (tracked mode). Falls back to legacy single `actual` field.
export function actualToDate(item) {
  const list = Array.isArray(item.actualEvents) ? item.actualEvents : []
  if (list.length > 0) {
    return list.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  }
  if (item.actual != null && item.actual !== '') {
    return Number(item.actual) || 0
  }
  return null
}
