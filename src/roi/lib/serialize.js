export const ROI_SCHEMA_VERSION = 1

export function serializeState(state, { anonymize = false } = {}) {
  const clone = JSON.parse(JSON.stringify(state))
  if (anonymize) {
    clone.meta.customerName = 'Customer A'
    clone.meta.location = ''
  }
  return {
    schemaVersion: ROI_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    anonymized: anonymize,
    state: clone,
  }
}

export function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function readJsonFile(file) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  if (!parsed.state || !parsed.schemaVersion) {
    throw new Error('Not a valid .roi.json file')
  }
  return parsed.state
}
