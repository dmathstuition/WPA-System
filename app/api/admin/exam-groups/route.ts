import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    await requireRole(['admin', 'super_admin', 'educator', 'learner'])
    const { data, error } = await supabaseAdmin
      .from('exam_groups').select('*').order('name')
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
    const { data, error } = await supabaseAdmin.from('exam_groups').insert({
      name: body.name.trim(), code: body.code?.trim() || null, description: body.description?.trim() || null,
    }).select().single()
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
    const { data, error } = await supabaseAdmin.from('exam_groups').update({
      name: updates.name, code: updates.code || null,
      description: updates.description || null, is_active: updates.is_active,
    }).eq('id', id).select().single()
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
    const { error } = await supabaseAdmin.from('exam_groups').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
