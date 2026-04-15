import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, Calendar, ClipboardList, AlertTriangle, TrendingUp, Layers, CheckCircle } from 'lucide-react'
import { pct } from '@/lib/utils'

export default async function SuperAdminDashboard() {
  const session = await getSession()

  const [
    { count: learners }, { count: educators }, { count: lessons },
    { count: assignments }, { count: missed }, { count: years },
    { data: yearBreakdown }, { data: topLearners },
  ] = await Promise.all([
    supabaseAdmin.from('learners').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('educators').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('assignments').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabaseAdmin.from('assignment_submissions').select('*', { count: 'exact', head: true }).eq('status', 'missed'),
    supabaseAdmin.from('year_levels').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('year_levels').select('id, name, learners(count)').eq('is_active', true).order('sort_order'),
    supabaseAdmin.from('assignment_submissions').select('learner_id, score, max_score, learners(users(name), year_levels(name))').eq('status', 'submitted').not('score', 'is', null).not('max_score', 'is', null).order('score', { ascending: false }).limit(8),
  ])

  return (
    <>
      <Topbar user={session!} title="Academy Overview" subtitle="Complete system analytics and performance" />
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Learners" value={learners ?? 0} icon={Users} color="blue" />
          <StatCard label="Educators" value={educators ?? 0} icon={GraduationCap} color="teal" />
          <StatCard label="Lessons" value={lessons ?? 0} icon={Calendar} color="amber" />
          <StatCard label="Assignments" value={assignments ?? 0} icon={ClipboardList} color="purple" />
          <StatCard label="Missed" value={missed ?? 0} icon={AlertTriangle} color="red" />
          <StatCard label="Year Levels" value={years ?? 0} icon={Layers} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Year breakdown */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100"><p className="text-[13px] font-semibold text-slate-800">Learners by Year Level</p></div>
            {!yearBreakdown?.length ? <div className="py-8 text-center text-slate-400 text-[12px]">No data yet</div> : (
              <div className="p-5 space-y-3">
                {yearBreakdown.map((y: any) => {
                  const count = Array.isArray(y.learners) ? (y.learners[0]?.count ?? 0) : 0
                  const pctVal = learners ? pct(count, learners) : 0
                  return (
                    <div key={y.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-slate-700">{y.name}</span>
                        <span className="text-[11.5px] font-bold text-slate-800">{count} learners</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all" style={{ width: `${pctVal}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top performers */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">Top Performers Academy-wide</p>
            </div>
            {!topLearners?.length ? <div className="py-8 text-center text-slate-400 text-[12px]">No completed tests yet</div> : (
              <div className="divide-y divide-slate-50">
                {topLearners.map((s: any, i: number) => {
                  const p = pct(s.score, s.max_score)
                  const color = p >= 70 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626'
                  return (
                    <div key={`${s.learner_id}-${i}`} className="px-5 py-3 flex items-center gap-3">
                      <span className="text-[14px] font-black text-amber-500 w-6 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-800 truncate">{(s.learners as any)?.users?.name ?? '—'}</p>
                        <p className="text-[10.5px] text-slate-400">{(s.learners as any)?.year_levels?.name ?? ''}</p>
                      </div>
                      <span className="text-[14px] font-bold" style={{ color }}>{p}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Summary metrics */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">System Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Completion Rate', value: assignments && missed ? `${pct((assignments - missed), assignments)}%` : '—', icon: CheckCircle, color: 'text-emerald-600' },
              { label: 'Total Missed', value: missed ?? 0, icon: AlertTriangle, color: 'text-red-500' },
              { label: 'Active Assignments', value: assignments ?? 0, icon: ClipboardList, color: 'text-purple-600' },
              { label: 'Total Lessons', value: lessons ?? 0, icon: Calendar, color: 'text-amber-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
                <Icon size={22} className={`mx-auto mb-2 ${color}`} />
                <p className="text-[20px] font-black text-slate-900">{value}</p>
                <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
