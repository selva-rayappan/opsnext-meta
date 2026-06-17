'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  AlertTriangle,
  Target,
  LayoutList,
  Columns3,
} from 'lucide-react';
import { getLeads, createLead, updateLead, deleteLead } from '@/lib/leads-api';
import type { Lead, CreateLeadDto, LeadStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function avatarColor(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        colorClass,
      )}
    >
      {score}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Zod schema
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

// ---------------------------------------------------------------------------
// Lead form modal (create / edit)
// ---------------------------------------------------------------------------
function LeadModal({
  lead,
  onClose,
}: {
  lead?: Lead;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const isEdit = Boolean(lead);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: lead?.firstName ?? '',
      lastName: lead?.lastName ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      company: lead?.company ?? '',
      source: lead?.source ?? '',
      score: lead?.score ?? 0,
      notes: lead?.notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LeadFormValues) => {
      const dto: CreateLeadDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        source: data.source || undefined,
        score: data.score,
        notes: data.notes || undefined,
      };
      return isEdit && lead ? updateLead(lead.id, dto) : createLead(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to save lead.');
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
      aria-labelledby="lead-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="lead-modal-title" className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Lead' : 'Add Lead'}
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
              placeholder="Jane"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              required
              placeholder="Smith"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="+1 555 000 0000"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Company"
            placeholder="Acme Corp"
            error={errors.company?.message}
            {...register('company')}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead-source" className="text-sm font-medium text-slate-700">
                Source
              </label>
              <select
                id="lead-source"
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
              placeholder="0"
              error={errors.score?.message}
              {...register('score')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead-notes" className="text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              id="lead-notes"
              rows={3}
              placeholder="Any additional context…"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm modal
// ---------------------------------------------------------------------------
function DeleteConfirmModal({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteLead(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to delete lead.');
    },
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-lead-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <div>
              <h2 id="delete-lead-title" className="text-base font-semibold text-slate-900">
                Delete lead?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {lead.firstName} {lead.lastName} will be removed. This action cannot be undone.
              </p>
            </div>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {apiError}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row actions menu
// ---------------------------------------------------------------------------
function RowActions({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label={`Actions for ${lead.firstName} ${lead.lastName}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onEdit(lead); }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <div className="h-px bg-slate-100" />
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onDelete(lead); }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton rows
// ---------------------------------------------------------------------------
function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          <td className="py-4 pl-6 pr-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </td>
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <td key={j} className="px-3 py-4">
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Kanban column
// ---------------------------------------------------------------------------
const KANBAN_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'];

function KanbanCard({ lead }: { lead: Lead }) {
  const colorClass = avatarColor(lead.firstName + lead.lastName);
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-primary-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            colorClass,
          )}
          aria-hidden="true"
        >
          {getInitials(lead.firstName, lead.lastName)}
        </div>
        <p className="text-sm font-medium text-slate-900 truncate">
          {lead.firstName} {lead.lastName}
        </p>
      </div>
      {lead.company && (
        <p className="text-xs text-slate-500 mb-2 truncate">{lead.company}</p>
      )}
      <ScorePill score={lead.score} />
    </Link>
  );
}

function KanbanView({ leads }: { leads: Lead[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KANBAN_STATUSES.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
              </div>
              <span className="text-xs font-medium text-slate-400">{columnLeads.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[120px]">
              {columnLeads.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 px-4 py-8">
                  <p className="text-xs text-slate-400">No leads</p>
                </div>
              ) : (
                columnLeads.map((lead) => <KanbanCard key={lead.id} lead={lead} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 25;
type ViewMode = 'table' | 'kanban';

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // For kanban we fetch all (no pagination) when in kanban mode
  const queryParams =
    viewMode === 'kanban'
      ? { limit: 200, q: debouncedSearch, status: statusFilter }
      : { page, limit: PAGE_SIZE, q: debouncedSearch, status: statusFilter };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['leads', queryParams],
    queryFn: () => getLeads(queryParams),
    placeholderData: (prev) => prev,
  });

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track and manage your sales leads pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
                aria-pressed={viewMode === 'table'}
              >
                <LayoutList className="h-4 w-4" aria-hidden="true" />
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
                aria-pressed={viewMode === 'kanban'}
              >
                <Columns3 className="h-4 w-4" aria-hidden="true" />
                Kanban
              </button>
            </div>

            <Button leftIcon={<Plus />} onClick={() => setShowAddModal(true)}>
              Add Lead
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search leads…"
              className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600 hover:border-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LeadStatus | '');
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600 hover:border-slate-400"
          >
            <option value="">All statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
          </select>
        </div>

        {/* Error state */}
        {isError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Failed to load leads:{' '}
              {(error as { message?: string })?.message ?? 'Unknown error'}
            </span>
          </div>
        )}

        {/* Kanban view */}
        {viewMode === 'kanban' && !isLoading && (
          <KanbanView leads={leads} />
        )}

        {/* Kanban skeleton */}
        {viewMode === 'kanban' && isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KANBAN_STATUSES.map((status) => (
              <div key={status} className="flex flex-col gap-2">
                <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Score
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Owner
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading && <SkeletonRows />}

                  {!isLoading && leads.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <Target className="h-7 w-7 text-slate-400" aria-hidden="true" />
                          </div>
                          <p className="text-sm font-medium text-slate-600">No leads found</p>
                          <p className="text-sm text-slate-400">
                            {debouncedSearch || statusFilter
                              ? 'Try adjusting your filters.'
                              : 'Add your first lead to get started.'}
                          </p>
                          {!debouncedSearch && !statusFilter && (
                            <Button
                              size="sm"
                              leftIcon={<Plus />}
                              onClick={() => setShowAddModal(true)}
                            >
                              Add Lead
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    leads.map((lead) => {
                      const initials = getInitials(lead.firstName, lead.lastName);
                      const colorClass = avatarColor(lead.firstName + lead.lastName);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 pl-6 pr-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                  colorClass,
                                )}
                                aria-hidden="true"
                              >
                                {initials}
                              </div>
                              <Link
                                href={`/leads/${lead.id}`}
                                className="font-medium text-slate-900 hover:text-primary-600 transition-colors"
                              >
                                {lead.firstName} {lead.lastName}
                              </Link>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-600">
                            {lead.company ?? <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-600">
                            {lead.email ? (
                              <a
                                href={`mailto:${lead.email}`}
                                className="hover:text-primary-600 transition-colors"
                              >
                                {lead.email}
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <StatusBadge status={lead.status} />
                          </td>
                          <td className="px-3 py-4">
                            <ScorePill score={lead.score} />
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-600 capitalize">
                            {lead.source
                              ? lead.source.replace(/_/g, ' ')
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-600">
                            {lead.owner
                              ? `${lead.owner.firstName} ${lead.owner.lastName}`
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-4 text-sm text-slate-500">
                            {formatDate(lead.createdAt)}
                          </td>
                          <td className="py-4 pl-3 pr-6 text-right">
                            <RowActions
                              lead={lead}
                              onEdit={setEditTarget}
                              onDelete={setDeleteTarget}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <p className="text-sm text-slate-500">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}{' '}
                  leads
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Previous page"
                    leftIcon={<ChevronLeft />}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(p)}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                    rightIcon={<ChevronRight />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && <LeadModal onClose={() => setShowAddModal(false)} />}
      {editTarget && (
        <LeadModal lead={editTarget} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal lead={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
