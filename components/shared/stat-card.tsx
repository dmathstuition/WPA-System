import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string; value: string | number; sub?: string
  icon: LucideIcon; color?: 'amber' | 'blue' | 'green' | 'red' | 'purple' | 'teal'
  trend?: { value: number; label: string }
}

const colorMap = {
  amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600',  ring: 'ring-amber-100' },
  blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',   ring: 'ring-blue-100' },
  green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600',ring: 'ring-emerald-100' },
  red:    { bg: 'bg-red-50',     icon: 'text-red-500',    ring: 'ring-red-100' },
  purple: { bg: 'bg-purple-50',  icon: 'text-purple-600', ring: 'ring-purple-100' },
  teal:   { bg: 'bg-teal-50',    icon: 'text-teal-600',   ring: 'ring-teal-100' },
}

export function StatCard({ label, value, sub, icon: Icon, color = 'amber', trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-4', c.bg, c.ring)}>
        <Icon size={19} className={cn(c.icon, 'group-hover:scale-110 transition-transform duration-200')} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[22px] font-black text-slate-900 leading-none tabular-nums">{value}</p>
        <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
        {trend && (
          <p className={cn('text-[10px] font-semibold mt-0.5', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
