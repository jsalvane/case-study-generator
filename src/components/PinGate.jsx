import { useState, useEffect, useRef, useCallback } from 'react'

const KEYPAD = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['','0','⌫'],
]

export default function PinGate({ correctPin, onAuthenticated, exiting }) {
  const [pin, setPin] = useState('')
  const [shaking, setShaking] = useState(false)
  const [error, setError] = useState(false)
  const dotsRef = useRef(null)

  const handleKey = useCallback((digit) => {
    if (digit === '⌫') {
      setPin(p => p.slice(0, -1))
      setError(false)
      return
    }
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)

    if (next.length === 4) {
      if (next === correctPin) {
        setTimeout(() => onAuthenticated(), 150)
      } else {
        setTimeout(() => {
          setShaking(true)
          setError(true)
          setTimeout(() => {
            setShaking(false)
            setPin('')
          }, 600)
        }, 80)
      }
    }
  }, [pin, correctPin, onAuthenticated])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      if (e.key === 'Backspace') handleKey('⌫')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all${exiting ? ' gate-fade-out' : ''}`}
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(200,16,46,0.18) 0%, transparent 70%), #0a0a0c',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative flex flex-col items-center gap-10 px-6 w-full max-w-[280px]">

        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center overflow-hidden"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 0 0 1px rgba(200,16,46,0.2), 0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <img src="/logo.png" alt="Chesterton" className="w-12 h-12 object-contain" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              A.W. Chesterton
            </p>
            <h1 className="text-[22px] font-semibold text-white tracking-tight leading-none">Case Study Generator</h1>
            <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.38)' }}>Enter your PIN to continue</p>
          </div>
        </div>

        {/* PIN dots */}
        <div
          ref={dotsRef}
          className={`flex gap-5 ${shaking ? 'pin-shake' : ''}`}
        >
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? 'scale-110'
                    : 'scale-110 pin-dot-fill'
                  : ''
              }`}
              style={{
                background: i < pin.length
                  ? error ? '#c8102e' : 'rgba(255,255,255,0.92)'
                  : 'rgba(255,255,255,0.18)',
                border: i < pin.length ? 'none' : '1px solid rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        <div
          className={`text-[12px] font-medium -mt-6 transition-all duration-200 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
          style={{ color: '#c8102e' }}
        >
          Incorrect PIN — try again
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {KEYPAD.flat().map((key, i) => {
            if (key === '') return <div key={i} />
            const isBackspace = key === '⌫'
            return (
              <button
                key={i}
                onClick={() => handleKey(key)}
                className="h-[58px] flex flex-col items-center justify-center select-none
                           transition-all duration-100 active:scale-95 focus-visible:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
                aria-label={isBackspace ? 'Delete' : key}
              >
                {isBackspace ? (
                  <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6H8.828a2 2 0 00-1.414.586l-4 4a2 2 0 000 2.828l4 4A2 2 0 008.828 18H12m4-12l4 4m0 0l-4 4m4-4H12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H12" />
                  </svg>
                ) : (
                  <span className="text-[22px] font-light text-white leading-none">{key}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <p className="text-[10px] -mt-4 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Internal use only · Authorized personnel only
        </p>
      </div>
    </div>
  )
}
