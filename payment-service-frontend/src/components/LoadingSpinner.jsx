export default function LoadingSpinner({ size = 'md', center = false }) {
  const sizes = { sm: 'w-4 h-4 border', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-[3px]' }
  const spinner = (
    <div
      className={`animate-spin rounded-full border-gray-200 border-t-emerald-600 ${sizes[size]}`}
      role="status"
      aria-label="Loading"
    />
  )

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        {spinner}
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  return spinner
}
