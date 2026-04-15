import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  count?: number
  action?: { label: string; href?: string; onClick?: () => void }
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
  className?: string
}

export function PageHeader({ title, count, action, secondaryAction, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-5 flex-wrap gap-3', className)}>
      <div className="flex items-center gap-2.5">
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        {count !== undefined && (
          <span className="bg-amber-100 text-amber-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
            {count}
          </span>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {secondaryAction && (
            secondaryAction.href ? (
              <Button asChild variant="outline" size="sm">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
            )
          )}
          {action && (
            action.href ? (
              <Button asChild size="sm">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button size="sm" onClick={action.onClick}>{action.label}</Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
