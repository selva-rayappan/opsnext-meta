import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------
const variantClasses = {
  default:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-600 disabled:bg-primary-300',
  destructive:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 disabled:bg-red-300',
  outline:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-primary-600 disabled:text-slate-400 disabled:border-slate-200',
  ghost:
    'text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-primary-600 disabled:text-slate-400',
  link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-600 disabled:text-slate-400',
} as const;

const sizeClasses = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:cursor-not-allowed',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2
            className={cn(
              'shrink-0 animate-spin',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            )}
            aria-hidden="true"
          />
        ) : (
          leftIcon && (
            <span
              className={cn(
                'shrink-0',
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )
        )}
        {children}
        {!loading && rightIcon && (
          <span
            className={cn(
              'shrink-0',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            )}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
