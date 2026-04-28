import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default:     'bg-slate-100 text-slate-600',
        success:     'bg-emerald-50 text-emerald-700',
        destructive: 'bg-red-50 text-red-700',
        warning:     'bg-amber-50 text-amber-700',
        info:        'bg-blue-50 text-blue-700',
        secondary:   'bg-slate-100 text-slate-500',
        purple:      'bg-violet-50 text-violet-700',
        teal:        'bg-teal-50 text-teal-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
