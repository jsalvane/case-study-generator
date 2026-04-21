import { CURRENCIES } from './theme.js'
import { annualCost, downtimeHoursPerYear } from './costItems.js'

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function fmtCurrency(n, currency = 'USD') {
  if (n == null || Number.isNaN(n)) return '—'
  const cfg = CURRENCIES[currency] || CURRENCIES.USD
  try {
    return n.toLocaleString(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: 0 })
  } catch {
    return `${cfg.symbol}${Math.round(n).toLocaleString('en-US')}`
  }
}

function fmtShortMoney(v, currency = 'USD') {
  const cfg = CURRENCIES[currency] || CURRENCIES.USD
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${cfg.symbol}${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000)     return `${cfg.symbol}${(v / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return `${cfg.symbol}${Math.round(v)}`
}

function fmtMonths(m) {
  if (m == null) return 'No payback in horizon'
  if (m < 0.5) return 'Immediate'
  const round = Math.round(m)
  const y = Math.floor(round / 12), r = round % 12
  if (y === 0) return `${round} mo`
  if (r === 0) return `${y} yr`
  return `${y} yr ${r} mo`
}

function itemDetail(i, currency) {
  switch (i.typeId) {
    case 'oneTime':    return `${fmtCurrency(Number(i.amount) || 0, currency)} at month ${i.occursAt || 0}`
    case 'recurring':  return `${fmtCurrency(Number(i.amount) || 0, currency)} × ${i.timesPerPeriod}/${i.frequency}`
    case 'consumption':return `${i.rate} ${i.rateUnit} × ${i.hoursPerYear} hr/yr × ${fmtCurrency(Number(i.unitPrice) || 0, currency)}/unit`
    case 'downtime':   return `${i.eventsPerYear}/yr × ${i.hoursPerEvent} hr × ${fmtCurrency(Number(i.hourlyRate) || 0, currency)}/hr`
    case 'energy':     return `${i.kW} kW × ${i.hoursPerYear} hr/yr × ${fmtCurrency(Number(i.pricePerKwh) || 0, currency)}/kWh${i.loadFactor != null ? ` × ${i.loadFactor} LF` : ''}`
    default: return ''
  }
}

function niceCeil(v) {
  if (v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}

// -----------------------------------------------------------------------------
// Chart SVG — savings shade, payback marker, confidence band baked in
// -----------------------------------------------------------------------------

function buildChartSvg({ chartData, labels, mode, horizonYears, paybackMonths, currency }) {
  if (!chartData || chartData.length === 0) return '<div class="missing">Chart unavailable</div>'
  const W = 900, H = 380
  const P = { top: 24, right: 20, bottom: 48, left: 72 }
  const innerW = W - P.left - P.right
  const innerH = H - P.top - P.bottom

  const hasTracked = mode === 'tracked'
  const maxY = Math.max(
    ...chartData.map(d => Math.max(
      d.current || 0,
      d.chesterton || 0,
      d.chestertonBandHigh || 0,
      d.currentActual || 0,
      d.chestertonActual || 0,
    )),
    1,
  )
  const niceMax = niceCeil(maxY)
  const maxX = chartData[chartData.length - 1].year || horizonYears || 5

  const x = v => P.left + (v / maxX) * innerW
  const y = v => P.top + innerH - (v / niceMax) * innerH

  const pathFor = (key) => {
    let out = '', started = false
    for (let i = 0; i < chartData.length; i++) {
      const v = chartData[i][key]
      if (v == null) { started = false; continue }
      out += `${started ? 'L' : 'M'} ${x(chartData[i].year).toFixed(1)} ${y(v).toFixed(1)} `
      started = true
    }
    return out.trim()
  }

  // Band polygon: top line forward, bottom line reversed.
  const bandPolygon = (lowKey, highKey) => {
    const top = [], bottom = []
    for (let i = 0; i < chartData.length; i++) {
      const lo = chartData[i][lowKey]
      const hi = chartData[i][highKey]
      if (lo == null || hi == null) continue
      top.push(`${x(chartData[i].year).toFixed(1)},${y(hi).toFixed(1)}`)
      bottom.push(`${x(chartData[i].year).toFixed(1)},${y(lo).toFixed(1)}`)
    }
    if (top.length === 0) return ''
    return `${top.join(' ')} ${bottom.reverse().join(' ')}`
  }

  // Savings zone polygon: current (upper) minus chesterton (lower), only where current > chesterton.
  const savingsPolygon = (() => {
    const top = [], bottom = []
    for (let i = 0; i < chartData.length; i++) {
      const a = chartData[i].current
      const b = chartData[i].chesterton
      if (a == null || b == null) continue
      const upper = Math.max(a, b)
      const lower = Math.min(a, b)
      top.push(`${x(chartData[i].year).toFixed(1)},${y(upper).toFixed(1)}`)
      bottom.push(`${x(chartData[i].year).toFixed(1)},${y(lower).toFixed(1)}`)
    }
    if (top.length === 0) return ''
    return `${top.join(' ')} ${bottom.reverse().join(' ')}`
  })()

  const confidenceBand = bandPolygon('chestertonBandLow', 'chestertonBandHigh')

  // Axes
  const yTicks = 5
  const gridLines = []
  const yLabels = []
  for (let i = 0; i <= yTicks; i++) {
    const v = (niceMax / yTicks) * i
    const yy = y(v).toFixed(1)
    gridLines.push(`<line x1="${P.left}" x2="${P.left + innerW}" y1="${yy}" y2="${yy}" stroke="#ebebed" stroke-width="1" />`)
    yLabels.push(`<text x="${P.left - 8}" y="${yy}" text-anchor="end" dominant-baseline="middle" font-size="11" fill="#6e6e73">${esc(fmtShortMoney(v, currency))}</text>`)
  }
  const xTickCount = Math.min(Math.ceil(maxX), 10)
  const xLabels = []
  for (let i = 0; i <= xTickCount; i++) {
    const v = (maxX / xTickCount) * i
    const xx = x(v).toFixed(1)
    xLabels.push(`<text x="${xx}" y="${P.top + innerH + 18}" text-anchor="middle" font-size="11" fill="#6e6e73">${v.toFixed(v === Math.round(v) ? 0 : 1)}</text>`)
  }

  const dashAttr = hasTracked ? ' stroke-dasharray="5 4"' : ''

  const lines = []
  lines.push(`<path d="${pathFor('current')}" fill="none" stroke="#6e6e73" stroke-width="2"${dashAttr} />`)
  lines.push(`<path d="${pathFor('chesterton')}" fill="none" stroke="#c8102e" stroke-width="2.5"${dashAttr} />`)
  if (hasTracked) {
    lines.push(`<path d="${pathFor('currentActual')}" fill="none" stroke="#6e6e73" stroke-width="2.5" />`)
    lines.push(`<path d="${pathFor('chestertonActual')}" fill="none" stroke="#c8102e" stroke-width="3" />`)
  }

  // Payback marker
  let paybackLayer = ''
  if (paybackMonths != null && paybackMonths > 0 && paybackMonths / 12 <= maxX) {
    const px = x(paybackMonths / 12).toFixed(1)
    paybackLayer = `
      <line x1="${px}" x2="${px}" y1="${P.top}" y2="${P.top + innerH}" stroke="#15803d" stroke-width="1.5" stroke-dasharray="4 4" />
      <text x="${px}" y="${P.top - 6}" text-anchor="middle" font-size="11" font-weight="600" fill="#15803d">Pays for itself · ${esc(fmtMonths(paybackMonths))}</text>
    `
  }

  // Legend
  const legendItems = [
    { color: '#15803d', label: 'Savings', box: true, opacity: 0.18 },
    { color: '#c8102e', label: 'Best / worst case', box: true, opacity: 0.14 },
    { color: '#6e6e73', label: labels?.A || 'Current', dashed: hasTracked },
    { color: '#c8102e', label: labels?.B || 'Chesterton', dashed: hasTracked },
  ]
  if (hasTracked) {
    legendItems.push({ color: '#6e6e73', label: `${labels?.A || 'Current'} (actual)` })
    legendItems.push({ color: '#c8102e', label: `${labels?.B || 'Chesterton'} (actual)` })
  }
  let legendX = P.left
  const legend = legendItems.map(item => {
    const swatch = item.box
      ? `<rect x="0" y="0" width="22" height="12" fill="${item.color}" fill-opacity="${item.opacity}" />`
      : `<line x1="0" x2="22" y1="6" y2="6" stroke="${item.color}" stroke-width="2.5"${item.dashed ? ' stroke-dasharray="5 4"' : ''} />`
    const g = `<g transform="translate(${legendX}, 4)">
      ${swatch}
      <text x="28" y="6" dominant-baseline="middle" font-size="11" fill="#1c1c1e">${esc(item.label)}</text>
    </g>`
    legendX += 40 + item.label.length * 6.2
    return g
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cumulative cost comparison">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff" />
    ${legend}
    ${gridLines.join('')}
    ${savingsPolygon ? `<polygon points="${savingsPolygon}" fill="#15803d" fill-opacity="0.14" stroke="none" />` : ''}
    ${confidenceBand ? `<polygon points="${confidenceBand}" fill="#c8102e" fill-opacity="0.10" stroke="none" />` : ''}
    ${yLabels.join('')}
    ${xLabels.join('')}
    <line x1="${P.left}" x2="${P.left + innerW}" y1="${P.top + innerH}" y2="${P.top + innerH}" stroke="#d1d1d6" stroke-width="1" />
    <text x="${P.left + innerW / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#6e6e73">Years</text>
    ${lines.join('')}
    ${paybackLayer}
  </svg>`
}

