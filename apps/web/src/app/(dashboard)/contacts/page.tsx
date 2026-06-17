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
  Upload,
  UserX,
} from 'lucide-react';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
} from '@/lib/contacts-api';
import { getTags } from '@/lib/tags-api';
import type { Contact, Tag, CreateContactDto } from '@/lib/types';
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
function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: tag.color + '20', color: tag.color }}
    >
      {tag.name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Zod schema for contact form
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

// ---------------------------------------------------------------------------
// Contact form modal (create / edit)
// ---------------------------------------------------------------------------
function ContactModal({
  contact,
  onClose,
}: {
  contact?: Contact;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const isEdit = Boolean(contact);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact?.firstName ?? '',
      lastName: contact?.lastName ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      title: contact?.title ?? '',
      source: contact?.source ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ContactFormValues) => {
      const dto: CreateContactDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        title: data.title || undefined,
        source: data.source || undefined,
      };
      return isEdit && contact
        ? updateContact(contact.id, dto)
        : createContact(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to save contact.');
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
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="contact-modal-title" className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Contact' : 'Add Contact'}
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
            label="Title"
            placeholder="VP of Sales"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-source" className="text-sm font-medium text-slate-700">
              Source
            </label>
            <select
              id="contact-source"
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
              {isEdit ? 'Save changes' : 'Add Contact'}
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
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteContact(contact.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to delete contact.');
    },
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-contact-title"
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
              <h2 id="delete-contact-title" className="text-base font-semibold text-slate-900">
                Delete contact?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {contact.firstName} {contact.lastName} will be removed. This action cannot be
                undone.
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
// CSV Import modal
// ---------------------------------------------------------------------------
function ImportModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(ev.target?.result as string);
    reader.readAsText(file);
  }

  async function handleImport() {
    setApiError(null);
    setResult(null);

    const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setApiError('CSV must include a header row and at least one data row.');
      return;
    }

    // Skip header row
    const dataLines = lines.slice(1);
    const contacts = dataLines.map((line) => {
      const [firstName = '', lastName = '', email = '', phone = '', title = '', source = ''] =
        line.split(',').map((v) => v.trim());
      return {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        title: title || undefined,
        source: source || undefined,
      };
    });

    setLoading(true);
    try {
      const res = await importContacts(contacts);
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Import failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="import-modal-title" className="text-base font-semibold text-slate-900">
            Import Contacts (CSV)
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
          <p className="text-sm text-slate-600">
            Expected format (header row required):
          </p>
          <pre className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-700 overflow-x-auto">
            firstName,lastName,email,phone,title,source
          </pre>

          <div>
            <label htmlFor="csv-file" className="text-sm font-medium text-slate-700">
              Upload CSV file
            </label>
            <input
              ref={fileRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="mt-1.5 block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="csv-text" className="text-sm font-medium text-slate-700">
              Or paste CSV content
            </label>
            <textarea
              id="csv-text"
              rows={6}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={`firstName,lastName,email,phone,title,source\nJane,Smith,jane@example.com,+1555000001,VP Sales,referral`}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <p className="font-medium">Import complete</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-green-600">
                <li>{result.created} contacts created</li>
                <li>{result.skipped} skipped</li>
                {result.errors.length > 0 && (
                  <li>{result.errors.length} error(s): {result.errors.join('; ')}</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleImport}
              loading={loading}
              disabled={loading || !csv.trim()}
              leftIcon={<Upload />}
            >
              Import
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
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label={`Actions for ${contact.firstName} ${contact.lastName}`}
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
              onClick={() => { setOpen(false); onEdit(contact); }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <div className="h-px bg-slate-100" />
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onDelete(contact); }}
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
                <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </td>
          {[1, 2, 3, 4, 5, 6].map((j) => (
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
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 25;

export default function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [tagFilter, setTagFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

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

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['contacts', { page, q: debouncedSearch, isActive: activeFilter, tagId: tagFilter }],
    queryFn: () =>
      getContacts({
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch,
        isActive: activeFilter,
        tagId: tagFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const contacts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const tags = tagsData ?? [];

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contacts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your contacts and their information.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Upload />}
              onClick={() => setShowImportModal(true)}
            >
              Import CSV
            </Button>
            <Button leftIcon={<Plus />} onClick={() => setShowAddModal(true)}>
              Add Contact
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search contacts…"
              className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600 hover:border-slate-400"
            />
          </div>

          {/* Active filter */}
          <select
            value={String(activeFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setActiveFilter(v === '' ? '' : v === 'true');
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600 hover:border-slate-400"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Tag filter */}
          {tags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600 hover:border-slate-400"
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Error state */}
        {isError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Failed to load contacts:{' '}
              {(error as { message?: string })?.message ?? 'Unknown error'}
            </span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tags
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

                {!isLoading && contacts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                          <UserX className="h-7 w-7 text-slate-400" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No contacts found</p>
                        <p className="text-sm text-slate-400">
                          {debouncedSearch || activeFilter !== '' || tagFilter
                            ? 'Try adjusting your filters.'
                            : 'Add your first contact to get started.'}
                        </p>
                        {!debouncedSearch && activeFilter === '' && !tagFilter && (
                          <Button
                            size="sm"
                            leftIcon={<Plus />}
                            onClick={() => setShowAddModal(true)}
                          >
                            Add Contact
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  contacts.map((contact) => {
                    const initials = getInitials(contact.firstName, contact.lastName);
                    const colorClass = avatarColor(contact.firstName + contact.lastName);
                    return (
                      <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
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
                            <div>
                              <Link
                                href={`/contacts/${contact.id}`}
                                className="font-medium text-slate-900 hover:text-primary-600 transition-colors"
                              >
                                {contact.firstName} {contact.lastName}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-600">
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:text-primary-600 transition-colors"
                            >
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-600">
                          {contact.phone ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-600">
                          {contact.title ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge isActive={contact.isActive} />
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags?.slice(0, 3).map((tag) => (
                              <TagChip key={tag.id} tag={tag} />
                            ))}
                            {(contact.tags?.length ?? 0) > 3 && (
                              <span className="text-xs text-slate-400">
                                +{(contact.tags?.length ?? 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-500">
                          {formatDate(contact.createdAt)}
                        </td>
                        <td className="py-4 pl-3 pr-6 text-right">
                          <RowActions
                            contact={contact}
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
                contacts
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
                {/* Page number buttons — show up to 5 */}
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
      </div>

      {/* Modals */}
      {showAddModal && <ContactModal onClose={() => setShowAddModal(false)} />}
      {editTarget && (
        <ContactModal contact={editTarget} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal contact={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
    </>
  );
}
