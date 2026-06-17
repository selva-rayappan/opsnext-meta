import api from './api';
import type {
  Contact,
  PaginatedResponse,
  CreateContactDto,
  UpdateContactDto,
  ImportResult,
} from './types';

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------
export interface GetContactsParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean | '';
  ownerId?: string;
  tagId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export async function getContacts(
  params: GetContactsParams = {},
): Promise<PaginatedResponse<Contact>> {
  const { page = 1, limit = 25, q = '', isActive, ownerId = '', tagId = '', sortBy = 'createdAt', order = 'desc' } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    q,
    ownerId,
    tagId,
    sortBy,
    order,
  });

  if (isActive !== '' && isActive !== undefined) {
    query.set('isActive', String(isActive));
  }

  const response = await api.get<PaginatedResponse<Contact>>(
    `/api/v1/contacts?${query.toString()}`,
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Single
// ---------------------------------------------------------------------------
export async function getContact(id: string): Promise<Contact> {
  const response = await api.get<Contact>(`/api/v1/contacts/${id}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createContact(dto: CreateContactDto): Promise<Contact> {
  const response = await api.post<Contact>('/api/v1/contacts', dto);
  return response.data;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateContact(
  id: string,
  dto: UpdateContactDto,
): Promise<Contact> {
  const response = await api.patch<Contact>(`/api/v1/contacts/${id}`, dto);
  return response.data;
}

// ---------------------------------------------------------------------------
// Delete (soft)
// ---------------------------------------------------------------------------
export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/api/v1/contacts/${id}`);
}

// ---------------------------------------------------------------------------
// Bulk import
// ---------------------------------------------------------------------------
export async function importContacts(
  contacts: CreateContactDto[],
): Promise<ImportResult> {
  const response = await api.post<ImportResult>('/api/v1/contacts/import', {
    contacts,
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------
export async function mergeContacts(
  sourceId: string,
  targetId: string,
): Promise<void> {
  await api.post(`/api/v1/contacts/${sourceId}/merge`, {
    mergeIntoId: targetId,
  });
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
export async function addContactTag(
  contactId: string,
  tagId: string,
): Promise<void> {
  await api.post(`/api/v1/contacts/${contactId}/tags`, { tagId });
}

export async function removeContactTag(
  contactId: string,
  tagId: string,
): Promise<void> {
  await api.delete(`/api/v1/contacts/${contactId}/tags/${tagId}`);
}

// ---------------------------------------------------------------------------
// Account links
// ---------------------------------------------------------------------------
export async function linkContactToAccount(
  contactId: string,
  accountId: string,
  opts?: { title?: string; isPrimary?: boolean },
): Promise<void> {
  await api.post(`/api/v1/contacts/${contactId}/accounts`, {
    accountId,
    ...opts,
  });
}
