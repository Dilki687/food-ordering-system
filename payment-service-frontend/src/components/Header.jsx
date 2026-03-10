import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const PAGE_META = {
  '/dashboard':          { title: 'Dashboard',        back: false },
  '/payments':           { title: 'All Payments',      back: false },
  '/payments/checkout':  { title: 'New Payment',       back: true  },
  '/user/payments':      { title: 'User History',      back: false },
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Match dynamic routes (e.g. /payments/:id)
  let meta = PAGE_META[pathname]
  if (!meta) {
    if (pathname.includes('/invoice'))       meta = { title: 'Invoice',          back: true }
    else if (pathname.match(/\/payments\/.+/)) meta = { title: 'Payment Details', back: true }
    else if (pathname.includes('/user/'))    meta = { title: 'User History',     back: true }
    else                                     meta = { title: 'PayFlow',           back: false }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {meta.back && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900">{meta.title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
    </header>
  )
}
