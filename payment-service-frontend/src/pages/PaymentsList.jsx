import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { getAllPayments } from '../api/payments'
import PaymentCard from '../components/PaymentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'

const STATUSES = ['pending', 'processing', 'succeeded', 'failed', 'refunded']

export default function PaymentsList() {
  const [status, setStatus]   = useState('')
  const [userId, setUserId]   = useState('')
  const [page, setPage]       = useState(1)
  const limit = 10

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['payments', 'list', { status, userId, page, limit }],
    queryFn: () =>
      getAllPayments({
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {}),
        page,
        limit,
      }),
    keepPreviousData: true,
  })

  const payments    = data?.data       ?? []
  const pagination  = data?.pagination ?? {}
  const totalPages  = pagination.pages ?? 1
  const total       = pagination.total ?? payments.length

  const hasFilters = status || userId
  const clearFilters = () => { setStatus(''); setUserId(''); setPage(1) }

  return (
    <div className="space-y-4 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">All Payments</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} transaction{total !== 1 ? 's' : ''}
            {hasFilters && ' (filtered)'}
          </p>
        </div>
        <Link
          to="/payments/checkout"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Payment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setStatus(''); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !status
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${
                  status === s
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* User ID search */}
          <div className="relative flex items-center ml-auto">
            <Search className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1) }}
              placeholder="Search by User ID…"
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-48"
            />
            {userId && (
              <button
                onClick={() => { setUserId(''); setPage(1) }}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2rem_1fr_auto_auto_1.5rem] items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <span />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order / User</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right w-20">Amount</span>
          <span />
        </div>

        {isLoading ? (
          <LoadingSpinner center />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description={hasFilters ? 'Try adjusting or clearing your filters.' : 'No payments have been created yet.'}
            action={
              <Link
                to="/payments/checkout"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" /> Create first payment
              </Link>
            }
          />
        ) : (
          <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
            {payments.map((p) => (
              <PaymentCard key={p._id} payment={p} />
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
