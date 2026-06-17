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
  Globe,
  Phone,
  Pencil,
  X,
  AlertTriangle,
  Plus,
  Users,
  Clock,
} from 'lucide-react';
import {
  getAccount,
  updateAccount,
  addAccountTag,
  removeAccountTag,
} from '@/lib/accounts-api';
import { getTags } from '@/lib/tags-api';
import type { Account, Tag } from '@/lib/types';
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

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        isActive
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-slate-100 text-slate-500 ring-slate-200',
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-green-500' : 'bg-slate-400')}
        aria-hidden="true"
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tag chip
// ---------------------------------------------------------------------------
function TagChip({
  tag,
  onRemove,
}: {
  tag: Tag;
  onRemove?: (tagId: string) => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: tag.color + '20', color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={() => onRemove(tag.id)}
          className="ml-0.5 rounded-full p-0.5 hover:opacity-70 transition-opacity"
          aria-label={`Remove tag ${tag.name}`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Edit account modal
// ---------------------------------------------------------------------------
const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().positive('Must be positive').optional()),
  website: z
    .string()
    .url('Enter a valid URL (https://…)')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

function EditAccountModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account.name,
      domain: account.domain ?? '',
      industry: account.industry ?? '',
      employeeCount: account.employeeCount ? String(account.employeeCount) : '',
      website: account.website ?? '',
      phone: account.phone ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AccountFormValues) =>
      updateAccount(account.id, {
        name: data.name,
        domain: data.domain || undefined,
        industry: data.industry || undefined,
        employeeCount: data.employeeCount,
        website: data.website || undefined,
        phone: data.phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', account.id] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to update account.');
    },
  });

  async function onSubmit(values: AccountFormValues) {
    setApiError(null);
    await mutation.mutateAsync(values);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-account-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="edit-account-title" className="text-base font-semibold text-slate-900">
            Edit Account
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

          <Input
            label="Account name"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Domain"
              placeholder="acme.com"
              error={errors.domain?.message}
              {...register('domain')}
            />
            <Input
              label="Phone"
              type="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-industry" className="text-sm font-medium text-slate-700">
              Industry
            </label>
            <select
              id="edit-industry"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              {...register('industry')}
            >
              <option value="">Select industry…</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="education">Education</option>
              <option value="real_estate">Real Estate</option>
              <option value="consulting">Consulting</option>
              <option value="media">Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employees"
              type="number"
              error={errors.employeeCount?.message}
              {...register('employeeCount')}
            />
            <Input
              label="Website"
              type="url"
              placeholder="https://acme.com"
              error={errors.website?.message}
              {...register('website')}
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
// Add tag dropdown
// ---------------------------------------------------------------------------
function AddTagDropdown({
  accountId,
  existingTagIds,
}: {
  accountId: string;
  existingTagIds: string[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    staleTime: 5 * 60 * 1000,
  });

  const availableTags = allTags.filter((t) => !existingTagIds.includes(t.id));

  const mutation = useMutation({
    mutationFn: (tagId: string) => addAccountTag(accountId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
      setOpen(false);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(typeof message === 'string' ? message : 'Failed to add tag.');
    },
  });

  if (availableTags.length === 0) return null;

  return (
    <div className="relative">
      <Button size="sm" variant="outline" leftIcon={<Plus />} onClick={() => setOpen((v) => !v)}>
        Add Tag
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => mutation.mutate(tag.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden="true"
                />
                {tag.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showEdit, setShowEdit] = useState(false);
  const queryClient = useQueryClient();

  const { data: account, isLoading, isError } = useQuery({
    queryKey: ['account', id],
    queryFn: () => getAccount(id),
    enabled: Boolean(id),
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => removeAccountTag(id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', id] });
    },
  });

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <div className="mb-6 h-5 w-20 animate-pulse rounded bg-slate-200" />
        <div className="mb-8 flex items-start gap-4">
          <div className="h-16 w-16 animate-pulse rounded-xl bg-slate-200" />
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
  if (isError || !account) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <Link
          href="/accounts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Accounts
        </Link>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Failed to load account. Please try again.</span>
        </div>
      </div>
    );
  }

  const existingTagIds = (account.tags ?? []).map((t) => t.id);

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Back */}
        <Link
          href="/accounts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Accounts
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <span className="text-2xl font-bold text-slate-500">
                {account.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {account.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {account.domain && (
                  <a
                    href={`https://${account.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    {account.domain}
                  </a>
                )}
                {account.phone && (
                  <a
                    href={`tel:${account.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    {account.phone}
                  </a>
                )}
                <StatusBadge isActive={account.isActive} />
              </div>
            </div>
          </div>

          <Button leftIcon={<Pencil />} variant="outline" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Timeline placeholder */}
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

            {/* Linked Contacts */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Linked Contacts
                  {(account.contactLinks ?? []).length > 0 && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {account.contactLinks!.length}
                    </span>
                  )}
                </h2>
              </div>

              {(account.contactLinks ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No contacts linked yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {account.contactLinks!.map((link) => (
                    <li key={link.contact.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                          {link.contact.firstName.charAt(0).toUpperCase()}
                          {link.contact.lastName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/contacts/${link.contact.id}`}
                            className="text-sm font-medium text-slate-900 hover:text-primary-600 transition-colors"
                          >
                            {link.contact.firstName} {link.contact.lastName}
                          </Link>
                        </div>
                      </div>
                      {link.isPrimary && (
                        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-200">
                          Primary
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {(account.contactLinks ?? []).length === 0 && (
                <div className="mt-4 flex flex-col items-center gap-2 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <Users className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Link contacts from their individual pages.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">
            {/* Info card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Industry
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700 capitalize">
                    {account.industry
                      ? account.industry.replace(/_/g, ' ')
                      : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Employees
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {account.employeeCount
                      ? account.employeeCount.toLocaleString()
                      : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Website
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {account.website ? (
                      <a
                        href={account.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {account.website}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Owner ID
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700 font-mono text-xs">
                    {account.ownerId ?? <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {formatDate(account.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Updated
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {formatDate(account.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {(account.tags ?? []).length === 0 && (
                  <p className="text-sm text-slate-400">No tags yet.</p>
                )}
                {(account.tags ?? []).map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    onRemove={(tagId) => removeTagMutation.mutate(tagId)}
                  />
                ))}
              </div>
              <div className="mt-3">
                <AddTagDropdown accountId={id} existingTagIds={existingTagIds} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditAccountModal account={account} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
