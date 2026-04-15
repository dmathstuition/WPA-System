import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    await requireRole(['admin', 'super_admin'])
    const { data, error } = await supabaseAdmin
      .from('year_levels')
      .select('*, exam_groups(id, name, code)')
      .order('sort_order')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('year_levels').insert({
      name: body.name.trim(),
      sort_order: body.sort_order ?? 0,
      is_private: body.is_private ?? false,
      exam_group_id: body.exam_group_id || null,
    }).select('*, exam_groups(id, name, code)').single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('year_levels').update({
      name: updates.name,
      sort_order: updates.sort_order,
      is_private: updates.is_private,
      is_active: updates.is_active,
      exam_group_id: updates.exam_group_id || null,
    }).eq('id', id).select('*, exam_groups(id, name, code)').single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id } = await req.json()
    const { error } = await supabaseAdmin.from('year_levels').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
