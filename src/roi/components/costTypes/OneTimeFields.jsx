import { NumberField, TextField, Hint } from '../../ui/fields.jsx'

export default function OneTimeFields({ item, onPatch }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <TextField label="Label" value={item.label} onChange={v => onPatch({ label: v })} placeholder="Acquisition cost" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <NumberField label="Amount ($)" value={item.amount} onChange={v => onPatch({ amount: v })} suffix="$" />
        <NumberField label="Occurs at (month)" value={item.occursAt} onChange={v => onPatch({ occursAt: v })} suffix="mo" />
      </div>
      <Hint>Month 0 = project start. Use a later month for purchases planned partway through the comparison period.</Hint>
    </div>
  )
}
