import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    await requireRole(['admin','super_admin','educator'])
    const { data, error } = await supabaseAdmin.from('subjects').select('*').order('name')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('subjects').insert({ name: body.name.trim(), code: body.code?.trim() ?? null }).select().single()
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id, ...updates } = await req.json()
    const { data, error } = await supabaseAdmin.from('subjects').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id } = await req.json()
    const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

