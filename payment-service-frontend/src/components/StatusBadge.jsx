const CONFIG = {
  succeeded: { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Succeeded' },
  processing: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Processing' },
  pending:    { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',  label: 'Pending' },
  failed:     { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Failed' },
  refunded:   { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Refunded' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const c = CONFIG[status] || CONFIG.pending
  const px = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px} ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}
