import { useEffect, useState } from 'react'
import { COST_TYPES, createItem, annualCost } from '../lib/costItems.js'
import { formatCurrency } from '../lib/calc.js'
import OneTimeFields from './costTypes/OneTimeFields.jsx'
import RecurringFixedFields from './costTypes/RecurringFixedFields.jsx'
import ConsumptionFields from './costTypes/ConsumptionFields.jsx'
import DowntimeFields from './costTypes/DowntimeFields.jsx'
import { NumberField, Button } from '../ui/fields.jsx'

const FIELDS = {
  oneTime: OneTimeFields,
  recurring: RecurringFixedFields,
  consumption: ConsumptionFields,
  downtime: DowntimeFields,
}

export default function CostItemDrawer({ open, scenarioKey, scenarioLabel, existing, mode, onSave, onDelete, onClose }) {
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
          width: 'min(520px, 100vw)',
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
            {mode === 'tracked' && (
              <div style={{ borderTop: '1px solid #ebebed', paddingTop: '16px' }}>
                <NumberField
                  label="Actual cost to date ($)"
                  value={draft.actual ?? ''}
                  onChange={v => patch({ actual: v === '' ? null : v })}
                  suffix="USD"
                />
                <p style={{ fontSize: '12px', color: '#6e6e73', marginTop: '6px' }}>
                  Leave blank if no actuals yet. When set, overrides the projection for elapsed months.
                </p>
              </div>
            )}
            <div style={{ background: '#f5f5f7', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Annualized
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1c1c1e', marginTop: '2px' }}>
                {formatCurrency(draft.typeId === 'oneTime' ? (Number(draft.amount) || 0) : annualCost(draft))}
                {draft.typeId === 'oneTime' && <span style={{ fontSize: 12, color: '#6e6e73', fontWeight: 500 }}> (one-time)</span>}
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
