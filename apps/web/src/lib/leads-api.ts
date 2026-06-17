import api from './api';
import type {
  Lead,
  LeadStatus,
  PaginatedResponse,
  CreateLeadDto,
  UpdateLeadDto,
  ConvertLeadDto,
} from './types';

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------
export interface GetLeadsParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: LeadStatus | '';
  ownerId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Convert result
// ---------------------------------------------------------------------------
export interface ConvertLeadResult {
  contactId: string;
  opportunityId?: string;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export async function getLeads(
  params: GetLeadsParams = {},
): Promise<PaginatedResponse<Lead>> {
  const {
    page = 1,
    limit = 25,
    q,
    status,
    ownerId,
    sortBy = 'createdAt',
    order = 'desc',
  } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    order,
  });

  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (ownerId) query.set('ownerId', ownerId);

  const response = await api.get<PaginatedResponse<Lead>>(
    `/api/v1/leads?${query.toString()}`,
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Single
// ---------------------------------------------------------------------------
export async function getLead(id: string): Promise<Lead> {
  const response = await api.get<Lead>(`/api/v1/leads/${id}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createLead(dto: CreateLeadDto): Promise<Lead> {
  const response = await api.post<Lead>('/api/v1/leads', dto);
  return response.data;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateLead(id: string, dto: UpdateLeadDto): Promise<Lead> {
  const response = await api.patch<Lead>(`/api/v1/leads/${id}`, dto);
  return response.data;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
export async function deleteLead(id: string): Promise<void> {
  await api.delete(`/api/v1/leads/${id}`);
}

// ---------------------------------------------------------------------------
// Change status
// ---------------------------------------------------------------------------
export async function changeLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead> {
  const response = await api.patch<Lead>(`/api/v1/leads/${id}/status`, { status });
  return response.data;
}

// ---------------------------------------------------------------------------
// Convert
// ---------------------------------------------------------------------------
export async function convertLead(
  id: string,
  dto: ConvertLeadDto,
): Promise<ConvertLeadResult> {
  const response = await api.post<{
    lead: any;
    contact: { id: string };
    opportunity?: { id: string };
  }>(`/api/v1/leads/${id}/convert`, dto);
  return {
    contactId: response.data.contact.id,
    opportunityId: response.data.opportunity?.id,
  };
}
