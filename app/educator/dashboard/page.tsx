export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, ClipboardList, AlertTriangle, User, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { EducatorCharts } from '@/components/charts/educator-charts'

async function getData(userId: string) {
  const { data: edu } = await supabaseAdmin
    .from('educators').select('id, specialization').eq('user_id', userId).single()
  if (!edu) return null
  const eid = edu.id
  const today = new Date().toISOString().split('T')[0]

  const { data: eduClasses } = await supabaseAdmin
    .from('educator_classes').select('id,year_level_id,class_group_id,lesson_type,subject_id').eq('educator_id', eid)
  const classes = eduClasses ?? []
  const yIds = [...new Set(classes.map((c: any) => c.year_level_id).filter(Boolean))]
  const gIds = [...new Set(classes.map((c: any) => c.class_group_id).filter(Boolean))]
  const sIds = [...new Set(classes.map((c: any) => c.subject_id).filter(Boolean))]
  const [yr, gr, su] = await Promise.all([
    yIds.length ? supabaseAdmin.from('year_levels').select('id,name').in('id', yIds) : { data: [] },
    gIds.length ? supabaseAdmin.from('class_groups').select('id,name').in('id', gIds) : { data: [] },
    sIds.length ? supabaseAdmin.from('subjects').select('id,name').in('id', sIds) : { data: [] },
  ])
  const yM = new Map((yr.data ?? []).map((x: any) => [x.id, x]))
  const gM = new Map((gr.data ?? []).map((x: any) => [x.id, x]))
  const sM = new Map((su.data ?? []).map((x: any) => [x.id, x]))
  const enrichedClasses = classes.map((c: any) => ({
    ...c, year_levels: yM.get(c.year_level_id) ?? null, class_groups: gM.get(c.class_group_id) ?? null, subject: sM.get(c.subject_id) ?? null,
  }))

  const learnersByClass: Record<string, any[]> = {}
  for (const cls of enrichedClasses) {
    let lrns: any[] = []
    if (cls.lesson_type === 'one_to_one') {
      const { data } = await supabaseAdmin.from('learners').select('id,user_id,admission_number,subject_id,exam_group_id')
        .eq('tutor_id', eid).eq('lesson_type', 'one_to_one').eq('status', 'active')
      lrns = data ?? []
    } else {
      let q = supabaseAdmin.from('learners').select('id,user_id,admission_number').eq('status', 'active')
      if (cls.year_level_id) q = q.eq('year_level_id', cls.year_level_id)
      if (cls.class_group_id) q = q.eq('class_group_id', cls.class_group_id)
      const { data } = await q; lrns = data ?? []
    }
    if (lrns.length) {
      const uids = lrns.map((l: any) => l.user_id).filter(Boolean)
      const { data: users } = uids.length ? await supabaseAdmin.from('users').select('id,name').in('id', uids) : { data: [] }
      const uM = new Map((users ?? []).map((u: any) => [u.id, u]))
      const lSubIds = [...new Set(lrns.map((l: any) => l.subject_id).filter(Boolean))]
      const { data: lSubs } = lSubIds.length ? await supabaseAdmin.from('subjects').select('id,name').in('id', lSubIds) : { data: [] }
      const lsM = new Map((lSubs ?? []).map((s: any) => [s.id, s]))
      learnersByClass[cls.id] = lrns.map((l: any) => ({ ...l, user: uM.get(l.user_id) ?? null, subject: lsM.get(l.subject_id) ?? null }))
    } else {
      learnersByClass[cls.id] = []
    }
  }

  const { data: leRows } = await supabaseAdmin.from('lesson_educators').select('lesson_id').eq('educator_id', eid)
  const lessonIds = (leRows ?? []).map((r: any) => r.lesson_id)
  const { data: todayL } = lessonIds.length
    ? await supabaseAdmin.from('lessons').select('id,title,attendance_locked,subject_id').in('id', lessonIds).eq('lesson_date', today) : { data: [] }
  const tSubIds = [...new Set((todayL ?? []).map((l: any) => l.subject_id).filter(Boolean))]
  const { data: tSubs } = tSubIds.length ? await supabaseAdmin.from('subjects').select('id,name').in('id', tSubIds) : { data: [] }
  const tsM = new Map((tSubs ?? []).map((s: any) => [s.id, s]))
  const todayLessons = (todayL ?? []).map((l: any) => ({ ...l, subject: tsM.get(l.subject_id) ?? null }))

  const { data: aIds } = await supabaseAdmin.from('assignments').select('id').eq('educator_id', eid)
  const assignIds = (aIds ?? []).map((a: any) => a.id)
  const { data: recentSubs } = assignIds.length
    ? await supabaseAdmin.from('assignment_submissions').select('id,status,submitted_at,assignment_id,learner_id')
        .in('assignment_id', assignIds).eq('status', 'submitted').order('submitted_at', { ascending: false }).limit(8) : { data: [] }
  const subLrnIds = [...new Set((recentSubs ?? []).map((s: any) => s.learner_id).filter(Boolean))]
  const { data: subLrns } = subLrnIds.length ? await supabaseAdmin.from('learners').select('id,user_id').in('id', subLrnIds) : { data: [] }
  const slUids = (subLrns ?? []).map((l: any) => l.user_id).filter(Boolean)
  const { data: slUsers } = slUids.length ? await supabaseAdmin.from('users').select('id,name').in('id', slUids) : { data: [] }
  const slrM = new Map((subLrns ?? []).map((l: any) => [l.id, l.user_id]))
  const suM2 = new Map((slUsers ?? []).map((u: any) => [u.id, u.name]))
  const subAsgIds = [...new Set((recentSubs ?? []).map((s: any) => s.assignment_id).filter(Boolean))]
  const { data: subAsgs } = subAsgIds.length ? await supabaseAdmin.from('assignments').select('id,title').in('id', subAsgIds) : { data: [] }
  const saM = new Map((subAsgs ?? []).map((a: any) => [a.id, a.title]))
  const enrichedSubs = (recentSubs ?? []).map((s: any) => ({
    ...s, learner_name: suM2.get(slrM.get(s.learner_id) ?? '') ?? '—', assignment_title: saM.get(s.assignment_id) ?? '—',
  }))

  const totalLearners = Object.values(learnersByClass).reduce((acc, arr) => acc + arr.length, 0)
  const { count: missedCount } = assignIds.length
    ? await supabaseAdmin.from('assignment_submissions').select('*', { count: 'exact', head: true }).in('assignment_id', assignIds).eq('status', 'missed') : { count: 0 }

  return { educator: edu, enrichedClasses, learnersByClass, todayLessons, recentSubs: enrichedSubs, totalLearners, missedCount: missedCount ?? 0 }
}

