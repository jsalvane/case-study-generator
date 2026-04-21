import { useEffect, useMemo, useRef, useState } from 'react'
import FormSection from '../components/FormSection.jsx'
import useRoiState from './hooks/useRoiState.js'
import MetaBlock from './components/MetaBlock.jsx'
import ModeToggle from './components/ModeToggle.jsx'
import ScenarioCard from './components/ScenarioCard.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import ExportModal from './components/ExportModal.jsx'
import MobileResultsSticky from './components/MobileResultsSticky.jsx'
import { Button, TextareaField } from './ui/fields.jsx'
import { computeRoi } from './lib/calc.js'
import { serializeState, downloadJson, readJsonFile } from './lib/serialize.js'
import { openPrintReport } from './lib/printReport.js'
import { buildShareUrl, readShareFromHash, clearShareHash } from './lib/share.js'

export default function RoiApp() {
  const {
    state, canUndo, undo,
    updateMeta, setHorizon, setMode, setElapsed, setSensitivity, setNotes,
    upsertItem, removeItem, cloneScenario, replaceState, resetState,
  } = useRoiState()
  const [exportOpen, setExportOpen] = useState(false)
  const [importError, setImportError] = useState('')
  const [banner, setBanner] = useState('')   // top-of-page info banner (share-loaded, etc.)
  const chartRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load state from URL hash (share link), one-time on mount.
  useEffect(() => {
    const shared = readShareFromHash()
    if (shared) {
      try {
        replaceState(shared)
        setBanner('Loaded ROI from share link. Your previous work is preserved in the undo history.')
        clearShareHash()
      } catch (e) {
        setImportError(e.message || 'Could not load share link')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const results = useMemo(() => computeRoi({
    horizonYears: state.horizonYears,
    scenarioA: state.scenarioA,
    scenarioB: state.scenarioB,
    mode: state.mode,
    elapsedMonths: state.elapsedMonths,
    sensitivity: state.sensitivity,
  }), [state])

  const labels = {
    A: state.meta.currentLabel || 'Current',
    B: state.meta.chestertonLabel || 'Chesterton',
  }

  const currency = state.meta.currency || 'USD'

  // Shared category suggestions for the drawer (categoryId pairing between A & B).
  const categorySuggestions = useMemo(() => {
    const set = new Set()
    for (const it of [...state.scenarioA.items, ...state.scenarioB.items]) {
      if (it.categoryId) set.add(it.categoryId)
    }
    return [...set].sort()
  }, [state.scenarioA.items, state.scenarioB.items])

  async function handleSaveJson(anonymize) {
    const payload = serializeState(state, { anonymize })
    const safe = (state.meta.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')
    downloadJson(payload, `ROI_${safe}_${state.meta.date || ''}.roi.json`)
  }

  async function handleExportPdf(anonymize) {
    const exportState = anonymize
      ? { ...state, meta: { ...state.meta, customerName: 'Customer A', location: '' } }
      : state
    openPrintReport({
      meta: exportState.meta,
      notes: state.notes,
      horizonYears: state.horizonYears,
      mode: state.mode,
      labels: { A: exportState.meta.currentLabel || 'Current', B: exportState.meta.chestertonLabel || 'Chesterton' },
      results,
      scenarioA: exportState.scenarioA,
      scenarioB: exportState.scenarioB,
      anonymized: !!anonymize,
    })
  }

  async function handleCopyShareLink(anonymize) {
    const shareState = anonymize
      ? { ...state, meta: { ...state.meta, customerName: 'Customer A', location: '' } }
      : state
    return buildShareUrl(shareState)
  }

  async function handleImport(e) {
    setImportError('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const next = await readJsonFile(file)
      replaceState(next)
    } catch (err) {
      setImportError(err.message || 'Could not read file')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '20px', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8102e', margin: 0 }}>
              ROI Calculator
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.02em' }}>
              Cost comparison
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" accept=".json,.roi.json,application/json" style={{ display: 'none' }} onChange={handleImport} />
            <Button variant="secondary" onClick={undo} disabled={!canUndo} title={canUndo ? 'Undo last structural change' : 'Nothing to undo'}>↶ Undo</Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Import .roi.json</Button>
            <Button variant="secondary" onClick={resetState}>Reset</Button>
            <Button onClick={() => setExportOpen(true)}>Save / Share</Button>
          </div>
        </div>
        {banner && (
          <div style={{ background: 'rgba(21,128,61,0.08)', color: '#15803d', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span>{banner}</span>
            <button onClick={() => setBanner('')} style={{ background: 'transparent', border: 'none', color: '#15803d', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>×</button>
          </div>
        )}
        {importError && (
          <div style={{ background: '#fdf0f2', color: '#c8102e', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>{importError}</div>
        )}

        <FormSection step={1} title="Customer & solution" description="Set the context for this ROI analysis.">
          <MetaBlock meta={state.meta} onChange={updateMeta} />
        </FormSection>

        <FormSection step={2} title="Comparison settings" description="Set the time horizon and scenario assumptions.">
          <ModeToggle
            mode={state.mode}
            onMode={setMode}
            horizonYears={state.horizonYears}
            onHorizon={setHorizon}
            elapsedMonths={state.elapsedMonths}
            onElapsed={setElapsed}
            sensitivity={state.sensitivity}
            onSensitivity={setSensitivity}
          />
        </FormSection>

        <FormSection step={3} title="Cost scenarios" description="Enter the costs for each solution. Chesterton items will be compared against the current solution.">
          <div className="roi-scenarios" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <ScenarioCard
              title={labels.A}
              accent="#6e6e73"
              scenarioKey="scenarioA"
              items={state.scenarioA.items}
              mode={state.mode}
              currency={currency}
              categorySuggestions={categorySuggestions}
              onUpsert={upsertItem}
              onRemove={removeItem}
              onClone={() => cloneScenario('scenarioB', 'scenarioA')}
              cloneLabel="← Clone from Chesterton"
            />
            <ScenarioCard
              title={labels.B}
              accent="#c8102e"
              scenarioKey="scenarioB"
              items={state.scenarioB.items}
              mode={state.mode}
              currency={currency}
              categorySuggestions={categorySuggestions}
              onUpsert={upsertItem}
              onRemove={removeItem}
              onClone={() => cloneScenario('scenarioA', 'scenarioB')}
              cloneLabel="Clone from Current →"
            />
          </div>
        </FormSection>

        <FormSection step={4} title="Results" description="See where Chesterton pays off.">
          <ResultsPanel ref={chartRef} results={results} labels={labels} mode={state.mode} currency={currency} />
        </FormSection>

        <FormSection step={5} title="Notes" description="Caveats, assumptions, or context for the reader.">
          <TextareaField
            value={state.notes}
            onChange={setNotes}
            placeholder="e.g. Numbers based on 2024 maintenance log; excludes insurance premium reductions."
            rows={4}
          />
        </FormSection>
      </div>

      <div className="roi-sticky-mobile-only">
        <MobileResultsSticky results={results} labels={labels} currency={currency} />
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExportPdf={handleExportPdf}
        onSaveJson={handleSaveJson}
        onCopyShareLink={handleCopyShareLink}
      />
    </>
  )
}
