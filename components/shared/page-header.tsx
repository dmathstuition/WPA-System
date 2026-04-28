import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function PageHeader({ title, count, action, secondaryAction }: {
  title: string; count?: number
  action?: { label: string; href?: string; onClick?: () => void }
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {count !== undefined && <span className="text-[12px] text-slate-400 tabular-nums">{count}</span>}
      </div>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {secondaryAction && (
            secondaryAction.href
              ? <Button asChild variant="outline" size="sm"><Link href={secondaryAction.href}>{secondaryAction.label}</Link></Button>
              : <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
          )}
          {action && (
            action.href
              ? <Button asChild size="sm"><Link href={action.href}>{action.label}</Link></Button>
              : <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
