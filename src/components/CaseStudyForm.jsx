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
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Submission failed')

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
              label="Submitted By"
              value={form.contact}
              onChange={v => update('contact', v)}
              placeholder="Your name"
              error={errors.contact}
            />
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

function TextareaField({ label, value, onChange, placeholder, example, expanded, onToggleExample, error, rows }) {
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
      {error && <p className="text-[11px] text-brand-accent mt-1">{error}</p>}
    </div>
  )
}
