import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import {
  Users, GraduationCap, ClipboardList, AlertTriangle,
  CheckCircle, ExternalLink, BookOpen, TrendingUp
} from 'lucide-react'
import Link from 'next/link'

async function getData() {
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: learnerCount },
    { count: educatorCount },
    { count: assignmentCount },
    { count: missedCount },
  ] = await Promise.all([
    supabaseAdmin.from('learners').select('*', { count:'exact', head:true }).eq('status','active'),
    supabaseAdmin.from('educators').select('*', { count:'exact', head:true }),
    supabaseAdmin.from('assignments').select('*', { count:'exact', head:true }).eq('is_published', true),
    supabaseAdmin.from('assignment_submissions').select('*', { count:'exact', head:true }).eq('status','missed'),
  ])

  // Fetch educators (flat, no joins)
  const { data: educators } = await supabaseAdmin
    .from('educators').select('id, user_id, specialization')
  const eduIds  = (educators ?? []).map((e: any) => e.id)
  const eduUids = (educators ?? []).map((e: any) => e.user_id).filter(Boolean)

  // Fetch user details separately
  const { data: users } = eduUids.length
    ? await supabaseAdmin.from('users').select('id,name,email,is_active').in('id', eduUids)
    : { data: [] }
  const uMap = new Map((users ?? []).map((u: any) => [u.id, u]))

  // Educator classes
  const { data: eduClasses } = eduIds.length
    ? await supabaseAdmin.from('educator_classes')
        .select('educator_id').in('educator_id', eduIds)
    : { data: [] }
  const clsCountMap = new Map<string, number>()
  for (const c of eduClasses ?? []) {
    clsCountMap.set(c.educator_id, (clsCountMap.get(c.educator_id) ?? 0) + 1)
  }

  // Lessons per educator (via lesson_educators junction)
  const { data: lessonEdus } = eduIds.length
    ? await supabaseAdmin.from('lesson_educators')
        .select('educator_id, lessons(id, lesson_date, attendance_locked)')
        .in('educator_id', eduIds)
    : { data: [] }

  const lessonByEdu = new Map<string, any[]>()
  for (const le of lessonEdus ?? []) {
    if (!lessonByEdu.has(le.educator_id)) lessonByEdu.set(le.educator_id, [])
    if (le.lessons) lessonByEdu.get(le.educator_id)!.push(le.lessons)
  }

  // Assignments per educator
  const { data: assignments } = eduIds.length
    ? await supabaseAdmin.from('assignments')
        .select('educator_id, created_at').in('educator_id', eduIds)
    : { data: [] }

  const assignTotal = new Map<string, number>()
  const assignToday = new Map<string, number>()
  for (const a of assignments ?? []) {
    assignTotal.set(a.educator_id, (assignTotal.get(a.educator_id) ?? 0) + 1)
    if (a.created_at?.startsWith(today))
      assignToday.set(a.educator_id, (assignToday.get(a.educator_id) ?? 0) + 1)
  }

  // Build tutor rows
  const tutorRows = (educators ?? []).map((e: any) => {
    const user    = uMap.get(e.user_id)
    const lessons = lessonByEdu.get(e.id) ?? []
    const locked  = lessons.filter((l: any) => l?.attendance_locked).length
    const todayLs = lessons.filter((l: any) => l?.lesson_date === today).length
    return {
      id:           e.id,
      name:         user?.name           ?? '—',
      email:        user?.email          ?? '',
      specialization: e.specialization  ?? '',
      isActive:     user?.is_active      ?? true,
      classes:      clsCountMap.get(e.id) ?? 0,
      totalLessons: lessons.length,
      todayLessons: todayLs,
      totalAssign:  assignTotal.get(e.id) ?? 0,
      todayAssign:  assignToday.get(e.id) ?? 0,
      attRate:      lessons.length > 0 ? Math.round((locked / lessons.length) * 100) : 0,
    }
  }).sort((a, b) => b.totalLessons - a.totalLessons)

  const tutorsActiveToday  = tutorRows.filter(t => t.todayLessons > 0).length
  const tutorsAssignToday  = tutorRows.filter(t => t.todayAssign  > 0).length

  // Recent submission notifications
  const { data: notifs } = await supabaseAdmin
    .from('notifications')
    .select('id, message, created_at, is_read, user_id')
    .eq('type', 'submission')
    .order('created_at', { ascending: false })
    .limit(15)

  const notifUids = [...new Set((notifs ?? []).map((n: any) => n.user_id).filter(Boolean))]
  const { data: notifUsers } = notifUids.length
    ? await supabaseAdmin.from('users').select('id,name').in('id', notifUids)
    : { data: [] }
  const nuMap = new Map((notifUsers ?? []).map((u: any) => [u.id, u]))
  const enrichedNotifs = (notifs ?? []).map((n: any) => ({
    ...n, tutorName: nuMap.get(n.user_id)?.name ?? 'Unknown'
  }))

  return {
    stats: { learners: learnerCount ?? 0, educators: educatorCount ?? 0, assignments: assignmentCount ?? 0, missed: missedCount ?? 0, tutorsActiveToday, tutorsAssignToday },
    tutorRows,
    notifs: enrichedNotifs,
  }
}

