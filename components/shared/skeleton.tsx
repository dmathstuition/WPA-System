export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className}`} />
}
export function SkeletonTopbar() {
  return (
    <div className="h-14 bg-white border-b border-slate-200/60 flex items-center justify-between px-6 animate-pulse">
      <div className="space-y-1.5"><div className="h-3.5 bg-slate-100 rounded w-28" /><div className="h-2.5 bg-slate-50 rounded w-40" /></div>
      <div className="flex items-center gap-2"><div className="w-7 h-7 bg-slate-100 rounded-lg" /><div className="w-7 h-7 bg-slate-100 rounded-full" /></div>
    </div>
  )
}
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200/60 p-4 animate-pulse">
          <div className="w-8 h-8 bg-slate-100 rounded-lg mb-3" />
          <div className="h-5 bg-slate-100 rounded w-10 mb-1.5" />
          <div className="h-2.5 bg-slate-50 rounded w-16" />
        </div>
      ))}
    </div>
  )
}
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 animate-pulse"><div className="h-3 bg-slate-100 rounded w-32" /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-slate-50 flex items-center gap-3 animate-pulse">
          <div className="w-7 h-7 bg-slate-100 rounded-full" />
          <div className="flex-1 h-2.5 bg-slate-100 rounded" />
          <div className="w-14 h-2.5 bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  )
}
