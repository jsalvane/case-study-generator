import { useState } from 'react'
import CostItemRow from './CostItemRow.jsx'
import CostItemDrawer from './CostItemDrawer.jsx'
import { annualCost } from '../lib/costItems.js'
import { formatCurrency } from '../lib/calc.js'
import { Button } from '../ui/fields.jsx'

export default function ScenarioCard({
  title, accent = '#6e6e73', scenarioKey, items, mode,
  currency = 'USD',
  categorySuggestions = [],
  onUpsert, onRemove, onClone, cloneLabel,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const oneTime = items.filter(i => i.typeId === 'oneTime').reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const yearly = items.filter(i => i.typeId !== 'oneTime').reduce((s, i) => s + annualCost(i), 0)

  function openAdd() { setEditing(null); setDrawerOpen(true) }
  function openEdit(item) { setEditing(item); setDrawerOpen(true) }

  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      border: `1px solid ${accent === '#c8102e' ? 'rgba(200,16,46,0.2)' : '#ebebed'}`,
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, margin: 0 }}>
            {scenarioKey === 'scenarioB' ? 'Chesterton' : 'Current'}
          </p>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1c1c1e', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || 'Unnamed solution'}
          </h3>
        </div>
        {onClone && (
          <button
            onClick={onClone}
            title={cloneLabel}
            style={{
              fontSize: '11px', fontWeight: 600, color: '#6e6e73',
              background: '#f5f5f7', border: 'none', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {cloneLabel}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {items.length === 0 && (
          <div style={{ fontSize: '13px', color: '#9a9a9f', padding: '12px', textAlign: 'center', background: '#f5f5f7', borderRadius: '10px' }}>
            No cost items yet.
          </div>
        )}
        {items.map(item => (
          <CostItemRow
            key={item.id}
            item={item}
            mode={mode}
            currency={currency}
            onEdit={() => openEdit(item)}
            onInlinePatch={(updated) => onUpsert(scenarioKey, updated)}
          />
        ))}
      </div>

      <Button variant="secondary" onClick={openAdd} style={{ width: '100%' }}>+ Add cost</Button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f5f5f7', borderRadius: '10px', padding: '10px 12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>One-time</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1c1c1e' }}>{formatCurrency(oneTime, currency)}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Per year (yr 1)</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1c1c1e' }}>{formatCurrency(yearly, currency)}</div>
        </div>
      </div>

      <CostItemDrawer
        open={drawerOpen}
        scenarioKey={scenarioKey}
        scenarioLabel={title || (scenarioKey === 'scenarioB' ? 'Chesterton' : 'Current')}
        existing={editing}
        mode={mode}
        currency={currency}
        categorySuggestions={categorySuggestions}
        onSave={(item) => onUpsert(scenarioKey, item)}
        onDelete={(id) => onRemove(scenarioKey, id)}
        onClose={() => { setDrawerOpen(false); setEditing(null) }}
      />
    </div>
  )
}
