import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0c0f1a] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/20">
          <span className="text-3xl font-black text-white">404</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-[14px] leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/"
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[13px] rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition">
            Go Home
          </Link>
          <Link href="/login"
            className="px-6 py-2.5 border border-white/10 text-slate-300 font-semibold text-[13px] rounded-xl hover:bg-white/5 transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
