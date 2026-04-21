import { validateAndNormalizeState } from './validate.js'

export const ROI_SCHEMA_VERSION = 2  // bumped for energy type, escalation, sourceNote, actualEvents, categoryId, isInvestment, currency, sensitivity

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
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON')
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.state || !parsed.schemaVersion) {
    throw new Error('Not a valid .roi.json file')
  }
  if (parsed.schemaVersion > ROI_SCHEMA_VERSION) {
    throw new Error(`Schema version ${parsed.schemaVersion} is newer than this tool (v${ROI_SCHEMA_VERSION}). Update the app and retry.`)
  }
  // Normalize handles v1 → v2 migration automatically (missing fields get defaults).
  return validateAndNormalizeState(parsed.state)
}
