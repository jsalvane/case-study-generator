import { NumberField, TextField, Hint } from '../../ui/fields.jsx'

export default function ConsumptionFields({ item, onPatch }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <TextField label="Label" value={item.label} onChange={v => onPatch({ label: v })} placeholder="Water flush" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <NumberField label="Usage rate" value={item.rate} onChange={v => onPatch({ rate: v })} suffix={item.rateUnit || 'gal/hr'} />
        <TextField label="Rate unit" value={item.rateUnit} onChange={v => onPatch({ rateUnit: v })} placeholder="gal/hr" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <NumberField label="Hours of operation" value={item.hoursPerYear} onChange={v => onPatch({ hoursPerYear: v })} suffix="hr/yr" />
        <NumberField label="Unit price" value={item.unitPrice} onChange={v => onPatch({ unitPrice: v })} suffix="$/unit" />
      </div>
      <Hint>Continuous running is 8,760 hr/yr. Example: 50 gal/hr × 8,760 hr/yr × $0.03/gal = $13,140/yr.</Hint>
    </div>
  )
}
