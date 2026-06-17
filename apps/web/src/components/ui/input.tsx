import React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  /** Render an icon/element at the start of the input */
  startAdornment?: React.ReactNode;
  /** Render an icon/element at the end of the input */
  endAdornment?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      startAdornment,
      endAdornment,
      id,
      className,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const descId = description ? `${inputId}-desc` : undefined;
    const errId = error ? `${inputId}-err` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {description && (
          <p id={descId} className="text-xs text-slate-500">
            {description}
          </p>
        )}

        <div className="relative flex items-center">
          {startAdornment && (
            <span className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {startAdornment}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-describedby={
              [descId, errId].filter(Boolean).join(' ') || undefined
            }
            aria-invalid={error ? true : undefined}
            className={cn(
              // Base
              'block w-full rounded-md border bg-white py-2 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'transition-colors duration-150',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
              // Error state
              error
                ? 'border-red-400 focus:ring-red-500'
                : 'border-slate-300 hover:border-slate-400',
              // Disabled state
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              // Padding adjustments for adornments
              startAdornment ? 'pl-9' : 'pl-3',
              endAdornment ? 'pr-9' : 'pr-3',
              className,
            )}
            {...props}
          />

          {endAdornment && (
            <span className="absolute right-3 flex items-center text-slate-400">
              {endAdornment}
            </span>
          )}
        </div>

        {error && (
          <p id={errId} className="flex items-center gap-1 text-xs text-red-600" role="alert">
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 4a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0V5zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
