import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInvoice } from '../api/payments'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react'

const SYMBOLS = { usd: '$', eur: '€', gbp: '£', lkr: 'Rs' }

export default function Invoice() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id),
  })

  if (isLoading) return <LoadingSpinner center />

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500 text-sm">Invoice not found.</p>
        <Link to="/payments" className="mt-3 text-sm text-emerald-600 hover:text-emerald-700">
          ← Back to Payments
        </Link>
      </div>
    )
  }

  const symbol  = SYMBOLS[invoice.currency?.toLowerCase()] || '$'
  const isPaid  = invoice.status === 'succeeded'

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Toolbar – hidden on print */}
      <div className="no-print flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="invoice-document">
        {/* Header band */}
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-white font-bold text-base">PayFlow</span>
            </div>
            <p className="text-slate-400 text-xs">Food Ordering System · Payment Service</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white tracking-tight">INVOICE</p>
            <p className="text-emerald-400 font-mono text-sm mt-0.5">{invoice.invoiceNumber}</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Issued to + Invoice info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Issued To</p>
              <p className="text-sm font-semibold text-gray-900">
                User #{invoice.userId}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Payment Service Customer</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Invoice Info</p>
              <InvoiceMetaRow label="Invoice #" value={invoice.invoiceNumber} />
              <InvoiceMetaRow
                label="Issued"
                value={invoice.issuedAt
                  ? new Date(invoice.issuedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
                  : '—'
                }
              />
              {invoice.paidAt && (
                <InvoiceMetaRow
                  label="Paid"
                  value={new Date(invoice.paidAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                />
              )}
              <div className="mt-1">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-100" />

          {/* Line items */}
          <div>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Description</span>
              <span className="text-center">Order</span>
              <span className="text-center">Method</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-4 items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {invoice.description || `Payment for Order #${invoice.orderId}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ID: <span className="font-mono">{String(invoice.paymentId).slice(-12)}</span>
                </p>
              </div>
              <span className="text-sm text-gray-700 text-center">#{invoice.orderId}</span>
              <span className="text-sm text-gray-700 capitalize text-center">
                {invoice.paymentMethod || 'card'}
              </span>
              <span className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                {symbol}{(invoice.amount ?? 0).toFixed(2)}
              </span>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{symbol}{(invoice.amount ?? 0).toFixed(2)}</span>
              </div>
              {invoice.refundAmount > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Refunded</span>
                  <span className="tabular-nums">− {symbol}{invoice.refundAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="tabular-nums">
                  {symbol}
                  {((invoice.amount ?? 0) - (invoice.refundAmount ?? 0)).toFixed(2)}{' '}
                  <span className="text-sm font-medium text-gray-400">{invoice.currency}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Paid badge */}
          {isPaid && (
            <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                PAID — Thank you!
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Generated by PayFlow · Food Ordering System · Student 4 – Susara
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              Stripe Payment Intent: <span className="font-mono">{invoice.stripeIntentId || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceMetaRow({ label, value }) {
  return (
    <p className="text-xs text-gray-500">
      <span className="text-gray-400">{label} </span>
      <span className="font-medium text-gray-700">{value}</span>
    </p>
  )
}
