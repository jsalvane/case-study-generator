// URL-hash sharing. State is base64-url encoded in the hash so the whole ROI travels in a single link.

export const SHARE_VERSION = 1

function toBase64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(token) {
  const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = b64.length % 4 === 0 ? 0 : 4 - (b64.length % 4)
  const padded = b64 + '='.repeat(padLen)
  return decodeURIComponent(escape(atob(padded)))
}

export function encodeShareToken(state) {
  const json = JSON.stringify({ v: SHARE_VERSION, state })
  return toBase64Url(json)
}

export function decodeShareToken(token) {
  const json = fromBase64Url(token)
  const parsed = JSON.parse(json)
  if (!parsed || parsed.v !== SHARE_VERSION || !parsed.state) {
    throw new Error('Unsupported or malformed share link')
  }
  return parsed.state
}

export function buildShareUrl(state) {
  if (typeof window === 'undefined') return ''
  const token = encodeShareToken(state)
  const { origin, pathname } = window.location
  return `${origin}${pathname}#roi=${token}`
}

export function readShareFromHash() {
  if (typeof window === 'undefined') return null
  const m = (window.location.hash || '').match(/roi=([^&]+)/)
  if (!m) return null
  try {
    return decodeShareToken(m[1])
  } catch {
    return null
  }
}

export function clearShareHash() {
  if (typeof window === 'undefined') return
  if (/roi=/.test(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}
