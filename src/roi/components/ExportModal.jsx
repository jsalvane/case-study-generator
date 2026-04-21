import { useState } from 'react'
import { CheckboxField, Button } from '../ui/fields.jsx'

export default function ExportModal({ open, onClose, onExportPdf, onSaveJson, onCopyShareLink }) {
  const [anonymize, setAnonymize] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!open) return null

  async function run(fn, key) {
    setError('')
    setBusy(key)
    try { await fn(anonymize) } catch (e) { setError(e.message || 'Export failed') }
    finally { setBusy(null) }
  }

  async function share() {
    setError('')
    setCopied(false)
    setBusy('share')
    try {
      const url = await onCopyShareLink(anonymize)
      if (url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch (e) {
      setError(e.message || 'Could not copy link')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        animation: 'app-fade-in 0.2s ease-out both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          width: '100%', maxWidth: '440px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)',
          animation: 'card-enter 0.25s cubic-bezier(0.16,1,0.3,1) both',
          display: 'flex', flexDirection: 'column', gap: '18px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1c1c1e' }}>Save or share</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6e6e73' }}>
            Print a branded PDF, save a round-trippable .roi.json, or copy a link that carries the whole ROI in its URL.
          </p>
        </div>
        <CheckboxField
          label="Anonymize customer details"
          description='Replaces customer name and location with "Customer A" in the export.'
          checked={anonymize}
          onChange={setAnonymize}
        />
        {error && <div style={{ background: '#fdf0f2', color: '#c8102e', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>{error}</div>}
        {copied && <div style={{ background: 'rgba(21,128,61,0.12)', color: '#15803d', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>Link copied to clipboard.</div>}
        <div style={{ display: 'grid', gap: '8px' }}>
          <Button onClick={() => run(onExportPdf, 'pdf')} disabled={busy != null}>
            {busy === 'pdf' ? 'Opening…' : 'Export PDF report'}
          </Button>
          <Button variant="secondary" onClick={() => run(onSaveJson, 'json')} disabled={busy != null}>
            {busy === 'json' ? 'Saving…' : 'Save .roi.json'}
          </Button>
          {onCopyShareLink && (
            <Button variant="secondary" onClick={share} disabled={busy != null}>
              {busy === 'share' ? 'Copying…' : 'Copy share link'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
