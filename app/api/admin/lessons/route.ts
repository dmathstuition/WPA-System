import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'super_admin'])
    const params = new URL(req.url).searchParams
    let q = supabaseAdmin.from('lessons')
      .select('id,title,lesson_date,lesson_type,attendance_locked,status,notes,subject_id,year_level_id,class_group_id')
      .order('lesson_date', { ascending: false })
    const yearId = params.get('year_level_id')
    if (yearId) q = q.eq('year_level_id', yearId)
    const { data: lessons, error } = await q
    if (error) throw error
    if (!lessons?.length) return NextResponse.json([])

    const subIds  = [...new Set(lessons.map((l: any) => l.subject_id).filter(Boolean))]
    const yearIds = [...new Set(lessons.map((l: any) => l.year_level_id).filter(Boolean))]
    const grIds   = [...new Set(lessons.map((l: any) => l.class_group_id).filter(Boolean))]
    const lIds    = lessons.map((l: any) => l.id)

    const [subRes, yrRes, grRes, leRes] = await Promise.all([
      subIds.length  ? supabaseAdmin.from('subjects').select('id,name').in('id', subIds)     : { data: [] },
      yearIds.length ? supabaseAdmin.from('year_levels').select('id,name').in('id', yearIds) : { data: [] },
      grIds.length   ? supabaseAdmin.from('class_groups').select('id,name').in('id', grIds)  : { data: [] },
      supabaseAdmin.from('lesson_educators').select('lesson_id,educator_id,educators(user_id)').in('lesson_id', lIds),
    ])

    const eduUserIds = [...new Set((leRes.data ?? []).map((le: any) => (le.educators as any)?.user_id).filter(Boolean))]
    const { data: eduUsers } = eduUserIds.length
      ? await supabaseAdmin.from('users').select('id,name').in('id', eduUserIds)
      : { data: [] }

    const sMap   = new Map((subRes.data  ?? []).map((x: any) => [x.id, x]))
    const yMap   = new Map((yrRes.data   ?? []).map((x: any) => [x.id, x]))
    const gMap   = new Map((grRes.data   ?? []).map((x: any) => [x.id, x]))
    const euMap  = new Map((eduUsers     ?? []).map((u: any) => [u.id, u]))
    const leMap  = new Map<string, any>()
    for (const le of leRes.data ?? []) {
      const uname = euMap.get((le.educators as any)?.user_id)?.name ?? null
      leMap.set(le.lesson_id, { educator_id: le.educator_id, educator_name: uname })
    }

    const enriched = lessons.map((l: any) => ({
      ...l,
      subjects:    sMap.get(l.subject_id)    ?? null,
      year_levels: yMap.get(l.year_level_id) ?? null,
      class_groups:gMap.get(l.class_group_id)?? null,
      educator:    leMap.get(l.id)           ?? null,
    }))
    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin', 'educator'])
    const body = await req.json()
    if (body.action === 'lock') {
      await supabaseAdmin.from('lessons')
        .update({ attendance_locked: true, status: 'completed' })
        .eq('id', body.id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
