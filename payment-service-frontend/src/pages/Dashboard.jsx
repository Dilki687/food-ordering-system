import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CreditCard, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Plus, ArrowRight,
} from 'lucide-react'
import { getAllPayments } from '../api/payments'
import StatsCard from '../components/StatsCard'
import PaymentCard from '../components/PaymentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const SYMBOLS = { usd: '$', eur: '€', gbp: '£', lkr: 'Rs' }

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments', 'dashboard'],
    queryFn: () => getAllPayments({ limit: 200 }),
  })

  const payments = data?.data ?? []

  // Compute stats
  const byStatus = (s) => payments.filter((p) => p.status === s)
  const revenue = byStatus('succeeded').reduce((acc, p) => acc + (p.amount ?? 0), 0)
  const stats = {
    total:      payments.length,
    succeeded:  byStatus('succeeded').length,
    processing: byStatus('processing').length,
    pending:    byStatus('pending').length,
    failed:     byStatus('failed').length,
    refunded:   byStatus('refunded').length,
    revenue,
  }

  const recent = [...payments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} payment{stats.total !== 1 ? 's' : ''} across all orders
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`$${revenue.toFixed(2)}`}
          subtitle="From succeeded payments"
          icon={TrendingUp}
          color="emerald"
        />
        <StatsCard
          title="Succeeded"
          value={stats.succeeded}
          subtitle={`${stats.total ? Math.round((stats.succeeded / stats.total) * 100) : 0}% success rate`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="In Progress"
          value={stats.processing + stats.pending}
          subtitle="Processing + Pending"
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="Issues"
          value={stats.failed + stats.refunded}
          subtitle="Failed + Refunded"
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Status breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Succeeded', count: stats.succeeded,  color: 'bg-green-500' },
              { label: 'Processing', count: stats.processing, color: 'bg-blue-500' },
              { label: 'Pending',    count: stats.pending,    color: 'bg-amber-500' },
              { label: 'Failed',     count: stats.failed,     color: 'bg-red-500' },
              { label: 'Refunded',   count: stats.refunded,   color: 'bg-purple-500' },
            ].map(({ label, count, color }) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 tabular-nums">{count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                to: '/payments/checkout',
                label: 'Process New Payment',
                sub: 'Checkout using Order ID + User ID',
                icon: ShoppingCartIcon,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                to: '/payments',
                label: 'Browse All Payments',
                sub: 'Filter, search and paginate transactions',
                icon: CreditCard,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                to: '/user/payments',
                label: 'User Payment History',
                sub: 'Look up all payments by a specific user',
                icon: UsersIcon,
                color: 'bg-purple-50 text-purple-600',
              },
            ].map(({ to, label, sub, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/80 transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{sub}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Payments</h3>
          <Link
            to="/payments"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Create your first payment to get started."
            action={
              <Link
                to="/payments/checkout"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" /> Create payment
              </Link>
            }
          />
        ) : (
          <div>{recent.map((p) => <PaymentCard key={p._id} payment={p} />)}</div>
        )}
      </div>
    </div>
  )
}

// Inline icon shortcuts to avoid extra imports
function ShoppingCartIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
function UsersIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
