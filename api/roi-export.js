import pptxgen from 'pptxgenjs'

const BRAND = {
  red: 'C8102E',
  darkRed: 'A50E25',
  black: '1C1C1E',
  gray: '6E6E73',
  fill: 'F5F5F7',
  white: 'FFFFFF',
}

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } }

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

function costItemRows(items) {
  return items.map(i => {
    let detail = ''
    switch (i.typeId) {
      case 'oneTime': detail = `${fmtCurrency(Number(i.amount) || 0)} at month ${i.occursAt || 0}`; break
      case 'recurring': detail = `${fmtCurrency(Number(i.amount) || 0)} × ${i.timesPerPeriod}/${i.frequency}`; break
      case 'consumption': detail = `${i.rate} ${i.rateUnit} × ${i.hoursPerYear} hr/yr × ${fmtCurrency(Number(i.unitPrice) || 0)}/unit`; break
      case 'downtime': detail = `${i.eventsPerYear}/yr × ${i.hoursPerEvent} hr × ${fmtCurrency(Number(i.hourlyRate) || 0)}/hr`; break
    }
    return [i.label || '—', detail]
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { meta, notes, horizonYears, mode, labels, results, scenarioA, scenarioB, chartPng, anonymized } = req.body || {}
    if (!meta) return res.status(400).json({ error: 'Missing payload' })

    const pres = new pptxgen()
    pres.layout = 'LAYOUT_WIDE' // 13.33 × 7.5
    pres.title = `ROI — ${meta.customerName || 'Customer'}`

    // ── Cover
    const cover = pres.addSlide()
    cover.background = { color: BRAND.white }
    cover.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.1, fill: { color: BRAND.red } })
    cover.addText('ROI Analysis', { x: 0.5, y: 0.22, w: 12, h: 0.7, fontFace: 'Inter', fontSize: 28, color: BRAND.white, bold: true })
    cover.addText(meta.customerName || 'Customer', { x: 0.5, y: 1.6, w: 12, h: 0.7, fontFace: 'Inter', fontSize: 32, color: BRAND.black, bold: true })
    cover.addText(
      [meta.industry, meta.productLine, meta.location].filter(Boolean).join(' • '),
      { x: 0.5, y: 2.35, w: 12, h: 0.4, fontFace: 'Inter', fontSize: 14, color: BRAND.gray },
    )
    cover.addText(`${labels?.A || 'Current'}  vs.  ${labels?.B || 'Chesterton'}`, {
      x: 0.5, y: 3.2, w: 12, h: 0.6, fontFace: 'Inter', fontSize: 20, color: BRAND.black, bold: true,
    })
    if (meta.application) {
      cover.addText(`Application: ${meta.application}`, { x: 0.5, y: 3.9, w: 12, h: 0.4, fontFace: 'Inter', fontSize: 13, color: BRAND.gray })
    }
    cover.addText(
      `Prepared by ${meta.preparedBy || '—'}  •  ${meta.date || ''}  •  Horizon: ${horizonYears} yr  •  ${mode === 'tracked' ? 'Tracked' : 'Projected'}${anonymized ? '  •  Anonymized' : ''}`,
      { x: 0.5, y: 6.9, w: 12, h: 0.4, fontFace: 'Inter', fontSize: 10, color: BRAND.gray },
    )

    // ── KPIs
    const kpi = pres.addSlide()
    kpi.background = { color: BRAND.white }
    kpi.addText('Headline results', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontFace: 'Inter', fontSize: 22, color: BRAND.black, bold: true })
    const cards = [
      { label: 'Payback period', value: fmtMonths(results?.paybackMonths) },
      { label: 'Total savings', value: fmtCurrency(results?.savings) },
      { label: 'ROI', value: results?.roiPct == null ? '—' : `${Math.round(results.roiPct)}%` },
      { label: 'Annualized savings', value: fmtCurrency(results?.annualizedSavings) },
      { label: `${labels?.A || 'Current'} TCO`, value: fmtCurrency(results?.tcoA) },
      { label: `${labels?.B || 'Chesterton'} TCO`, value: fmtCurrency(results?.tcoB) },
      { label: 'Downtime hours avoided', value: `${Math.round(results?.downtimeHoursAvoided || 0).toLocaleString()} hr` },
    ]
    const cols = 4
    const cardW = 2.9, cardH = 1.4, gap = 0.25
    cards.forEach((c, i) => {
      const r = Math.floor(i / cols), col = i % cols
      const x = 0.5 + col * (cardW + gap)
      const y = 1.4 + r * (cardH + gap)
      kpi.addShape(pres.ShapeType.roundRect, { x, y, w: cardW, h: cardH, fill: { color: BRAND.fill }, line: { color: BRAND.fill }, rectRadius: 0.15 })
      kpi.addText(c.label.toUpperCase(), { x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.3, fontFace: 'Inter', fontSize: 9, color: BRAND.gray, bold: true, charSpacing: 2 })
      kpi.addText(c.value, { x: x + 0.2, y: y + 0.5, w: cardW - 0.4, h: 0.7, fontFace: 'Inter', fontSize: 20, color: BRAND.black, bold: true })
    })

    // ── Chart
    const chartSlide = pres.addSlide()
    chartSlide.background = { color: BRAND.white }
    chartSlide.addText('Cumulative cost comparison', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontFace: 'Inter', fontSize: 22, color: BRAND.black, bold: true })
    if (chartPng && chartPng.startsWith('data:image')) {
      chartSlide.addImage({ data: chartPng, x: 0.5, y: 1.2, w: 12.3, h: 5.6 })
    } else {
      chartSlide.addText('(chart unavailable)', { x: 0.5, y: 3.5, w: 12, h: 0.5, fontFace: 'Inter', fontSize: 14, color: BRAND.gray, align: 'center' })
    }

    // ── Breakdown
    const bd = pres.addSlide()
    bd.background = { color: BRAND.white }
    bd.addText('Cost item breakdown', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontFace: 'Inter', fontSize: 22, color: BRAND.black, bold: true })
    bd.addText(labels?.A || 'Current', { x: 0.5, y: 1.1, w: 6, h: 0.4, fontFace: 'Inter', fontSize: 14, color: BRAND.gray, bold: true })
    bd.addText(labels?.B || 'Chesterton', { x: 6.85, y: 1.1, w: 6, h: 0.4, fontFace: 'Inter', fontSize: 14, color: BRAND.red, bold: true })
    const tblOpts = { x: 0.5, y: 1.5, w: 6, fontFace: 'Inter', fontSize: 10, color: BRAND.black, border: { type: 'solid', pt: 0.5, color: 'EBEBED' } }
    const rowsA = [['Item', 'Detail'], ...costItemRows(scenarioA?.items || [])]
    const rowsB = [['Item', 'Detail'], ...costItemRows(scenarioB?.items || [])]
    bd.addTable(rowsA, tblOpts)
    bd.addTable(rowsB, { ...tblOpts, x: 6.85 })

    // ── Notes
    if (notes && notes.trim()) {
      const nt = pres.addSlide()
      nt.background = { color: BRAND.white }
      nt.addText('Notes & assumptions', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontFace: 'Inter', fontSize: 22, color: BRAND.black, bold: true })
      nt.addText(notes, { x: 0.5, y: 1.2, w: 12.3, h: 5.8, fontFace: 'Inter', fontSize: 13, color: BRAND.black, valign: 'top' })
    }

    const buf = await pres.write({ outputType: 'nodebuffer' })
    const data = Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64')
    const safe = (meta.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')
    return res.status(200).json({ success: true, filename: `ROI_${safe}.pptx`, data })
  } catch (err) {
    console.error('ROI export error:', err)
    return res.status(500).json({ error: err.message || 'Failed to generate PPTX' })
  }
}
