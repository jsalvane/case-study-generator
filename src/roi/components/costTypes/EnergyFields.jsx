import { NumberField, TextField, Hint } from '../../ui/fields.jsx'

export default function EnergyFields({ item, onPatch }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <TextField label="Label" value={item.label} onChange={v => onPatch({ label: v })} placeholder="Pump motor energy" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <NumberField label="Power draw" value={item.kW} onChange={v => onPatch({ kW: v })} suffix="kW" step="0.1" />
        <NumberField label="Load factor" value={item.loadFactor} onChange={v => onPatch({ loadFactor: v })} step="0.05" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <NumberField label="Hours of operation" value={item.hoursPerYear} onChange={v => onPatch({ hoursPerYear: v })} suffix="hr/yr" />
        <NumberField label="Electricity price" value={item.pricePerKwh} onChange={v => onPatch({ pricePerKwh: v })} suffix="$/kWh" step="0.005" />
      </div>
      <NumberField
        label="CO₂e factor (optional)"
        value={item.co2eKgPerKwh}
        onChange={v => onPatch({ co2eKgPerKwh: v })}
        suffix="kg/kWh"
        step="0.05"
      />
      <Hint>US grid average ≈ 0.40 kg CO₂e/kWh. Use 0 for fully renewable sites. Annual kWh = kW × hours × load factor.</Hint>
    </div>
  )
}
