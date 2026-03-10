import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { ArrowUpRight } from 'lucide-react'

const SYMBOLS = { usd: '$', eur: '€', gbp: '£', lkr: 'Rs' }

export default function PaymentCard({ payment }) {
  const symbol = SYMBOLS[payment.currency] || '$'
  const date = new Date(payment.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const time = new Date(payment.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group border-b border-gray-100 last:border-0">
      {/* Icon */}
      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
        <span className="text-sm font-bold text-gray-500 group-hover:text-emerald-600 transition-colors">
          #{(payment.orderId || '').toString().slice(-2)}
        </span>
      </div>

      {/* Order + User */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          Order <span className="font-semibold">#{payment.orderId}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          User {payment.userId} · {date} {time}
        </p>
      </div>

      {/* Status */}
      <StatusBadge status={payment.status} />

      {/* Amount */}
      <span className="font-semibold text-gray-900 text-sm w-20 text-right tabular-nums">
        {symbol}{(payment.amount ?? 0).toFixed(2)}
      </span>

      {/* Link */}
      <Link
        to={`/payments/${payment._id}`}
        className="text-gray-300 hover:text-emerald-600 transition-colors"
        aria-label="View details"
      >
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
