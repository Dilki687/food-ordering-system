import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',          label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/payments',           label: 'All Payments',   icon: CreditCard },
  { to: '/payments/checkout',  label: 'New Payment',    icon: ShoppingCart },
  { to: '/user/payments',      label: 'User History',   icon: Users },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/60">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-tight">PayFlow</p>
          <p className="text-slate-400 text-xs">Payment Service</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* API Docs Link */}
      <div className="px-3 pb-2">
        <a
          href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8084'}/api-docs`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all duration-150"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          API Docs
        </a>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700/60">
        <p className="text-slate-500 text-xs text-center">Food Ordering System</p>
        <p className="text-slate-600 text-xs text-center mt-0.5">Student 4 – Susara</p>
      </div>
    </aside>
  )
}
