import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin','super_admin','educator'])
    const yearId = req.nextUrl.searchParams.get('year_level_id') || req.nextUrl.searchParams.get('year')
    let q = supabaseAdmin.from('class_groups').select('*, year_levels(name)').order('name')
    if (yearId) q = q.eq('year_level_id', yearId)
    const { data, error } = await q
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.name?.trim() || !body.year_level_id) return NextResponse.json({ error: 'Name and Year Level are required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('class_groups').insert({ name: body.name.trim(), year_level_id: body.year_level_id }).select().single()
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id, ...updates } = await req.json()
    const { data, error } = await supabaseAdmin.from('class_groups').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id } = await req.json()
    const { error } = await supabaseAdmin.from('class_groups').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

