export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'emerald' }) {
  const iconColors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue:    'bg-blue-50   text-blue-600',
    amber:   'bg-amber-50  text-amber-600',
    purple:  'bg-purple-50 text-purple-600',
    red:     'bg-red-50    text-red-600',
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${iconColors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
