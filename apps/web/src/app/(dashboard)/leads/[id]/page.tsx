'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  X,
  AlertTriangle,
  Clock,
  Building2,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { getLead, updateLead, changeLeadStatus, convertLead } from '@/lib/leads-api';
import type { Lead, LeadStatus, ConvertLeadDto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 ring-blue-200',
  CONTACTED: 'bg-amber-50 text-amber-700 ring-amber-200',
  QUALIFIED: 'bg-green-50 text-green-700 ring-green-200',
  UNQUALIFIED: 'bg-slate-100 text-slate-500 ring-slate-200',
  CONVERTED: 'bg-purple-50 text-purple-700 ring-purple-200',
};

const STATUS_DOT: Record<LeadStatus, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-amber-500',
  QUALIFIED: 'bg-green-500',
  UNQUALIFIED: 'bg-slate-400',
  CONVERTED: 'bg-purple-500',
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])}
        aria-hidden="true"
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Score pill
// ---------------------------------------------------------------------------
function ScorePill({ score }: { score: number }) {
  const colorClass =
    score >= 70
      ? 'bg-green-50 text-green-700 ring-green-200'
      : score >= 40
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-red-50 text-red-700 ring-red-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset',
        colorClass,
      )}
    >
      {score} / 100
    </span>
  );
}

