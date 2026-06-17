import api from './api';
import type {
  Account,
  PaginatedResponse,
  CreateAccountDto,
  UpdateAccountDto,
} from './types';

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------
export interface GetAccountsParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean | '';
  ownerId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export async function getAccounts(
  params: GetAccountsParams = {},
): Promise<PaginatedResponse<Account>> {
  const {
    page = 1,
    limit = 25,
    q = '',
    isActive,
    ownerId = '',
    sortBy = 'createdAt',
    order = 'desc',
  } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    q,
    ownerId,
    sortBy,
    order,
  });

  if (isActive !== '' && isActive !== undefined) {
    query.set('isActive', String(isActive));
  }

  const response = await api.get<PaginatedResponse<Account>>(
    `/api/v1/accounts?${query.toString()}`,
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Single
// ---------------------------------------------------------------------------
export async function getAccount(id: string): Promise<Account> {
  const response = await api.get<Account>(`/api/v1/accounts/${id}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createAccount(dto: CreateAccountDto): Promise<Account> {
  const response = await api.post<Account>('/api/v1/accounts', dto);
  return response.data;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
export async function updateAccount(
  id: string,
  dto: UpdateAccountDto,
): Promise<Account> {
  const response = await api.patch<Account>(`/api/v1/accounts/${id}`, dto);
  return response.data;
}

// ---------------------------------------------------------------------------
// Delete (soft)
// ---------------------------------------------------------------------------
export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/api/v1/accounts/${id}`);
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
export async function addAccountTag(
  accountId: string,
  tagId: string,
): Promise<void> {
  await api.post(`/api/v1/accounts/${accountId}/tags`, { tagId });
}

export async function removeAccountTag(
  accountId: string,
  tagId: string,
): Promise<void> {
  await api.delete(`/api/v1/accounts/${accountId}/tags/${tagId}`);
}
