import { SelectField, TextField } from '../ui/fields.jsx'
import { CURRENCY_OPTIONS } from '../lib/theme.js'
import INDUSTRIES from '../reference/industries.json'
import PRODUCT_LINES from '../reference/product-lines.json'

export default function MetaBlock({ meta, onChange }) {
  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <TextField label="Customer name" value={meta.customerName} onChange={v => onChange({ customerName: v })} placeholder="Acme Refining" />
        <SelectField label="Industry" value={meta.industry} onChange={v => onChange({ industry: v })} options={INDUSTRIES} />
        <SelectField label="Product line" value={meta.productLine} onChange={v => onChange({ productLine: v })} options={PRODUCT_LINES} />
        <TextField label="Location / plant (optional)" value={meta.location} onChange={v => onChange({ location: v })} placeholder="Baton Rouge, LA" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <TextField label="Application" value={meta.application} onChange={v => onChange({ application: v })} placeholder="Cooling water pump P-401A" />
        <TextField label="Current solution" value={meta.currentLabel} onChange={v => onChange({ currentLabel: v })} placeholder="Competitor cartridge seal" />
        <TextField label="Chesterton solution" value={meta.chestertonLabel} onChange={v => onChange({ chestertonLabel: v })} placeholder="Chesterton 442C Split Seal" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <TextField label="Prepared by" value={meta.preparedBy} onChange={v => onChange({ preparedBy: v })} placeholder="Your name" />
        <TextField label="Date" type="date" value={meta.date} onChange={v => onChange({ date: v })} />
        <SelectField
          label="Currency"
          value={meta.currency || 'USD'}
          onChange={v => onChange({ currency: v })}
          options={CURRENCY_OPTIONS}
        />
      </div>
    </div>
  )
}
