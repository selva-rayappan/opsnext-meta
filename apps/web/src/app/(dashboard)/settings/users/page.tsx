'use client';

import React, { Fragment, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Role } from '@opsnext/shared';
import { useAuth } from '@/context/auth-context';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface PaginatedUsers {
  data: UserRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------
const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  [Role.SUPER_ADMIN]: {
    label: 'Super Admin',
    className: 'bg-red-100 text-red-700 ring-red-200',
  },
  [Role.ADMIN]: {
    label: 'Admin',
    className: 'bg-blue-100 text-blue-700 ring-blue-200',
  },
  [Role.SALES_MANAGER]: {
    label: 'Sales Manager',
    className: 'bg-purple-100 text-purple-700 ring-purple-200',
  },
  [Role.SALES_REP]: {
    label: 'Sales Rep',
    className: 'bg-green-100 text-green-700 ring-green-200',
  },
  [Role.READ_ONLY]: {
    label: 'Read Only',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
};

function RoleBadge({ role }: { role: Role }) {
  const { label, className } = ROLE_BADGE[role] ?? {
    label: role,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        className,
      )}
    >
      {label}
    </span>
  );
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
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-green-500' : 'bg-slate-400',
        )}
        aria-hidden="true"
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row action menu
// ---------------------------------------------------------------------------
function RowActions({
  user,
  currentUserId,
  onChangeRole,
  onToggleActive,
}: {
  user: UserRecord;
  currentUserId: string;
  onChangeRole: (user: UserRecord) => void;
  onToggleActive: (user: UserRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSelf = user.id === currentUserId;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label={`Actions for ${user.firstName} ${user.lastName}`}
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
            className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card-md"
          >
            <button
              role="menuitem"
              disabled={isSelf}
              onClick={() => {
                setOpen(false);
                onChangeRole(user);
              }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Change role
            </button>
            <div className="h-px bg-slate-100" />
            <button
              role="menuitem"
              disabled={isSelf}
              onClick={() => {
                setOpen(false);
                onToggleActive(user);
              }}
              className={cn(
                'flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-40',
                user.isActive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-700 hover:bg-green-50',
              )}
            >
              {user.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite modal
// ---------------------------------------------------------------------------
const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  role: z.nativeEnum(Role, { required_error: 'Select a role' }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const ASSIGNABLE_ROLES: Role[] = [
  Role.ADMIN,
  Role.SALES_MANAGER,
  Role.SALES_REP,
  Role.READ_ONLY,
];

function InviteModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: Role.SALES_REP },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormValues) =>
      api.post('/api/v1/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setApiError(
        typeof message === 'string' ? message : 'Failed to send invite.',
      );
    },
  });

  async function onSubmit(values: InviteFormValues) {
    setApiError(null);
    await inviteMutation.mutateAsync(values);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2
            id="invite-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            Invite team member
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 px-6 py-5"
        >
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
            label="Email address"
            type="email"
            autoComplete="off"
            placeholder="colleague@company.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-role"
              className="text-sm font-medium text-slate-700"
            >
              Role <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="invite-role"
              className={cn(
                'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900',
                'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
                'disabled:cursor-not-allowed disabled:bg-slate-50',
                errors.role
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-slate-300 hover:border-slate-400',
              )}
              {...register('role')}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_BADGE[r].label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs text-red-600">{errors.role.message}</p>
            )}
            <p className="text-xs text-slate-500">
              The invited user will receive an email with instructions to set up
              their account.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              leftIcon={<UserPlus />}
            >
              Send invite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change role modal
// ---------------------------------------------------------------------------
const changeRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

type ChangeRoleValues = z.infer<typeof changeRoleSchema>;

