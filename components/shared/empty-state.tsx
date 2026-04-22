import { FileQuestion } from 'lucide-react'

interface EmptyStateProps { message?: string; icon?: React.ReactNode; action?: React.ReactNode }

export function EmptyState({ message = 'No records found.', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
        {icon ?? <FileQuestion size={24} />}
      </div>
      <p className="text-[13px] text-slate-400 font-medium max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