// -----------------------------------------------------------------------------
// Item tables + paired-category table (2.4)
// -----------------------------------------------------------------------------

function itemTable(items, currency) {
  if (!items?.length) return '<p class="muted">No items.</p>'
  const hasSource = items.some(i => i.sourceNote)
  const rows = items.map(i => `
    <tr>
      <td>${esc(i.label || '—')}${i.categoryId ? `<div class="chip">${esc(i.categoryId)}</div>` : ''}</td>
      <td class="detail">${esc(itemDetail(i, currency))}${Number(i.escalationPct) ? ` · esc ${Number(i.escalationPct) > 0 ? '+' : ''}${Number(i.escalationPct)}%/yr` : ''}</td>
      ${hasSource ? `<td class="source">${esc(i.sourceNote || '')}</td>` : ''}
    </tr>`).join('')
  return `<table class="items">
    <thead><tr>
      <th>Item</th><th>Detail</th>${hasSource ? '<th>Source</th>' : ''}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function pairedCategories(scenarioA, scenarioB, currency) {
  const byCat = new Map()
  const push = (item, side) => {
    if (!item.categoryId) return
    const key = item.categoryId
    if (!byCat.has(key)) byCat.set(key, { category: key, a: null, b: null })
    byCat.get(key)[side] = item
  }
  ;(scenarioA?.items || []).forEach(i => push(i, 'a'))
  ;(scenarioB?.items || []).forEach(i => push(i, 'b'))

  const pairs = [...byCat.values()]
  if (pairs.length === 0) return ''

  const annualizedOrOneTime = i => {
    if (!i) return 0
    return i.typeId === 'oneTime' ? (Number(i.amount) || 0) : annualCost(i)
  }

  const rows = pairs.map(p => {
    const a = annualizedOrOneTime(p.a)
    const b = annualizedOrOneTime(p.b)
    const delta = a - b
    const isOneTime = (p.a?.typeId === 'oneTime' || p.b?.typeId === 'oneTime')
    const unit = isOneTime ? 'once' : '/yr'
    return `<tr>
      <td class="cat">${esc(p.category)}</td>
      <td class="muted">${p.a ? esc(p.a.label) : '—'}</td>
      <td class="num">${p.a ? `${fmtCurrency(a, currency)} <span class="unit">${unit}</span>` : '—'}</td>
      <td class="muted">${p.b ? esc(p.b.label) : '—'}</td>
      <td class="num">${p.b ? `${fmtCurrency(b, currency)} <span class="unit">${unit}</span>` : '—'}</td>
      <td class="num ${delta > 0 ? 'savings' : delta < 0 ? 'loss' : ''}">${fmtCurrency(delta, currency)}</td>
    </tr>`
  }).join('')

  return `<table class="pairs">
    <thead><tr>
      <th>Category</th>
      <th>Current item</th><th>Current cost</th>
      <th>Chesterton item</th><th>Chesterton cost</th>
      <th>Savings</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

// -----------------------------------------------------------------------------
// Executive summary (3.3)
// -----------------------------------------------------------------------------

function buildExecutiveSummary({ meta, labels, horizonYears, results, currency }) {
  const customer = meta.customerName || 'the customer'
  const app = meta.application ? ` on ${meta.application}` : ''
  const savings = fmtCurrency(results?.savings, currency)
  const payback = fmtMonths(results?.paybackMonths)
  const roi = results?.roiPct == null ? null : `${Math.round(results.roiPct)}% ROI`
  const downtime = results?.downtimeHoursAvoided > 0 ? `${Math.round(results.downtimeHoursAvoided).toLocaleString()} downtime hours avoided` : null
  const energy = results?.energyKwhAvoided > 0 ? `${Math.round(results.energyKwhAvoided).toLocaleString()} kWh avoided` : null
  const co2e = results?.co2eKgAvoided > 0 ? `${Math.round(results.co2eKgAvoided).toLocaleString()} kg CO₂e avoided` : null

  const drivers = [downtime, energy, co2e].filter(Boolean)

  const s1 = `Over a ${horizonYears}-year horizon, switching ${customer}${app} from <em>${esc(labels.A || 'the current solution')}</em> to <em>${esc(labels.B || 'Chesterton')}</em> projects <strong>${esc(savings)}</strong> in total savings with payback in <strong>${esc(payback)}</strong>${roi ? ` (<strong>${esc(roi)}</strong>)` : ''}.`
  const s2 = drivers.length
    ? `Key operational benefits: ${drivers.map(d => `<strong>${esc(d)}</strong>`).join(', ')}.`
    : ''
  const sensitivityNote = results.sensitivity === 'conservative'
    ? `This estimate uses a <strong>Worst case</strong> sensitivity — the benefit from Chesterton may be lower than projected.`
    : results.sensitivity === 'aggressive'
    ? `This estimate uses a <strong>Best case</strong> sensitivity — the benefit from Chesterton may be higher than projected.`
    : null

  return `<p>${s1}</p>${s2 ? `<p>${s2}</p>` : ''}${sensitivityNote ? `<p>${sensitivityNote}</p>` : ''}`
}

// -----------------------------------------------------------------------------
// Full report
// -----------------------------------------------------------------------------

export function buildReportHtml({ meta, notes, horizonYears, mode, labels, results, scenarioA, scenarioB, anonymized }) {
  const currency = meta.currency || 'USD'

  const kpis = [
    ['Pays for itself',      fmtMonths(results?.paybackMonths)],
    ['Total savings',        fmtCurrency(results?.savings, currency)],
    ['ROI',                  results?.roiPct == null ? '—' : `${Math.round(results.roiPct)}%`],
    ['Savings per year',     fmtCurrency(results?.annualizedSavings, currency)],
    [`${labels?.A || 'Current'} total cost`,    fmtCurrency(results?.tcoA, currency)],
    [`${labels?.B || 'Chesterton'} total cost`, fmtCurrency(results?.tcoB, currency)],
    ['Downtime hours avoided', `${Math.round(results?.downtimeHoursAvoided || 0).toLocaleString()} hr`],
  ]
  if (results?.energyKwhAvoided > 0) kpis.push(['Energy kWh avoided', `${Math.round(results.energyKwhAvoided).toLocaleString()} kWh`])
  if (results?.co2eKgAvoided > 0)    kpis.push(['CO₂e avoided',       `${Math.round(results.co2eKgAvoided).toLocaleString()} kg`])

  const subtitle = [meta.industry, meta.productLine, meta.location].filter(Boolean).map(esc).join(' • ')
  const sensitivityLabelMap = { conservative: 'Worst case', expected: 'Most likely', aggressive: 'Best case' }
  const sensitivityForFooter = results?.sensitivity && results.sensitivity !== 'expected'
    ? ` • Sensitivity: ${esc(sensitivityLabelMap[results.sensitivity] || results.sensitivity)}`
    : ''
  const footerLine = `Prepared by ${esc(meta.preparedBy || '—')} • ${esc(meta.date || '')} • Horizon: ${esc(horizonYears)} yr • ${mode === 'tracked' ? 'Tracked' : 'Projected'}${sensitivityForFooter}${anonymized ? ' • Anonymized' : ''}`

  const execSummary = buildExecutiveSummary({ meta, labels, horizonYears, results, currency })
  const pairedTable = pairedCategories(scenarioA, scenarioB, currency)

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
  .exec-summary { background: #f5f5f7; border-radius: 12px; padding: 14px 18px; margin-top: 16px; font-size: 13px; line-height: 1.55; }
  .exec-summary p { margin: 0 0 8px; }
  .exec-summary p:last-child { margin-bottom: 0; }
  .exec-summary em { font-style: normal; font-weight: 600; color: #1c1c1e; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
  .kpi { background: #f5f5f7; border-radius: 10px; padding: 12px; }
  .kpi .label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6e6e73; }
  .kpi .value { margin-top: 6px; font-size: 18px; font-weight: 700; }
  .chart { margin-top: 8px; page-break-inside: avoid; }
  .chart svg { width: 100%; height: auto; border: 1px solid #ebebed; border-radius: 8px; display: block; }
  .chart .missing { padding: 40px; text-align: center; color: #6e6e73; border: 1px dashed #ebebed; border-radius: 8px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .scenario-title { font-size: 13px; font-weight: 700; margin: 0 0 6px; }
  .scenario-title.b { color: #c8102e; }
  table.items, table.pairs { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.items th, table.items td, table.pairs th, table.pairs td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ebebed; vertical-align: top; }
  table.items th, table.pairs th { background: #f5f5f7; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #6e6e73; }
  table.items td.detail, table.items td.source { color: #6e6e73; }
  table.items td.source { font-style: italic; max-width: 180px; }
  table.pairs td.cat { font-weight: 700; color: #1c1c1e; }
  table.pairs td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  table.pairs td.num.savings { color: #15803d; font-weight: 700; }
  table.pairs td.num.loss { color: #c8102e; font-weight: 700; }
  table.pairs .unit { color: #9a9a9f; font-size: 10px; font-weight: 500; }
  .chip { display: inline-block; margin-top: 3px; font-size: 9px; font-weight: 600; color: #6e6e73; background: #f5f5f7; padding: 1px 6px; border-radius: 4px; letter-spacing: 0.04em; }
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

<div class="exec-summary">${execSummary}</div>

<h2>Headline results</h2>
<div class="kpis">
  ${kpis.map(([l, v]) => `<div class="kpi"><div class="label">${esc(l)}</div><div class="value">${esc(v)}</div></div>`).join('')}
</div>

<h2>Cumulative cost comparison</h2>
<div class="chart">
  ${buildChartSvg({ chartData: results?.chartData, labels, mode, horizonYears, paybackMonths: results?.paybackMonths, currency })}
</div>

${pairedTable ? `<h2>Where the savings come from</h2>${pairedTable}` : ''}

<div class="page-break"></div>
<h2>Cost item breakdown</h2>
<div class="grid-2">
  <div>
    <p class="scenario-title">${esc(labels?.A || 'Current')}</p>
    ${itemTable(scenarioA?.items || [], currency)}
  </div>
  <div>
    <p class="scenario-title b">${esc(labels?.B || 'Chesterton')}</p>
    ${itemTable(scenarioB?.items || [], currency)}
  </div>
</div>

${notes && notes.trim() ? `<h2>Notes &amp; assumptions</h2><div class="notes">${esc(notes)}</div>` : ''}

<div class="footer">${footerLine}</div>

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
