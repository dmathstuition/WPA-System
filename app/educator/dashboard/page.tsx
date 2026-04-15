import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, ClipboardList, AlertTriangle, User, BookOpen } from 'lucide-react'
import Link from 'next/link'

async function getData(userId: string) {
  const { data: edu } = await supabaseAdmin
    .from('educators')
    .select('id, specialization')
    .eq('user_id', userId).single()
  if (!edu) return null
  const eid   = edu.id
  const today = new Date().toISOString().split('T')[0]

  // Get assigned classes
  const { data: eduClasses } = await supabaseAdmin
    .from('educator_classes')
    .select('id, year_level_id, class_group_id, lesson_type, subject_id')
    .eq('educator_id', eid)

  const classes = eduClasses ?? []
  const yearIds  = [...new Set(classes.map((c: any) => c.year_level_id).filter(Boolean))]
  const groupIds = [...new Set(classes.map((c: any) => c.class_group_id).filter(Boolean))]
  const subIds   = [...new Set(classes.map((c: any) => c.subject_id).filter(Boolean))]

  const [yrRes, grRes, subRes] = await Promise.all([
    yearIds.length  ? supabaseAdmin.from('year_levels').select('id,name').in('id', yearIds)   : { data: [] },
    groupIds.length ? supabaseAdmin.from('class_groups').select('id,name').in('id', groupIds) : { data: [] },
    subIds.length   ? supabaseAdmin.from('subjects').select('id,name').in('id', subIds)       : { data: [] },
  ])
  const yMap = new Map((yrRes.data  ?? []).map((x: any) => [x.id, x]))
  const gMap = new Map((grRes.data  ?? []).map((x: any) => [x.id, x]))
  const sMap = new Map((subRes.data ?? []).map((x: any) => [x.id, x]))

  const enrichedClasses = classes.map((c: any) => ({
    ...c,
    year_levels:  yMap.get(c.year_level_id)  ?? null,
    class_groups: gMap.get(c.class_group_id) ?? null,
    // For general: use the class's assigned subject
    // For 1:1: subject is per-learner, shown differently
    subject:      sMap.get(c.subject_id)     ?? null,
  }))

  // Get learners per class
  const learnersByClass: Record<string, any[]> = {}
  for (const cls of enrichedClasses) {
    if (cls.lesson_type === 'one_to_one') {
      // 1:1: get learners assigned to this tutor, each has their own subject
      const { data: lrns } = await supabaseAdmin
        .from('learners')
        .select('id, user_id, admission_number, subject_id, exam_group_id')
        .eq('tutor_id', eid)
        .eq('lesson_type', 'one_to_one')
        .eq('status', 'active')
      if (lrns?.length) {
        const uids   = lrns.map((l: any) => l.user_id).filter(Boolean)
        const sids   = [...new Set(lrns.map((l: any) => l.subject_id).filter(Boolean))]
        const eids2  = [...new Set(lrns.map((l: any) => l.exam_group_id).filter(Boolean))]
        const [uRes, lsRes, egRes] = await Promise.all([
          uids.length  ? supabaseAdmin.from('users').select('id,name,email').in('id', uids)          : { data: [] },
          sids.length  ? supabaseAdmin.from('subjects').select('id,name').in('id', sids)             : { data: [] },
          eids2.length ? supabaseAdmin.from('exam_groups').select('id,name').in('id', eids2)         : { data: [] },
        ])
        const luMap  = new Map((uRes.data  ?? []).map((u: any) => [u.id, u]))
        const lsMap  = new Map((lsRes.data ?? []).map((s: any) => [s.id, s]))
        const egMap  = new Map((egRes.data ?? []).map((e: any) => [e.id, e]))
        learnersByClass[cls.id] = lrns.map((l: any) => ({
          ...l,
          user:       luMap.get(l.user_id)    ?? null,
          subject:    lsMap.get(l.subject_id) ?? null,
          exam_group: egMap.get(l.exam_group_id) ?? null,
        }))
      } else {
        learnersByClass[cls.id] = []
      }
    } else {
      // General: get learners in this year + arm
      let lq = supabaseAdmin.from('learners')
        .select('id, user_id, admission_number')
        .eq('year_level_id', cls.year_level_id)
        .eq('status', 'active')
      if (cls.class_group_id) lq = lq.eq('class_group_id', cls.class_group_id)
      const { data: lrns } = await lq
      if (lrns?.length) {
        const uids = lrns.map((l: any) => l.user_id).filter(Boolean)
        const { data: uRes } = uids.length
          ? await supabaseAdmin.from('users').select('id,name').in('id', uids)
          : { data: [] }
        const uMap2 = new Map((uRes ?? []).map((u: any) => [u.id, u]))
        learnersByClass[cls.id] = lrns.map((l: any) => ({ ...l, user: uMap2.get(l.user_id) ?? null }))
      } else {
        learnersByClass[cls.id] = []
      }
    }
  }

  // Today's lessons
  const { data: leRows } = await supabaseAdmin
    .from('lesson_educators').select('lesson_id').eq('educator_id', eid)
  const lessonIds = (leRows ?? []).map((r: any) => r.lesson_id)
  const { data: todayLessons } = lessonIds.length
    ? await supabaseAdmin.from('lessons')
        .select('id,title,attendance_locked,subject_id,year_level_id,class_group_id')
        .in('id', lessonIds).eq('lesson_date', today)
    : { data: [] }

  // Enrich today lessons with names
  const tSubIds  = [...new Set((todayLessons ?? []).map((l: any) => l.subject_id).filter(Boolean))]
  const { data: tSubs } = tSubIds.length
    ? await supabaseAdmin.from('subjects').select('id,name').in('id', tSubIds) : { data: [] }
  const tsMap = new Map((tSubs ?? []).map((s: any) => [s.id, s]))
  const enrichedToday = (todayLessons ?? []).map((l: any) => ({
    ...l, subject: tsMap.get(l.subject_id) ?? null
  }))

  // Recent submissions
  const { data: assignIds } = await supabaseAdmin
    .from('assignments').select('id').eq('educator_id', eid)
  const aIds = (assignIds ?? []).map((a: any) => a.id)
  const { data: recentSubs } = aIds.length
    ? await supabaseAdmin.from('assignment_submissions')
        .select('id, status, submitted_at, assignment_id, learner_id, assignments(title)')
        .in('assignment_id', aIds)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(8)
    : { data: [] }

  // Sub learner names
  const subLrnIds = [...new Set((recentSubs ?? []).map((s: any) => s.learner_id).filter(Boolean))]
  const { data: subLrnRows } = subLrnIds.length
    ? await supabaseAdmin.from('learners').select('id,user_id').in('id', subLrnIds) : { data: [] }
  const slUids = (subLrnRows ?? []).map((l: any) => l.user_id).filter(Boolean)
  const { data: slUsers } = slUids.length
    ? await supabaseAdmin.from('users').select('id,name').in('id', slUids) : { data: [] }
  const slrMap = new Map((subLrnRows ?? []).map((l: any) => [l.id, l.user_id]))
  const suMap  = new Map((slUsers    ?? []).map((u: any) => [u.id, u.name]))

  const enrichedSubs = (recentSubs ?? []).map((s: any) => ({
    ...s,
    learner_name: suMap.get(slrMap.get(s.learner_id) ?? '') ?? '—',
  }))

  const totalLearners = Object.values(learnersByClass).reduce((acc, arr) => acc + arr.length, 0)
  const { count: missedCount } = aIds.length
    ? await supabaseAdmin.from('assignment_submissions')
        .select('*', { count:'exact', head:true })
        .in('assignment_id', aIds).eq('status','missed')
    : { count: 0 }

  return {
    educator: edu,
    enrichedClasses,
    learnersByClass,
    todayLessons: enrichedToday,
    recentSubs: enrichedSubs,
    totalLearners,
    missedCount: missedCount ?? 0,
  }
}

