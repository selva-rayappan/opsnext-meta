'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const requestSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

const confirmSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RequestFormValues = z.infer<typeof requestSchema>;
type ConfirmFormValues = z.infer<typeof confirmSchema>;

// ---------------------------------------------------------------------------
// Request form (step 1)
// ---------------------------------------------------------------------------
function RequestForm() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
  });

  async function onSubmit(values: RequestFormValues) {
    setApiError(null);
    try {
      await api.post('/api/v1/auth/password-reset/request', {
        email: values.email,
      });
      setSubmittedEmail(values.email);
      setSent(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      // Use a generic message to avoid email enumeration
      setApiError(
        typeof message === 'string'
          ? message
          : 'Something went wrong. Please try again.',
      );
    }
  }

  if (sent) {
    return (
      <div className="px-8 py-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Check your inbox</h2>
        <p className="mt-2 text-sm text-slate-500">
          We sent a password reset link to{' '}
          <span className="font-medium text-slate-700">{submittedEmail}</span>.
          The link expires in 1 hour.
        </p>
        <p className="mt-5 text-xs text-slate-400">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            className="text-primary-600 underline hover:text-primary-700"
            onClick={() => setSent(false)}
            type="button"
          >
            try again
          </button>
          .
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Reset your password
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {apiError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 4a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0V5zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          startAdornment={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm form (step 2 — arrived from email link with ?token=xxx)
// ---------------------------------------------------------------------------
function ConfirmForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
  });

  const passwordValue = watch('password', '');

  async function onSubmit(values: ConfirmFormValues) {
    setApiError(null);
    try {
      await api.post('/api/v1/auth/password-reset/confirm', {
        token,
        newPassword: values.password,
      });
      setDone(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      setApiError(
        typeof message === 'string'
          ? message
          : 'This reset link is invalid or has expired.',
      );
    }
  }

  if (done) {
    return (
      <div className="px-8 py-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Password updated
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your password has been reset successfully.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Sign in with new password
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Create new password
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Your new password must be at least 8 characters and include uppercase,
          number, and special character.
        </p>
      </div>

      {apiError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 4a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0V5zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-2">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            startAdornment={<Lock className="h-4 w-4" />}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Requirement checklist */}
          {passwordValue.length > 0 && (
            <ul className="space-y-1 pl-1">
              {[
                { test: passwordValue.length >= 8, label: 'At least 8 characters' },
                { test: /[A-Z]/.test(passwordValue), label: 'One uppercase letter' },
                { test: /[0-9]/.test(passwordValue), label: 'One number' },
                { test: /[^A-Za-z0-9]/.test(passwordValue), label: 'One special character' },
              ].map(({ test, label }) => (
                <li
                  key={label}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    test ? 'text-green-600' : 'text-slate-400',
                  )}
                >
                  <svg
                    className="h-3 w-3 shrink-0"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    {test ? (
                      <path d="M10.28 2.28L4.75 7.81 1.72 4.78a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l6-6a.75.75 0 0 0-1.06-1.06z" />
                    ) : (
                      <circle cx="6" cy="6" r="4" />
                    )}
                  </svg>
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Input
          label="Confirm password"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          startAdornment={<Lock className="h-4 w-4" />}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Reset password
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — decides which sub-form to render
// ---------------------------------------------------------------------------
export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <ConfirmForm token={token} />;
  }

  return <RequestForm />;
}
