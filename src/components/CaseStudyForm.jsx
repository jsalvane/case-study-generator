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
    title: '',
  })
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [expandedExample, setExpandedExample] = useState(null)
  const [generatingTitle, setGeneratingTitle] = useState(false)
  const [titleError, setTitleError] = useState('')

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  async function generateTitle() {
    if (form.challenge.trim().length < 50 || form.solution.trim().length < 50 || form.result.trim().length < 50) {
      setTitleError('Fill in Challenge, Solution, and Result first (at least 50 characters each).')
      return
    }
    setTitleError('')
    setGeneratingTitle(true)
    try {
      const res = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productLine: form.productLine,
          industry: form.industry,
          product: form.product,
          challenge: form.challenge,
          solution: form.solution,
          result: form.result,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      update('title', data.title)
    } catch (err) {
      setTitleError(err.message || 'Could not generate title. Please try again.')
    } finally {
      setGeneratingTitle(false)
    }
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

    // Check total payload size
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
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }

      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('presentationml') || contentType.includes('octet-stream')) {
        const blob = await res.blob()
        const disposition = res.headers.get('Content-Disposition') || ''
        const match = disposition.match(/filename="([^"]+)"/)
        const filename = match ? match[1] : 'Case_Study.pptx'
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }

      setShowSuccess(true)
      setForm({ productLine: '', industry: '', product: '', contact: '', challenge: '', solution: '', result: '', title: '' })
      setImages([])
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-[720px] mx-auto flex flex-col gap-5 pb-12">

        {/* Section 1: Details */}
        <FormSection title="Details" description="Basic information about this case study." delay={0}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Product Line"
              value={form.productLine}
              onChange={v => update('productLine', v)}
              options={PRODUCT_LINES}
              placeholder="Select product line..."
              error={errors.productLine}
            />
            <SelectField
              label="Industry"
              value={form.industry}
              onChange={v => update('industry', v)}
              options={INDUSTRIES}
              placeholder="Select industry..."
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
              placeholder="Your name"
              error={errors.contact}
            />
          </div>

          {/* Title row — full width */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-cool-gray">
                Case Study Title
              </label>
              <button
                type="button"
                onClick={generateTitle}
                disabled={generatingTitle}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#fedb00', color: '#1c1c1e' }}
              >
                {generatingTitle ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Fill in the content fields above, then click Generate with AI"
              className="w-full h-10 px-3 text-[13px] rounded-lg border border-gray-200 bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent placeholder:text-cool-gray/40"
            />
            {titleError && <p className="text-[11px] text-brand-accent mt-1">{titleError}</p>}
            {form.title && !titleError && (
              <p className="text-[11px] text-cool-gray mt-1">You can edit the generated title directly.</p>
            )}
          </div>
        </FormSection>

        {/* Section 2: Content */}
        <FormSection title="Case Study Content" description="Describe the challenge, your solution, and the results. Be specific — numbers and details make stronger case studies." delay={80}>
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
        <FormSection title="Photos" description="Upload images to accompany the case study. The first image will be considered for the hero spot." delay={160}>
          <ImageUpload
            images={images}
            onChange={setImages}
            error={errors.images}
          />
        </FormSection>

        {/* Submit */}
        {submitError && (
          <div className="bg-brand-accent-light border border-brand-accent/20 rounded-lg px-4 py-3 text-[13px] text-brand-accent font-medium">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-lg font-semibold text-[15px] text-brand-black transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: submitting ? '#e5c500' : '#fedb00' }}
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

  // Count meaningful sentences (5+ words each)
  const sentences = trimmed
    .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
    .filter(s => s.trim().split(/\s+/).filter(w => w.length > 0).length >= 5)
  const sentenceCount = sentences.length
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length

  let points = 0
  const hints = []

  if (!isResult) {
    // Sentence score: 0–50
    const sentPts =
      sentenceCount === 0 ? 0
      : sentenceCount === 1 ? 10
      : sentenceCount === 2 ? 28
      : sentenceCount <= 5 ? 50
      : 42
    // Word score: 0–50
    const wordPts =
      wordCount < 15 ? 0
      : wordCount < 30 ? 15
      : wordCount < 60 ? 30
      : wordCount < 100 ? 45
      : 50
    points = sentPts + wordPts
  } else {
    // Sentence score: 0–35
    const sentPts =
      sentenceCount === 0 ? 0
      : sentenceCount === 1 ? 7
      : sentenceCount === 2 ? 20
      : sentenceCount <= 5 ? 35
      : 29
    // Word score: 0–30
    const wordPts =
      wordCount < 15 ? 0
      : wordCount < 30 ? 9
      : wordCount < 60 ? 18
      : wordCount < 100 ? 27
      : 30
    // Dollar value or % improvement: +20
    const hasDollar = /\$[\d,.]|\d+\s*%/i.test(trimmed)
    // ROI / savings keywords: +15
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
    <div className="mt-1.5 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-1.5 w-7 rounded-full transition-colors duration-300"
              style={{ background: i <= segments ? barColor : '#e5e7eb' }}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold" style={{ color: textColor }}>
          {label}
        </span>
      </div>
      {hints.length > 0 && (
        <p className="text-[11px] text-cool-gray leading-snug">{hints[0]}</p>
      )}
    </div>
  )
}


/* ─── Inline sub-components ─── */

function SelectField({ label, value, onChange, options, placeholder, error }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-cool-gray mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full h-10 px-3 text-[13px] rounded-lg border bg-white transition-all duration-150 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent ${
          error ? 'border-brand-accent' : value ? 'border-gray-200 text-brand-black' : 'border-gray-200 text-cool-gray'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236e6e73' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '32px',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-brand-accent mt-1">{error}</p>}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-cool-gray mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10 px-3 text-[13px] rounded-lg border bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent placeholder:text-cool-gray/50 ${
          error ? 'border-brand-accent' : 'border-gray-200'
        }`}
      />
      {error && <p className="text-[11px] text-brand-accent mt-1">{error}</p>}
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, example, expanded, onToggleExample, error, rows, isResult }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-cool-gray">
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleExample}
          className="text-[11px] font-medium text-brand-accent hover:text-brand-accent-dark transition-colors"
        >
          {expanded ? 'Hide example' : 'See example'}
        </button>
      </div>
      {expanded && (
        <div className="bg-brand-accent-light/50 border border-brand-accent/10 rounded-lg px-3.5 py-3 mb-2 text-[12px] text-cool-gray leading-relaxed italic">
          {example}
        </div>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2.5 text-[13px] rounded-lg border bg-white transition-all duration-150 resize-y focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent placeholder:text-cool-gray/50 leading-relaxed ${
          error ? 'border-brand-accent' : 'border-gray-200'
        }`}
      />
      <RobustnessIndicator text={value} isResult={isResult} />
      {error && <p className="text-[11px] text-brand-accent mt-1">{error}</p>}
    </div>
  )
}
