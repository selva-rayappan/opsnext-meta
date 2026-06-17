'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronLeft,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  Clock,
  Sparkles,
  TrendingDown,
  Trash2,
  Edit2,
  AlertTriangle,
  History,
  Check,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { getPipelines } from '@/lib/pipelines-api';
import {
  getOpportunity,
  updateOpportunity,
  deleteOpportunity,
  markOpportunityWon,
  markOpportunityLost,
} from '@/lib/opportunities-api';
import ActivityTimeline from '@/components/activity-timeline';
import { getAccounts } from '@/lib/accounts-api';
import { getContacts } from '@/lib/contacts-api';
import api from '@/lib/api';
import type { Opportunity, Pipeline, Stage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;

  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------
const updateOpportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required').max(100),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  closeDate: z.string().min(1, 'Close date is required'),
  pipelineId: z.string().min(1, 'Pipeline is required'),
  stageId: z.string().min(1, 'Stage is required'),
  contactId: z.string().optional().or(z.literal('')),
  accountId: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  probability: z.coerce.number().min(0).max(100).optional(),
});

type UpdateOpportunityFormValues = z.infer<typeof updateOpportunitySchema>;

// ---------------------------------------------------------------------------
// Main Detail Page
// ---------------------------------------------------------------------------
export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Queries
  const { data: opp, isLoading, isError } = useQuery<Opportunity>({
    queryKey: ['opportunity', params.id],
    queryFn: () => getOpportunity(params.id),
  });

  const { data: pipelines = [] } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  // Query users for selection
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/api/v1/users?limit=100');
      return res.data;
    },
  });
  const users = usersData?.data ?? [];

  // Query accounts
  const { data: accountsData } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => getAccounts({ limit: 100 }),
  });
  const accounts = accountsData?.data ?? [];

  // Query contacts
  const { data: contactsData } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => getContacts({ limit: 100 }),
  });
  const contacts = contactsData?.data ?? [];

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: UpdateOpportunityFormValues) => {
      const dto = {
        ...data,
        contactId: data.contactId || null,
        accountId: data.accountId || null,
        ownerId: data.ownerId || null,
      } as any;
      return updateOpportunity(params.id, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', params.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowEditModal(false);
      setApiError(null);
    },
    onError: (err: any) => {
      setApiError(err.response?.data?.message ?? 'Failed to update opportunity.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOpportunity(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      router.push('/opportunities');
    },
  });

  const markWonMutation = useMutation({
    mutationFn: () => markOpportunityWon(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', params.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowWonModal(false);
    },
  });

  const markLostMutation = useMutation({
    mutationFn: (reason: string) => markOpportunityLost(params.id, { lostReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', params.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowLostModal(false);
      setLostReason('');
    },
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOpportunityFormValues>({
    resolver: zodResolver(updateOpportunitySchema),
  });

  const formPipelineId = watch('pipelineId');
  const formStageId = watch('stageId');

  const selectedPipeline = pipelines.find((p) => p.id === (formPipelineId || opp?.pipelineId));
  const stages = selectedPipeline?.stages ?? [];

  // Prefill probability when stage changes in form
  React.useEffect(() => {
    if (formStageId && selectedPipeline) {
      const currentStage = selectedPipeline.stages?.find((s) => s.id === formStageId);
      if (currentStage) {
        setValue('probability', currentStage.probability);
      }
    }
  }, [formStageId, selectedPipeline, setValue]);

  const handleOpenEditModal = () => {
    if (!opp) return;
    reset({
      name: opp.name,
      amount: opp.amount ?? 0,
      closeDate: new Date(opp.closeDate).toISOString().split('T')[0],
      pipelineId: opp.pipelineId,
      stageId: opp.stageId,
      probability: opp.probability,
      contactId: opp.contactId ?? '',
      accountId: opp.accountId ?? '',
      ownerId: opp.ownerId ?? '',
    });
    setShowEditModal(true);
    setApiError(null);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8 lg:px-10 space-y-6">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="col-span-1 h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (isError || !opp) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-lg font-semibold text-red-800">Opportunity not found</h2>
          <p className="mt-2 text-sm text-red-600">The requested opportunity ID does not exist or you lack permission.</p>
          <Link href="/opportunities" className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline">
            Go back to list
          </Link>
        </div>
      </div>
    );
  }

  const stageHistory = opp.stageHistory ?? [];

  return (
    <div className="px-6 py-8 lg:px-10 space-y-6">
      {/* Back Link */}
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Opportunities
      </Link>

      {/* Header Info Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                opp.status === 'WON'
                  ? 'bg-green-50 text-green-700 ring-green-200'
                  : opp.status === 'LOST'
                  ? 'bg-red-50 text-red-700 ring-red-200'
                  : 'bg-blue-50 text-blue-700 ring-blue-200',
              )}
            >
              {opp.status}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Pipeline: {opp.pipeline?.name}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 truncate">{opp.name}</h1>
          <span className="mt-1 block text-3xl font-extrabold text-slate-950">
            {formatCurrency(opp.amount)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {opp.status === 'OPEN' && (
            <>
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => setShowWonModal(true)}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Mark Won
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setShowLostModal(true)}
                leftIcon={<TrendingDown className="h-4 w-4" />}
              >
                Mark Lost
              </Button>
            </>
          )}

          <Button variant="outline" onClick={handleOpenEditModal} leftIcon={<Edit2 className="h-4 w-4" />}>
            Edit
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Details and Stage History Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: General Info & Relationships */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-500" />
              General Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div className="flex flex-col gap-1">
                <span>Close Date</span>
                <span className="text-slate-800 font-bold text-sm">{formatDate(opp.closeDate)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span>Win Probability</span>
                <span className="text-slate-800 font-bold text-sm">{opp.probability}%</span>
              </div>

              <div className="flex flex-col gap-1">
                <span>Current Stage</span>
                <span className="text-slate-800 font-bold text-sm">{opp.stage?.name}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span>Assignee</span>
                <span className="text-slate-800 font-bold text-sm">
                  {opp.owner ? `${opp.owner.firstName} ${opp.owner.lastName}` : 'Unassigned'}
                </span>
              </div>

              {opp.status === 'LOST' && opp.lostReason && (
                <div className="col-span-2 flex flex-col gap-1 rounded-lg bg-red-50 p-3 border border-red-200 text-red-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Lost Reason</span>
                  <span className="text-sm font-semibold">{opp.lostReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Relationships Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-primary-600" />
                Contact Relationship
              </h3>

              {opp.contact ? (
                <div className="space-y-3">
                  <span className="block font-semibold text-slate-950 text-sm">
                    {opp.contact.firstName} {opp.contact.lastName}
                  </span>
                  <Link href={`/contacts`} className="inline-flex text-xs font-semibold text-primary-600 hover:underline">
                    View contact details
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">No contact linked.</div>
              )}
            </div>

            {/* Account Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-primary-600" />
                Account Relationship
              </h3>

              {opp.account ? (
                <div className="space-y-3">
                  <span className="block font-semibold text-slate-950 text-sm">{opp.account.name}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">No account linked.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Stage History Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary-500" />
              Stage Progression
            </h2>

            {stageHistory.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium py-10">
                No stage transition logs available.
              </div>
            ) : (
              <div className="flex-1 flow-root">
                <ul className="-mb-8">
                  {stageHistory.map((item, idx) => {
                    const isLast = idx === stageHistory.length - 1;
                    const timeSpent = !isLast && item.changedAt
                      ? formatDuration(stageHistory[idx + 1].changedAt, item.changedAt)
                      : null;

                    return (
                      <li key={item.id}>
                        <div className="relative pb-8">
                          {!isLast && (
                            <span
                              className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
                                <History className="h-4 w-4 text-slate-500" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-950">
                                {item.fromStage ? (
                                  <span className="flex items-center gap-1.5 flex-wrap">
                                    {item.fromStage.name}
                                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="text-primary-700">{item.toStage?.name}</span>
                                  </span>
                                ) : (
                                  <span>Opportunity Created in <span className="text-primary-700">{item.toStage?.name}</span></span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">
                                by {item.changedBy ? `${item.changedBy.firstName} ${item.changedBy.lastName}` : 'System'}
                                {item.changedAt && ` • ${formatDate(item.changedAt)} at ${formatTime(item.changedAt)}`}
                              </p>
                              {timeSpent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600 mt-2">
                                  <Clock className="h-2.5 w-2.5" />
                                  Time spent in stage: {timeSpent}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <ActivityTimeline opportunityId={opp.id} />
        </div>
      </div>

      {/* Edit Opportunity Modal */}
      {showEditModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Opportunity</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <Trash2 className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(async (values) => {
                await updateMutation.mutateAsync(values);
              })}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                {apiError && (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {apiError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Deal Name *</label>
                    <Input {...register('name')} placeholder="e.g. Acme Enterprise Deal" />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Amount ($ USD) *</label>
                    <Input type="number" step="0.01" {...register('amount')} placeholder="e.g. 5000" />
                    {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Close Date *</label>
                    <Input type="date" {...register('closeDate')} />
                    {errors.closeDate && <p className="mt-1 text-xs text-red-600">{errors.closeDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pipeline *</label>
                    <select
                      {...register('pipelineId')}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none"
                    >
                      {pipelines.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Stage *</label>
                    <select
                      {...register('stageId')}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none"
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.probability}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Win Probability (%)</label>
                    <Input type="number" min="0" max="100" {...register('probability')} placeholder="0-100" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee / Owner</label>
                    <select
                      {...register('ownerId')}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500"
                    >
                      <option value="">Select assignee...</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Account Relationship</label>
                    <select
                      {...register('accountId')}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                    >
                      <option value="">Select account...</option>
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Relation</label>
                    <select
                      {...register('contactId')}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                    >
                      <option value="">Select contact...</option>
                      {contacts.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/50">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Opportunity confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Opportunity?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800">&ldquo;{opp.name}&rdquo;</span>?
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* WON confirmation Modal */}
      {showWonModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowWonModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Celebrate Deal Won!
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to mark this deal as closed won? This will transition the opportunity stage and log the transaction.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowWonModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                loading={markWonMutation.isPending}
                onClick={() => markWonMutation.mutate()}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark Won
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LOST confirmation Modal */}
      {showLostModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowLostModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Closed Lost Reason
            </h3>
            <p className="mt-1 text-sm text-slate-500">Please provide a reason why this opportunity was lost.</p>

            <Input
              type="text"
              placeholder="e.g. Budget constraints, Competitor selected"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="mt-4 text-sm"
            />

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowLostModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!lostReason.trim()}
                loading={markLostMutation.isPending}
                onClick={() => markLostMutation.mutate(lostReason)}
              >
                Mark Lost
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
