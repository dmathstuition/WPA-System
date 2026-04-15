import { FileQuestion } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  icon?: React.ReactNode
}

export function EmptyState({ message = 'No records found.', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
        {icon ?? <FileQuestion size={20} />}
      </div>
      <p className="text-[12.5px] text-slate-400 font-medium">{message}</p>
    </div>
  )
}
