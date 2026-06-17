import api from './api';
import type {
  Pipeline,
  Stage,
  CreatePipelineDto,
  UpdatePipelineDto,
  CreateStageDto,
  UpdateStageDto,
  ReorderStagesDto,
} from './types';

export async function getPipelines(): Promise<Pipeline[]> {
  const response = await api.get<Pipeline[]>('/api/v1/pipelines');
  return response.data;
}

export async function getPipeline(id: string): Promise<Pipeline> {
  const response = await api.get<Pipeline>(`/api/v1/pipelines/${id}`);
  return response.data;
}

export async function createPipeline(dto: CreatePipelineDto): Promise<Pipeline> {
  const response = await api.post<Pipeline>('/api/v1/pipelines', dto);
  return response.data;
}

export async function updatePipeline(id: string, dto: UpdatePipelineDto): Promise<Pipeline> {
  const response = await api.patch<Pipeline>(`/api/v1/pipelines/${id}`, dto);
  return response.data;
}

export async function deletePipeline(id: string): Promise<void> {
  await api.delete(`/api/v1/pipelines/${id}`);
}

export async function createStage(pipelineId: string, dto: CreateStageDto): Promise<Stage> {
  const response = await api.post<Stage>(`/api/v1/pipelines/${pipelineId}/stages`, dto);
  return response.data;
}

export async function updateStage(
  pipelineId: string,
  stageId: string,
  dto: UpdateStageDto,
): Promise<Stage> {
  const response = await api.patch<Stage>(
    `/api/v1/pipelines/${pipelineId}/stages/${stageId}`,
    dto,
  );
  return response.data;
}

export async function deleteStage(pipelineId: string, stageId: string): Promise<void> {
  await api.delete(`/api/v1/pipelines/${pipelineId}/stages/${stageId}`);
}

export async function reorderStages(pipelineId: string, dto: ReorderStagesDto): Promise<Stage[]> {
  const response = await api.post<Stage[]>(
    `/api/v1/pipelines/${pipelineId}/stages/reorder`,
    dto,
  );
  return response.data;
}