export default async function AdminDashboard() {
  const session = await getSession()
  const { stats, tutorRows, notifs } = await getData()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <>
      <Topbar user={session!} title="Dashboard"
              subtitle={`Good ${greeting}, ${session!.name.split(' ')[0]} · ${new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}`} />

      <div className="p-6 space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Learners"     value={stats.learners}          sub="All active"           icon={Users}         color="blue" />
          <StatCard label="Tutors"             value={stats.educators}         sub="Teaching staff"       icon={GraduationCap} color="amber" />
          <StatCard label="Assignments"        value={stats.assignments}       sub="All published"        icon={ClipboardList} color="purple" />
          <StatCard label="Missed Work"        value={stats.missed}            sub="Submissions missed"   icon={AlertTriangle} color="red" />
          <StatCard label="Active Today"       value={stats.tutorsActiveToday} sub="Tutors with lessons"  icon={BookOpen}      color="green" />
          <StatCard label="Assigned Today"     value={stats.tutorsAssignToday} sub="Set CBT / PDF"        icon={CheckCircle}   color="teal" />
        </div>

        {/* ── Submission notifications ── */}
        {notifs.length > 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50/60 flex items-center justify-between">
              <p className="text-[13px] font-bold text-emerald-800">🔔 Recent Submissions</p>
              <span className="text-[11.5px] text-emerald-600 font-medium bg-emerald-100 px-2.5 py-1 rounded-full">{notifs.length}</span>
            </div>
            <div className="divide-y divide-slate-50 max-h-[200px] overflow-y-auto">
              {notifs.map((n: any) => (
                <div key={n.id} className="px-6 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-slate-700 truncate">{n.message}</p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">Tutor: {n.tutorName}</p>
                  </div>
                  <span className="text-[10.5px] text-slate-400 whitespace-nowrap flex-shrink-0">
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tutor performance table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[14px] font-bold text-slate-900">Tutor Performance</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Attendance rate, lessons taught, and assignments set per tutor</p>
            </div>
            <Link href="/admin/educators"
              className="text-[12px] font-semibold text-amber-600 hover:text-amber-700 transition">
              Manage Tutors →
            </Link>
          </div>

          {tutorRows.length === 0 ? (
            <div className="py-16 text-center">
              <GraduationCap size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-[13px] text-slate-400 font-medium">No tutors yet</p>
              <p className="text-[12px] text-slate-300 mt-1">Add tutors and assign them classes to see performance here.</p>
              <Link href="/admin/educators"
                className="inline-block mt-4 px-4 py-2 bg-amber-500 text-white text-[12px] font-semibold rounded-xl hover:bg-amber-600 transition">
                Add First Tutor →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50">
                    {['Tutor','Classes','All Lessons','Today','Assignments','Today Assigned','Att. Rate','Action'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tutorRows.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">

                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
                            {t.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{t.name}</p>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">{t.specialization || t.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Classes */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700">{t.classes}</span>
                        <span className="text-slate-400 ml-1 text-[11px]">assigned</span>
                      </td>

                      {/* Total lessons */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700">{t.totalLessons}</span>
                      </td>

                      {/* Today lessons */}
                      <td className="px-5 py-4">
                        {t.todayLessons > 0
                          ? <Badge variant="success" className="font-semibold">{t.todayLessons}</Badge>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Total assignments */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-700">{t.totalAssign}</span>
                      </td>

                      {/* Today assignments — key alert column */}
                      <td className="px-5 py-4">
                        {t.todayAssign > 0 ? (
                          <Badge variant="success" className="font-semibold gap-1">
                            <CheckCircle size={10} /> {t.todayAssign} set
                          </Badge>
                        ) : t.todayLessons > 0 ? (
                          <Badge variant="warning" className="font-semibold">Not yet</Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Attendance rate */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5 min-w-[90px]">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: t.attRate + '%',
                                background: t.attRate >= 80 ? '#16a34a' : t.attRate >= 50 ? '#f59e0b' : '#dc2626'
                              }} />
                          </div>
                          <span className="text-[11.5px] font-bold w-10 flex-shrink-0"
                            style={{ color: t.attRate >= 80 ? '#16a34a' : t.attRate >= 50 ? '#f59e0b' : '#dc2626' }}>
                            {t.attRate}%
                          </span>
                        </div>
                      </td>

                      {/* View portal — anchor tag, opens new tab with token */}
                      <td className="px-5 py-4">
                        <a href={'/api/admin/impersonate-redirect?educator_id=' + t.id}
                           target="_blank" rel="noreferrer"
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 text-[11.5px] font-semibold rounded-lg transition-colors whitespace-nowrap">
                          <ExternalLink size={12} /> View Portal
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick access cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href:  '/admin/learners',
              icon:  '👤',
              label: 'Manage Learners',
              sub:   'View, add and assign learners to classes',
              color: '#3b82f6',
            },
            {
              href:  '/admin/educators',
              icon:  '🎓',
              label: 'Manage Tutors',
              sub:   'Assign classes, view portals and monitor activity',
              color: '#f59e0b',
            },
            {
              href:  '/admin/year-levels',
              icon:  '📚',
              label: 'Academic Setup',
              sub:   'Year levels, class arms, subjects, exam groups',
              color: '#8b5cf6',
            },
          ].map(({ href, icon, label, sub, color }) => (
            <Link key={href} href={href}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: color + '15' }}>
                  {icon}
                </div>
                <div>
                  <p className="text-[13.5px] font-bold text-slate-800 group-hover:text-amber-600 transition-colors leading-tight">{label}</p>
                  <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  )
}
