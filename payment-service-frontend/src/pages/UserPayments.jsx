import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowRight, User } from 'lucide-react'
import { getPaymentsByUser } from '../api/payments'
import PaymentCard from '../components/PaymentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'

const SYMBOLS = { usd: '$', eur: '€', gbp: '£', lkr: 'Rs' }

export default function UserPayments() {
  const { userId: urlUserId } = useParams()
  const navigate = useNavigate()

  const [inputId, setInputId]   = useState(urlUserId || '')
  const [activeId, setActiveId] = useState(urlUserId || '')
  const [page, setPage]         = useState(1)
  const limit = 10

  // Sync URL param on route change
  useEffect(() => {
    if (urlUserId) {
      setInputId(urlUserId)
      setActiveId(urlUserId)
    }
  }, [urlUserId])

  const { data, isLoading } = useQuery({
    queryKey: ['user-payments', activeId, page, limit],
    queryFn: () => getPaymentsByUser(activeId, { page, limit }),
    enabled: !!activeId,
  })

  const user         = data?.data?.user      ?? null
  const payments     = data?.data?.payments  ?? []
  const pagination   = data?.pagination      ?? {}
  const totalPages   = pagination.pages      ?? 1

  const handleSearch = (e) => {
    e.preventDefault()
    if (!inputId.trim()) return
    const uid = inputId.trim()
    setActiveId(uid)
    setPage(1)
    navigate(`/user/${uid}/payments`, { replace: true })
  }

  // Compute quick stats
  const stats = {
    total:     payments.length,
    succeeded: payments.filter((p) => p.status === 'succeeded').length,
    revenue:   payments
      .filter((p) => p.status === 'succeeded')
      .reduce((acc, p) => acc + (p.amount ?? 0), 0),
  }

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">User History</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Look up all payments for a specific user
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Enter User ID (e.g. 1)"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" /> Look Up
          </button>
        </div>
      </form>

      {activeId && (
        <>
          {isLoading ? (
            <LoadingSpinner center />
          ) : (
            <>
              {/* User summary */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">
                      {user?.name || user?.username || `User #${activeId}`}
                    </h3>
                    {user?.email && (
                      <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">ID: {activeId}</p>
                  </div>

                  {/* Mini stats */}
                  <div className="hidden sm:grid grid-cols-3 gap-3 shrink-0">
                    <MiniStat label="Payments"  value={pagination.total ?? payments.length} />
                    <MiniStat label="Succeeded" value={stats.succeeded} />
                    <MiniStat label="Revenue"   value={`$${stats.revenue.toFixed(2)}`} />
                  </div>
                </div>
              </div>

              {/* Payments list */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">
                    Payments
                    {pagination.total != null && (
                      <span className="text-gray-400 font-normal ml-1">({pagination.total})</span>
                    )}
                  </p>
                </div>

                {payments.length === 0 ? (
                  <EmptyState
                    title="No payments found"
                    description={`User ${activeId} has not made any payments yet.`}
                  />
                ) : (
                  <div>
                    {payments.map((p) => (
                      <PaymentCard key={p._id} payment={p} />
                    ))}
                  </div>
                )}
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {/* Empty prompt */}
      {!activeId && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState
            title="Enter a User ID to begin"
            description="Search for any user to view their complete payment history."
          />
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="text-center bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-base font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
