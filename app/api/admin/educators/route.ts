import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'super_admin'])
    const search = new URL(req.url).searchParams.get('search') ?? ''

    const { data: educators, error } = await supabaseAdmin
      .from('educators').select('id, user_id, staff_id, specialization').order('created_at', { ascending: false })
    if (error) throw error

    const eduIds  = (educators ?? []).map((e: any) => e.id)
    const eduUids = (educators ?? []).map((e: any) => e.user_id).filter(Boolean)

    const [usersRes, classesRes] = await Promise.all([
      eduUids.length ? supabaseAdmin.from('users').select('id,name,email,phone,is_active').in('id', eduUids) : { data: [] },
      eduIds.length  ? supabaseAdmin.from('educator_classes').select('id,educator_id,year_level_id,class_group_id,lesson_type,subject_id').in('educator_id', eduIds) : { data: [] },
    ])

    const clsYearIds  = [...new Set((classesRes.data ?? []).map((c: any) => c.year_level_id).filter(Boolean))]
    const clsGroupIds = [...new Set((classesRes.data ?? []).map((c: any) => c.class_group_id).filter(Boolean))]
    const clsSubIds   = [...new Set((classesRes.data ?? []).map((c: any) => c.subject_id).filter(Boolean))]

    const [yrRes, grRes, subRes] = await Promise.all([
      clsYearIds.length  ? supabaseAdmin.from('year_levels').select('id,name').in('id', clsYearIds)   : { data: [] },
      clsGroupIds.length ? supabaseAdmin.from('class_groups').select('id,name').in('id', clsGroupIds) : { data: [] },
      clsSubIds.length   ? supabaseAdmin.from('subjects').select('id,name').in('id', clsSubIds)       : { data: [] },
    ])

    const uMap   = new Map((usersRes.data ?? []).map((u: any) => [u.id, u]))
    const yrMap  = new Map((yrRes.data    ?? []).map((x: any) => [x.id, x]))
    const grMap  = new Map((grRes.data    ?? []).map((x: any) => [x.id, x]))
    const subMap = new Map((subRes.data   ?? []).map((x: any) => [x.id, x]))

    const classMap = new Map<string, any[]>()
    for (const c of classesRes.data ?? []) {
      if (!classMap.has(c.educator_id)) classMap.set(c.educator_id, [])
      classMap.get(c.educator_id)!.push({
        ...c,
        year_levels:  yrMap.get(c.year_level_id)  ?? null,
        class_groups: grMap.get(c.class_group_id) ?? null,
        subjects:     subMap.get(c.subject_id)    ?? null,
      })
    }

    let rows = (educators ?? []).map((e: any) => ({
      ...e,
      users:           uMap.get(e.user_id) ?? null,
      educator_classes: classMap.get(e.id) ?? [],
    }))

    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter((r: any) =>
        r.users?.name?.toLowerCase().includes(s) ||
        r.users?.email?.toLowerCase().includes(s) ||
        r.staff_id?.toLowerCase().includes(s)
      )
    }
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.name || !body.email || !body.password)
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
    const hash = await bcrypt.hash(body.password, 12)
    const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({
      name: body.name, email: body.email.toLowerCase().trim(),
      password_hash: hash, role: 'educator', phone: body.phone || null,
    }).select('id').single()
    if (uErr) throw new Error(uErr.message)
    const { error: eErr } = await supabaseAdmin.from('educators').insert({
      user_id: user.id, staff_id: body.staff_id || null, specialization: body.specialization || null,
    })
    if (eErr) throw new Error(eErr.message)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { data: edu } = await supabaseAdmin.from('educators').select('user_id').eq('id', body.id).single()
    if (!edu) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const uUp: any = {}
    if (body.name)  uUp.name  = body.name
    if (body.phone !== undefined) uUp.phone = body.phone || null
    if (body.is_active !== undefined) uUp.is_active = body.is_active
    if (body.password) uUp.password_hash = await bcrypt.hash(body.password, 12)
    if (Object.keys(uUp).length) await supabaseAdmin.from('users').update(uUp).eq('id', edu.user_id)
    const eUp: any = {}
    if (body.staff_id !== undefined)       eUp.staff_id      = body.staff_id
    if (body.specialization !== undefined) eUp.specialization = body.specialization
    if (Object.keys(eUp).length) await supabaseAdmin.from('educators').update(eUp).eq('id', body.id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin']); const{id}=await req.json(); if(!id) return NextResponse.json({error:'ID required'},{status:400}); const{data:edu}=await supabaseAdmin.from('educators').select('user_id').eq('id',id).single(); if(!edu) return NextResponse.json({error:'Not found'},{status:404}); await supabaseAdmin.from('educator_classes').delete().eq('educator_id',id); await supabaseAdmin.from('educators').delete().eq('id',id); await supabaseAdmin.from('users').delete().eq('id',edu.user_id); return NextResponse.json({ok:true}) } catch(e:any){return NextResponse.json({error:e.message},{status:500})}
}
