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
  Plus,
  Building2,
  Clock,
} from 'lucide-react';
import {
  getContact,
  updateContact,
  addContactTag,
  removeContactTag,
  linkContactToAccount,
} from '@/lib/contacts-api';
import { getAccounts } from '@/lib/accounts-api';
import { getTags } from '@/lib/tags-api';
import type { Contact, Tag } from '@/lib/types';
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
// Edit contact modal
// ---------------------------------------------------------------------------
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

function EditContactModal({
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      title: contact.title ?? '',
      source: contact.source ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ContactFormValues) =>
      updateContact(contact.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        title: data.title || undefined,
        source: data.source || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contact.id] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to update contact.');
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setApiError(null);
    await mutation.mutateAsync(values);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-contact-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="edit-contact-title" className="text-base font-semibold text-slate-900">
            Edit Contact
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
            label="Title"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-source" className="text-sm font-medium text-slate-700">
              Source
            </label>
            <select
              id="edit-source"
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
// Link account modal
// ---------------------------------------------------------------------------
function LinkAccountModal({
  contactId,
  onClose,
}: {
  contactId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: ['accounts-search', search],
    queryFn: () => getAccounts({ q: search, limit: 20 }),
    enabled: true,
  });

  const accounts = accountsData?.data ?? [];

  async function handleLink() {
    if (!selectedId) return;
    setApiError(null);
    setLoading(true);
    try {
      await linkContactToAccount(contactId, selectedId, { isPrimary });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to link account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-account-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="link-account-title" className="text-base font-semibold text-slate-900">
            Link Account
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
          />

          <div className="max-h-52 overflow-y-auto rounded-md border border-slate-200">
            {accounts.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">No accounts found.</p>
            ) : (
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedId(acc.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                    selectedId === acc.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{acc.name}</p>
                    {acc.domain && <p className="text-xs text-slate-400">{acc.domain}</p>}
                  </div>
                </button>
              ))
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            />
            Mark as primary account
          </label>

          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              loading={loading}
              disabled={loading || !selectedId}
            >
              Link Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add tag dropdown
// ---------------------------------------------------------------------------
function AddTagDropdown({
  contactId,
  existingTagIds,
}: {
  contactId: string;
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
    mutationFn: (tagId: string) => addContactTag(contactId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
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
            {error && (
              <p className="px-3 py-2 text-xs text-red-600">{error}</p>
            )}
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
export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showEdit, setShowEdit] = useState(false);
  const [showLinkAccount, setShowLinkAccount] = useState(false);
  const queryClient = useQueryClient();

  const { data: contact, isLoading, isError } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id),
    enabled: Boolean(id),
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => removeContactTag(id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
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
  if (isError || !contact) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <Link
          href="/contacts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Contacts
        </Link>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Failed to load contact. Please try again.</span>
        </div>
      </div>
    );
  }

  const existingTagIds = (contact.tags ?? []).map((t) => t.id);

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Back */}
        <Link
          href="/contacts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Contacts
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
              {getInitials(contact.firstName, contact.lastName)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {contact.firstName} {contact.lastName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    {contact.phone}
                  </a>
                )}
                <StatusBadge isActive={contact.isActive} />
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

            {/* Linked Accounts */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Linked Accounts</h2>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus />}
                  onClick={() => setShowLinkAccount(true)}
                >
                  Link Account
                </Button>
              </div>

              {(contact.accountLinks ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No accounts linked yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {contact.accountLinks!.map((link) => (
                    <li key={link.account.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        </div>
                        <div>
                          <Link
                            href={`/accounts/${link.account.id}`}
                            className="text-sm font-medium text-slate-900 hover:text-primary-600 transition-colors"
                          >
                            {link.account.name}
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
                    Title
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {contact.title ?? <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Source
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700 capitalize">
                    {contact.source
                      ? contact.source.replace(/_/g, ' ')
                      : <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Owner ID
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700 font-mono text-xs">
                    {contact.ownerId ?? <span className="text-slate-300">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {formatDate(contact.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Updated
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {formatDate(contact.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {(contact.tags ?? []).map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    onRemove={(tagId) => removeTagMutation.mutate(tagId)}
                  />
                ))}
              </div>
              <div className="mt-3">
                <AddTagDropdown contactId={id} existingTagIds={existingTagIds} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditContactModal contact={contact} onClose={() => setShowEdit(false)} />
      )}
      {showLinkAccount && (
        <LinkAccountModal contactId={id} onClose={() => setShowLinkAccount(false)} />
      )}
    </>
  );
}
