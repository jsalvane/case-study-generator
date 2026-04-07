export default function FormSection({ title, description, children, delay = 0 }) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 card-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-brand-black">{title}</h2>
          {description && (
            <p className="text-[13px] text-cool-gray mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
