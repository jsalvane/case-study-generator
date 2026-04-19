import { NumberField, TextField, Hint } from '../../ui/fields.jsx'

export default function OneTimeFields({ item, onPatch }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <TextField label="Label" value={item.label} onChange={v => onPatch({ label: v })} placeholder="Acquisition cost" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <NumberField label="Amount ($)" value={item.amount} onChange={v => onPatch({ amount: v })} suffix="USD" />
        <NumberField label="Occurs at (month)" value={item.occursAt} onChange={v => onPatch({ occursAt: v })} suffix="mo" />
      </div>
      <Hint>Use month 0 for purchases made at project start. Use a later month for planned mid-horizon events like a rebuild.</Hint>
    </div>
  )
}
