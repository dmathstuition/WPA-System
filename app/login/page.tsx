'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  )
}

const FEATURES = [
  { icon: '📚', title: 'Lesson Calendar',     desc: 'Schedule unlimited sessions per day, per teacher' },
  { icon: '📝', title: 'CBT Assignments',     desc: 'Auto-scored tests with instant results and grades' },
  { icon: '📊', title: 'Progress Analytics',  desc: 'Academy-wide attendance and performance tracking' },
  { icon: '🎯', title: 'Exam Preparation',    desc: 'SATs, GCSE, A-Level tracking built in from day one' },
  { icon: '👤', title: '1:1 Private Tuition', desc: 'Dedicated tutor assignment with exam group support' },
  { icon: '🏫', title: 'Multi-Year Support',  desc: 'Year 2 through Year 11 with subject specialisation' },
]

const ROLES = [
  { label: 'Super Admin', color: '#f59e0b', desc: 'Full academy oversight' },
  { label: 'Admin',       color: '#3b82f6', desc: 'Manage people & lessons' },
  { label: 'Educator',    color: '#10b981', desc: 'Teach, mark & assess' },
  { label: 'Learner',     color: '#8b5cf6', desc: 'Learn & complete tests' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]    = useState('')
  const [password,   setPassword] = useState('')
  const [showPass,   setShowPass] = useState(false)
  const [remember,   setRemember] = useState(false)
  const [error,      setError]    = useState('')
  const [loading,    setLoading]  = useState(false)
  const [attempts,   setAttempts] = useState(0)
  const [lockedOut,  setLockedOut] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('wpa_remember_email')
    if (saved) { setEmail(saved); setRemember(true) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || lockedOut) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (res.status === 429) { setLockedOut(true); setError(data.error); setLoading(false); return }
      if (!res.ok) {
        const next = attempts + 1
        setAttempts(next)
        if (next >= 5) setLockedOut(true)
        setError(data.error ?? 'Invalid email or password')
        setLoading(false)
        return
      }
      if (remember) localStorage.setItem('wpa_remember_email', email.trim())
      else          localStorage.removeItem('wpa_remember_email')
      const dest: Record<string, string> = {
        super_admin: '/super-admin/dashboard',
        admin:       '/admin/dashboard',
        educator:    '/educator/dashboard',
        learner:     '/learner/dashboard',
      }
      router.push(dest[data.role] ?? '/admin/dashboard')
    } catch {
      setError('Connection error. Please check your internet and try again.')
      setLoading(false)
    }
  }

  const attemptsLeft = Math.max(0, 5 - attempts)

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)' }}>

      {/* ── Left panel — features, hidden on mobile ── */}
      <div className="hidden lg:flex w-[520px] flex-col justify-between p-12 border-r border-white/5 relative overflow-hidden flex-shrink-0">
        {/* Dot grid background */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-[15px] leading-none">Whyte Pyramid</p>
              <p className="text-amber-500 text-[11px] font-medium mt-0.5">Academy Portal</p>
            </div>
          </div>

          <h2 className="text-[28px] font-black text-white leading-tight mb-3">
            Everything your academy needs,<br />
            <span style={{ color: '#f59e0b' }}>in one place.</span>
          </h2>
          <p className="text-slate-400 text-[13px] leading-relaxed mb-8">
            A purpose-built portal for learners, educators, and administrators. Manage lessons, track attendance, run CBT tests, and monitor progress — all from one dashboard.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/8 transition">
                <span className="text-lg">{icon}</span>
                <p className="text-white text-[11.5px] font-bold mt-1.5">{title}</p>
                <p className="text-slate-500 text-[10.5px] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="relative z-10 mt-8">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-2">Portal access for</p>
          <div className="flex gap-2 flex-wrap">
            {ROLES.map(({ label, color, desc }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[10.5px] text-slate-300 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-amber-500/30"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
          </div>
          <p className="text-white font-black text-lg">Whyte Pyramid Academy</p>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h1 className="text-[26px] font-black text-white leading-tight">Welcome back</h1>
            <p className="text-slate-400 text-[13px] mt-1">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border px-4 py-3 flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="text-[12.5px] text-red-300 font-medium">{error}</p>
                {attempts >= 3 && !lockedOut && (
                  <p className="text-[11px] text-red-400/60 mt-0.5">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left before lockout.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Email address
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <input type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={lockedOut || loading}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 transition focus:outline-none disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor  = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={lockedOut || loading}
                  className="w-full rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-600 transition focus:outline-none disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.target.style.borderColor  = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition">
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500" />
                <span className="text-[12px] text-slate-400">Remember me</span>
              </label>
              <span className="text-[11px] text-slate-600">Session: 8 hours</span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || lockedOut}
              className="w-full py-3 rounded-xl text-[13.5px] font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ background: lockedOut ? '#334155' : 'linear-gradient(135deg,#f59e0b,#ea580c)', boxShadow: lockedOut ? 'none' : '0 4px 24px rgba(245,158,11,0.3)' }}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </>
              ) : lockedOut ? 'Account locked — wait 30 minutes' : 'Sign in'}
            </button>
          </form>

          {/* Security badges */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { icon: '🔒', text: 'AES-256 encrypted' },
                { icon: '🛡️', text: 'Brute-force protected' },
                { icon: '⏱️', text: '8hr auto logout' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <span className="text-[11px]">{icon}</span>
                  <span className="text-[10.5px] text-slate-600">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-700 mt-4">
            © {new Date().getFullYear()} Whyte Pyramid Academy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
