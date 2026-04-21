import { useEffect, useState } from 'react'
import { COST_TYPES, createItem, annualCost, actualToDate } from '../lib/costItems.js'
import { formatCurrency } from '../lib/calc.js'
import OneTimeFields from './costTypes/OneTimeFields.jsx'
import RecurringFixedFields from './costTypes/RecurringFixedFields.jsx'
import ConsumptionFields from './costTypes/ConsumptionFields.jsx'
import DowntimeFields from './costTypes/DowntimeFields.jsx'
import EnergyFields from './costTypes/EnergyFields.jsx'
import { NumberField, TextField, CheckboxField, Button } from '../ui/fields.jsx'

const FIELDS = {
  oneTime: OneTimeFields,
  recurring: RecurringFixedFields,
  consumption: ConsumptionFields,
  downtime: DowntimeFields,
  energy: EnergyFields,
}

export default function CostItemDrawer({
  open, scenarioKey, scenarioLabel, existing, mode, currency = 'USD',
  categorySuggestions = [],
  onSave, onDelete, onClose,
}) {
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (!open) return
    if (existing) setDraft(existing)
    else setDraft({ step: 'type' })
  }, [open, existing])

  if (!open || !draft) return null

  const isNew = !existing
  const Fields = draft.typeId ? FIELDS[draft.typeId] : null

  function patch(p) { setDraft(d => ({ ...d, ...p })) }

  function pickType(typeId) {
    setDraft(createItem(typeId))
  }

  function handleSave() {
    onSave(draft)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50,
        animation: 'app-fade-in 0.2s ease-out both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="roi-drawer"
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 'min(560px, 100vw)',
          background: '#fff', boxShadow: '-12px 0 40px rgba(0,0,0,0.1)',
          padding: '24px', overflowY: 'auto',
          animation: 'card-enter 0.25s cubic-bezier(0.16,1,0.3,1) both',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8102e', margin: 0 }}>
              {scenarioLabel}
            </p>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1e', margin: '4px 0 0' }}>
              {isNew ? 'Add cost' : 'Edit cost'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f7', border: 'none', width: 32, height: 32, borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#6e6e73' }}>×</button>
        </div>

        {!draft.typeId && (
          <div style={{ display: 'grid', gap: '10px' }}>
            {Object.values(COST_TYPES).map(t => (
              <button
                key={t.id}
                onClick={() => pickType(t.id)}
                style={{
                  textAlign: 'left', padding: '14px 16px',
                  background: '#f5f5f7', border: '1.5px solid transparent', borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.border = '1.5px solid #c8102e'}
                onMouseLeave={e => e.currentTarget.style.border = '1.5px solid transparent'}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1e' }}>{t.label}</div>
                <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '3px' }}>{t.description}</div>
              </button>
            ))}
          </div>
        )}

        {Fields && (
          <>
            <Fields item={draft} onPatch={patch} />

            {/* Shared fields: category pairing + escalation + source note + investment flag */}
            <div style={{ borderTop: '1px solid #ebebed', paddingTop: '16px', display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <NumberField
                  label="Annual escalation"
                  value={draft.escalationPct ?? 0}
                  onChange={v => patch({ escalationPct: v })}
                  suffix="%/yr"
                  step="0.5"
                />
                <CategoryField
                  value={draft.categoryId}
                  suggestions={categorySuggestions}
                  onChange={v => patch({ categoryId: v === '' ? null : v })}
                />
              </div>
              <TextField
                label="Source / justification (shown in PDF)"
                value={draft.sourceNote ?? ''}
                onChange={v => patch({ sourceNote: v })}
                placeholder="2024 work-order log · customer-provided · industry benchmark"
              />
              <CheckboxField
                label="Counts toward ROI investment basis"
                description="ROI % = savings ÷ sum of items flagged here. Typically the Chesterton up-front investment."
                checked={!!draft.isInvestment}
                onChange={v => patch({ isInvestment: v })}
              />
            </div>

            {mode === 'tracked' && (
              <TrackedEvents
                events={Array.isArray(draft.actualEvents) ? draft.actualEvents : []}
                legacyActual={draft.actual}
                currency={currency}
                onChange={(events) => patch({ actualEvents: events, actual: null })}
              />
            )}

            <div style={{ background: '#f5f5f7', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Annualized (year 1)
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1c1c1e', marginTop: '2px' }}>
                {formatCurrency(draft.typeId === 'oneTime' ? (Number(draft.amount) || 0) : annualCost(draft), currency)}
                {draft.typeId === 'oneTime' && <span style={{ fontSize: 12, color: '#6e6e73', fontWeight: 500 }}> (one-time)</span>}
                {Number(draft.escalationPct) !== 0 && draft.typeId !== 'oneTime' && (
                  <span style={{ fontSize: 12, color: '#6e6e73', fontWeight: 500 }}> · escalates {Number(draft.escalationPct) > 0 ? '+' : ''}{Number(draft.escalationPct)}%/yr</span>
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          {!isNew ? (
            <Button variant="danger" onClick={() => { onDelete(existing.id); onClose() }}>Delete</Button>
          ) : <span />}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            {Fields && <Button onClick={handleSave}>Save</Button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryField({ value, suggestions, onChange }) {
  const listId = 'roi-category-list'
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6e6e73', marginBottom: '7px' }}>
        Category (pairs A ↔ B)
      </label>
      <input
        list={listId}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Maintenance, Acquisition, Downtime"
        style={{
          width: '100%', height: '44px', padding: '0 14px',
          fontSize: '15px', color: '#1c1c1e',
          background: value ? '#fff' : '#f5f5f7',
          border: value ? '1.5px solid #e5e5ea' : '1.5px solid transparent',
          borderRadius: '12px', outline: 'none', fontFamily: 'inherit',
        }}
      />
      <datalist id={listId}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  )
}

function TrackedEvents({ events, legacyActual, currency, onChange }) {
  // If legacy single actual exists and no events yet, offer a one-click migration.
  const hasLegacy = (legacyActual != null && legacyActual !== '') && events.length === 0

  function add() {
    const next = [...events, {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      note: '',
    }]
    onChange(next)
  }

  function update(id, patch) {
    onChange(events.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  function remove(id) {
    onChange(events.filter(e => e.id !== id))
  }

  function migrateLegacy() {
    onChange([{
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
      date: new Date().toISOString().slice(0, 10),
      amount: Number(legacyActual) || 0,
      note: 'Migrated from single actual',
    }])
  }

  const total = events.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  return (
    <div style={{ borderTop: '1px solid #ebebed', paddingTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1c1c1e' }}>Tracked actual events</div>
          <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '2px' }}>
            Dated log of real costs to date. Sum replaces the projection for the elapsed window.
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Total to date</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1c1c1e' }}>{formatCurrency(total, currency)}</div>
        </div>
      </div>

      {hasLegacy && (
        <div style={{ background: '#fdf0f2', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: '#6e6e73' }}>
            Found a legacy single actual of {formatCurrency(Number(legacyActual) || 0, currency)}. Move it to the event log?
          </div>
          <Button variant="secondary" onClick={migrateLegacy}>Migrate</Button>
        </div>
      )}

      <div style={{ display: 'grid', gap: '8px' }}>
        {events.length === 0 && !hasLegacy && (
          <div style={{ fontSize: '12px', color: '#9a9a9f', padding: '12px', textAlign: 'center', background: '#f5f5f7', borderRadius: '10px' }}>
            No events yet. Add one when an actual cost hits.
          </div>
        )}
        {events.map(ev => (
          <div key={ev.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#6e6e73', marginBottom: '4px' }}>Date</label>
              <input type="date" value={ev.date} onChange={e => update(ev.id, { date: e.target.value })}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#6e6e73', marginBottom: '4px' }}>Amount</label>
              <input type="number" value={ev.amount} onChange={e => update(ev.id, { amount: Number(e.target.value) || 0 })}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#6e6e73', marginBottom: '4px' }}>Note</label>
              <input type="text" value={ev.note} onChange={e => update(ev.id, { note: e.target.value })}
                placeholder="WO #12345" style={inputStyle} />
            </div>
            <button
              onClick={() => remove(ev.id)}
              title="Remove"
              style={{ height: '36px', width: '36px', border: 'none', borderRadius: '8px', background: '#fdf0f2', color: '#c8102e', cursor: 'pointer', fontSize: '16px' }}
            >×</button>
          </div>
        ))}
      </div>

      <Button variant="secondary" onClick={add} style={{ marginTop: '10px', width: '100%' }}>+ Add event</Button>
    </div>
  )
}

const inputStyle = {
  width: '100%', height: '36px', padding: '0 10px',
  fontSize: '13px', color: '#1c1c1e', background: '#fff',
  border: '1px solid #e5e5ea', borderRadius: '8px', outline: 'none', fontFamily: 'inherit',
}
