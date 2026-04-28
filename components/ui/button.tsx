import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'bg-orange-600 text-white hover:bg-orange-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline:     'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        secondary:   'bg-slate-100 text-slate-700 hover:bg-slate-200',
        ghost:       'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        link:        'text-orange-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3.5',
        sm:      'h-7 px-2.5 text-[11.5px]',
        lg:      'h-9 px-5',
        icon:    'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'
export { Button, buttonVariants }
