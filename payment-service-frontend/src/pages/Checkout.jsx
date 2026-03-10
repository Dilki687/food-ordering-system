import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import {
  ShoppingBag, User, Lock, ArrowRight, CheckCircle2,
  Package, DollarSign, Hash,
} from 'lucide-react'
import { createPaymentFromOrder, confirmPayment } from '../api/payments'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'

// Load Stripe outside component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const SYMBOLS = { usd: '$', eur: '€', gbp: '£', lkr: 'Rs' }

// ─── Stripe Card Payment Form ────────────────────────────────────────────────
function CardPaymentForm({ clientSecret, paymentId, amount, currency, onSuccess }) {
  const stripe     = useStripe()
  const elements   = useElements()
  const [name, setName]               = useState('')
  const [processing, setProcessing]   = useState(false)

  const confirmMutation = useMutation({
    mutationFn: ({ id, pmId }) => confirmPayment(id, pmId),
    onSuccess: (data) => onSuccess(data),
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Payment confirmation failed')
      setProcessing(false)
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { name: name.trim() || 'Guest' },
      },
    })

    if (error) {
      toast.error(error.message)
      setProcessing(false)
      return
    }

    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
      confirmMutation.mutate({ id: paymentId, pmId: paymentIntent.payment_method })
    } else {
      toast.error(`Unexpected payment status: ${paymentIntent.status}`)
      setProcessing(false)
    }
  }

  const symbol  = SYMBOLS[currency] || '$'
  const busy    = processing || confirmMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Cardholder name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Smith"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
      </div>

      {/* Card details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Card details
        </label>
        <div className="border border-gray-200 rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#111827',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  '::placeholder': { color: '#9ca3af' },
                  iconColor: '#6b7280',
                },
                invalid: { color: '#ef4444', iconColor: '#ef4444' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Test card: <span className="font-mono">4242 4242 4242 4242</span> · Any future date · Any CVC
        </p>
      </div>

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm mt-2"
      >
        {busy ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Processing payment…</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay {symbol}{(amount ?? 0).toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ payment, navigate }) {
  return (
    <div className="text-center py-4 animate-fade-in">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">Your transaction has been confirmed.</p>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left divide-y divide-gray-100">
        <InfoRow icon={Hash}        label="Payment ID" value={String(payment._id || payment.paymentId || '').slice(-12)} mono />
        <InfoRow icon={DollarSign}  label="Amount"     value={`$${(payment.amount ?? 0).toFixed(2)}`} />
        <InfoRow icon={Package}     label="Order"      value={`#${payment.orderId}`} />
        <InfoRow icon={User}        label="Status"     value={<StatusBadge status={payment.status} />} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/payments/${payment._id || payment.paymentId}`)}
          className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => navigate('/payments')}
          className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          All Payments
        </button>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={`text-xs font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ['Order Details', 'Card Payment', 'Confirmed']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step  ? 'bg-emerald-600 text-white'
                : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${i === step ? 'text-emerald-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-2 mb-4 transition-all duration-500 ${i < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function Checkout() {
  const { orderId: urlOrderId, userId: urlUserId } = useParams()
  const navigate = useNavigate()

  const [orderId,           setOrderId]           = useState(urlOrderId || '')
  const [userId,            setUserId]             = useState(urlUserId  || '')
  const [step,              setStep]               = useState(0)
  const [paymentData,       setPaymentData]        = useState(null)
  const [confirmedPayment,  setConfirmedPayment]   = useState(null)

  const createMutation = useMutation({
    mutationFn: ({ oid, uid }) => createPaymentFromOrder(oid, uid),
    onSuccess: (data) => {
      setPaymentData(data)
      setStep(1)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment')
    },
  })

  // Auto-trigger when URL params are pre-filled
  useEffect(() => {
    if (urlOrderId && urlUserId) {
      createMutation.mutate({ oid: urlOrderId, uid: urlUserId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOrderSubmit = (e) => {
    e.preventDefault()
    if (!orderId.trim() || !userId.trim()) {
      toast.error('Please enter both Order ID and User ID')
      return
    }
    createMutation.mutate({ oid: orderId.trim(), uid: userId.trim() })
  }

  const handlePaymentSuccess = (confirmed) => {
    setConfirmedPayment(confirmed)
    setStep(2)
    toast.success('Payment confirmed!')
  }

  const currentStep = confirmedPayment ? 2 : step

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Stepper step={currentStep} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* ── Step 2: Success ── */}
        {confirmedPayment && (
          <SuccessScreen payment={confirmedPayment} navigate={navigate} />
        )}

        {/* ── Step 0: Enter IDs ── */}
        {!confirmedPayment && step === 0 && (
          <form onSubmit={handleOrderSubmit} className="space-y-5 animate-fade-in">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Start Checkout</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your Order ID and User ID to proceed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Order ID
              </label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 1"
                required
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                User ID
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. 1"
                required
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Fetching order…</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Continue to Payment</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Step 1: Payment ── */}
        {!confirmedPayment && step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Complete Payment</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Review your order then enter card details
              </p>
            </div>

            {/* Order summary card */}
            {paymentData ? (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                  Order Summary
                </p>
                <div className="space-y-2">
                  <SummaryRow label="Order ID"  value={`#${paymentData.orderId}`} />
                  <SummaryRow label="User ID"   value={paymentData.userId} />
                  {paymentData.order?.product && (
                    <SummaryRow label="Product"  value={paymentData.order.product} />
                  )}
                  {paymentData.order?.quantity && (
                    <SummaryRow label="Quantity" value={paymentData.order.quantity} />
                  )}
                  {paymentData.user?.name && (
                    <SummaryRow label="Customer" value={paymentData.user.name} />
                  )}
                  <div className="border-t border-emerald-200 pt-2 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-emerald-800">Total</span>
                      <span className="text-lg font-bold text-emerald-900">
                        {SYMBOLS[paymentData.currency] || '$'}
                        {(paymentData.amount ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <LoadingSpinner center />
            )}

            {/* Stripe payment form */}
            {paymentData?.clientSecret && (
              <Elements stripe={stripePromise}>
                <CardPaymentForm
                  clientSecret={paymentData.clientSecret}
                  paymentId={paymentData.paymentId}
                  amount={paymentData.amount}
                  currency={paymentData.currency}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            )}
          </div>
        )}

        {/* Loading while auto-creating from URL params */}
        {!confirmedPayment && step === 1 && !paymentData && createMutation.isPending && (
          <LoadingSpinner center />
        )}
      </div>

      {/* Security note */}
      {!confirmedPayment && (
        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          Payments are securely processed by Stripe
        </p>
      )}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-emerald-700/70">{label}</span>
      <span className="text-xs font-medium text-emerald-900">{value}</span>
    </div>
  )
}
