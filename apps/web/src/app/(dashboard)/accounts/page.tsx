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
  Building2,
} from 'lucide-react';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@/lib/accounts-api';
import type { Account, CreateAccountDto } from '@/lib/types';
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
// Zod schema
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

// ---------------------------------------------------------------------------
// Account modal (create / edit)
// ---------------------------------------------------------------------------
function AccountModal({
  account,
  onClose,
}: {
  account?: Account;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const isEdit = Boolean(account);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      domain: account?.domain ?? '',
      industry: account?.industry ?? '',
      employeeCount: account?.employeeCount ? String(account.employeeCount) : '',
      website: account?.website ?? '',
      phone: account?.phone ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AccountFormValues) => {
      const dto: CreateAccountDto = {
        name: data.name,
        domain: data.domain || undefined,
        industry: data.industry || undefined,
        employeeCount: data.employeeCount,
        website: data.website || undefined,
        phone: data.phone || undefined,
      };
      return isEdit && account
        ? updateAccount(account.id, dto)
        : createAccount(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to save account.');
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
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="account-modal-title" className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Account' : 'Add Account'}
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
            placeholder="Acme Corporation"
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
              placeholder="+1 555 000 0000"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="account-industry" className="text-sm font-medium text-slate-700">
              Industry
            </label>
            <select
              id="account-industry"
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
              placeholder="500"
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
              {isEdit ? 'Save changes' : 'Add Account'}
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
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => deleteAccount(account.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to delete account.');
    },
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
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
              <h2 id="delete-account-title" className="text-base font-semibold text-slate-900">
                Delete account?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-medium">{account.name}</span> will be removed. This action
                cannot be undone.
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
// Row actions
// ---------------------------------------------------------------------------
function RowActions({
  account,
  onEdit,
  onDelete,
}: {
  account: Account;
  onEdit: (a: Account) => void;
  onDelete: (a: Account) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label={`Actions for ${account.name}`}
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
              onClick={() => { setOpen(false); onEdit(account); }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <div className="h-px bg-slate-100" />
            <button
              role="menuitem"
              onClick={() => { setOpen(false); onDelete(account); }}
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
// Loading skeletons
// ---------------------------------------------------------------------------
function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          <td className="py-4 pl-6 pr-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </td>
          {[1, 2, 3, 4, 5].map((j) => (
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

export default function AccountsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['accounts', { page, q: debouncedSearch, isActive: activeFilter }],
    queryFn: () =>
      getAccounts({ page, limit: PAGE_SIZE, q: debouncedSearch, isActive: activeFilter }),
    placeholderData: (prev) => prev,
  });

  const accounts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your company accounts and relationships.
            </p>
          </div>
          <Button leftIcon={<Plus />} onClick={() => setShowAddModal(true)}>
            Add Account
          </Button>
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
              placeholder="Search accounts…"
              className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600 hover:border-slate-400"
            />
          </div>

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
        </div>

        {/* Error state */}
        {isError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Failed to load accounts:{' '}
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
                    Domain
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Industry
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contacts
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
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

                {!isLoading && accounts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                          <Building2 className="h-7 w-7 text-slate-400" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No accounts found</p>
                        <p className="text-sm text-slate-400">
                          {debouncedSearch || activeFilter !== ''
                            ? 'Try adjusting your filters.'
                            : 'Add your first account to get started.'}
                        </p>
                        {!debouncedSearch && activeFilter === '' && (
                          <Button
                            size="sm"
                            leftIcon={<Plus />}
                            onClick={() => setShowAddModal(true)}
                          >
                            Add Account
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                          </div>
                          <div>
                            <Link
                              href={`/accounts/${account.id}`}
                              className="font-medium text-slate-900 hover:text-primary-600 transition-colors"
                            >
                              {account.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600">
                        {account.domain ? (
                          <a
                            href={`https://${account.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-primary-600 transition-colors"
                          >
                            {account.domain}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 capitalize">
                        {account.industry
                          ? account.industry.replace(/_/g, ' ')
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600">
                        {account.contactLinks?.length ?? 0}
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge isActive={account.isActive} />
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-500">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <RowActions
                          account={account}
                          onEdit={setEditTarget}
                          onDelete={setDeleteTarget}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <p className="text-sm text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}{' '}
                accounts
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
      </div>

      {/* Modals */}
      {showAddModal && <AccountModal onClose={() => setShowAddModal(false)} />}
      {editTarget && (
        <AccountModal account={editTarget} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
