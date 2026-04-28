import { LucideIcon } from 'lucide-react'

const colors: Record<string, string> = {
  amber:  'text-orange-600 bg-orange-50',
  blue:   'text-blue-600 bg-blue-50',
  green:  'text-emerald-600 bg-emerald-50',
  red:    'text-red-600 bg-red-50',
  purple: 'text-violet-600 bg-violet-50',
  teal:   'text-teal-600 bg-teal-50',
}

export function StatCard({ label, value, sub, icon: Icon, color = 'amber' }: {
  label: string; value: string | number; sub?: string; icon: LucideIcon; color?: string
}) {
  const c = colors[color] ?? colors.amber
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c}`}>
          <Icon size={15} strokeWidth={2} />
        </div>
      </div>
      <p className="text-[22px] font-semibold text-slate-900 tracking-tight tabular-nums leading-none">{value}</p>
      <p className="text-[11.5px] text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[10.5px] text-slate-400">{sub}</p>}
    </div>
  )
}
