export default function SuccessModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full sm:max-w-sm card-enter"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '32px 28px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          textAlign: 'center',
        }}
      >
        {/* Check icon */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(140deg, #c8102e, #a50e25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(200,16,46,0.35)',
          }}
        >
          <svg style={{ width: '26px', height: '26px', color: '#ffffff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h3 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#1c1c1e',
          letterSpacing: '-0.025em',
          marginBottom: '8px',
        }}>
          Case Study Submitted
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6e6e73',
          lineHeight: 1.55,
          marginBottom: '24px',
        }}>
          Your case study has been sent to Creative Services. They'll follow up if they need anything else.
        </p>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center transition-all duration-200 active:scale-[0.99]"
          style={{
            height: '50px',
            background: '#fedb00',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#1c1c1e',
            letterSpacing: '-0.01em',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(254,219,0,0.35)',
          }}
        >
          Submit Another
        </button>
      </div>
    </div>
  )
}
