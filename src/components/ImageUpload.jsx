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
        className="relative flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
        style={{
          padding: '36px 24px',
          borderRadius: '14px',
          border: dragging
            ? '2px dashed #c8102e'
            : error
              ? '2px dashed rgba(200,16,46,0.4)'
              : '2px dashed rgba(0,0,0,0.1)',
          background: dragging
            ? 'rgba(200,16,46,0.04)'
            : error
              ? 'rgba(200,16,46,0.03)'
              : '#f5f5f7',
        }}
      >
        {compressing ? (
          <>
            <svg className="w-6 h-6 animate-spin" style={{ color: '#6e6e73' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p style={{ fontSize: '14px', color: '#6e6e73' }}>Compressing images...</p>
          </>
        ) : (
          <>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
              }}
            >
              <svg style={{ width: '20px', height: '20px', color: '#6e6e73' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', color: '#1c1c1e', fontWeight: 500 }}>
              Click to upload or drag and drop
            </p>
            <p style={{ fontSize: '12px', color: '#9a9a9f' }}>
              JPG or PNG · Up to {MAX_IMAGES} images · Auto-compressed
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

      {error && <p style={{ fontSize: '12px', color: '#c8102e', marginTop: '-4px' }}>{error}</p>}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative group aspect-[4/3] overflow-hidden bg-fill"
              style={{ borderRadius: '12px' }}
            >
              <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
              {i === 0 && (
                <span
                  className="absolute top-1.5 left-1.5 text-white"
                  style={{
                    background: 'rgba(28,28,30,0.75)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '3px 7px',
                    borderRadius: '6px',
                  }}
                >
                  Hero
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 active:scale-90"
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(28,28,30,0.75)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg style={{ width: '10px', height: '10px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 inset-x-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', padding: '10px 8px 5px' }}>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(img.compressed.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guidelines */}
      <button
        type="button"
        onClick={() => setGuidelinesOpen(!guidelinesOpen)}
        className="flex items-center gap-1.5 transition-colors self-start"
        style={{ fontSize: '12px', fontWeight: 500, color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <svg
          style={{ width: '13px', height: '13px', transition: 'transform 0.2s', transform: guidelinesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        Photo guidelines
      </button>

      {guidelinesOpen && (
        <div style={{
          background: '#f5f5f7',
          borderRadius: '14px',
          padding: '16px 18px',
          fontSize: '12px',
          color: '#6e6e73',
          lineHeight: 1.6,
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1c1c1e', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Best Practices
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              ['Resolution', 'Minimum 1200 x 800 pixels. Photos from modern smartphones work well.'],
              ['Orientation', 'Landscape (horizontal) is strongly preferred for the template hero area.'],
              ['Lighting', 'Make sure the subject is well-lit. Avoid backlit shots where equipment appears as a dark silhouette.'],
              ['Composition', 'Get close enough that the product fills at least 50% of the frame. Include enough context to show the application.'],
              ['Great subjects', 'Installed product on equipment, before/after comparisons, the plant or facility, the team (with permission).'],
              ['Avoid', 'Blurry or dark images, screenshots of phone photos (send the original), photos with sensitive or proprietary info visible.'],
            ].map(([bold, rest]) => (
              <li key={bold} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#c8102e', flexShrink: 0 }}>&#x2022;</span>
                <span><strong style={{ color: '#1c1c1e', fontWeight: 600 }}>{bold}:</strong> {rest}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: '11px', color: '#9a9a9f', marginTop: '10px' }}>
            The first image uploaded will be considered for the template's main hero area. Creative Services will make the final selection.
          </p>
        </div>
      )}
    </div>
  )
}