function ChangeRoleModal({
  user,
  onClose,
}: {
  user: UserRecord;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<ChangeRoleValues>({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: { role: user.role },
  });

  const mutation = useMutation({
    mutationFn: (data: ChangeRoleValues) =>
      api.patch(`/api/v1/users/${user.id}/role`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setApiError(
        typeof message === 'string' ? message : 'Failed to update role.',
      );
    },
  });

  async function onSubmit(values: ChangeRoleValues) {
    setApiError(null);
    await mutation.mutateAsync(values);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-role-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2
            id="change-role-title"
            className="text-base font-semibold text-slate-900"
          >
            Change role
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 px-6 py-5"
        >
          <p className="text-sm text-slate-600">
            Changing role for{' '}
            <span className="font-medium text-slate-900">
              {user.firstName} {user.lastName}
            </span>
            .
          </p>

          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-role"
              className="text-sm font-medium text-slate-700"
            >
              New role
            </label>
            <select
              id="new-role"
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              {...register('role')}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_BADGE[r].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm deactivate/reactivate modal
// ---------------------------------------------------------------------------
function ConfirmToggleModal({
  user,
  onClose,
}: {
  user: UserRecord;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/v1/users/${user.id}/status`, {
        isActive: !user.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: unknown) => {
      const message = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setApiError(
        typeof message === 'string'
          ? message
          : 'Failed to update user status.',
      );
    },
  });

  const action = user.isActive ? 'Deactivate' : 'Reactivate';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-toggle-title"
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
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                user.isActive ? 'bg-red-100' : 'bg-green-100',
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  user.isActive ? 'text-red-600' : 'text-green-600',
                )}
                aria-hidden="true"
              />
            </div>
            <div>
              <h2
                id="confirm-toggle-title"
                className="text-base font-semibold text-slate-900"
              >
                {action} user?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {user.isActive
                  ? `${user.firstName} ${user.lastName} will no longer be able to sign in.`
                  : `${user.firstName} ${user.lastName} will be able to sign in again.`}
              </p>
            </div>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <span>{apiError}</span>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={user.isActive ? 'destructive' : 'default'}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {action}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 20;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = useState<UserRecord | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserRecord | null>(null);

  // Role guard
  const isAdmin =
    currentUser?.role === Role.ADMIN ||
    currentUser?.role === Role.SUPER_ADMIN;

  const { data, isLoading, isError, error } = useQuery<PaginatedUsers>({
    queryKey: ['users', page],
    queryFn: async () => {
      const response = await api.get<PaginatedUsers>(
        `/api/v1/users?page=${page}&limit=${PAGE_SIZE}`,
      );
      return response.data;
    },
    placeholderData: (prev) => prev,
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <>
      <div className="px-6 py-8 lg:px-10">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Team members
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage user accounts and roles for your organization.
            </p>
          </div>
          {isAdmin && (
            <Button
              leftIcon={<UserPlus />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite user
            </Button>
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
              Failed to load users:{' '}
              {(error as { message?: string })?.message ?? 'Unknown error'}
            </span>
          </div>
        )}

        {/* Table card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Last login
                  </th>
                  {isAdmin && (
                    <th scope="col" className="relative py-3.5 pl-3 pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-44 animate-pulse rounded bg-slate-200" />
                          </div>
                        </div>
                      </td>
                      {[1, 2, 3].map((j) => (
                        <td key={j} className="px-3 py-4">
                          <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 5 : 4}
                      className="py-16 text-center text-sm text-slate-400"
                    >
                      No team members found.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                            {(u.firstName?.[0] ?? u.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {u.firstName} {u.lastName}
                              {u.id === currentUser?.sub && (
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge isActive={u.isActive} />
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-500">
                        {formatLastLogin(u.lastLoginAt)}
                      </td>
                      {isAdmin && (
                        <td className="py-4 pl-3 pr-6 text-right">
                          <RowActions
                            user={u}
                            currentUserId={currentUser?.sub ?? ''}
                            onChangeRole={setChangeRoleTarget}
                            onToggleActive={setToggleTarget}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <p className="text-sm text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total} members
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
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}
      {changeRoleTarget && (
        <ChangeRoleModal
          user={changeRoleTarget}
          onClose={() => setChangeRoleTarget(null)}
        />
      )}
      {toggleTarget && (
        <ConfirmToggleModal
          user={toggleTarget}
          onClose={() => setToggleTarget(null)}
        />
      )}
    </>
  );
}
