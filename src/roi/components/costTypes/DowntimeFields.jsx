import { NumberField, TextField, Hint } from '../../ui/fields.jsx'

export default function DowntimeFields({ item, onPatch }) {
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <TextField label="Label" value={item.label} onChange={v => onPatch({ label: v })} placeholder="Pump overhaul downtime" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        <NumberField label="Events per year" value={item.eventsPerYear} onChange={v => onPatch({ eventsPerYear: v })} suffix="/yr" />
        <NumberField label="Hours per event" value={item.hoursPerEvent} onChange={v => onPatch({ hoursPerEvent: v })} suffix="hr" />
        <NumberField label="Cost per hour" value={item.hourlyRate} onChange={v => onPatch({ hourlyRate: v })} suffix="$/hr" />
      </div>
      <Hint>What one hour of downtime costs the customer — lost production $/hr when the line is down, or a loaded labor rate when it's just repair time.</Hint>
    </div>
  )
}
