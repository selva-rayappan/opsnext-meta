import api from './api';
import type { EmailIntegration, EmailTemplate, EmailThread, EmailMessage } from './types';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface UpsertEmailIntegrationDto {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass?: string;
  smtpFromName: string;
  smtpFromEmail: string;
  smtpSecure: boolean;
  imapEnabled: boolean;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPass?: string;
}

export interface CreateEmailTemplateDto {
  name: string;
  subject: string;
  bodyHtml: string;
  isShared?: boolean;
}

export type UpdateEmailTemplateDto = Partial<CreateEmailTemplateDto>;

export interface ComposeEmailDto {
  subject: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bodyHtml: string;
  contactId?: string;
  opportunityId?: string;
}

export interface ReplyEmailDto {
  bodyHtml: string;
  toAddresses?: string[];
  ccAddresses?: string[];
}

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

export async function getEmailIntegration(): Promise<EmailIntegration | null> {
  try {
    const response = await api.get<EmailIntegration>('/api/v1/email-integrations');
    return response.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

export async function upsertEmailIntegration(
  dto: UpsertEmailIntegrationDto,
): Promise<EmailIntegration> {
  const response = await api.put<EmailIntegration>('/api/v1/email-integrations', dto);
  return response.data;
}

export async function deleteEmailIntegration(): Promise<void> {
  await api.delete('/api/v1/email-integrations');
}

export async function testEmailIntegration(
  dto: UpsertEmailIntegrationDto,
): Promise<{ success: boolean; error?: string }> {
  const response = await api.post<{ success: boolean; error?: string }>(
    '/api/v1/email-integrations/test',
    dto,
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const response = await api.get<EmailTemplate[]>('/api/v1/email-templates');
  return response.data;
}

export async function createEmailTemplate(dto: CreateEmailTemplateDto): Promise<EmailTemplate> {
  const response = await api.post<EmailTemplate>('/api/v1/email-templates', dto);
  return response.data;
}

export async function updateEmailTemplate(
  id: string,
  dto: UpdateEmailTemplateDto,
): Promise<EmailTemplate> {
  const response = await api.patch<EmailTemplate>(`/api/v1/email-templates/${id}`, dto);
  return response.data;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await api.delete(`/api/v1/email-templates/${id}`);
}

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

export async function getEmailThreads(params?: {
  contactId?: string;
  opportunityId?: string;
}): Promise<EmailThread[]> {
  const query = new URLSearchParams();
  if (params?.contactId) query.set('contactId', params.contactId);
  if (params?.opportunityId) query.set('opportunityId', params.opportunityId);
  const qs = query.toString();
  const response = await api.get<EmailThread[]>(`/api/v1/emails/threads${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getEmailThread(id: string): Promise<EmailThread> {
  const response = await api.get<EmailThread>(`/api/v1/emails/threads/${id}`);
  return response.data;
}

export async function composeEmail(dto: ComposeEmailDto): Promise<EmailThread> {
  const response = await api.post<EmailThread>('/api/v1/emails/threads', dto);
  return response.data;
}

export async function replyToThread(threadId: string, dto: ReplyEmailDto): Promise<EmailMessage> {
  const response = await api.post<EmailMessage>(`/api/v1/emails/threads/${threadId}/reply`, dto);
  return response.data;
}
