import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:bg-[var(--brand-secondary)] shadow-sm',
        accent:
          'bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-hover)] shadow-sm',
        outline:
          'border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
        ghost:
          'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
        destructive:
          'bg-[var(--error)] text-white hover:opacity-90',
        link:
          'text-[var(--brand-accent)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    // Radix Slot (used when asChild) requires exactly one React element
    // child, via React.Children.only — it can't accept the loading
    // indicator as a sibling, so asChild bypasses it and just forwards
    // children untouched. (loading is meaningless combined with asChild
    // anyway, since there's no button element left to inject a spinner into.)
    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          disabled={disabled}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mr-1 flex gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
                style={{ animation: 'dots-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'
