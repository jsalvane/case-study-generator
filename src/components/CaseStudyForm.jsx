import { useState } from 'react'
import FormSection from './FormSection.jsx'
import ImageUpload from './ImageUpload.jsx'
import SuccessModal from './SuccessModal.jsx'

const PRODUCT_LINES = [
  'Mechanical Seals',
  'Mechanical Packing',
  'Polymer Seals',
  'Protective Coatings',
  'IL/MRO',
  'Service',
]

const INDUSTRIES = [
  'Pulp & Paper',
  'Mining & Minerals',
  'Chemical Processing',
  'Oil & Gas (Upstream)',
  'Oil & Gas (Downstream/Refining)',
  'Power Generation',
  'Water & Wastewater',
  'Food & Beverage',
  'Pharmaceutical & Biotech',
  'Steel & Primary Metals',
  'Marine & Shipbuilding',
  'General Manufacturing',
]

const EXAMPLES = {
  challenge: 'A large kraft paper mill in the southeastern US was experiencing repeated failures on their #3 stock pump, a Goulds 3196 handling black liquor at 180\u00B0F. The existing competitor seals were lasting only 3\u20134 months, causing unplanned downtime averaging 8 hours per failure. Maintenance costs were escalating and production losses exceeded $15,000 per incident.',
  solution: 'After a thorough application review, the Chesterton team recommended upgrading to a Chesterton 442 split seal with SiC/SiC faces and Kalrez O-rings. The split design eliminated the need for full pump disassembly, reducing installation time from 6 hours to 45 minutes. A Chesterton CFS barrier fluid system was also installed to provide optimal seal face lubrication.',
  result: 'The Chesterton 442 has been running continuously for over 18 months with zero failures. The customer has realized annual savings of approximately $85,000 in reduced maintenance labor, eliminated downtime, and lower spare parts inventory. The success on the #3 stock pump led to a plant-wide standardization program covering 12 additional pumps.',
}