// ---------------------------------------------------------------------------
// Edit lead modal
// ---------------------------------------------------------------------------
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function EditLeadModal({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      company: lead.company ?? '',
      source: lead.source ?? '',
      score: lead.score,
      notes: lead.notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LeadFormValues) =>
      updateLead(lead.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        source: data.source || undefined,
        score: data.score,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to update lead.');
    },
  });

  async function onSubmit(values: LeadFormValues) {
    setApiError(null);
    await mutation.mutateAsync(values);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-lead-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="edit-lead-title" className="text-base font-semibold text-slate-900">
            Edit Lead
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-6 py-5">
          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              required
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Company"
            error={errors.company?.message}
            {...register('company')}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-lead-source" className="text-sm font-medium text-slate-700">
                Source
              </label>
              <select
                id="edit-lead-source"
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                {...register('source')}
              >
                <option value="">Select source…</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="event">Event</option>
                <option value="social_media">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Score (0–100)"
              type="number"
              error={errors.score?.message}
              {...register('score')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-lead-notes" className="text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="edit-lead-notes"
              rows={3}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convert Lead wizard
// ---------------------------------------------------------------------------
const convertSchema = z.object({
  createOpportunity: z.boolean(),
  opportunityTitle: z.string().optional(),
  amount: z.coerce.number().min(0).optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

function ConvertWizard({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [convertedContactId, setConvertedContactId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConvertFormValues>({
    defaultValues: {
      createOpportunity: false,
      opportunityTitle: lead.company || `${lead.firstName} ${lead.lastName}`,
      amount: undefined,
    },
  });

  const createOpportunity = watch('createOpportunity');

  const mutation = useMutation({
    mutationFn: (data: ConvertFormValues) => {
      const dto: ConvertLeadDto = {
        createOpportunity: data.createOpportunity,
        opportunityTitle: data.createOpportunity ? data.opportunityTitle : undefined,
        amount: data.createOpportunity && data.amount ? data.amount : undefined,
      };
      return convertLead(lead.id, dto);
    },
    onSuccess: (result) => {
      setConvertedContactId(result.contactId);
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to convert lead.');
    },
  });

  async function onSubmit(values: ConvertFormValues) {
    setApiError(null);
    await mutation.mutateAsync(values);
  }

  // Success state
  if (convertedContactId) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800">Lead converted successfully!</h3>
            <p className="mt-1 text-sm text-green-700">
              A new contact has been created from this lead.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={`/contacts/${convertedContactId}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                View Contact
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <button
                onClick={onClose}
                className="text-sm text-green-700 hover:text-green-900 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Convert Lead</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Close convert wizard"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Converting this lead will create a Contact record. Optionally create an Opportunity at the same time.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            {...register('createOpportunity')}
          />
          Also create an Opportunity
        </label>

        {createOpportunity && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <Input
              label="Opportunity title"
              placeholder="Deal with Acme Corp"
              error={errors.opportunityTitle?.message}
              {...register('opportunityTitle')}
            />
            <Input
              label="Amount ($)"
              type="number"
              placeholder="0"
              error={errors.amount?.message}
              {...register('amount')}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<RefreshCw />}
          >
            Convert Lead
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status changer
// ---------------------------------------------------------------------------
const CHANGEABLE_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'];

function StatusChanger({
  lead,
}: {
  lead: Lead;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (status: LeadStatus) => changeLeadStatus(lead.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setError(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(typeof message === 'string' ? message : 'Failed to update status.');
    },
  });

  if (lead.status === 'CONVERTED') {
    return (
      <div className="flex items-center gap-2 text-sm text-purple-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        This lead has been converted.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Change Status</p>
      <div className="flex flex-wrap gap-2">
        {CHANGEABLE_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => mutation.mutate(s)}
            disabled={mutation.isPending || lead.status === s}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-all',
              lead.status === s
                ? 'cursor-default opacity-60'
                : 'hover:opacity-80 cursor-pointer',
              s === 'NEW' && 'bg-blue-50 text-blue-700 ring-blue-200',
              s === 'CONTACTED' && 'bg-amber-50 text-amber-700 ring-amber-200',
              s === 'QUALIFIED' && 'bg-green-50 text-green-700 ring-green-200',
              s === 'UNQUALIFIED' && 'bg-slate-100 text-slate-500 ring-slate-200',
            )}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
            {lead.status === s && ' ✓'}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showEdit, setShowEdit] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id),
    enabled: Boolean(id),
  });

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <div className="mb-6 h-5 w-20 animate-pulse rounded bg-slate-200" />
        <div className="mb-8 flex items-start gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (isError || !lead) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <Link
          href="/leads"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Leads
        </Link>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Failed to load lead. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Back */}
        <Link
          href="/leads"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Leads
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
              {getInitials(lead.firstName, lead.lastName)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {lead.firstName} {lead.lastName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    {lead.phone}
                  </a>
                )}
                <StatusBadge status={lead.status} />
              </div>
            </div>
          </div>

          <Button leftIcon={<Pencil />} variant="outline" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Notes */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Notes</h2>
              {lead.notes ? (
                <p className="whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</p>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Clock className="h-6 w-6 text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-slate-400">No notes added yet. Edit this lead to add notes.</p>
                </div>
              )}
            </div>

            {/* Activity placeholder */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Activity Timeline</h2>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Clock className="h-6 w-6 text-slate-400" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-slate-600">Activities coming in EP-05</p>
                <p className="text-sm text-slate-400">
                  Call logs, emails, notes, and tasks will appear here.
                </p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Details card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Company</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-700">
                    {lead.company ? (
                      <>
                        <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {lead.company}
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Score</dt>
                  <dd className="mt-1">
                    <ScorePill score={lead.score} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Source</dt>
                  <dd className="mt-0.5 text-sm text-slate-700 capitalize">
                    {lead.source
                      ? lead.source.replace(/_/g, ' ')
                      : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {lead.owner
                      ? `${lead.owner.firstName} ${lead.owner.lastName}`
                      : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{formatDate(lead.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Updated</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{formatDate(lead.updatedAt)}</dd>
                </div>
                {lead.convertedAt && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Converted</dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{formatDate(lead.convertedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Actions</h2>
              <div className="space-y-4">
                <StatusChanger lead={lead} />

                <div className="h-px bg-slate-100" />

                {lead.status !== 'CONVERTED' && (
                  <>
                    {showConvert ? (
                      <ConvertWizard
                        lead={lead}
                        onClose={() => setShowConvert(false)}
                      />
                    ) : (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Conversion
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RefreshCw />}
                          onClick={() => setShowConvert(true)}
                          className="w-full"
                        >
                          Convert Lead
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {lead.status === 'CONVERTED' && lead.convertedContactId && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Converted To
                    </p>
                    <Link
                      href={`/contacts/${lead.convertedContactId}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors ring-1 ring-inset ring-purple-200"
                    >
                      View Contact
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditLeadModal lead={lead} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
