import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'super_admin', 'educator'])
    const p            = new URL(req.url).searchParams
    const search       = p.get('search')         ?? ''
    const yearLevelId  = p.get('year_level_id')  ?? ''
    const classGroupId = p.get('class_group_id') ?? ''
    const lessonType   = p.get('lesson_type')    ?? ''

    // Fetch learners with plain columns only — no FK joins
    let q = supabaseAdmin
      .from('learners')
      .select('id, user_id, admission_number, date_of_birth, status, lesson_type, exam_group_id, tutor_id, year_level_id, class_group_id, subject_id')
      .order('created_at', { ascending: false })

    if (yearLevelId)  q = q.eq('year_level_id',  yearLevelId)
    if (classGroupId) q = q.eq('class_group_id', classGroupId)
    if (lessonType)   q = q.eq('lesson_type',    lessonType)

    const { data: learners, error } = await q
    if (error) throw new Error(error.message)
    if (!learners?.length) return NextResponse.json([])

    // Fetch related data separately
    const userIds  = [...new Set(learners.map((l: any) => l.user_id).filter(Boolean))]
    const yearIds  = [...new Set(learners.map((l: any) => l.year_level_id).filter(Boolean))]
    const groupIds = [...new Set(learners.map((l: any) => l.class_group_id).filter(Boolean))]
    const examIds  = [...new Set(learners.map((l: any) => l.exam_group_id).filter(Boolean))]
    const tutorIds = [...new Set(learners.map((l: any) => l.tutor_id).filter(Boolean))]

    const [usersRes, yearsRes, groupsRes, examsRes, tutorsRes] = await Promise.all([
      userIds.length  ? supabaseAdmin.from('users').select('id,name,email,phone,is_active').in('id', userIds)    : { data: [] },
      yearIds.length  ? supabaseAdmin.from('year_levels').select('id,name').in('id', yearIds)                    : { data: [] },
      groupIds.length ? supabaseAdmin.from('class_groups').select('id,name').in('id', groupIds)                  : { data: [] },
      examIds.length  ? supabaseAdmin.from('exam_groups').select('id,name,code').in('id', examIds)               : { data: [] },
      tutorIds.length ? supabaseAdmin.from('educators').select('id,user_id').in('id', tutorIds)                  : { data: [] },
    ])

    const tutorUserIds = (tutorsRes.data ?? []).map((t: any) => t.user_id).filter(Boolean)
    const { data: tutorUsers } = tutorUserIds.length
      ? await supabaseAdmin.from('users').select('id,name').in('id', tutorUserIds)
      : { data: [] }

    const uMap  = new Map((usersRes.data   ?? []).map((u: any) => [u.id, u]))
    const yMap  = new Map((yearsRes.data   ?? []).map((y: any) => [y.id, y]))
    const gMap  = new Map((groupsRes.data  ?? []).map((g: any) => [g.id, g]))
    const eMap  = new Map((examsRes.data   ?? []).map((e: any) => [e.id, e]))
    const tuMap = new Map((tutorUsers      ?? []).map((u: any) => [u.id, u]))
    const tidMap = new Map((tutorsRes.data ?? []).map((t: any) => [t.id, tuMap.get(t.user_id)?.name ?? null]))

    let rows = learners.map((l: any) => ({
      ...l,
      users:       uMap.get(l.user_id)       ?? null,
      year_levels: yMap.get(l.year_level_id) ?? null,
      class_groups:gMap.get(l.class_group_id)?? null,
      exam_groups: eMap.get(l.exam_group_id) ?? null,
      tutor_name:  tidMap.get(l.tutor_id)    ?? null,
    }))

    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter((l: any) =>
        l.users?.name?.toLowerCase().includes(s) ||
        l.users?.email?.toLowerCase().includes(s) ||
        l.admission_number?.toLowerCase().includes(s)
      )
    }
    return NextResponse.json(rows)
  } catch (e: any) {
    console.error('GET learners error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.name?.trim())  return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!body.email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    const isOTO = body.lesson_type === 'one_to_one'
    if (!isOTO && !body.year_level_id)  return NextResponse.json({ error: 'Year level required for general learners' }, { status: 400 })
    if (!isOTO && !body.class_group_id) return NextResponse.json({ error: 'Class group required for general learners' }, { status: 400 })
    if (isOTO  && !body.tutor_id)       return NextResponse.json({ error: 'Tutor required for 1:1 learners' }, { status: 400 })

    const hash = await bcrypt.hash(body.password || 'Password@123', 12)
    const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({
      name: body.name.trim(), email: body.email.toLowerCase().trim(),
      password_hash: hash, role: 'learner', phone: body.phone || null,
    }).select('id').single()
    if (uErr) throw new Error(uErr.message)

    const row: Record<string, any> = {
      user_id: user.id,
      year_level_id:    body.year_level_id   || null,
      class_group_id:   body.class_group_id  || null,
      admission_number: body.admission_number || null,
      date_of_birth:    body.date_of_birth   || null,
    }
    try { row.lesson_type  = isOTO ? 'one_to_one' : 'general' } catch {}
    if (body.exam_group_id) row.exam_group_id = body.exam_group_id
    if (body.tutor_id)      row.tutor_id      = body.tutor_id
    if (body.subject_id)    row.subject_id    = body.subject_id

    const { error: lErr } = await supabaseAdmin.from('learners').insert(row)
    if (lErr) {
      if (lErr.code === '42703') {
        delete row.lesson_type; delete row.exam_group_id; delete row.tutor_id
        const { error: r2 } = await supabaseAdmin.from('learners').insert(row)
        if (r2) throw new Error(r2.message)
      } else throw new Error(lErr.message)
    }
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.id || body.id === 'new')
      return NextResponse.json({ error: 'Valid learner ID required' }, { status: 400 })
    const { data: learner } = await supabaseAdmin.from('learners').select('user_id').eq('id', body.id).single()
    if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 })

    const uUp: Record<string, any> = {}
    if (body.name)                    uUp.name          = body.name
    if (body.phone !== undefined)     uUp.phone         = body.phone || null
    if (body.is_active !== undefined) uUp.is_active     = body.is_active
    if (body.password)                uUp.password_hash = await bcrypt.hash(body.password, 12)
    if (Object.keys(uUp).length) await supabaseAdmin.from('users').update(uUp).eq('id', learner.user_id)

    const lUp: Record<string, any> = {}
    if (body.year_level_id  !== undefined) lUp.year_level_id    = body.year_level_id  || null
    if (body.class_group_id !== undefined) lUp.class_group_id   = body.class_group_id || null
    if (body.admission_number !== undefined) lUp.admission_number = body.admission_number
    if (body.status)                       lUp.status           = body.status
    if (body.lesson_type)                  lUp.lesson_type      = body.lesson_type
    if (body.exam_group_id !== undefined)  lUp.exam_group_id    = body.exam_group_id  || null
    if (body.tutor_id !== undefined)       lUp.tutor_id         = body.tutor_id       || null
    if (body.subject_id !== undefined)     lUp.subject_id       = body.subject_id     || null
    if (Object.keys(lUp).length) await supabaseAdmin.from('learners').update(lUp).eq('id', body.id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try { await requireRole(['admin']); const{id}=await req.json(); if(!id) return NextResponse.json({error:'ID required'},{status:400}); const{data:l}=await supabaseAdmin.from('learners').select('user_id').eq('id',id).single(); if(!l) return NextResponse.json({error:'Not found'},{status:404}); await supabaseAdmin.from('learners').delete().eq('id',id); await supabaseAdmin.from('users').delete().eq('id',l.user_id); return NextResponse.json({ok:true}) } catch(e:any){return NextResponse.json({error:e.message},{status:500})}
}
