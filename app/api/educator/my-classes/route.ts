import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['educator', 'admin', 'super_admin'])
    const { data: edu } = await supabaseAdmin
      .from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json([])

    const { data: classes } = await supabaseAdmin
      .from('educator_classes')
      .select('id, educator_id, year_level_id, class_group_id, lesson_type, subject_id')
      .eq('educator_id', edu.id)
    if (!classes?.length) return NextResponse.json([])

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

    const enriched = classes.map((c: any) => ({
      ...c,
      year_name:    yMap.get(c.year_level_id)?.name  ?? '—',
      group_name:   gMap.get(c.class_group_id)?.name ?? null,
      subject_name: sMap.get(c.subject_id)?.name     ?? null,
      year_levels:  yMap.get(c.year_level_id)        ?? null,
      class_groups: gMap.get(c.class_group_id)       ?? null,
    }))
    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
