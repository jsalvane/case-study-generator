import { COST_TYPES, annualCost } from '../lib/costItems.js'
import { formatCurrency } from '../lib/calc.js'

export default function CostItemRow({ item, onEdit, mode }) {
  const type = COST_TYPES[item.typeId]
  const yearly = item.typeId === 'oneTime' ? Number(item.amount) || 0 : annualCost(item)
  return (
    <button
      onClick={onEdit}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#c8102e', background: 'rgba(200,16,46,0.08)',
            padding: '2px 6px', borderRadius: '5px',
          }}>{type?.label.split(' ')[0] || 'Item'}</span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </div>
        {mode === 'tracked' && item.actual != null && item.actual !== '' && (
          <div style={{ fontSize: '11px', color: '#6e6e73', marginTop: '2px' }}>
            Actual to date: {formatCurrency(Number(item.actual))}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1c1c1e' }}>{formatCurrency(yearly)}</div>
        <div style={{ fontSize: '11px', color: '#6e6e73' }}>
          {item.typeId === 'oneTime' ? 'one-time' : '/ year'}
        </div>
      </div>
    </button>
  )
}
