const fs = require('fs')
const path = require('path')
function w(p,c){const d=path.dirname(p);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(p,c,'utf8');console.log('  ✓',p)}

// Rewrite the learners GET API to properly join users, year_levels, class_groups
w('app/api/admin/learners/route.ts', `import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'super_admin'])
    const url = new URL(req.url)
    const search = url.searchParams.get('search') ?? ''
    const yearLevelId = url.searchParams.get('year_level_id')
    const classGroupId = url.searchParams.get('class_group_id')

    let q = supabaseAdmin.from('learners')
      .select('id, user_id, admission_number, lesson_type, status, year_level_id, class_group_id, tutor_id, subject_id')
      .order('created_at', { ascending: false })

    if (yearLevelId) q = q.eq('year_level_id', yearLevelId)
    if (classGroupId) q = q.eq('class_group_id', classGroupId)

    const { data: learners, error } = await q
    if (error) throw error

    const rows = learners ?? []
    if (!rows.length) return NextResponse.json([])

    // Resolve user names
    const uids = [...new Set(rows.map(l => l.user_id).filter(Boolean))]
    const { data: users } = uids.length
      ? await supabaseAdmin.from('users').select('id, name, email').in('id', uids)
      : { data: [] }
    const uMap = new Map((users ?? []).map((u: any) => [u.id, u]))

    // Resolve year levels
    const yids = [...new Set(rows.map(l => l.year_level_id).filter(Boolean))]
    const { data: years } = yids.length
      ? await supabaseAdmin.from('year_levels').select('id, name').in('id', yids)
      : { data: [] }
    const yMap = new Map((years ?? []).map((y: any) => [y.id, y.name]))

    // Resolve class groups
    const gids = [...new Set(rows.map(l => l.class_group_id).filter(Boolean))]
    const { data: groups } = gids.length
      ? await supabaseAdmin.from('class_groups').select('id, name').in('id', gids)
      : { data: [] }
    const gMap = new Map((groups ?? []).map((g: any) => [g.id, g.name]))

    // Enrich
    let enriched = rows.map((l: any) => {
      const user = uMap.get(l.user_id)
      return {
        ...l,
        name: user?.name ?? '—',
        email: user?.email ?? '',
        year_name: yMap.get(l.year_level_id) ?? '—',
        group_name: gMap.get(l.class_group_id) ?? '—',
      }
    })

    // Search filter (server-side)
    if (search) {
      const s = search.toLowerCase()
      enriched = enriched.filter((r: any) =>
        r.name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.admission_number ?? '').toLowerCase().includes(s)
      )
    }

    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const email = body.email || (body.admission_number ?? 'learner-' + Date.now()) + '@learner.whytepyramid.com'
    const hash = await bcrypt.hash(body.password || 'Password@123', 12)

    const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({
      name: body.name, email, password_hash: hash, role: 'learner', is_active: true
    }).select('id').single()
    if (uErr) {
      if (uErr.code === '23505') return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      throw uErr
    }

    const { error: lErr } = await supabaseAdmin.from('learners').insert({
      user_id: user.id,
      admission_number: body.admission_number || null,
      year_level_id: body.year_level_id || null,
      class_group_id: body.class_group_id || null,
      lesson_type: body.lesson_type || 'general',
      tutor_id: body.tutor_id || null,
      subject_id: body.subject_id || null,
      status: 'active',
    })
    if (lErr) throw lErr

    return NextResponse.json({ ok: true, id: user.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const body = await req.json()

    // Bulk class update
    if (body.action === 'update_class') {
      const update: any = { year_level_id: body.year_level_id }
      if (body.class_group_id) update.class_group_id = body.class_group_id
      await supabaseAdmin.from('learners').update(update).eq('id', body.id)
      return NextResponse.json({ ok: true })
    }

    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Get learner
    const { data: learner } = await supabaseAdmin.from('learners').select('user_id').eq('id', body.id).single()
    if (!learner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Update user fields
    const userUpdate: any = {}
    if (body.name) userUpdate.name = body.name
    if (body.email) userUpdate.email = body.email
    if (Object.keys(userUpdate).length) {
      await supabaseAdmin.from('users').update(userUpdate).eq('id', learner.user_id)
    }

    // Update learner fields
    const learnerUpdate: any = {}
    if (body.year_level_id !== undefined) learnerUpdate.year_level_id = body.year_level_id || null
    if (body.class_group_id !== undefined) learnerUpdate.class_group_id = body.class_group_id || null
    if (body.lesson_type !== undefined) learnerUpdate.lesson_type = body.lesson_type
    if (body.tutor_id !== undefined) learnerUpdate.tutor_id = body.tutor_id || null
    if (body.subject_id !== undefined) learnerUpdate.subject_id = body.subject_id || null
    if (body.admission_number !== undefined) learnerUpdate.admission_number = body.admission_number || null
    if (body.status !== undefined) learnerUpdate.status = body.status
    if (Object.keys(learnerUpdate).length) {
      await supabaseAdmin.from('learners').update(learnerUpdate).eq('id', body.id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin'])
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { data: learner } = await supabaseAdmin.from('learners').select('user_id').eq('id', id).single()
    if (!learner) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await supabaseAdmin.from('learners').delete().eq('id', id)
    await supabaseAdmin.from('users').delete().eq('id', learner.user_id)
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
`)

console.log('\nDone. The API now joins users, year_levels, and class_groups.')
console.log('Each learner row returns: name, email, year_name, group_name')
console.log('')
console.log('Run:')
console.log('  git add -A')
console.log('  git commit -m "Fix learners API: join user/year/group names"')
console.log('  git push')