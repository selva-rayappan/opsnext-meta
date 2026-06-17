'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle, Trash2, TestTube2 } from 'lucide-react';
import {
  getEmailIntegration,
  upsertEmailIntegration,
  deleteEmailIntegration,
  testEmailIntegration,
} from '@/lib/email-api';
import type { UpsertEmailIntegrationDto } from '@/lib/email-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const emailIntegrationSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().min(1, 'SMTP user is required'),
  smtpPass: z.string().optional(),
  smtpFromName: z.string().min(1, 'From name is required'),
  smtpFromEmail: z.string().email('Enter a valid email address'),
  smtpSecure: z.boolean(),
  imapEnabled: z.boolean(),
  imapHost: z.string().optional(),
  imapPort: z.union([z.coerce.number().int().min(1).max(65535), z.literal('')]).optional(),
  imapUser: z.string().optional(),
  imapPass: z.string().optional(),
});

type FormValues = z.infer<typeof emailIntegrationSchema>;

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EmailIntegrationPage() {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: integration, isLoading } = useQuery({
    queryKey: ['email-integration'],
    queryFn: getEmailIntegration,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(emailIntegrationSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpFromName: '',
      smtpFromEmail: '',
      smtpSecure: false,
      imapEnabled: false,
      imapHost: '',
      imapPort: '' as '',
      imapUser: '',
      imapPass: '',
    },
  });

  const imapEnabled = watch('imapEnabled');

  // Pre-fill form when integration loads
  useEffect(() => {
    if (integration) {
      reset({
        smtpHost: integration.smtpHost,
        smtpPort: integration.smtpPort,
        smtpUser: integration.smtpUser,
        smtpPass: '', // never pre-fill password
        smtpFromName: integration.smtpFromName,
        smtpFromEmail: integration.smtpFromEmail,
        smtpSecure: integration.smtpSecure,
        imapEnabled: integration.imapEnabled,
        imapHost: integration.imapHost ?? '',
        imapPort: integration.imapPort ?? ('' as ''),
        imapUser: integration.imapUser ?? '',
        imapPass: '',
      });
    }
  }, [integration, reset]);

  const saveMutation = useMutation({
    mutationFn: (dto: UpsertEmailIntegrationDto) => upsertEmailIntegration(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-integration'] });
      setSaveSuccess(true);
      setApiError(null);
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to save email integration.');
      setSaveSuccess(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-integration'] });
      setShowDeleteConfirm(false);
      reset();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to delete integration.');
    },
  });

  function buildDto(values: FormValues): UpsertEmailIntegrationDto {
    const dto: UpsertEmailIntegrationDto = {
      smtpHost: values.smtpHost,
      smtpPort: Number(values.smtpPort),
      smtpUser: values.smtpUser,
      smtpFromName: values.smtpFromName,
      smtpFromEmail: values.smtpFromEmail,
      smtpSecure: values.smtpSecure,
      imapEnabled: values.imapEnabled,
    };
    if (values.smtpPass) dto.smtpPass = values.smtpPass;
    if (values.imapEnabled) {
      if (values.imapHost) dto.imapHost = values.imapHost;
      if (values.imapPort !== '' && values.imapPort !== undefined) {
        dto.imapPort = Number(values.imapPort);
      }
      if (values.imapUser) dto.imapUser = values.imapUser;
      if (values.imapPass) dto.imapPass = values.imapPass;
    }
    return dto;
  }

  async function onSubmit(values: FormValues) {
    setApiError(null);
    setSaveSuccess(false);
    await saveMutation.mutateAsync(buildDto(values));
  }

  async function handleTest() {
    setTestResult(null);
    setTestLoading(true);
    try {
      const values = getValues();
      const result = await testEmailIntegration(buildDto(values));
      setTestResult(result);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setTestResult({ success: false, error: typeof message === 'string' ? message : 'Connection test failed.' });
    } finally {
      setTestLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Email Integration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your email server to send emails directly from the CRM.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-8">
        {/* Global errors/success */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}
        {saveSuccess && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Email integration saved successfully.</span>
          </div>
        )}
        {testResult && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
              testResult.success
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {testResult.success
                ? 'Connection successful! Your SMTP settings are working.'
                : testResult.error ?? 'Connection test failed.'}
            </span>
          </div>
        )}

        {/* SMTP Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="SMTP Settings"
            description="Outgoing mail server configuration for sending emails."
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="SMTP Host"
                placeholder="smtp.example.com"
                required
                error={errors.smtpHost?.message}
                {...register('smtpHost')}
              />
              <Input
                label="SMTP Port"
                type="number"
                placeholder="587"
                required
                error={errors.smtpPort?.message}
                {...register('smtpPort')}
              />
            </div>
            <Input
              label="SMTP Username"
              placeholder="you@example.com"
              required
              error={errors.smtpUser?.message}
              {...register('smtpUser')}
            />
            <Input
              label="SMTP Password"
              type="password"
              placeholder="••••••••"
              error={errors.smtpPass?.message}
              {...register('smtpPass')}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="From Name"
                placeholder="Acme Corp CRM"
                required
                error={errors.smtpFromName?.message}
                {...register('smtpFromName')}
              />
              <Input
                label="From Email"
                type="email"
                placeholder="crm@example.com"
                required
                error={errors.smtpFromEmail?.message}
                {...register('smtpFromEmail')}
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                {...register('smtpSecure')}
              />
              <span>
                Use SSL/TLS (smtpSecure) —{' '}
                <span className="text-slate-400">enable for port 465; leave off for STARTTLS (587)</span>
              </span>
            </label>
          </div>
        </div>

        {/* IMAP Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="IMAP Settings"
            description="Incoming mail server configuration for syncing received emails."
          />
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
                {...register('imapEnabled')}
              />
              Enable IMAP sync
            </label>

            {imapEnabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="IMAP Host"
                    placeholder="imap.example.com"
                    error={errors.imapHost?.message}
                    {...register('imapHost')}
                  />
                  <Input
                    label="IMAP Port"
                    type="number"
                    placeholder="993"
                    error={errors.imapPort?.message}
                    {...register('imapPort')}
                  />
                </div>
                <Input
                  label="IMAP Username"
                  placeholder="you@example.com"
                  error={errors.imapUser?.message}
                  {...register('imapUser')}
                />
                <Input
                  label="IMAP Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.imapPass?.message}
                  {...register('imapPass')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              leftIcon={<TestTube2 />}
              loading={testLoading}
              disabled={testLoading || isSubmitting}
              onClick={handleTest}
            >
              Test Connection
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting || testLoading}>
              Save
            </Button>
          </div>

          {integration && !showDeleteConfirm && (
            <Button
              type="button"
              variant="outline"
              leftIcon={<Trash2 />}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Integration
            </Button>
          )}

          {integration && showDeleteConfirm && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
              <span className="text-sm text-red-700">Are you sure? This cannot be undone.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                loading={deleteMutation.isPending}
                disabled={deleteMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => deleteMutation.mutate()}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
