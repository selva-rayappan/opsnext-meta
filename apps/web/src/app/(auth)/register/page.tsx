'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name is too long'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Password strength
// ---------------------------------------------------------------------------
function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Too weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-400' },
    { label: 'Fair', color: 'bg-yellow-400' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ];
  return { score, ...levels[score] };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 63);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const passwordValue = watch('password', '');
  const strength = getPasswordStrength(passwordValue);

  async function onSubmit(values: RegisterFormValues) {
    setApiError(null);
    try {
      await api.post('/api/v1/auth/register', {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        organizationName: values.organizationName,
        organizationSlug: slugify(values.organizationName),
      });
      // Auto-login after successful registration
      await login(values.email, values.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data;
      const raw = data?.message;
      const message = Array.isArray(raw) ? raw.join(', ') : raw;
      setApiError(message ?? 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Start your free OpsNext CRM workspace today.
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
        {/* Organization */}
        <Input
          label="Organization name"
          type="text"
          autoComplete="organization"
          placeholder="Acme Inc."
          startAdornment={<Building2 className="h-4 w-4" />}
          error={errors.organizationName?.message}
          {...register('organizationName')}
        />

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            type="text"
            autoComplete="given-name"
            placeholder="Jane"
            startAdornment={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            type="text"
            autoComplete="family-name"
            placeholder="Smith"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        {/* Email */}
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          startAdornment={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password + strength */}
        <div className="space-y-2">
          <Input
            label="Password"
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

          {/* Strength indicator */}
          {passwordValue.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i < strength.score
                        ? strength.color
                        : 'bg-slate-200',
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Password strength:{' '}
                <span
                  className={cn(
                    'font-medium',
                    strength.score <= 1 && 'text-red-600',
                    strength.score === 2 && 'text-yellow-600',
                    strength.score === 3 && 'text-blue-600',
                    strength.score === 4 && 'text-green-600',
                  )}
                >
                  {strength.label}
                </span>
              </p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Create account
        </Button>

        <p className="text-center text-xs text-slate-400">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-600">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
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
