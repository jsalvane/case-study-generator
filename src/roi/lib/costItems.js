export const COST_TYPES = {
  oneTime: {
    id: 'oneTime',
    label: 'One-time cost',
    description: 'Acquisition, installation, or a single mid-horizon event.',
    hint: 'Use for seal purchase price, install labor, or a planned rebuild at month N.',
    defaults: () => ({ amount: 0, occursAt: 0 }),
  },
  recurring: {
    id: 'recurring',
    label: 'Recurring fixed cost',
    description: 'A fixed cost that repeats on a cadence.',
    hint: 'Example: "Repair: $2,400 × 4 per year."',
    defaults: () => ({ amount: 0, frequency: 'year', timesPerPeriod: 1 }),
  },
  consumption: {
    id: 'consumption',
    label: 'Consumption / rate cost',
    description: 'Rate × running hours × unit price.',
    hint: 'Example: water at 50 gal/hr × 8,760 hr/yr × $0.03/gal.',
    defaults: () => ({ rate: 0, rateUnit: 'gal/hr', hoursPerYear: 8760, unitPrice: 0 }),
  },
  downtime: {
    id: 'downtime',
    label: 'Downtime / labor cost',
    description: 'Events per year × hours per event × loaded hourly rate.',
    hint: 'Loaded labor = wage + benefits + overhead. Or use lost-production $/hr.',
    defaults: () => ({ eventsPerYear: 0, hoursPerEvent: 0, hourlyRate: 0 }),
  },
}

export function createItem(typeId, partial = {}) {
  const type = COST_TYPES[typeId]
  if (!type) throw new Error(`Unknown cost type: ${typeId}`)
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    typeId,
    label: partial.label || type.label,
    ...type.defaults(),
    ...partial,
    actual: partial.actual ?? null,
  }
}

export function annualCost(item) {
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
    default:
      return 0
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

export function downtimeHoursPerYear(item) {
  if (item.typeId !== 'downtime') return 0
  return (Number(item.eventsPerYear) || 0) * (Number(item.hoursPerEvent) || 0)
}

export function monthlyCostAt(item, monthIndex) {
  if (item.typeId === 'oneTime') {
    return Math.round(Number(item.occursAt) || 0) === monthIndex ? Number(item.amount) || 0 : 0
  }
  return annualCost(item) / 12
}
