import { useEffect, useState, useCallback } from 'react'
import { createItem } from '../lib/costItems.js'

const STORAGE_KEY = 'chesterton_roi_state_v1'

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
    },
    horizonYears: 5,
    mode: 'projected',
    elapsedMonths: 0,
    scenarioA: {
      items: [
        createItem('oneTime', { label: 'Acquisition cost', amount: 3500, occursAt: 0 }),
        createItem('recurring', { label: 'Repair / rebuild', amount: 2400, frequency: 'year', timesPerPeriod: 4 }),
        createItem('downtime', { label: 'Pump overhaul downtime', eventsPerYear: 2, hoursPerEvent: 16, hourlyRate: 450 }),
      ],
    },
    scenarioB: {
      items: [
        createItem('oneTime', { label: 'Acquisition cost', amount: 6200, occursAt: 0 }),
        createItem('recurring', { label: 'Repair / rebuild', amount: 900, frequency: 'year', timesPerPeriod: 1 }),
        createItem('downtime', { label: 'Pump overhaul downtime', eventsPerYear: 0.5, hoursPerEvent: 6, hourlyRate: 450 }),
      ],
    },
    notes: '',
  }
}

export default function useRoiState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return sampleState()
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  const updateMeta = useCallback((patch) => {
    setState(s => ({ ...s, meta: { ...s.meta, ...patch } }))
  }, [])

  const setHorizon = useCallback((years) => {
    setState(s => ({ ...s, horizonYears: years }))
  }, [])

  const setMode = useCallback((mode) => {
    setState(s => ({ ...s, mode }))
  }, [])

  const setElapsed = useCallback((m) => {
    setState(s => ({ ...s, elapsedMonths: Math.max(0, Number(m) || 0) }))
  }, [])

  const setNotes = useCallback((notes) => {
    setState(s => ({ ...s, notes }))
  }, [])

  const upsertItem = useCallback((scenarioKey, item) => {
    setState(s => {
      const items = s[scenarioKey].items
      const idx = items.findIndex(i => i.id === item.id)
      const next = idx >= 0
        ? items.map(i => (i.id === item.id ? item : i))
        : [...items, item]
      return { ...s, [scenarioKey]: { ...s[scenarioKey], items: next } }
    })
  }, [])

  const removeItem = useCallback((scenarioKey, itemId) => {
    setState(s => ({
      ...s,
      [scenarioKey]: { ...s[scenarioKey], items: s[scenarioKey].items.filter(i => i.id !== itemId) },
    }))
  }, [])

  const cloneScenario = useCallback((fromKey, toKey) => {
    setState(s => {
      const cloned = s[fromKey].items.map(i => ({
        ...i,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
        actual: null,
      }))
      return { ...s, [toKey]: { ...s[toKey], items: cloned } }
    })
  }, [])

  const replaceState = useCallback((next) => setState(next), [])
  const resetState = useCallback(() => setState(sampleState()), [])

  return {
    state,
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
