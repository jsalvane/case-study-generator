export async function chartNodeToPng(chartContainer) {
  if (!chartContainer) return null
  const svg = chartContainer.querySelector('svg')
  if (!svg) return null
  const clone = svg.cloneNode(true)
  const width = svg.clientWidth || 900
  const height = svg.clientHeight || 400
  clone.setAttribute('width', width)
  clone.setAttribute('height', height)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const xml = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = 1.5
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function exportPptx(payload) {
  const res = await fetch('/api/roi-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    let detail = ''
    try { const body = await res.json(); detail = body.error || JSON.stringify(body) } catch {}
    throw new Error(`Export failed: ${res.status}${detail ? ' — ' + detail : ''}`)
  }
  const json = await res.json()
  if (!json.success || !json.data) throw new Error('Export response missing data')
  const bin = atob(json.data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = json.filename || 'ROI_Analysis.pptx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
