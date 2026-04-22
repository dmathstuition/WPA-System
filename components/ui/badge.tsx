import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold transition-all duration-150',
  {
    variants: {
      variant: {
        default:     'bg-primary/10 text-primary',
        success:     'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
        destructive: 'bg-red-50 text-red-700 border border-red-200/60',
        warning:     'bg-amber-50 text-amber-700 border border-amber-200/60',
        info:        'bg-blue-50 text-blue-700 border border-blue-200/60',
        secondary:   'bg-slate-100 text-slate-600',
        purple:      'bg-purple-50 text-purple-700 border border-purple-200/60',
        teal:        'bg-teal-50 text-teal-700 border border-teal-200/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
