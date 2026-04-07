export default function SuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center card-enter"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-brand-black mb-1">Case Study Submitted</h3>
        <p className="text-[13px] text-cool-gray mb-5">
          Your case study has been sent to Creative Services. They'll follow up if they need anything else.
        </p>
        <button
          onClick={onClose}
          className="w-full h-10 rounded-lg font-semibold text-[13px] text-brand-black transition-all duration-200 active:scale-[0.99]"
          style={{ background: '#fedb00' }}
        >
          Submit Another
        </button>
      </div>
    </div>
  )
}
