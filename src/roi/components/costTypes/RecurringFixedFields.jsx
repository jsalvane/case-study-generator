import { NumberField, TextField, SelectField, Hint } from '../../ui/fields.jsx'

export default function RecurringFixedFields({ item, onPatch }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <TextField label="Label" value={item.label} onChange={v => onPatch({ label: v })} placeholder="Repair / rebuild" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        <NumberField label="Amount per occurrence" value={item.amount} onChange={v => onPatch({ amount: v })} suffix="USD" />
        <NumberField label="Times" value={item.timesPerPeriod} onChange={v => onPatch({ timesPerPeriod: v })} />
        <SelectField
          label="Per"
          value={item.frequency}
          onChange={v => onPatch({ frequency: v })}
          options={[{ value: 'year', label: 'Year' }, { value: 'quarter', label: 'Quarter' }, { value: 'month', label: 'Month' }]}
        />
      </div>
      <Hint>Example: $2,400 × 4 × Year → $9,600/yr. Tool converts everything to a monthly stream automatically.</Hint>
    </div>
  )
}
