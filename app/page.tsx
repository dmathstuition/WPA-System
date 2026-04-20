import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const session = await getSession()
  if (session) {
    redirect(['admin','super_admin'].includes(session.role) ? '/admin/dashboard' : '/educator/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0c0f1a] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-[#0c0f1a]/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
            </div>
            <span className="text-[15px] font-black tracking-tight">Whyte Pyramid</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#features" className="text-[13px] text-slate-400 hover:text-white transition hidden sm:block">Features</Link>
            <Link href="#about" className="text-[13px] text-slate-400 hover:text-white transition hidden sm:block">About</Link>
            <Link href="/login" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[13px] font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-orange-500/8 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Powering Academic Excellence
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
            Whyte Pyramid
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Academy
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A modern academic portal for managing tutors, learners, lessons, attendance, and CBT assessments — all in one elegant platform.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link href="/login" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[14px] rounded-xl hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all">
              Access Portal →
            </Link>
            <Link href="#features" className="px-8 py-3.5 border border-white/10 text-slate-300 font-semibold text-[14px] rounded-xl hover:bg-white/5 transition">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: 'Year 2–11', label: 'Year Levels Supported' },
            { value: '1:1 & Group', label: 'Lesson Formats' },
            { value: 'CBT & PDF', label: 'Assessment Types' },
            { value: 'Real-time', label: 'Progress Tracking' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-[12px] text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold text-amber-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black">Everything Your Academy Needs</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">From managing learners to tracking tutor performance — built for how modern academies actually work.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '👤', title: 'Learner Management', desc: 'Register general and 1:1 private learners. Assign to year levels, class arms, and tutors.' },
              { icon: '🎓', title: 'Tutor Portal', desc: 'Each tutor sees their assigned classes, learners, and creates lessons from their dashboard.' },
              { icon: '📅', title: 'Lesson Scheduling', desc: 'Tutors create daily lessons for their assigned classes. Mark attendance with one tap.' },
              { icon: '📝', title: 'CBT Assessments', desc: 'Build multiple-choice tests with auto-scoring. Share via link — no learner login needed.' },
              { icon: '📊', title: 'Performance Analytics', desc: 'Admin dashboard tracks tutor attendance rates, assignment completion, and daily activity.' },
              { icon: '🔗', title: 'Shareable Links', desc: 'Every assignment gets a unique link. Learners submit via the link. Tutors get notified instantly.' },
              { icon: '📄', title: 'PDF Assignments', desc: 'Upload PDF worksheets as assignments. Learners download, complete, and confirm submission.' },
              { icon: '👁️', title: 'Admin Portal Access', desc: 'Admin can view any tutor\'s portal with one click — no password needed.' },
              { icon: '🏫', title: 'Multi-Class Support', desc: 'Tutors handle multiple classes across year levels. 1:1 tutors teach different subjects per learner.' },
            ].map(f => (
              <div key={f.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-amber-500/20 transition group">
                <div className="text-2xl mb-3">{f.icon}</div>
                <p className="text-[14px] font-bold text-white group-hover:text-amber-400 transition">{f.title}</p>
                <p className="text-[12.5px] text-slate-400 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[12px] font-bold text-amber-400 uppercase tracking-widest mb-3">About</p>
            <h2 className="text-3xl font-black leading-tight">Built for Modern<br/>Academic Excellence</h2>
            <p className="text-slate-400 mt-4 leading-relaxed">
              Whyte Pyramid Academy portal streamlines the entire academic workflow. Administrators manage learners and assign tutors. Tutors create lessons, mark attendance, and set assignments. Learners access CBT tests through shareable links — no separate login required.
            </p>
            <p className="text-slate-400 mt-3 leading-relaxed">
              Supporting both general classroom teaching and private one-to-one tuition, the platform adapts to how your academy works — not the other way around.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[13px] rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition">
              Get Started →
            </Link>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/10 rounded-3xl p-8 space-y-4">
            {[
              { step: '01', title: 'Admin Assigns', desc: 'Add learners, create tutors, assign classes and subjects' },
              { step: '02', title: 'Tutor Teaches', desc: 'Create lessons, mark attendance, set CBT or PDF assignments' },
              { step: '03', title: 'Learner Submits', desc: 'Access assignments via shareable link, complete and submit' },
              { step: '04', title: 'Track Progress', desc: 'Real-time analytics on attendance, scores, and completion rates' },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <span className="text-[13px] font-black text-amber-500 w-7 flex-shrink-0">{s.step}</span>
                <div>
                  <p className="text-[13px] font-bold text-white">{s.title}</p>
                  <p className="text-[11.5px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 14l9-5-9-5-9 5 9 5z"/></svg>
            </div>
            <span className="text-[12px] font-bold text-slate-500">Whyte Pyramid Academy</span>
          </div>
          <p className="text-[11px] text-slate-600">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
