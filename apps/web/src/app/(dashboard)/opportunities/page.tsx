'use client';

import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  LayoutList,
  Columns3,
  Calendar,
  AlertTriangle,
  Briefcase,
  DollarSign,
  Sparkles,
  User,
  ArrowRight,
  TrendingDown,
  Building,
  X,
} from 'lucide-react';
import { getPipelines } from '@/lib/pipelines-api';
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  changeOpportunityStage,
  markOpportunityWon,
  markOpportunityLost,
  getForecast,
} from '@/lib/opportunities-api';
import { getAccounts } from '@/lib/accounts-api';
import { getContacts } from '@/lib/contacts-api';
import api from '@/lib/api';
import type { Opportunity, Pipeline, Stage, OpportunityStatus } from '@/lib/types';
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
// Zod Schema
// ---------------------------------------------------------------------------
const opportunitySchema = z.object({
  name: z.string().min(1, 'Opportunity name is required').max(100),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  closeDate: z.string().min(1, 'Close date is required'),
  pipelineId: z.string().min(1, 'Pipeline is required'),
  stageId: z.string().min(1, 'Stage is required'),
  contactId: z.string().optional().or(z.literal('')),
  accountId: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  probability: z.coerce.number().min(0).max(100).optional(),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

// ---------------------------------------------------------------------------
// Component Page
// ---------------------------------------------------------------------------
export default function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'board' | 'table' | 'forecast'>('board');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wonTargetId, setWonTargetId] = useState<string | null>(null);
  const [lostTargetId, setLostTargetId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Queries
  const { data: pipelines = [] } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  // Set default pipeline if none is selected
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [pipelines, selectedPipelineId]);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = selectedPipeline?.stages ?? [];

  // Query opportunities for list/board
  const { data: oppsData, isLoading: isOppsLoading } = useQuery({
    queryKey: ['opportunities', selectedPipelineId, searchQuery, statusFilter, page, activeTab],
    queryFn: () =>
      getOpportunities({
        page,
        limit: activeTab === 'board' ? 100 : 20,
        pipelineId: selectedPipelineId || undefined,
        q: searchQuery || undefined,
        status: statusFilter || undefined,
      }),
    enabled: !!selectedPipelineId,
  });

  // Query users for assignment
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

  // Query Forecast data
  const { data: forecastData, isLoading: isForecastLoading } = useQuery({
    queryKey: ['forecast', selectedPipelineId],
    queryFn: () => getForecast({ pipelineId: selectedPipelineId || undefined }),
    enabled: activeTab === 'forecast' && !!selectedPipelineId,
  });

  const opportunities = oppsData?.data ?? [];
  const total = oppsData?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: OpportunityFormValues) => {
      const dto = {
        ...data,
        contactId: data.contactId || undefined,
        accountId: data.accountId || undefined,
        ownerId: data.ownerId || undefined,
      };
      return createOpportunity(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      setShowCreateModal(false);
      setApiError(null);
    },
    onError: (err: any) => {
      setApiError(err.response?.data?.message ?? 'Failed to create opportunity.');
    },
  });

  const changeStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      changeOpportunityStage(id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
    },
  });

  const markWonMutation = useMutation({
    mutationFn: (id: string) => markOpportunityWon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      setWonTargetId(null);
    },
  });

  const markLostMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      markOpportunityLost(id, { lostReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      setLostTargetId(null);
      setLostReason('');
    },
  });

  // React Hook Form for creation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      currency: 'USD',
      probability: 50,
    },
  });

  const watchStageId = watch('stageId');
  const watchPipelineId = watch('pipelineId');

  // Handle stage default probability auto-fill
  useEffect(() => {
    if (watchStageId && selectedPipeline) {
      const currentStage = selectedPipeline.stages?.find((s) => s.id === watchStageId);
      if (currentStage) {
        setValue('probability', currentStage.probability);
      }
    }
  }, [watchStageId, selectedPipeline, setValue]);

  // Handle pipeline selection inside form
  useEffect(() => {
    if (watchPipelineId) {
      const pipe = pipelines.find((p) => p.id === watchPipelineId);
      if (pipe && pipe.stages && pipe.stages.length > 0) {
        // Automatically default to the first stage of the selected pipeline
        setValue('stageId', pipe.stages[0].id);
      }
    }
  }, [watchPipelineId, pipelines, setValue]);

  const handleOpenCreateModal = () => {
    reset({
      name: '',
      amount: 0,
      currency: 'USD',
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pipelineId: selectedPipelineId,
      stageId: stages[0]?.id ?? '',
      probability: stages[0]?.probability ?? 50,
      contactId: '',
      accountId: '',
      ownerId: '',
    });
    setShowCreateModal(true);
    setApiError(null);
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Title Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary-600" />
            Opportunities
          </h1>
          <p className="mt-1 text-sm text-slate-500">Track deals, pipeline stages, and revenue forecasting.</p>
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<Plus />}>
          Add Opportunity
        </Button>
      </div>

      {/* Toolbar / Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        {/* Navigation Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('board')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all',
              activeTab === 'board'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            )}
          >
            <Columns3 className="h-4 w-4" />
            Board
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all',
              activeTab === 'table'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            )}
          >
            <LayoutList className="h-4 w-4" />
            Table
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all',
              activeTab === 'forecast'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Forecast
          </button>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {pipelines.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipeline:</span>
              <select
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'table' && (
            <>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-48 text-sm"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 1. KANBAN BOARD VIEW */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
          {stages.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
            const totalStageValue = stageOpps.reduce((sum, o) => sum + (o.amount ?? 0), 0);

            return (
              <div
                key={stage.id}
                className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/70 p-3 border border-slate-200/50 backdrop-blur-sm"
              >
                {/* Column Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-900 truncate text-sm">{stage.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5">{stageOpps.length} deals</span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                    {formatCurrency(totalStageValue)}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 space-y-3 min-h-[400px]">
                  {stageOpps.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center p-4">
                      <span className="text-xs text-slate-400 font-medium">No deals here</span>
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <Link href={`/opportunities/${opp.id}`} className="absolute inset-0" />

                        {/* Title and Amount */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-950 truncate text-sm group-hover:text-primary-700 transition-colors">
                            {opp.name}
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900 mt-1">
                          {formatCurrency(opp.amount)}
                        </span>

                        {/* Account Name */}
                        {opp.account && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 min-w-0">
                            <Building className="h-3 w-3 shrink-0" />
                            <span className="truncate">{opp.account.name}</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatDate(opp.closeDate)}</span>
                          </div>

                          {/* Quick Stage Swapper & Actions */}
                          <div className="relative z-10 flex items-center gap-1">
                            <select
                              value={opp.stageId}
                              onChange={(e) => {
                                changeStageMutation.mutate({ id: opp.id, stageId: e.target.value });
                              }}
                              className="text-[10px] rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-slate-600 focus:outline-none"
                            >
                              {stages.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>

                            {opp.status === 'OPEN' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWonTargetId(opp.id);
                                  }}
                                  className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700 hover:bg-green-100"
                                >
                                  Won
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLostTargetId(opp.id);
                                  }}
                                  className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-100"
                                >
                                  Lost
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 2. TABLE VIEW */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'table' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Deal Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stage
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Probability
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Close Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Owner
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-slate-400 font-medium">
                      No opportunities found.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-semibold text-slate-900">
                        <Link href={`/opportunities/${opp.id}`} className="hover:text-primary-600 hover:underline">
                          {opp.name}
                        </Link>
                        {opp.account && (
                          <div className="text-xs text-slate-500 font-normal mt-0.5">
                            {opp.account.name}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(opp.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                        {opp.stage?.name ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 font-medium">
                        {opp.probability}%
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                            opp.status === 'WON'
                              ? 'bg-green-50 text-green-700 ring-green-200'
                              : opp.status === 'LOST'
                              ? 'bg-red-50 text-red-700 ring-red-200'
                              : 'bg-blue-50 text-blue-700 ring-blue-200',
                          )}
                        >
                          {opp.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {formatDate(opp.closeDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {opp.owner ? (
                          <div className="flex items-center gap-2">
                            <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', avatarColor(`${opp.owner.firstName} ${opp.owner.lastName}`))}>
                              {getInitials(opp.owner.firstName, opp.owner.lastName)}
                            </div>
                            <span className="text-slate-700 text-xs font-medium">{opp.owner.firstName} {opp.owner.lastName}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium pr-6">
                        <Link href={`/opportunities/${opp.id}`} className="text-primary-600 hover:text-primary-900">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} ({total} opportunities)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 3. FORECAST VIEW */}
      {/* ------------------------------------------------------------------------- */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {isForecastLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
          ) : forecastData ? (
            <>
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Pipeline Value</span>
                      <span className="text-2xl font-bold text-slate-900 mt-0.5">
                        {formatCurrency(forecastData.summary.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected Value (Weighted)</span>
                      <span className="text-2xl font-bold text-slate-900 mt-0.5">
                        {formatCurrency(forecastData.summary.expectedValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Deals Scoped</span>
                      <span className="text-2xl font-bold text-slate-900 mt-0.5">
                        {forecastData.summary.count} Opportunities
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly CSS Bar Chart & Table Split */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Visual CSS Chart (2/3 col) */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary-500" />
                    Weighted Forecast Chart
                  </h3>

                  {forecastData.monthly.length === 0 ? (
                    <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
                      No forecast periods found in pipeline.
                    </div>
                  ) : (
                    <div className="flex h-64 items-end gap-6 border-b border-l border-slate-200 pb-2 pl-4">
                      {forecastData.monthly.map((m) => {
                        // Max value calculation for scaling
                        const maxVal = Math.max(...forecastData.monthly.map((item) => item.totalValue), 1000);
                        const totalPercent = (m.totalValue / maxVal) * 100;
                        const expectedPercent = (m.expectedValue / maxVal) * 100;

                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none bg-slate-950 text-white rounded px-2.5 py-1.5 text-[10px] font-medium z-10 transition-opacity flex flex-col gap-0.5 shadow-lg w-32 border border-slate-800">
                              <span className="font-bold text-slate-300">{m.month}</span>
                              <span>Deals: {m.count}</span>
                              <span>Total: {formatCurrency(m.totalValue)}</span>
                              <span className="text-emerald-400">Exp: {formatCurrency(m.expectedValue)}</span>
                            </div>

                            {/* Side-by-side CSS bars */}
                            <div className="flex items-end gap-1.5 w-full h-full">
                              <div
                                style={{ height: `${totalPercent}%` }}
                                className="flex-1 bg-gradient-to-t from-primary-700 to-primary-500 rounded-t shadow-sm transition-all duration-300"
                              />
                              <div
                                style={{ height: `${expectedPercent}%` }}
                                className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t shadow-sm transition-all duration-300"
                              />
                            </div>

                            <span className="text-[10px] font-bold text-slate-500 tracking-tight mt-1">{m.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-500 justify-center">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded bg-primary-600" />
                      Total Deal Value
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded bg-emerald-500" />
                      Expected (Weighted) Revenue
                    </div>
                  </div>
                </div>

                {/* Table Data (1/3 col) */}
                <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Period Summary</h3>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                      {forecastData.monthly.map((m) => (
                        <div key={m.month} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-900">{m.month}</span>
                            <span className="text-slate-400">{m.count} deals</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-semibold text-slate-900">{formatCurrency(m.totalValue)}</span>
                            <span className="text-emerald-600 font-bold">Exp: {formatCurrency(m.expectedValue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-sm">
              <span className="text-slate-400 text-sm">No data available for forecasting.</span>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 4. ADD OPPORTUNITY MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="opp-create-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 id="opp-create-title" className="text-lg font-semibold text-slate-900">
                New Opportunity
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(async (values) => {
                await createMutation.mutateAsync(values);
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
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500"
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Contact</label>
                    <select
                      {...register('contactId')}
                      className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500"
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
                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Create Opportunity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WON confirmation Modal */}
      {wonTargetId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setWonTargetId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Celebrate Deal Won!
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to mark this deal as closed won? This will transition the opportunity stage and log the transaction.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setWonTargetId(null)}>
                Cancel
              </Button>
              <Button
                variant="default"
                loading={markWonMutation.isPending}
                onClick={() => markWonMutation.mutate(wonTargetId)}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark Won
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LOST confirmation Modal */}
      {lostTargetId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setLostTargetId(null)} />
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
              <Button variant="outline" onClick={() => setLostTargetId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!lostReason.trim()}
                loading={markLostMutation.isPending}
                onClick={() => markLostMutation.mutate({ id: lostTargetId, reason: lostReason })}
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
