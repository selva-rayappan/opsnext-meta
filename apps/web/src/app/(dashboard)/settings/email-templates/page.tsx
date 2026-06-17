'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, AlertTriangle, FileText } from 'lucide-react';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '@/lib/email-api';
import type { EmailTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  bodyHtml: z.string().min(1, 'Body is required'),
  isShared: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

// ---------------------------------------------------------------------------
// Template form (right panel)
// ---------------------------------------------------------------------------
function TemplateEditor({
  template,
  onSaved,
  onCancel,
}: {
  template: EmailTemplate | null; // null = new
  onSaved: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? '',
      subject: template?.subject ?? '',
      bodyHtml: template?.bodyHtml ?? '',
      isShared: template?.isShared ?? false,
    },
  });

  // Reset when switching templates
  useEffect(() => {
    reset({
      name: template?.name ?? '',
      subject: template?.subject ?? '',
      bodyHtml: template?.bodyHtml ?? '',
      isShared: template?.isShared ?? false,
    });
    setApiError(null);
  }, [template, reset]);

  const mutation = useMutation({
    mutationFn: (values: TemplateFormValues) =>
      template
        ? updateEmailTemplate(template.id, values)
        : createEmailTemplate(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      onSaved();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to save template.');
    },
  });

  async function onSubmit(values: TemplateFormValues) {
    setApiError(null);
    await mutation.mutateAsync(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {template ? 'Edit Template' : 'New Template'}
        </h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
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
          label="Template Name"
          required
          placeholder="e.g. Welcome Email"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Subject"
          required
          placeholder="e.g. Welcome to OpsNext!"
          error={errors.subject?.message}
          {...register('subject')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Body <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-slate-400">(HTML is supported)</span>
          </label>
          <textarea
            rows={14}
            placeholder="<p>Hello {{firstName}},</p>"
            className={cn(
              'block w-full rounded-md border bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-y',
              errors.bodyHtml ? 'border-red-400' : 'border-slate-300 hover:border-slate-400',
            )}
            {...register('bodyHtml')}
          />
          {errors.bodyHtml && (
            <p className="text-xs text-red-600">{errors.bodyHtml.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600"
            {...register('isShared')}
          />
          Share with all team members
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {template ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: getEmailTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      if (selectedId === deletedId) setSelectedId(null);
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setDeleteError(typeof message === 'string' ? message : 'Failed to delete template.');
    },
  });

  const selectedTemplate =
    selectedId && selectedId !== 'new'
      ? (templates.find((t) => t.id === selectedId) ?? null)
      : null;

  const showEditor = selectedId !== null;

  return (
    <div className="flex h-full flex-col px-6 py-8 lg:px-10">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Email Templates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create and manage reusable email templates for your team.
        </p>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{deleteError}</span>
        </div>
      )}

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left sidebar */}
        <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Templates</span>
            <Button
              size="sm"
              leftIcon={<Plus />}
              onClick={() => setSelectedId('new')}
            >
              New
            </Button>
          </div>

          {isLoading ? (
            <div className="flex-1 space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <FileText className="h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="text-sm text-slate-400">No templates yet.</p>
              <Button size="sm" leftIcon={<Plus />} onClick={() => setSelectedId('new')}>
                Create First Template
              </Button>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors',
                      selectedId === t.id
                        ? 'bg-primary-50'
                        : 'hover:bg-slate-50',
                    )}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <span
                      className={cn(
                        'text-sm font-medium',
                        selectedId === t.id ? 'text-primary-700' : 'text-slate-900',
                      )}
                    >
                      {t.name}
                    </span>
                    <span className="truncate text-xs text-slate-400 w-full">{t.subject}</span>
                    {t.isShared && (
                      <span className="mt-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        Shared
                      </span>
                    )}
                  </button>

                  {selectedId === t.id && (
                    <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2">
                      <button
                        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors"
                        onClick={() => setSelectedId(t.id)}
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100 transition-colors"
                        disabled={deleteMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteError(null);
                          deleteMutation.mutate(t.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {showEditor ? (
            <TemplateEditor
              template={selectedId === 'new' ? null : selectedTemplate}
              onSaved={() => setSelectedId(null)}
              onCancel={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <FileText className="h-10 w-10 text-slate-200" aria-hidden="true" />
              <p className="text-sm text-slate-400">
                Select a template to edit, or create a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
