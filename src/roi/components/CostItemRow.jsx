import { useEffect, useRef, useState } from 'react'
import { COST_TYPES, annualCost, actualToDate } from '../lib/costItems.js'
import { formatCurrency } from '../lib/calc.js'

// Types that support inline headline-number editing (single dominant $ driver).
// Consumption and energy have multiple drivers — we keep those drawer-only to avoid ambiguity.
const INLINE_PRIMARY_FIELD = {
  oneTime:   { field: 'amount',     label: '$' },
  recurring: { field: 'amount',     label: '$ per occurrence' },
  downtime:  { field: 'hourlyRate', label: '$/hr' },
}

export default function CostItemRow({ item, mode, currency = 'USD', onEdit, onInlinePatch }) {
  const type = COST_TYPES[item.typeId]
  const yearly = item.typeId === 'oneTime' ? Number(item.amount) || 0 : annualCost(item)
  const inlineCfg = INLINE_PRIMARY_FIELD[item.typeId]

  const [editing, setEditing] = useState(false)
  const [draftValue, setDraftValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEdit(e) {
    e.stopPropagation()
    if (!inlineCfg) return
    setDraftValue(String(item[inlineCfg.field] ?? 0))
    setEditing(true)
  }

  function commit() {
    if (!inlineCfg) return
    const v = Number(draftValue)
    if (Number.isFinite(v) && v !== Number(item[inlineCfg.field])) {
      onInlinePatch?.({ ...item, [inlineCfg.field]: v })
    }
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  const actualTotal = actualToDate(item)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit() } }}
      style={{
        width: '100%', textAlign: 'left',
        padding: '12px 14px',
        background: '#fff', border: '1px solid #ebebed',
        borderRadius: '12px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#c8102e'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#ebebed'}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#c8102e', background: 'rgba(200,16,46,0.08)',
            padding: '2px 6px', borderRadius: '5px',
          }}>{type?.label.split(' ')[0] || 'Item'}</span>
          {item.categoryId && (
            <span style={{
              fontSize: '10px', fontWeight: 600, color: '#6e6e73',
              background: '#f5f5f7', padding: '2px 6px', borderRadius: '5px',
            }}>{item.categoryId}</span>
          )}
          {item.sourceNote && (
            <span title={item.sourceNote} style={{
              fontSize: '10px', color: '#6e6e73',
              background: '#f5f5f7', padding: '2px 6px', borderRadius: '5px',
              maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>src: {item.sourceNote}</span>
          )}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </div>
        {mode === 'tracked' && actualTotal != null && (
          <div style={{ fontSize: '11px', color: '#6e6e73', marginTop: '2px' }}>
            Actual to date: {formatCurrency(actualTotal, currency)}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {editing && inlineCfg ? (
          <input
            ref={inputRef}
            type="number"
            value={draftValue}
            onChange={e => setDraftValue(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={commit}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') { e.preventDefault(); cancel() }
            }}
            style={{
              width: '110px', height: '32px', padding: '0 8px', textAlign: 'right',
              fontSize: '14px', fontWeight: 600, color: '#1c1c1e',
              background: '#fff', border: '1.5px solid #c8102e', borderRadius: '8px',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            disabled={!inlineCfg}
            title={inlineCfg ? `Click to edit ${inlineCfg.label}` : 'Open to edit'}
            style={{
              background: inlineCfg ? 'transparent' : 'transparent',
              border: inlineCfg ? '1px dashed transparent' : 'none',
              cursor: inlineCfg ? 'text' : 'default',
              padding: inlineCfg ? '2px 6px' : '0',
              borderRadius: '6px', fontFamily: 'inherit', textAlign: 'right',
            }}
            onMouseEnter={e => { if (inlineCfg) e.currentTarget.style.borderColor = '#e5e5ea' }}
            onMouseLeave={e => { if (inlineCfg) e.currentTarget.style.borderColor = 'transparent' }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1c1c1e' }}>{formatCurrency(yearly, currency)}</div>
            <div style={{ fontSize: '11px', color: '#6e6e73' }}>
              {item.typeId === 'oneTime' ? 'one-time' : '/ year'}
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
