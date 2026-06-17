import api from './api';
import type { Task, TaskPriority, TaskStatus } from './types';

export interface GetTasksParams {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTasks {
  data: Task[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueAt?: string;
  priority?: TaskPriority;
  assigneeId: string;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  dueAt?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
}

export async function getTasks(params?: GetTasksParams): Promise<PaginatedTasks> {
  const response = await api.get<PaginatedTasks>('/api/v1/tasks', { params });
  return response.data;
}

export async function getTaskById(id: string): Promise<Task> {
  const response = await api.get<Task>(`/api/v1/tasks/${id}`);
  return response.data;
}

export async function createTask(dto: CreateTaskDto): Promise<Task> {
  const response = await api.post<Task>('/api/v1/tasks', dto);
  return response.data;
}

export async function updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
  const response = await api.patch<Task>(`/api/v1/tasks/${id}`, dto);
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/api/v1/tasks/${id}`);
}