export default function CaseStudyForm() {
  const [form, setForm] = useState({
    productLine: '',
    industry: '',
    product: '',
    contact: '',
    challenge: '',
    solution: '',
    result: '',
  })
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [expandedExample, setExpandedExample] = useState(null)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.productLine) e.productLine = 'Required'
    if (!form.industry) e.industry = 'Required'
    if (!form.product.trim()) e.product = 'Required'
    if (!form.contact.trim()) e.contact = 'Required'
    if (form.challenge.trim().length < 50) e.challenge = 'Please provide at least 50 characters'
    if (form.solution.trim().length < 50) e.solution = 'Please provide at least 50 characters'
    if (form.result.trim().length < 50) e.result = 'Please provide at least 50 characters'
    if (images.length === 0) e.images = 'Please upload at least one image'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    const totalImageSize = images.reduce((sum, img) => sum + img.compressed.size, 0)
    if (totalImageSize > 3.5 * 1024 * 1024) {
      setSubmitError('Total image size is too large. Please remove some images or use smaller files.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => formData.append(key, val))
      images.forEach(img => formData.append('images', img.compressed, img.name))

      const res = await fetch('/api/submit', { method: 'POST', body: formData })

      if (!res.ok) {
        let errMsg = 'Submission failed'
        try { const d = await res.json(); errMsg = d.error || errMsg } catch {}
        throw new Error(errMsg)
      }

      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('presentation') || contentType.includes('octet-stream')) {
        const blob = await res.blob()
        const disposition = res.headers.get('Content-Disposition') || ''
        const match = disposition.match(/filename="([^"]+)"/)
        const filename = match ? match[1] : 'Case_Study.pptx'
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename; a.click()
        URL.revokeObjectURL(url)
      }

      setShowSuccess(true)
      setForm({ productLine: '', industry: '', product: '', contact: '', challenge: '', solution: '', result: '' })
      setImages([])
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-[700px] mx-auto flex flex-col gap-4 pb-16">

        {/* Hero */}
        <div
          className="card-enter"
          style={{
            background: 'linear-gradient(140deg, #c8102e 0%, #a50e25 100%)',
            borderRadius: '20px',
            padding: '32px 36px 30px',
            animationDelay: '0ms',
          }}
        >
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '10px',
          }}>
            A.W. Chesterton
          </p>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            lineHeight: 1.15,
            marginBottom: '8px',
          }}>
            Case Study Generator
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.5,
          }}>
            Document your win. Let us tell your story.
          </p>
        </div>

        {/* Section 1: Details */}
        <FormSection
          title="Details"
          description="Basic information about this case study."
          step={1}
          delay={60}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Product Line"
              value={form.productLine}
              onChange={v => update('productLine', v)}
              options={PRODUCT_LINES}
              placeholder="Select product line"
              error={errors.productLine}
            />
            <SelectField
              label="Industry"
              value={form.industry}
              onChange={v => update('industry', v)}
              options={INDUSTRIES}
              placeholder="Select industry"
              error={errors.industry}
            />
            <TextField
              label="Product"
              value={form.product}
              onChange={v => update('product', v)}
              placeholder="e.g. Chesterton 442 Split Seal"
              error={errors.product}
            />
            <TextField
              label="Email"
              value={form.contact}
              onChange={v => update('contact', v)}
              placeholder="Your name or email"
              error={errors.contact}
            />
          </div>

        </FormSection>

        {/* Section 2: Content */}
        <FormSection
          title="Case Study Content"
          description="Describe the challenge, your solution, and the results. Numbers and specifics make stronger case studies."
          step={2}
          delay={120}
        >
          <div className="flex flex-col gap-5">
            <TextareaField
              label="Challenge"
              value={form.challenge}
              onChange={v => update('challenge', v)}
              placeholder="What problem was the customer facing?"
              example={EXAMPLES.challenge}
              expanded={expandedExample === 'challenge'}
              onToggleExample={() => setExpandedExample(expandedExample === 'challenge' ? null : 'challenge')}
              error={errors.challenge}
              rows={5}
            />
            <TextareaField
              label="Solution"
              value={form.solution}
              onChange={v => update('solution', v)}
              placeholder="What did Chesterton recommend and why?"
              example={EXAMPLES.solution}
              expanded={expandedExample === 'solution'}
              onToggleExample={() => setExpandedExample(expandedExample === 'solution' ? null : 'solution')}
              error={errors.solution}
              rows={5}
            />
            <TextareaField
              label="Result"
              value={form.result}
              onChange={v => update('result', v)}
              placeholder="What measurable outcomes did the customer see?"
              example={EXAMPLES.result}
              expanded={expandedExample === 'result'}
              onToggleExample={() => setExpandedExample(expandedExample === 'result' ? null : 'result')}
              error={errors.result}
              rows={5}
              isResult
            />
          </div>
        </FormSection>

        {/* Section 3: Photos */}
        <FormSection
          title="Photos"
          description="Upload images to accompany the case study. The first image will be considered for the hero spot."
          step={3}
          delay={180}
        >
          <ImageUpload
            images={images}
            onChange={setImages}
            error={errors.images}
          />
        </FormSection>

        {/* Submit error */}
        {submitError && (
          <div
            className="card-enter"
            style={{
              background: '#fdf0f2',
              border: '1px solid rgba(200,16,46,0.2)',
              borderRadius: '14px',
              padding: '14px 18px',
              fontSize: '13px',
              color: '#c8102e',
              fontWeight: 500,
            }}
          >
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            height: '56px',
            background: submitting ? '#e5c500' : '#fedb00',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#1c1c1e',
            letterSpacing: '-0.01em',
            border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            boxShadow: '0 2px 16px rgba(254,219,0,0.35)',
          }}
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Case Study'
          )}
        </button>

      </form>

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </>
  )
}


/* ─── Robustness scoring ─── */

