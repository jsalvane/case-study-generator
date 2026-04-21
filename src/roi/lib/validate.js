import { COST_TYPES } from './costItems.js'
import { CURRENCIES } from './theme.js'

export const VALID_MODES = ['projected', 'tracked']
export const HORIZON_MIN = 1
export const HORIZON_MAX = 15

function num(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function str(v, fallback = '') {
  return typeof v === 'string' ? v : fallback
}

function normalizeEvent(ev) {
  if (!ev || typeof ev !== 'object') return null
  return {
    id: str(ev.id, crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)),
    date: str(ev.date, ''),
    amount: num(ev.amount, 0),
    note: str(ev.note, ''),
  }
}

function normalizeItem(it) {
  if (!it || typeof it !== 'object') throw new Error('Invalid cost item')
  if (!COST_TYPES[it.typeId]) throw new Error(`Unknown cost type: ${it.typeId}`)
  return {
    ...it,
    id: str(it.id, crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)),
    label: str(it.label, COST_TYPES[it.typeId].label),
    escalationPct: num(it.escalationPct, 0),
    sourceNote: str(it.sourceNote, ''),
    categoryId: it.categoryId == null || it.categoryId === '' ? null : str(it.categoryId, null),
    isInvestment: !!it.isInvestment,
    actualEvents: Array.isArray(it.actualEvents)
      ? it.actualEvents.map(normalizeEvent).filter(Boolean)
      : [],
    actual: it.actual == null || it.actual === '' ? null : num(it.actual, null),
  }
}

export function validateAndNormalizeState(state) {
  if (!state || typeof state !== 'object') throw new Error('State must be an object')
  if (!state.meta || typeof state.meta !== 'object') throw new Error('Missing meta block')
  if (!state.scenarioA || !Array.isArray(state.scenarioA.items)) throw new Error('Missing scenarioA.items')
  if (!state.scenarioB || !Array.isArray(state.scenarioB.items)) throw new Error('Missing scenarioB.items')

  const currency = CURRENCIES[state.meta.currency] ? state.meta.currency : 'USD'
  const horizonYears = Math.max(HORIZON_MIN, Math.min(HORIZON_MAX, num(state.horizonYears, 5)))
  const mode = VALID_MODES.includes(state.mode) ? state.mode : 'projected'

  return {
    meta: {
      customerName: str(state.meta.customerName),
      industry: str(state.meta.industry),
      location: str(state.meta.location),
      productLine: str(state.meta.productLine),
      application: str(state.meta.application),
      currentLabel: str(state.meta.currentLabel),
      chestertonLabel: str(state.meta.chestertonLabel),
      preparedBy: str(state.meta.preparedBy),
      date: str(state.meta.date),
      currency,
    },
    horizonYears,
    mode,
    elapsedMonths: Math.max(0, num(state.elapsedMonths, 0)),
    notes: str(state.notes, ''),
    scenarioA: { items: state.scenarioA.items.map(normalizeItem) },
    scenarioB: { items: state.scenarioB.items.map(normalizeItem) },
  }
}
