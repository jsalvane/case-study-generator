import { useEffect, useState, useCallback, useRef } from 'react'
import { createItem } from '../lib/costItems.js'
import { validateAndNormalizeState, HORIZON_MIN, HORIZON_MAX } from '../lib/validate.js'

const STORAGE_KEY = 'chesterton_roi_state_v1'
const UNDO_LIMIT = 20

function sampleState() {
  return {
    meta: {
      customerName: 'Acme Refining',
      industry: 'Oil & Gas (Downstream/Refining)',
      location: '',
      productLine: 'Mechanical Seals',
      application: 'Cooling water pump P-401A',
      currentLabel: 'Competitor cartridge seal',
      chestertonLabel: 'Chesterton 442C Split Seal',
      preparedBy: '',
      date: new Date().toISOString().slice(0, 10),
      currency: 'USD',
    },
    horizonYears: 5,
    mode: 'projected',
    elapsedMonths: 0,
    scenarioA: {
      items: [
        createItem('oneTime',   { label: 'Acquisition cost',      amount: 3500, occursAt: 0, categoryId: 'Acquisition',    sourceNote: 'Competitor quote' }),
        createItem('recurring', { label: 'Repair / rebuild',      amount: 2400, frequency: 'year', timesPerPeriod: 4,      categoryId: 'Maintenance',    sourceNote: '2024 work-order log' }),
        createItem('downtime',  { label: 'Pump overhaul downtime', eventsPerYear: 2, hoursPerEvent: 16, hourlyRate: 450,   categoryId: 'Downtime',       sourceNote: 'Lost-production estimate' }),
      ],
    },
    scenarioB: {
      items: [
        createItem('oneTime',   { label: 'Acquisition cost',      amount: 6200, occursAt: 0, isInvestment: true,           categoryId: 'Acquisition',    sourceNote: 'Chesterton quote' }),
        createItem('recurring', { label: 'Repair / rebuild',      amount: 900, frequency: 'year', timesPerPeriod: 1,       categoryId: 'Maintenance',    sourceNote: 'Chesterton field trial' }),
        createItem('downtime',  { label: 'Pump overhaul downtime', eventsPerYear: 0.5, hoursPerEvent: 6, hourlyRate: 450,  categoryId: 'Downtime',       sourceNote: 'Chesterton field trial' }),
      ],
    },
    notes: '',
  }
}

function readInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return validateAndNormalizeState(JSON.parse(raw))
  } catch {
    // fall through to sample
  }
  return sampleState()
}

export default function useRoiState() {
  const [state, setStateRaw] = useState(readInitialState)
  const [undoStack, setUndoStack] = useState([])
  const lastPushRef = useRef(0)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  // `withHistory=true` pushes the previous state onto the undo stack before applying `updater`.
  // Chatty field-level setters skip history to avoid 1-char undo noise.
  const setState = useCallback((updater, { withHistory = false } = {}) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (withHistory) {
        // Debounce: coalesce rapid pushes inside a 400ms window.
        const now = Date.now()
        if (now - lastPushRef.current > 400) {
          lastPushRef.current = now
          setUndoStack(h => [...h, prev].slice(-UNDO_LIMIT))
        }
      }
      return next
    })
  }, [])

  const updateMeta = useCallback((patch) => {
    setState(s => ({ ...s, meta: { ...s.meta, ...patch } }))
  }, [setState])

  const setHorizon = useCallback((years) => {
    setState(s => ({ ...s, horizonYears: Math.min(HORIZON_MAX, Math.max(HORIZON_MIN, Number(years) || HORIZON_MIN)) }))
  }, [setState])

  const setMode = useCallback((mode) => {
    setState(s => ({ ...s, mode }))
  }, [setState])

  const setElapsed = useCallback((m) => {
    setState(s => ({ ...s, elapsedMonths: Math.max(0, Number(m) || 0) }))
  }, [setState])

  const setNotes = useCallback((notes) => {
    setState(s => ({ ...s, notes }))
  }, [setState])

  const upsertItem = useCallback((scenarioKey, item) => {
    setState(s => {
      const items = s[scenarioKey].items
      const idx = items.findIndex(i => i.id === item.id)
      const next = idx >= 0
        ? items.map(i => (i.id === item.id ? item : i))
        : [...items, item]
      return { ...s, [scenarioKey]: { ...s[scenarioKey], items: next } }
    }, { withHistory: true })
  }, [setState])

  const removeItem = useCallback((scenarioKey, itemId) => {
    setState(s => ({
      ...s,
      [scenarioKey]: { ...s[scenarioKey], items: s[scenarioKey].items.filter(i => i.id !== itemId) },
    }), { withHistory: true })
  }, [setState])

  const cloneScenario = useCallback((fromKey, toKey) => {
    setState(s => {
      const cloned = s[fromKey].items.map(i => ({
        ...i,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
        actual: null,
        actualEvents: [],
      }))
      return { ...s, [toKey]: { ...s[toKey], items: cloned } }
    }, { withHistory: true })
  }, [setState])

  const replaceState = useCallback((next) => {
    const normalized = validateAndNormalizeState(next)
    setState(() => normalized, { withHistory: true })
  }, [setState])

  const resetState = useCallback(() => {
    setState(() => sampleState(), { withHistory: true })
  }, [setState])

  const undo = useCallback(() => {
    setUndoStack(h => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setStateRaw(prev)
      return h.slice(0, -1)
    })
  }, [])

  return {
    state,
    canUndo: undoStack.length > 0,
    undo,
    updateMeta,
    setHorizon,
    setMode,
    setElapsed,
    setNotes,
    upsertItem,
    removeItem,
    cloneScenario,
    replaceState,
    resetState,
  }
}
