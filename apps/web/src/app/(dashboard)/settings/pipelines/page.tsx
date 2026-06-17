'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  FolderOpen,
  Layers,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Role } from '@opsnext/shared';
import {
  getPipelines,
  createPipeline,
  updatePipeline,
  deletePipeline,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from '@/lib/pipelines-api';
import type { Pipeline, Stage, StageType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const pipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100),
  isDefault: z.boolean().optional(),
});

type PipelineFormValues = z.infer<typeof pipelineSchema>;

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').max(100),
  probability: z.coerce.number().min(0).max(100),
  stageType: z.enum(['OPEN', 'WON', 'LOST']),
});

type StageFormValues = z.infer<typeof stageSchema>;

// ---------------------------------------------------------------------------
// Settings Tab Sub-navigation Helper
// ---------------------------------------------------------------------------
function SettingsHeader() {
  const pathname = usePathname();
  const isActiveUsers = pathname === '/settings/users';
  const isActivePipelines = pathname === '/settings/pipelines';

  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        <Link
          href="/settings/users"
          className={cn(
            'border-b-2 py-4 px-1 text-sm font-medium transition-colors',
            isActiveUsers
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
          )}
        >
          Users & Roles
        </Link>
        <Link
          href="/settings/pipelines"
          className={cn(
            'border-b-2 py-4 px-1 text-sm font-medium transition-colors',
            isActivePipelines
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
          )}
        >
          Pipelines & Stages
        </Link>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function PipelinesSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [pipelineModal, setPipelineModal] = useState<{ open: boolean; pipeline?: Pipeline }>({
    open: false,
  });
  const [stageModal, setStageModal] = useState<{ open: boolean; stage?: Stage }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pipeline' | 'stage'; id: string; name: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Role guard: Only Admins, Super Admins, and Sales Managers can view/modify
  const hasAccess =
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN ||
    user?.role === Role.SALES_MANAGER;

  // Query pipelines
  const { data: pipelines = [], isLoading, isError, error } = useQuery<Pipeline[]>({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
    enabled: hasAccess,
  });

  // Set default selected pipeline once loaded
  React.useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [pipelines, selectedPipelineId]);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = selectedPipeline?.stages ?? [];

  // Mutations
  const pipelineMutation = useMutation({
    mutationFn: (data: PipelineFormValues) => {
      if (pipelineModal.pipeline) {
        return updatePipeline(pipelineModal.pipeline.id, data);
      }
      return createPipeline(data);
    },
    onSuccess: (newPipeline) => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      if (!selectedPipelineId) {
        setSelectedPipelineId(newPipeline.id);
      }
      setPipelineModal({ open: false });
      setApiError(null);
    },
    onError: (err: any) => {
      setApiError(err.response?.data?.message ?? 'Failed to save pipeline.');
    },
  });

  const stageMutation = useMutation({
    mutationFn: (data: StageFormValues) => {
      if (!selectedPipelineId) throw new Error('No selected pipeline');
      if (stageModal.stage) {
        return updateStage(selectedPipelineId, stageModal.stage.id, data);
      }
      return createStage(selectedPipelineId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setStageModal({ open: false });
      setApiError(null);
    },
    onError: (err: any) => {
      setApiError(err.response?.data?.message ?? 'Failed to save stage.');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => updatePipeline(id, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === 'pipeline') {
        await deletePipeline(deleteTarget.id);
      } else {
        if (!selectedPipelineId) return;
        await deleteStage(selectedPipelineId, deleteTarget.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      if (deleteTarget?.type === 'pipeline' && deleteTarget.id === selectedPipelineId) {
        setSelectedPipelineId(null);
      }
      setDeleteTarget(null);
      setApiError(null);
    },
    onError: (err: any) => {
      setApiError(err.response?.data?.message ?? 'Failed to delete item.');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (stageIds: string[]) => {
      if (!selectedPipelineId) throw new Error('No selected pipeline');
      return reorderStages(selectedPipelineId, { stageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if (!selectedPipelineId) return;
    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    // Swap stages
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    reorderMutation.mutate(newStages.map((s) => s.id));
  };

  // ---------------------------------------------------------------------------
  // Forms Hook
  // ---------------------------------------------------------------------------
  const { register: registerPipeline, handleSubmit: handlePipelineSubmit, reset: resetPipeline, formState: { errors: pipelineErrors } } = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineSchema),
  });

  const { register: registerStage, handleSubmit: handleStageSubmit, reset: resetStage, formState: { errors: stageErrors } } = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
  });

  const openPipelineModal = (pipeline?: Pipeline) => {
    resetPipeline({
      name: pipeline?.name ?? '',
      isDefault: pipeline?.isDefault ?? false,
    });
    setPipelineModal({ open: true, pipeline });
    setApiError(null);
  };

  const openStageModal = (stage?: Stage) => {
    resetStage({
      name: stage?.name ?? '',
      probability: stage?.probability ?? 50,
      stageType: stage?.stageType ?? 'OPEN',
    });
    setStageModal({ open: true, stage });
    setApiError(null);
  };

  if (!hasAccess) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-lg font-semibold text-red-800">Access Denied</h2>
          <p className="mt-2 text-sm text-red-600">
            You do not have the required permissions to access pipeline configuration settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Configure team workspace preferences and systems.</p>
      </div>

      <SettingsHeader />

      {/* Main Container */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipelines Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary-600" />
              Pipelines
            </h2>
            <Button
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => openPipelineModal()}
            >
              Add
            </Button>
          </div>

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load pipelines: {(error as Error)?.message}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pipelines.map((pipeline) => {
                const isSelected = pipeline.id === selectedPipelineId;
                return (
                  <div
                    key={pipeline.id}
                    onClick={() => setSelectedPipelineId(pipeline.id)}
                    className={cn(
                      'group relative flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200',
                      isSelected
                        ? 'border-primary-600 bg-primary-50/40 shadow-sm ring-1 ring-primary-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-12">
                      <span className="font-medium text-slate-950 truncate">{pipeline.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {pipeline.stages?.length ?? 0} stages
                        </span>
                        {pipeline.isDefault && (
                          <span className="inline-flex items-center rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!pipeline.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDefaultMutation.mutate(pipeline.id);
                          }}
                          title="Set as Default"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-primary-700 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPipelineModal(pipeline);
                        }}
                        title="Rename"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ type: 'pipeline', id: pipeline.id, name: pipeline.name });
                          setApiError(null);
                        }}
                        disabled={pipeline.isDefault}
                        title={pipeline.isDefault ? 'Cannot delete default pipeline' : 'Delete Pipeline'}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stages Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {selectedPipeline ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary-600" />
                    {selectedPipeline.name} Stages
                  </h2>
                  <p className="text-xs text-slate-500">Reorder, edit, or configure deal progression stages.</p>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => openStageModal()}
                >
                  Add Stage
                </Button>
              </div>

              {stages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-sm">
                  <Layers className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">No stages configured</h3>
                  <p className="mt-2 text-xs text-slate-500">Configure at least one stage to activate this pipeline.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => openStageModal()}
                  >
                    Add First Stage
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stages.map((stage, index) => {
                    const isFirst = index === 0;
                    const isLast = index === stages.length - 1;

                    return (
                      <div
                        key={stage.id}
                        className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={isFirst}
                              onClick={() => handleMoveStage(index, 'up')}
                              className="rounded hover:bg-slate-100 p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => handleMoveStage(index, 'down')}
                              className="rounded hover:bg-slate-100 p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-950 truncate">
                              {stage.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 font-medium">
                                Win Probability: {stage.probability}%
                              </span>
                              <span className="text-slate-200">•</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    stage.stageType === 'WON'
                                      ? 'bg-green-500'
                                      : stage.stageType === 'LOST'
                                      ? 'bg-red-500'
                                      : 'bg-blue-500',
                                  )}
                                />
                                {stage.stageType}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openStageModal(stage)}
                            title="Edit Stage"
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ type: 'stage', id: stage.id, name: stage.name });
                              setApiError(null);
                            }}
                            title="Delete Stage"
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
              <span className="text-slate-400 text-sm">Select or create a pipeline to configure its stages.</span>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Form Modal */}
      {pipelineModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pipeline-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setPipelineModal({ open: false })}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 id="pipeline-modal-title" className="text-lg font-semibold text-slate-900">
                {pipelineModal.pipeline ? 'Rename Pipeline' : 'Create Pipeline'}
              </h3>
              <button
                onClick={() => setPipelineModal({ open: false })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <Trash2 className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={handlePipelineSubmit(async (values) => {
                await pipelineMutation.mutateAsync(values);
              })}
            >
              <div className="p-6 space-y-4">
                {apiError && (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {apiError}
                  </div>
                )}

                <div>
                  <label htmlFor="pipelineName" className="block text-sm font-semibold text-slate-700 mb-1">
                    Pipeline Name
                  </label>
                  <Input
                    id="pipelineName"
                    type="text"
                    {...registerPipeline('name')}
                    placeholder="e.g. Inside Sales, Enterprise"
                  />
                  {pipelineErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{pipelineErrors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/50">
                <Button variant="outline" type="button" onClick={() => setPipelineModal({ open: false })}>
                  Cancel
                </Button>
                <Button type="submit" loading={pipelineMutation.isPending}>
                  {pipelineModal.pipeline ? 'Save Changes' : 'Create Pipeline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage Form Modal */}
      {stageModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="stage-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setStageModal({ open: false })}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 id="stage-modal-title" className="text-lg font-semibold text-slate-900">
                {stageModal.stage ? 'Edit Stage' : 'Create Stage'}
              </h3>
              <button
                onClick={() => setStageModal({ open: false })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <Trash2 className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={handleStageSubmit(async (values) => {
                await stageMutation.mutateAsync(values);
              })}
            >
              <div className="p-6 space-y-4">
                {apiError && (
                  <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {apiError}
                  </div>
                )}

                <div>
                  <label htmlFor="stageName" className="block text-sm font-semibold text-slate-700 mb-1">
                    Stage Name
                  </label>
                  <Input
                    id="stageName"
                    type="text"
                    {...registerStage('name')}
                    placeholder="e.g. Qualification, Proposal Sent"
                  />
                  {stageErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{stageErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="probability" className="block text-sm font-semibold text-slate-700 mb-1">
                    Win Probability (%)
                  </label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    {...registerStage('probability')}
                    placeholder="0-100"
                  />
                  {stageErrors.probability && (
                    <p className="mt-1 text-xs text-red-600">{stageErrors.probability.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="stageType" className="block text-sm font-semibold text-slate-700 mb-1">
                    Stage Type
                  </label>
                  <select
                    id="stageType"
                    {...registerStage('stageType')}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="OPEN">OPEN (Pipeline Active)</option>
                    <option value="WON">WON (Closed Won)</option>
                    <option value="LOST">LOST (Closed Lost)</option>
                  </select>
                  {stageErrors.stageType && (
                    <p className="mt-1 text-xs text-red-600">{stageErrors.stageType.message}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/50">
                <Button variant="outline" type="button" onClick={() => setStageModal({ open: false })}>
                  Cancel
                </Button>
                <Button type="submit" loading={stageMutation.isPending}>
                  {stageModal.stage ? 'Save Changes' : 'Create Stage'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 id="confirm-delete-title" className="text-base font-semibold text-slate-900">
                    Delete {deleteTarget.type === 'pipeline' ? 'Pipeline' : 'Stage'}?
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteTarget.name}"</span>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {apiError && (
                <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