export default async function EducatorDashboard() {
  const session = await getSession()
  if (!session) return null
  const data = await getData(session.id)

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center p-8">
        <p className="text-slate-500 font-medium">Educator profile not found.</p>
        <p className="text-[12px] text-slate-400 mt-1">Contact your administrator.</p>
      </div>
    </div>
  )

  const { educator, enrichedClasses, learnersByClass, todayLessons, recentSubs, totalLearners, missedCount } = data
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <>
      <Topbar user={session} title="Dashboard"
              subtitle={`Good ${greeting}, ${session.name.split(' ')[0]}${educator.specialization ? ' · ' + educator.specialization : ''}`} />
      <div className="p-5 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="My Classes"    value={enrichedClasses.length} sub="Assigned by admin"    icon={BookOpen}    color="amber" />
          <StatCard label="My Learners"   value={totalLearners}          sub="Across all classes"   icon={Users}       color="blue" />
          <StatCard label="Today"         value={todayLessons.length}    sub="Lessons scheduled"    icon={Calendar}    color="green" />
          <StatCard label="Missed Work"   value={missedCount}            sub="Submissions overdue"  icon={AlertTriangle} color="red" />
        </div>

        {/* Today's lessons */}
        {todayLessons.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-800">Today's Lessons</p>
              <Link href="/educator/lessons" className="text-[11.5px] text-amber-600 hover:text-amber-700 font-medium">All lessons →</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {todayLessons.map((l: any) => (
                <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${l.attendance_locked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">{l.title}</p>
                    {l.subject && <p className="text-[11px] text-slate-400 mt-0.5">{l.subject.name}</p>}
                  </div>
                  <Badge variant={l.attendance_locked ? 'success' : 'warning'}>
                    {l.attendance_locked ? 'Done' : 'Mark Attendance'}
                  </Badge>
                  <Link href={'/educator/lessons/' + l.id + '/attendance'}
                    className="text-[11.5px] text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap">
                    {l.attendance_locked ? 'View →' : 'Mark →'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned classes + learners */}
        <div>
          <p className="text-[13px] font-bold text-slate-800 mb-3">My Assigned Classes</p>
          {enrichedClasses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center">
              <p className="text-[13px] text-slate-400">No classes assigned yet. Contact your administrator.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedClasses.map((cls: any) => {
                const lrns  = learnersByClass[cls.id] ?? []
                const isOTO = cls.lesson_type === 'one_to_one'
                return (
                  <div key={cls.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Class header */}
                    <div className={`px-5 py-3.5 border-b flex items-center justify-between ${isOTO ? 'bg-purple-50 border-purple-100' : 'bg-amber-50 border-amber-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOTO ? 'bg-purple-500' : 'bg-amber-500'}`}>
                          {isOTO ? <User size={15} className="text-white" /> : <Users size={15} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800">
                            {cls.year_levels?.name ?? '?'}
                            {cls.class_groups?.name ? ' · Arm ' + cls.class_groups.name : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant={isOTO ? 'purple' : 'info'} style={{ fontSize:'9px' }}>
                              {isOTO ? '1:1 Private' : 'General Class'}
                            </Badge>
                            {/* General: show the fixed assigned subject (tutor's specialization) */}
                            {!isOTO && cls.subject && (
                              <span className="text-[10.5px] text-slate-600 font-semibold">{cls.subject.name}</span>
                            )}
                            {!isOTO && !cls.subject && educator.specialization && (
                              <span className="text-[10.5px] text-slate-500">{educator.specialization}</span>
                            )}
                            {/* 1:1: show "Multiple subjects" label */}
                            {isOTO && (
                              <span className="text-[10.5px] text-purple-600 font-medium">Multiple subjects (per learner)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">{lrns.length} learner{lrns.length !== 1 ? 's' : ''}</span>
                        <Link href={'/educator/lessons?class=' + cls.id}
                          className="text-[11.5px] text-amber-600 hover:text-amber-700 font-semibold">
                          Lessons →
                        </Link>
                      </div>
                    </div>

                    {/* Learners */}
                    {lrns.length === 0 ? (
                      <p className="px-5 py-4 text-[12px] text-slate-400 italic">No learners assigned to this class yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {lrns.map((l: any) => (
                          <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${isOTO ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
                              {(l.user?.name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12.5px] font-semibold text-slate-800 truncate">{l.user?.name ?? '—'}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {l.admission_number && (
                                  <span className="text-[10px] text-slate-400 font-mono">{l.admission_number}</span>
                                )}
                                {/* 1:1 learners show their specific subject */}
                                {isOTO && l.subject && (
                                  <Badge variant="teal" style={{ fontSize:'9px', padding:'1px 6px' }}>{l.subject.name}</Badge>
                                )}
                                {isOTO && l.exam_group && (
                                  <Badge variant="warning" style={{ fontSize:'9px', padding:'1px 6px' }}>{l.exam_group.name}</Badge>
                                )}
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

        {/* Recent submissions */}
        {recentSubs.length > 0 && (
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-emerald-100 bg-emerald-50/50">
              <p className="text-[13px] font-semibold text-emerald-800">🔔 Recent Submissions</p>
            </div>
            <div className="divide-y divide-slate-50">
              {recentSubs.map((s: any) => (
                <div key={s.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-slate-700 truncate">
                      <strong>{s.learner_name}</strong> submitted <strong>{s.assignments?.title ?? '—'}</strong>
                    </p>
                  </div>
                  <span className="text-[10.5px] text-slate-400 whitespace-nowrap">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
