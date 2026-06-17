'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, AlertTriangle, Send } from 'lucide-react';
import {
  getEmailTemplates,
  composeEmail,
  replyToThread,
} from '@/lib/email-api';
import type { EmailThread } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId?: string;
  opportunityId?: string;
  contactEmail?: string;
  mode: 'compose' | 'reply';
  threadId?: string;
  threadSubject?: string;
  onSuccess?: (thread: EmailThread) => void;
}

// ---------------------------------------------------------------------------
// Email chip input — enter or comma-separated email addresses
// ---------------------------------------------------------------------------
function EmailChipInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState('');

  function addEmail(raw: string) {
    const trimmed = raw.trim().replace(/,$/, '');
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputVal);
    } else if (e.key === 'Backspace' && inputVal === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    if (inputVal.trim()) addEmail(inputVal);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex min-h-[2.25rem] flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:border-slate-400 focus-within:border-transparent focus-within:ring-2 focus-within:ring-primary-600">
        {value.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700"
          >
            {email}
            <button
              type="button"
              onClick={() => onChange(value.filter((e) => e !== email))}
              className="rounded-full p-0.5 hover:opacity-70 transition-opacity"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[8rem] bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <p className="text-xs text-slate-400">Press Enter or comma to add each address.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export default function EmailComposeModal({
  isOpen,
  onClose,
  contactId,
  opportunityId,
  contactEmail,
  mode,
  threadId,
  threadSubject,
  onSuccess,
}: EmailComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [bodyHtml, setBodyHtml] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  // Pre-fill when modal opens
  useEffect(() => {
    if (isOpen) {
      setToAddresses(contactEmail ? [contactEmail] : []);
      setSubject(mode === 'reply' && threadSubject ? `Re: ${threadSubject}` : '');
      setCcAddresses([]);
      setBodyHtml('');
      setSelectedTemplateId('');
      setApiError(null);
    }
  }, [isOpen, contactEmail, mode, threadSubject]);

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: getEmailTemplates,
    enabled: isOpen,
  });

  // Apply template selection
  useEffect(() => {
    if (!selectedTemplateId) return;
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (tpl) {
      if (mode === 'compose') setSubject(tpl.subject);
      setBodyHtml(tpl.bodyHtml);
    }
  }, [selectedTemplateId, templates, mode]);

  const composeMutation = useMutation({
    mutationFn: () =>
      composeEmail({
        subject,
        toAddresses,
        ccAddresses: ccAddresses.length ? ccAddresses : undefined,
        bodyHtml,
        contactId,
        opportunityId,
      }),
    onSuccess: (thread) => {
      onSuccess?.(thread);
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to send email.');
    },
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToThread(threadId!, {
        bodyHtml,
        toAddresses: toAddresses.length ? toAddresses : undefined,
        ccAddresses: ccAddresses.length ? ccAddresses : undefined,
      }),
    onSuccess: (message) => {
      // Wrap as partial EmailThread for onSuccess callback
      onSuccess?.({ id: threadId! } as EmailThread);
      // Suppress "message" unused warning - we don't need its content
      void message;
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setApiError(typeof message === 'string' ? message : 'Failed to send reply.');
    },
  });

  const isPending = composeMutation.isPending || replyMutation.isPending;

  function handleSend() {
    setApiError(null);
    if (mode === 'compose') {
      composeMutation.mutate();
    } else {
      replyMutation.mutate();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 py-6"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="compose-modal-title" className="text-base font-semibold text-slate-900">
            {mode === 'compose' ? 'Compose Email' : 'Reply to Thread'}
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

          {/* Template selector */}
          {templates.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="template-select" className="text-sm font-medium text-slate-700">
                Use Template
              </label>
              <select
                id="template-select"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              >
                <option value="">— Select a template —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject (hidden in reply mode) */}
          {mode === 'compose' && (
            <Input
              label="Subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          )}

          {/* To */}
          <EmailChipInput
            label="To"
            value={toAddresses}
            onChange={setToAddresses}
            placeholder="recipient@example.com"
          />

          {/* CC */}
          <EmailChipInput
            label="CC"
            value={ccAddresses}
            onChange={setCcAddresses}
            placeholder="cc@example.com (optional)"
          />

          {/* Body */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Body{' '}
              <span className="text-xs font-normal text-slate-400">(HTML is supported)</span>
            </label>
            <textarea
              rows={10}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<p>Hello,</p>"
              className={cn(
                'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400',
                'hover:border-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-600 resize-y',
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            leftIcon={<Send />}
            loading={isPending}
            disabled={isPending || toAddresses.length === 0 || !bodyHtml.trim()}
            onClick={handleSend}
          >
            {mode === 'compose' ? 'Send Email' : 'Send Reply'}
          </Button>
        </div>
      </div>
    </div>
  );
}
