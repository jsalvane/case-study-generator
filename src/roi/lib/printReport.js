function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function fmtCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtMonths(m) {
  if (m == null) return 'No payback in horizon'
  if (m === 0) return 'Immediate'
  const y = Math.floor(m / 12), r = m % 12
  if (y === 0) return `${m} mo`
  if (r === 0) return `${y} yr`
  return `${y} yr ${r} mo`
}

function itemDetail(i) {
  switch (i.typeId) {
    case 'oneTime': return `${fmtCurrency(Number(i.amount) || 0)} at month ${i.occursAt || 0}`
    case 'recurring': return `${fmtCurrency(Number(i.amount) || 0)} × ${i.timesPerPeriod}/${i.frequency}`
    case 'consumption': return `${i.rate} ${i.rateUnit} × ${i.hoursPerYear} hr/yr × ${fmtCurrency(Number(i.unitPrice) || 0)}/unit`
    case 'downtime': return `${i.eventsPerYear}/yr × ${i.hoursPerEvent} hr × ${fmtCurrency(Number(i.hourlyRate) || 0)}/hr`
    default: return ''
  }
}

function itemTable(items) {
  if (!items?.length) return '<p class="muted">No items.</p>'
  const rows = items.map(i => `
    <tr>
      <td>${esc(i.label || '—')}</td>
      <td class="detail">${esc(itemDetail(i))}</td>
    </tr>`).join('')
  return `<table class="items"><thead><tr><th>Item</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`
}

export function buildReportHtml({ meta, notes, horizonYears, mode, labels, results, scenarioA, scenarioB, chartPng, anonymized }) {
  const kpis = [
    ['Payback period', fmtMonths(results?.paybackMonths)],
    ['Total savings', fmtCurrency(results?.savings)],
    ['ROI', results?.roiPct == null ? '—' : `${Math.round(results.roiPct)}%`],
    ['Annualized savings', fmtCurrency(results?.annualizedSavings)],
    [`${labels?.A || 'Current'} TCO`, fmtCurrency(results?.tcoA)],
    [`${labels?.B || 'Chesterton'} TCO`, fmtCurrency(results?.tcoB)],
    ['Downtime hours avoided', `${Math.round(results?.downtimeHoursAvoided || 0).toLocaleString()} hr`],
  ]
  const subtitle = [meta.industry, meta.productLine, meta.location].filter(Boolean).map(esc).join(' • ')
  const footer = `Prepared by ${esc(meta.preparedBy || '—')} • ${esc(meta.date || '')} • Horizon: ${esc(horizonYears)} yr • ${mode === 'tracked' ? 'Tracked' : 'Projected'}${anonymized ? ' • Anonymized' : ''}`

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>ROI — ${esc(meta.customerName || 'Customer')}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; color: #1c1c1e; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { padding: 24px; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #c8102e; margin: 0; }
  h1 { margin: 4px 0 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
  h2 { margin: 28px 0 12px; font-size: 16px; font-weight: 700; color: #1c1c1e; }
  .subtitle { margin: 6px 0 0; color: #6e6e73; font-size: 13px; }
  .versus { margin-top: 14px; font-size: 15px; font-weight: 600; }
  .versus .a { color: #6e6e73; }
  .versus .b { color: #c8102e; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .kpi { background: #f5f5f7; border-radius: 10px; padding: 12px; }
  .kpi .label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6e6e73; }
  .kpi .value { margin-top: 6px; font-size: 18px; font-weight: 700; }
  .chart { margin-top: 8px; page-break-inside: avoid; }
  .chart img { width: 100%; height: auto; border: 1px solid #ebebed; border-radius: 8px; }
  .chart .missing { padding: 40px; text-align: center; color: #6e6e73; border: 1px dashed #ebebed; border-radius: 8px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .scenario-title { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
  .scenario-title.b { color: #c8102e; }
  table.items { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.items th, table.items td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ebebed; vertical-align: top; }
  table.items th { background: #f5f5f7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #6e6e73; }
  table.items td.detail { color: #6e6e73; }
  .notes { white-space: pre-wrap; font-size: 12px; line-height: 1.5; }
  .muted { color: #6e6e73; font-size: 12px; }
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #ebebed; color: #6e6e73; font-size: 10px; }
  .print-bar { position: sticky; top: 0; background: #fff; padding: 8px 0 12px; margin: -8px 0 16px; border-bottom: 1px solid #ebebed; display: flex; gap: 8px; }
  .print-bar button { padding: 8px 14px; font-size: 13px; font-weight: 600; border-radius: 8px; border: 1px solid #ebebed; background: #fff; cursor: pointer; }
  .print-bar button.primary { background: #c8102e; color: #fff; border-color: #c8102e; }
  @media print { .print-bar { display: none; } body { padding: 0; } }
  .page-break { page-break-before: always; }
</style>
</head><body>
<div class="print-bar">
  <button class="primary" onclick="window.print()">Print / Save as PDF</button>
  <button onclick="window.close()">Close</button>
</div>

<p class="eyebrow">ROI Analysis</p>
<h1>${esc(meta.customerName || 'Customer')}</h1>
${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
<p class="versus"><span class="a">${esc(labels?.A || 'Current')}</span> &nbsp;vs.&nbsp; <span class="b">${esc(labels?.B || 'Chesterton')}</span></p>
${meta.application ? `<p class="subtitle">Application: ${esc(meta.application)}</p>` : ''}

<h2>Headline results</h2>
<div class="kpis">
  ${kpis.map(([l, v]) => `<div class="kpi"><div class="label">${esc(l)}</div><div class="value">${esc(v)}</div></div>`).join('')}
</div>

<h2>Cumulative cost comparison</h2>
<div class="chart">
  ${chartPng && chartPng.startsWith('data:image')
    ? `<img src="${chartPng}" alt="Cumulative cost chart" />`
    : '<div class="missing">Chart unavailable</div>'}
</div>

<div class="page-break"></div>
<h2>Cost item breakdown</h2>
<div class="grid-2">
  <div>
    <p class="scenario-title">${esc(labels?.A || 'Current')}</p>
    ${itemTable(scenarioA?.items || [])}
  </div>
  <div>
    <p class="scenario-title b">${esc(labels?.B || 'Chesterton')}</p>
    ${itemTable(scenarioB?.items || [])}
  </div>
</div>

${notes && notes.trim() ? `<h2>Notes &amp; assumptions</h2><div class="notes">${esc(notes)}</div>` : ''}

<div class="footer">${footer}</div>

<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 350);
  });
</script>
</body></html>`
}

export function openPrintReport(payload) {
  const html = buildReportHtml(payload)
  const w = window.open('', '_blank')
  if (!w) throw new Error('Popup blocked. Allow popups for this site and try again.')
  w.document.open()
  w.document.write(html)
  w.document.close()
}
