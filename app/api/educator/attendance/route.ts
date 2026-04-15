import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['educator', 'admin', 'super_admin'])
    const lessonId = new URL(req.url).searchParams.get('lesson_id')
    if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

    const { data: lesson, error: lErr } = await supabaseAdmin
      .from('lessons')
      .select('id, year_level_id, class_group_id, lesson_type, one_to_one_learner_id, attendance_locked, created_by')
      .eq('id', lessonId).single()

    if (lErr || !lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

    let learnerRows: any[] = []

    if (lesson.lesson_type === 'one_to_one') {
      if (lesson.one_to_one_learner_id) {
        // Single specific learner
        const { data } = await supabaseAdmin.from('learners')
          .select('id, user_id, admission_number')
          .eq('id', lesson.one_to_one_learner_id)
          .eq('status', 'active')
        learnerRows = data ?? []
      } else {
        // 1:1 lesson but no specific learner set — find tutor's 1:1 learners
        const { data: edu } = await supabaseAdmin.from('educators')
          .select('id').eq('user_id', lesson.created_by).maybeSingle()
        if (edu) {
          const { data } = await supabaseAdmin.from('learners')
            .select('id, user_id, admission_number')
            .eq('tutor_id', edu.id)
            .eq('lesson_type', 'one_to_one')
            .eq('status', 'active')
          learnerRows = data ?? []
        }
      }
    } else {
      // General class — filter by year + arm
      let q = supabaseAdmin.from('learners')
        .select('id, user_id, admission_number')
        .eq('status', 'active')
      if (lesson.year_level_id)  q = q.eq('year_level_id',  lesson.year_level_id)
      if (lesson.class_group_id) q = q.eq('class_group_id', lesson.class_group_id)
      const { data } = await q
      learnerRows = data ?? []
    }

    // No learners — return empty but valid shape
    if (!learnerRows.length) {
      return NextResponse.json({ lesson, records: [] })
    }

    // Get user names
    const uids = learnerRows.map((l: any) => l.user_id).filter(Boolean)
    const { data: users } = uids.length
      ? await supabaseAdmin.from('users').select('id, name, email').in('id', uids)
      : { data: [] }
    const uMap = new Map((users ?? []).map((u: any) => [u.id, u]))

    // Get existing attendance records
    const lids = learnerRows.map((l: any) => l.id)
    const { data: existing } = await supabaseAdmin.from('attendances')
      .select('learner_id, status')
      .eq('lesson_id', lessonId)
      .in('learner_id', lids)
    const attMap = new Map((existing ?? []).map((a: any) => [a.learner_id, a.status]))

    const records = learnerRows.map((l: any) => ({
      learner_id:       l.id,
      name:             uMap.get(l.user_id)?.name  ?? '—',
      email:            uMap.get(l.user_id)?.email ?? '',
      admission_number: l.admission_number ?? '',
      status:           attMap.get(l.id) ?? 'absent',
    }))

    return NextResponse.json({ lesson, records })
  } catch (e: any) {
    console.error('Attendance GET error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['educator', 'admin', 'super_admin'])
    const body = await req.json()
    const { lesson_id, records, lock } = body

    if (!lesson_id)            return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    if (!Array.isArray(records)) return NextResponse.json({ error: 'records must be an array' }, { status: 400 })

    // Upsert each attendance record
    for (const r of records) {
      if (!r.learner_id) continue
      await supabaseAdmin.from('attendances').upsert({
        lesson_id,
        learner_id: r.learner_id,
        status:     r.status ?? 'absent',
        marked_at:  new Date().toISOString(),
        marked_by:  session.id,
      }, { onConflict: 'lesson_id,learner_id' })
    }

    if (lock) {
      await supabaseAdmin.from('lessons')
        .update({ attendance_locked: true, status: 'completed' })
        .eq('id', lesson_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Attendance POST error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
