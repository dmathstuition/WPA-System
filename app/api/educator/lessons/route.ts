import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['educator', 'admin', 'super_admin'])
    const { data: edu } = await supabaseAdmin
      .from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json([])

    const { data: leRows } = await supabaseAdmin
      .from('lesson_educators').select('lesson_id').eq('educator_id', edu.id)
    const lessonIds = (leRows ?? []).map((r: any) => r.lesson_id)
    if (!lessonIds.length) return NextResponse.json([])

    const { data: lessons, error } = await supabaseAdmin
      .from('lessons')
      .select('id,title,lesson_date,lesson_type,attendance_locked,status,notes,subject_id,year_level_id,class_group_id')
      .in('id', lessonIds)
      .order('lesson_date', { ascending: false })
    if (error) throw error

    const subIds  = [...new Set((lessons ?? []).map((l: any) => l.subject_id).filter(Boolean))]
    const yearIds = [...new Set((lessons ?? []).map((l: any) => l.year_level_id).filter(Boolean))]
    const grIds   = [...new Set((lessons ?? []).map((l: any) => l.class_group_id).filter(Boolean))]

    const [sRes, yRes, gRes] = await Promise.all([
      subIds.length  ? supabaseAdmin.from('subjects').select('id,name').in('id', subIds)     : { data: [] },
      yearIds.length ? supabaseAdmin.from('year_levels').select('id,name').in('id', yearIds) : { data: [] },
      grIds.length   ? supabaseAdmin.from('class_groups').select('id,name').in('id', grIds)  : { data: [] },
    ])
    const sMap = new Map((sRes.data ?? []).map((x: any) => [x.id, x]))
    const yMap = new Map((yRes.data ?? []).map((x: any) => [x.id, x]))
    const gMap = new Map((gRes.data ?? []).map((x: any) => [x.id, x]))

    const enriched = (lessons ?? []).map((l: any) => ({
      ...l,
      subjects:    sMap.get(l.subject_id)    ?? null,
      year_levels: yMap.get(l.year_level_id) ?? null,
      class_groups:gMap.get(l.class_group_id)?? null,
    }))
    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['educator'])
    const body = await req.json()
    if (!body.title)       return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!body.subject_id)  return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!body.lesson_date) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

    const { data: edu } = await supabaseAdmin
      .from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json({ error: 'Educator not found' }, { status: 404 })

    const { data: lesson, error: lErr } = await supabaseAdmin.from('lessons').insert({
      title:                 body.title,
      lesson_date:           body.lesson_date,
      subject_id:            body.subject_id,
      lesson_type:           body.lesson_type      || 'general',
      year_level_id:         body.year_level_id     || null,
      class_group_id:        body.class_group_id    || null,
      one_to_one_learner_id: body.one_to_one_learner_id || null,
      notes:                 body.notes             || null,
      created_by:            session.id,
    }).select('id').single()
    if (lErr) throw new Error(lErr.message)

    await supabaseAdmin.from('lesson_educators').insert({ lesson_id: lesson.id, educator_id: edu.id })
    return NextResponse.json({ ok: true, id: lesson.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
