import { useMemo, useRef, useState } from 'react'
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
import { chartNodeToSvg } from './lib/pptx.js'
import { openPrintReport } from './lib/printReport.js'

export default function RoiApp() {
  const {
    state, updateMeta, setHorizon, setMode, setElapsed, setNotes,
    upsertItem, removeItem, cloneScenario, replaceState, resetState,
  } = useRoiState()
  const [exportOpen, setExportOpen] = useState(false)
  const [importError, setImportError] = useState('')
  const chartRef = useRef(null)
  const fileInputRef = useRef(null)

  const results = useMemo(() => computeRoi({
    horizonYears: state.horizonYears,
    scenarioA: state.scenarioA,
    scenarioB: state.scenarioB,
    mode: state.mode,
    elapsedMonths: state.elapsedMonths,
  }), [state])

  const labels = {
    A: state.meta.currentLabel || 'Current',
    B: state.meta.chestertonLabel || 'Chesterton',
  }

  async function handleSaveJson(anonymize) {
    const payload = serializeState(state, { anonymize })
    const safe = (state.meta.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')
    downloadJson(payload, `ROI_${safe}_${state.meta.date || ''}.roi.json`)
  }

  async function handleExportPdf(anonymize) {
    const chartSvg = chartNodeToSvg(chartRef.current)
    const exportState = anonymize
      ? { ...state, meta: { ...state.meta, customerName: 'Customer A', location: '' } }
      : state
    openPrintReport({
      meta: exportState.meta,
      notes: state.notes,
      horizonYears: state.horizonYears,
      mode: state.mode,
      labels: { A: exportState.meta.currentLabel || 'Current', B: exportState.meta.chestertonLabel || 'Chesterton' },
      results: {
        paybackMonths: results.paybackMonths,
        tcoA: results.tcoA,
        tcoB: results.tcoB,
        savings: results.savings,
        roiPct: results.roiPct,
        annualizedSavings: results.annualizedSavings,
        downtimeHoursAvoided: results.downtimeHoursAvoided,
      },
      scenarioA: exportState.scenarioA,
      scenarioB: exportState.scenarioB,
      chartSvg,
      anonymized: !!anonymize,
    })
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
              Total cost of ownership comparison
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" accept=".json,.roi.json,application/json" style={{ display: 'none' }} onChange={handleImport} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Import .roi.json</Button>
            <Button variant="secondary" onClick={resetState}>Reset</Button>
            <Button onClick={() => setExportOpen(true)}>Save / Export</Button>
          </div>
        </div>
        {importError && (
          <div style={{ background: '#fdf0f2', color: '#c8102e', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>{importError}</div>
        )}

        <FormSection step={1} title="Customer & solution" description="Set the context for this ROI analysis.">
          <MetaBlock meta={state.meta} onChange={updateMeta} />
        </FormSection>

        <FormSection step={2} title="Horizon & mode" description="Projected for hypothetical ROI, Tracked to log actuals over time.">
          <ModeToggle
            mode={state.mode}
            onMode={setMode}
            horizonYears={state.horizonYears}
            onHorizon={setHorizon}
            elapsedMonths={state.elapsedMonths}
            onElapsed={setElapsed}
          />
        </FormSection>

        <FormSection step={3} title="Cost scenarios" description="Add one-time, recurring, consumption, and downtime costs to each side.">
          <div className="roi-scenarios" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <ScenarioCard
              title={labels.A}
              accent="#6e6e73"
              scenarioKey="scenarioA"
              items={state.scenarioA.items}
              mode={state.mode}
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
              onUpsert={upsertItem}
              onRemove={removeItem}
              onClone={() => cloneScenario('scenarioA', 'scenarioB')}
              cloneLabel="Clone from Current →"
            />
          </div>
        </FormSection>

        <FormSection step={4} title="Results" description="Cumulative cost comparison across the horizon.">
          <ResultsPanel ref={chartRef} results={results} labels={labels} mode={state.mode} />
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
        <MobileResultsSticky results={results} />
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExportPdf={handleExportPdf}
        onSaveJson={handleSaveJson}
      />
    </>
  )
}
