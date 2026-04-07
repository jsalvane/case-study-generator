import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'

const MAX_IMAGES = 6

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/jpeg',
}

export default function ImageUpload({ images, onChange, error }) {
  const [dragging, setDragging] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const inputRef = useRef(null)

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return

    const remaining = MAX_IMAGES - images.length
    const toProcess = files.slice(0, remaining)
    if (toProcess.length === 0) return

    setCompressing(true)
    try {
      const newImages = await Promise.all(
        toProcess.map(async (file) => {
          const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
          const preview = URL.createObjectURL(compressed)
          return { name: file.name, original: file, compressed, preview }
        })
      )
      onChange([...images, ...newImages])
    } catch (err) {
      console.error('Image compression failed:', err)
    } finally {
      setCompressing(false)
    }
  }

  function removeImage(index) {
    const updated = [...images]
    URL.revokeObjectURL(updated[index].preview)
    updated.splice(index, 1)
    onChange(updated)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-brand-accent bg-brand-accent-light/50'
            : error
              ? 'border-brand-accent/40 bg-brand-accent-light/20'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
        }`}
      >
        {compressing ? (
          <>
            <svg className="w-6 h-6 text-cool-gray animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[13px] text-cool-gray">Compressing images...</p>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-cool-gray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-[13px] text-cool-gray">
              <span className="font-medium text-brand-black">Click to upload</span> or drag and drop
            </p>
            <p className="text-[11px] text-cool-gray/60">
              JPG or PNG · Up to {MAX_IMAGES} images · Auto-compressed for delivery
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
          className="hidden"
        />
      </div>

      {error && <p className="text-[11px] text-brand-accent -mt-1">{error}</p>}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-brand-black/70 text-white text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded">
                  Hero
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-brand-black/70 hover:bg-brand-accent rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent px-1.5 py-1">
                <p className="text-[9px] text-white/80 truncate">{(img.compressed.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guidelines */}
      <button
        type="button"
        onClick={() => setGuidelinesOpen(!guidelinesOpen)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-cool-gray hover:text-brand-black transition-colors self-start"
      >
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${guidelinesOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        Photo guidelines
      </button>

      {guidelinesOpen && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-[12px] text-cool-gray leading-relaxed space-y-2">
          <p className="font-semibold text-brand-black text-[11px] uppercase tracking-wider mb-1">Best Practices</p>
          <ul className="space-y-1.5 list-none">
            <li className="flex gap-2">
              <span className="text-brand-accent shrink-0">&#x2022;</span>
              <span><strong>Resolution:</strong> Minimum 1200 x 800 pixels. Photos from modern smartphones work well.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent shrink-0">&#x2022;</span>
              <span><strong>Orientation:</strong> Landscape (horizontal) is strongly preferred for the template hero area.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent shrink-0">&#x2022;</span>
              <span><strong>Lighting:</strong> Make sure the subject is well-lit. Avoid backlit shots where equipment appears as a dark silhouette.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent shrink-0">&#x2022;</span>
              <span><strong>Composition:</strong> Get close enough that the product fills at least 50% of the frame. Include enough context to show the application.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent shrink-0">&#x2022;</span>
              <span><strong>Great subjects:</strong> Installed product on equipment, before/after comparisons, the plant or facility, the team (with permission).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-brand-accent shrink-0">&#x2022;</span>
              <span><strong>Avoid:</strong> Blurry or dark images, screenshots of phone photos (send the original), photos with sensitive or proprietary info visible.</span>
            </li>
          </ul>
          <p className="text-[11px] text-cool-gray/70 pt-1">The first image uploaded will be considered for the template's main hero area. Creative Services will make the final selection.</p>
        </div>
      )}
    </div>
  )
}
