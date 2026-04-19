const LABEL_STYLE = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#6e6e73',
  marginBottom: '7px',
  letterSpacing: '-0.005em',
}

const fieldBase = (error, hasValue) => ({
  width: '100%',
  fontSize: '15px',
  color: '#1c1c1e',
  background: error ? '#fdf0f2' : hasValue ? '#ffffff' : '#f5f5f7',
  border: error ? '1.5px solid #c8102e' : hasValue ? '1.5px solid #e5e5ea' : '1.5px solid transparent',
  borderRadius: '12px',
  outline: 'none',
  transition: 'all 0.15s ease',
  fontFamily: 'inherit',
})

export function Label({ children, htmlFor, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
      <label htmlFor={htmlFor} style={{ ...LABEL_STYLE, marginBottom: 0 }}>{children}</label>
      {right}
    </div>
  )
}

export function TextField({ label, value, onChange, placeholder, error, type = 'text', step, min, suffix }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          min={min}
          className="focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent focus:bg-white placeholder:text-[#9a9a9f]"
          style={{
            ...fieldBase(error, value != null && value !== ''),
            height: '44px',
            padding: suffix ? '0 44px 0 14px' : '0 14px',
          }}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: 12, top: 0, bottom: 0,
            display: 'flex', alignItems: 'center',
            fontSize: '12px', color: '#6e6e73', pointerEvents: 'none',
          }}>{suffix}</span>
        )}
      </div>
      {error && <p style={{ fontSize: '12px', color: '#c8102e', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

export function NumberField(props) {
  return <TextField {...props} type="number" step={props.step ?? 'any'} min={props.min ?? 0} />
}

export function SelectField({ label, value, onChange, options, placeholder = 'Select…', error }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent focus:bg-white"
        style={{
          ...fieldBase(error, !!value),
          height: '44px',
          paddingLeft: '14px',
          paddingRight: '36px',
          appearance: 'none',
          cursor: 'pointer',
          color: value ? '#1c1c1e' : '#9a9a9f',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236e6e73' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          backgroundSize: '12px 12px',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
      {error && <p style={{ fontSize: '12px', color: '#c8102e', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

export function TextareaField({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent focus:bg-white placeholder:text-[#9a9a9f]"
        style={{
          ...fieldBase(false, value != null && value !== ''),
          padding: '13px 14px',
          resize: 'vertical',
          lineHeight: 1.6,
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

export function CheckboxField({ label, checked, onChange, description }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: '3px', accentColor: '#c8102e', width: '16px', height: '16px' }}
      />
      <div>
        <div style={{ fontSize: '14px', color: '#1c1c1e', fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: '12px', color: '#6e6e73', marginTop: '2px' }}>{description}</div>}
      </div>
    </label>
  )
}

export function Hint({ children }) {
  return (
    <div style={{
      background: 'rgba(200,16,46,0.04)',
      border: '1px solid rgba(200,16,46,0.1)',
      borderRadius: '10px',
      padding: '10px 12px',
      fontSize: '12px',
      color: '#6e6e73',
      lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: '40px', padding: '0 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 600, letterSpacing: '-0.005em',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: 'none', transition: 'all 0.15s ease', fontFamily: 'inherit',
  }
  const variants = {
    primary: { background: '#c8102e', color: '#fff' },
    secondary: { background: '#f5f5f7', color: '#1c1c1e', border: '1px solid rgba(0,0,0,0.06)' },
    ghost: { background: 'transparent', color: '#c8102e' },
    danger: { background: '#fdf0f2', color: '#c8102e' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  )
}
