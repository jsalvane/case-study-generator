export default function FormSection({ title, description, children, delay = 0, step }) {
  return (
    <div
      className="bg-white card-enter"
      style={{
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 2px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
        animationDelay: `${delay}ms`,
      }}
    >
      {title && (
        <div style={{ marginBottom: '24px' }}>
          {step && (
            <p style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#c8102e',
              marginBottom: '6px',
            }}>
              {String(step).padStart(2, '0')}
            </p>
          )}
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1c1c1e',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            margin: 0,
          }}>
            {title}
          </h2>
          {description && (
            <p style={{
              fontSize: '14px',
              color: '#6e6e73',
              marginTop: '5px',
              lineHeight: 1.5,
            }}>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
