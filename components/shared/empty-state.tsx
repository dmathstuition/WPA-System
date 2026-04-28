export function EmptyState({ message = 'Nothing here yet.', icon, action }: {
  message?: string; icon?: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {icon && <div className="text-slate-300 mb-3">{icon}</div>}
      <p className="text-[13px] text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
