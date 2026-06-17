import api from './api';
import type {
  Opportunity,
  PaginatedResponse,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ChangeStageDto,
  MarkWonDto,
  MarkLostDto,
} from './types';

export interface GetOpportunitiesParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  pipelineId?: string;
  stageId?: string;
  ownerId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ForecastSummary {
  month: string; // "YYYY-MM"
  count: number;
  totalValue: number;
  expectedValue: number;
}

export interface ForecastResponse {
  summary: {
    totalValue: number;
    expectedValue: number;
    count: number;
  };
  monthly: ForecastSummary[];
}

export async function getOpportunities(
  params: GetOpportunitiesParams = {},
): Promise<PaginatedResponse<Opportunity>> {
  const {
    page = 1,
    limit = 25,
    q,
    status,
    pipelineId,
    stageId,
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
  if (pipelineId) query.set('pipelineId', pipelineId);
  if (stageId) query.set('stageId', stageId);
  if (ownerId) query.set('ownerId', ownerId);

  const response = await api.get<PaginatedResponse<Opportunity>>(
    `/api/v1/opportunities?${query.toString()}`,
  );
  return response.data;
}

export async function getOpportunity(id: string): Promise<Opportunity> {
  const response = await api.get<Opportunity>(`/api/v1/opportunities/${id}`);
  return response.data;
}

export async function createOpportunity(dto: CreateOpportunityDto): Promise<Opportunity> {
  const response = await api.post<Opportunity>('/api/v1/opportunities', dto);
  return response.data;
}

export async function updateOpportunity(
  id: string,
  dto: UpdateOpportunityDto,
): Promise<Opportunity> {
  const response = await api.patch<Opportunity>(`/api/v1/opportunities/${id}`, dto);
  return response.data;
}

export async function deleteOpportunity(id: string): Promise<void> {
  await api.delete(`/api/v1/opportunities/${id}`);
}

export async function changeOpportunityStage(id: string, stageId: string): Promise<Opportunity> {
  const response = await api.patch<Opportunity>(`/api/v1/opportunities/${id}/stage`, {
    stageId,
  } as ChangeStageDto);
  return response.data;
}

export async function markOpportunityWon(id: string, dto: MarkWonDto = {}): Promise<Opportunity> {
  const response = await api.post<Opportunity>(`/api/v1/opportunities/${id}/won`, dto);
  return response.data;
}

export async function markOpportunityLost(id: string, dto: MarkLostDto): Promise<Opportunity> {
  const response = await api.post<Opportunity>(`/api/v1/opportunities/${id}/lost`, dto);
  return response.data;
}

export async function getForecast(params: {
  pipelineId?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<ForecastResponse> {
  const query = new URLSearchParams();
  if (params.pipelineId) query.set('pipelineId', params.pipelineId);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const response = await api.get<ForecastResponse>(
    `/api/v1/opportunities/forecast?${query.toString()}`,
  );
  return response.data;
}
