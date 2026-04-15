import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    // Rate limiting — max 5 attempts per 15 min
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: attempts } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase().trim())
      .eq('success', false)
      .gte('created_at', cutoff)

    if ((attempts ?? 0) >= 5)
      return NextResponse.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 })

    // Find user — explicitly select password_hash
    const { data: user, error: uErr } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password_hash, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (uErr || !user) {
      await supabaseAdmin.from('login_attempts').insert({ email: email.toLowerCase().trim(), ip, success: false })
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.is_active)
      return NextResponse.json({ error: 'Account is inactive. Contact admin.' }, { status: 403 })

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      await supabaseAdmin.from('login_attempts').insert({ email: user.email, ip, success: false })
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Success — log it
    await supabaseAdmin.from('login_attempts').insert({ email: user.email, ip, success: true })

    const session = { id: user.id, name: user.name, email: user.email, role: user.role }
    const jwt     = await signToken(session)

    const res = NextResponse.json({ ok: true, user: session })
    res.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 8, // 8 hours
      path:     '/',
    })
    return res
  } catch (e: any) {
    console.error('Login error:', e.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