export default async function EducatorDashboard() {
  const session = await getSession()
  if (!session) redirect('/login')

  const data = await getData(session.id)

  if (!data && ['admin', 'super_admin'].includes(session.role)) {
    redirect('/admin/dashboard')
  }

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center p-8">
        <p className="text-slate-500 font-medium">Educator profile not found.</p>
        <p className="text-[12px] text-slate-400 mt-1">Contact your administrator.</p>
      </div>
    </div>
  )

  const { educator, enrichedClasses, learnersByClass, todayLessons, recentSubs, totalLearners, missedCount } = data
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <>
      <Topbar user={session} title="Dashboard"
              subtitle={`Good ${greeting}, ${session.name.split(' ')[0]}${educator.specialization ? ' · ' + educator.specialization : ''}`} />
      <div className="p-5 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="My Classes"  value={enrichedClasses.length} sub="Assigned by admin"   icon={BookOpen}      color="amber" />
          <StatCard label="My Learners" value={totalLearners}          sub="Across all classes"  icon={Users}         color="blue" />
          <StatCard label="Today"       value={todayLessons.length}    sub="Lessons scheduled"   icon={Calendar}      color="green" />
          <StatCard label="Missed Work" value={missedCount}            sub="Submissions overdue" icon={AlertTriangle}  color="red" />
        </div>

        {/* Today's lessons */}
        {todayLessons.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-800">Today's Lessons</p>
              <Link href="/educator/lessons" className="text-[11.5px] text-orange-600 hover:text-orange-700 font-medium">All lessons →</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {todayLessons.map((l: any) => (
                <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.attendance_locked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">{l.title}</p>
                    {l.subject && <p className="text-[11px] text-slate-400">{l.subject.name}</p>}
                  </div>
                  <Badge variant={l.attendance_locked ? 'success' : 'warning'}>{l.attendance_locked ? 'Done' : 'Mark'}</Badge>
                  <Link href={'/educator/lessons/' + l.id + '/attendance'} className="text-[11.5px] text-orange-600 font-medium">
                    {l.attendance_locked ? 'View →' : 'Mark →'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes + Charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
          {/* Left: assigned classes */}
          <div>
            <p className="text-[13px] font-semibold text-slate-800 mb-3">My Assigned Classes</p>
            {enrichedClasses.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200/60 p-8 text-center">
                <p className="text-[13px] text-slate-400">No classes assigned yet. Contact your administrator.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrichedClasses.map((cls: any) => {
                  const lrns = learnersByClass[cls.id] ?? []; const isOTO = cls.lesson_type === 'one_to_one'
                  return (
                    <div key={cls.id} className="bg-white rounded-lg border border-slate-200/60 overflow-hidden">
                      <div className={`px-5 py-3 border-b flex items-center justify-between ${isOTO ? 'bg-violet-50/50 border-violet-100' : 'bg-orange-50/50 border-orange-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOTO ? 'bg-violet-500' : 'bg-orange-500'}`}>
                            {isOTO ? <User size={14} className="text-white"/> : <Users size={14} className="text-white"/>}
                          </div>
                          <div>
                            <p className="text-[12.5px] font-semibold text-slate-800">{cls.year_levels?.name ?? '?'}{cls.class_groups?.name ? ' · Arm ' + cls.class_groups.name : ''}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge variant={isOTO ? 'purple' : 'info'}>{isOTO ? '1:1 Private' : 'General'}</Badge>
                              {!isOTO && cls.subject && <span className="text-[10.5px] text-slate-500">{cls.subject.name}</span>}
                              {isOTO && <span className="text-[10.5px] text-violet-600">Multiple subjects</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">{lrns.length} learner{lrns.length !== 1 ? 's' : ''}</span>
                          <Link href={'/educator/lessons?class=' + cls.id} className="text-[11px] text-orange-600 font-semibold">Lessons →</Link>
                        </div>
                      </div>
                      {lrns.length === 0 ? (
                        <p className="px-5 py-3.5 text-[12px] text-slate-400 italic">No learners assigned yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {lrns.map((l: any) => (
                            <div key={l.id} className="px-5 py-2.5 flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 ${isOTO ? 'bg-violet-500' : 'bg-slate-700'}`}>
                                {(l.user?.name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-slate-800 truncate">{l.user?.name ?? '—'}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {l.admission_number && <span className="text-[10px] text-slate-400 font-mono">{l.admission_number}</span>}
                                  {isOTO && l.subject && <Badge variant="teal">{l.subject.name}</Badge>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: charts sidebar */}
          <EducatorCharts
            classes={enrichedClasses}
            learnersByClass={learnersByClass}
            missedCount={missedCount}
            totalLearners={totalLearners}
          />
        </div>

        {/* Recent submissions */}
        {recentSubs.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">Recent Submissions</p>
            </div>
            <div className="divide-y divide-slate-50">
              {recentSubs.map((s: any) => (
                <div key={s.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"/>
                  <p className="flex-1 text-[12px] text-slate-700 truncate"><span className="font-medium">{s.learner_name}</span> submitted <span className="font-medium">{s.assignment_title}</span></p>
                  <span className="text-[10.5px] text-slate-400 whitespace-nowrap">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