function scoreContent(text, isResult = false) {
  const trimmed = text.trim()
  if (!trimmed) return null

  const sentences = trimmed
    .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
    .filter(s => s.trim().split(/\s+/).filter(w => w.length > 0).length >= 5)
  const sentenceCount = sentences.length
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length

  let points = 0
  const hints = []

  if (!isResult) {
    const sentPts =
      sentenceCount === 0 ? 0
      : sentenceCount === 1 ? 10
      : sentenceCount === 2 ? 28
      : sentenceCount <= 5 ? 50
      : 42
    const wordPts =
      wordCount < 15 ? 0
      : wordCount < 30 ? 15
      : wordCount < 60 ? 30
      : wordCount < 100 ? 45
      : 50
    points = sentPts + wordPts
  } else {
    const sentPts =
      sentenceCount === 0 ? 0
      : sentenceCount === 1 ? 7
      : sentenceCount === 2 ? 20
      : sentenceCount <= 5 ? 35
      : 29
    const wordPts =
      wordCount < 15 ? 0
      : wordCount < 30 ? 9
      : wordCount < 60 ? 18
      : wordCount < 100 ? 27
      : 30
    const hasDollar = /\$[\d,.]|\d+\s*%/i.test(trimmed)
    const hasROI = /\bsav(ed|ings?)\b|\bROI\b|\bpayback\b|\breduction\b|\belimin(at|ed)?\b|\bcost\b|\bdowntime\b|\bannual\b|\bmonthly\b/i.test(trimmed)

    points = sentPts + wordPts + (hasDollar ? 20 : 0) + (hasROI ? 15 : 0)
    if (!hasDollar) hints.push('Add a $ savings amount or % improvement')
    if (!hasROI) hints.push('Include an ROI metric (e.g. annual savings, downtime reduction)')
  }

  const score = Math.min(100, points)
  const status = score >= 70 ? 'green' : score >= 35 ? 'yellow' : 'red'
  const label = status === 'green' ? 'Strong' : status === 'yellow' ? 'Good' : 'Needs detail'
  return { score, status, label, hints }
}

function RobustnessIndicator({ text, isResult = false }) {
  const result = scoreContent(text, isResult)
  if (!result) return null

  const { status, label, hints } = result
  const barColor = status === 'green' ? '#22c55e' : status === 'yellow' ? '#f59e0b' : '#ef4444'
  const textColor = status === 'green' ? '#16a34a' : status === 'yellow' ? '#d97706' : '#dc2626'
  const segments = status === 'green' ? 3 : status === 'yellow' ? 2 : 1

  return (
    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                height: '4px',
                width: '28px',
                borderRadius: '999px',
                background: i <= segments ? barColor : '#e5e7eb',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: textColor }}>{label}</span>
      </div>
      {hints.length > 0 && (
        <p style={{ fontSize: '11px', color: '#6e6e73', lineHeight: 1.4 }}>{hints[0]}</p>
      )}
    </div>
  )
}


/* ─── Field components ─── */

const LABEL_STYLE = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#6e6e73',
  marginBottom: '7px',
  letterSpacing: '-0.005em',
}

const fieldBase = (error, hasValue) => ({
  width: '100%',
  fontSize: '15px',
  color: '#1c1c1e',
  background: error ? '#fdf0f2' : hasValue ? '#ffffff' : '#f5f5f7',
  border: error ? '1.5px solid #c8102e' : hasValue ? '1.5px solid #e5e5ea' : '1.5px solid transparent',
  borderRadius: '12px',
  outline: 'none',
  transition: 'all 0.15s ease',
  fontFamily: 'inherit',
})

function SelectField({ label, value, onChange, options, placeholder, error }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent focus:bg-white"
        style={{
          ...fieldBase(error, !!value),
          height: '48px',
          paddingLeft: '14px',
          paddingRight: '36px',
          appearance: 'none',
          cursor: 'pointer',
          color: value ? '#1c1c1e' : '#9a9a9f',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236e6e73' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          backgroundSize: '12px 12px',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p style={{ fontSize: '12px', color: '#c8102e', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, error }) {
  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent focus:bg-white placeholder:text-[#9a9a9f]"
        style={{
          ...fieldBase(error, !!value),
          height: '48px',
          padding: '0 14px',
        }}
      />
      {error && <p style={{ fontSize: '12px', color: '#c8102e', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, example, expanded, onToggleExample, error, rows, isResult }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
        <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>{label}</label>
        <button
          type="button"
          onClick={onToggleExample}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#c8102e',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {expanded ? 'Hide example' : 'See example'}
        </button>
      </div>
      {expanded && (
        <div style={{
          background: 'rgba(200,16,46,0.04)',
          border: '1px solid rgba(200,16,46,0.1)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '8px',
          fontSize: '13px',
          color: '#6e6e73',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          {example}
        </div>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent focus:bg-white placeholder:text-[#9a9a9f]"
        style={{
          ...fieldBase(error, !!value),
          padding: '13px 14px',
          resize: 'vertical',
          lineHeight: 1.6,
        }}
      />
      <RobustnessIndicator text={value} isResult={isResult} />
      {error && <p style={{ fontSize: '12px', color: '#c8102e', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}
