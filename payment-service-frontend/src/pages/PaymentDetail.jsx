import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  CreditCard, Package, User, FileText, RotateCcw,
  Calendar, Hash, DollarSign, Tag, AlertTriangle,
} from 'lucide-react'
import { getPaymentWithDetails, refundPayment } from '../api/payments'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const SYMBOLS = { usd: '$', eur: '€', gbp: '£', lkr: 'Rs' }
const TABS = ['Payment', 'Order', 'Customer', 'Timeline']

export default function PaymentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPaymentWithDetails(id),
  })

  const refundMutation = useMutation({
    mutationFn: (amount) => refundPayment(id, amount || undefined),
    onSuccess: () => {
      toast.success('Refund processed successfully')
      queryClient.invalidateQueries({ queryKey: ['payment', id] })
      setShowRefundModal(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Refund failed'),
  })

  if (isLoading) return <LoadingSpinner center />

  if (error || !payment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
        <h3 className="font-semibold text-gray-900">Payment not found</h3>
        <p className="text-sm text-gray-500 mt-1">The payment ID may be invalid or was deleted.</p>
        <Link to="/payments" className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          ← Back to Payments
        </Link>
      </div>
    )
  }

  const symbol  = SYMBOLS[payment.currency] || '$'
  const order   = payment.orderDetails || {}
  const user    = payment.userDetails  || {}

  return (
    <div className="max-w-3xl animate-fade-in space-y-5">
      {/* Top card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-gray-500 font-mono">
                {String(payment._id).slice(-12)}
              </p>
              <StatusBadge status={payment.status} size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {symbol}{(payment.amount ?? 0).toFixed(2)}{' '}
              <span className="text-base font-medium text-gray-400 uppercase">
                {payment.currency}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Order #{payment.orderId} · User {payment.userId}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <Link
              to={`/payments/${id}/invoice`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> Invoice
            </Link>
            {payment.status === 'succeeded' && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refund
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'text-emerald-600 border-b-2 border-emerald-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Payment tab */}
          {activeTab === 0 && (
            <dl className="divide-y divide-gray-50">
              <DetailRow icon={Hash}       label="Payment ID"      value={String(payment._id)} mono />
              <DetailRow icon={DollarSign} label="Amount"          value={`${symbol}${(payment.amount ?? 0).toFixed(2)}`} />
              <DetailRow icon={Tag}        label="Currency"        value={payment.currency?.toUpperCase()} />
              <DetailRow icon={CreditCard} label="Method"          value={payment.paymentMethod} capitalize />
              <DetailRow icon={Tag}        label="Status"          value={<StatusBadge status={payment.status} />} />
              {payment.stripePaymentIntentId && (
                <DetailRow icon={Hash}     label="Stripe Intent"  value={payment.stripePaymentIntentId} mono />
              )}
              {payment.description && (
                <DetailRow icon={Tag}      label="Description"    value={payment.description} />
              )}
              {payment.refundAmount > 0 && (
                <DetailRow icon={RotateCcw} label="Refunded"      value={`${symbol}${payment.refundAmount.toFixed(2)}`} />
              )}
            </dl>
          )}

          {/* Order tab */}
          {activeTab === 1 && (
            <div>
              {Object.keys(order).length > 0 ? (
                <dl className="divide-y divide-gray-50">
                  {Object.entries(order)
                    .filter(([k]) => !['__v', 'createdAt', 'updatedAt'].includes(k))
                    .map(([key, val]) => (
                      <DetailRow
                        key={key}
                        icon={Package}
                        label={key.replace(/_/g, ' ')}
                        value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                        capitalize
                      />
                    ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  Order details not available
                </p>
              )}
            </div>
          )}

          {/* Customer tab */}
          {activeTab === 2 && (
            <div>
              {Object.keys(user).length > 0 ? (
                <dl className="divide-y divide-gray-50">
                  {Object.entries(user)
                    .filter(([k]) => !['password', '__v', 'createdAt', 'updatedAt'].includes(k))
                    .map(([key, val]) => (
                      <DetailRow
                        key={key}
                        icon={User}
                        label={key.replace(/_/g, ' ')}
                        value={String(val ?? '—')}
                        capitalize
                      />
                    ))}
                </dl>
              ) : (
                <div className="text-center py-8">
                  <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">User details not available</p>
                  <p className="text-xs text-gray-300 mt-1">User ID: {payment.userId}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <TimelineEvent
                icon={CreditCard}
                color="bg-blue-500"
                label="Payment Created"
                date={payment.createdAt}
                description={`PaymentIntent created · ${symbol}${(payment.amount ?? 0).toFixed(2)}`}
              />
              {payment.status === 'succeeded' && (
                <TimelineEvent
                  icon={CheckIcon}
                  color="bg-emerald-500"
                  label="Payment Succeeded"
                  date={payment.updatedAt}
                  description="Card charged successfully"
                />
              )}
              {payment.status === 'failed' && (
                <TimelineEvent
                  icon={XIcon}
                  color="bg-red-500"
                  label="Payment Failed"
                  date={payment.updatedAt}
                  description="Transaction could not be completed"
                />
              )}
              {payment.status === 'refunded' && (
                <TimelineEvent
                  icon={RotateCcw}
                  color="bg-purple-500"
                  label="Payment Refunded"
                  date={payment.updatedAt}
                  description={`Refunded ${symbol}${(payment.refundAmount ?? 0).toFixed(2)}`}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Refund modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-base font-bold text-gray-900 mb-1">Process Refund</h3>
            <p className="text-sm text-gray-500 mb-4">
              Leave amount blank for a full refund of {symbol}
              {(payment.amount ?? 0).toFixed(2)}.
            </p>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={payment.amount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={`Max ${symbol}${(payment.amount ?? 0).toFixed(2)}`}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={refundMutation.isPending}
                onClick={() => refundMutation.mutate(refundAmount ? parseFloat(refundAmount) : undefined)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refundMutation.isPending ? <LoadingSpinner size="sm" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value, mono = false, capitalize = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-500 capitalize">{label}</span>
      </div>
      <span
        className={`text-sm font-medium text-gray-900 text-right break-all ${mono ? 'font-mono text-xs' : ''} ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function TimelineEvent({ icon: Icon, color, label, date, description }) {
  return (
    <div className="flex gap-3">
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
        {date && (
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(date).toLocaleString('en-US', {
              dateStyle: 'medium', timeStyle: 'short',
            })}
          </p>
        )}
      </div>
    </div>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
function XIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
