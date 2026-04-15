import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'super_admin', 'educator'])
    const educatorId = new URL(req.url).searchParams.get('educator_id')
    let q = supabaseAdmin.from('educator_classes')
      .select('id, educator_id, year_level_id, class_group_id, lesson_type, subject_id').order('created_at')
    if (educatorId) q = q.eq('educator_id', educatorId)
    const { data, error } = await q
    if (error) throw error

    const yearIds  = [...new Set((data ?? []).map((c: any) => c.year_level_id).filter(Boolean))]
    const groupIds = [...new Set((data ?? []).map((c: any) => c.class_group_id).filter(Boolean))]
    const subIds   = [...new Set((data ?? []).map((c: any) => c.subject_id).filter(Boolean))]
    const [yrRes, grRes, subRes] = await Promise.all([
      yearIds.length  ? supabaseAdmin.from('year_levels').select('id,name').in('id', yearIds)   : { data: [] },
      groupIds.length ? supabaseAdmin.from('class_groups').select('id,name').in('id', groupIds) : { data: [] },
      subIds.length   ? supabaseAdmin.from('subjects').select('id,name').in('id', subIds)       : { data: [] },
    ])
    const yMap = new Map((yrRes.data  ?? []).map((x: any) => [x.id, x]))
    const gMap = new Map((grRes.data  ?? []).map((x: any) => [x.id, x]))
    const sMap = new Map((subRes.data ?? []).map((x: any) => [x.id, x]))
    const enriched = (data ?? []).map((c: any) => ({
      ...c,
      year_levels:  yMap.get(c.year_level_id)  ?? null,
      class_groups: gMap.get(c.class_group_id) ?? null,
      subjects:     sMap.get(c.subject_id)     ?? null,
    }))
    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.educator_id || !body.year_level_id)
      return NextResponse.json({ error: 'educator_id and year_level_id required' }, { status: 400 })
    const { error } = await supabaseAdmin.from('educator_classes').insert({
      educator_id:    body.educator_id,
      year_level_id:  body.year_level_id,
      class_group_id: body.class_group_id || null,
      lesson_type:    body.lesson_type    || 'general',
      subject_id:     body.subject_id     || null,
    })
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'This class is already assigned to this tutor' }, { status: 409 })
      throw error
    }
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { error } = await supabaseAdmin.from('educator_classes').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
