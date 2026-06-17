import api from './api';
import type { Activity, ActivityType } from './types';

export interface GetActivitiesParams {
  q?: string;
  type?: ActivityType;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedActivities {
  data: Activity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateActivityDto {
  type: ActivityType;
  subject: string;
  body?: string;
  dueAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
}

export async function getActivities(params?: GetActivitiesParams): Promise<PaginatedActivities> {
  const response = await api.get<PaginatedActivities>('/api/v1/activities', { params });
  return response.data;
}

export async function getActivityById(id: string): Promise<Activity> {
  const response = await api.get<Activity>(`/api/v1/activities/${id}`);
  return response.data;
}

export async function createActivity(dto: CreateActivityDto): Promise<Activity> {
  const response = await api.post<Activity>('/api/v1/activities', dto);
  return response.data;
}

export async function updateActivity(id: string, dto: CreateActivityDto): Promise<Activity> {
  const response = await api.patch<Activity>(`/api/v1/activities/${id}`, dto);
  return response.data;
}

export async function deleteActivity(id: string): Promise<void> {
  await api.delete(`/api/v1/activities/${id}`);
}
