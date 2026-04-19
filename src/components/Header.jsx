import { useState, useRef, useEffect } from 'react'

export default function Header({ onLogout, toolTitle, onBack }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 shrink-0"
      style={{
        height: '64px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Left: logo + wordmark */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center overflow-hidden shrink-0"
          style={{
            background: '#ffffff',
            boxShadow: '0 0 0 1.5px rgba(200,16,46,0.25), 0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <img src="/logo.png" alt="Chesterton" className="w-[26px] h-[26px] object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-medium"
            style={{ fontSize: '13px', color: '#6e6e73', letterSpacing: '-0.01em' }}
          >
            A.W. Chesterton
          </span>
          <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '15px', fontWeight: 300 }}>/</span>
          <span
            className="font-semibold"
            style={{ fontSize: '13px', color: '#1c1c1e', letterSpacing: '-0.01em' }}
          >
            {toolTitle || 'Sales Tools'}
          </span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: 600, color: '#6e6e73',
              background: '#f5f5f7', border: 'none', borderRadius: '8px',
              padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Tools</button>
        )}
      </div>

      {/* Right: settings */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: menuOpen ? '#f5f5f7' : 'transparent',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
          aria-label="Settings"
        >
          <svg
            style={{ width: '15px', height: '15px', color: '#6e6e73' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.38.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full py-1 z-50"
            style={{
              marginTop: '6px',
              width: '172px',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
              animation: 'card-enter 0.15s ease-out both',
            }}
          >
            <button
              onClick={() => { setMenuOpen(false); onLogout() }}
              className="w-full text-left flex items-center gap-2.5 transition-colors hover:bg-fill"
              style={{
                padding: '9px 14px',
                fontSize: '13px',
                color: '#1c1c1e',
                borderRadius: '10px',
              }}
            >
              <svg
                style={{ width: '15px', height: '15px', color: '#6e6e73', flexShrink: 0 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Lock Tool
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
