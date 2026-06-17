import api from './api';
import type {
  PipelineSummaryRow,
  ActivityByRepRow,
  LeadFunnelStats,
  WinLossStats,
  RevenueForecastRow,
  SavedReport,
} from './types';

export async function getPipelineSummary(): Promise<PipelineSummaryRow[]> {
  const response = await api.get<PipelineSummaryRow[]>('/api/v1/reports/pipeline-summary');
  return response.data;
}

export async function getActivityByRep(): Promise<ActivityByRepRow[]> {
  const response = await api.get<ActivityByRepRow[]>('/api/v1/reports/activity-by-rep');
  return response.data;
}

export async function getLeadFunnel(): Promise<LeadFunnelStats> {
  const response = await api.get<LeadFunnelStats>('/api/v1/reports/lead-funnel');
  return response.data;
}

export async function getWinLossAnalysis(): Promise<WinLossStats> {
  const response = await api.get<WinLossStats>('/api/v1/reports/win-loss');
  return response.data;
}

export async function getRevenueForecast(): Promise<RevenueForecastRow[]> {
  const response = await api.get<RevenueForecastRow[]>('/api/v1/reports/revenue-forecast');
  return response.data;
}

export async function downloadReportCsv(type: string): Promise<string> {
  const response = await api.get<string>(`/api/v1/reports/export?type=${type}`, {
    responseType: 'text',
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Saved Reports (EP-07)
// ---------------------------------------------------------------------------

export async function getSavedReports(): Promise<SavedReport[]> {
  const response = await api.get<SavedReport[]>('/api/v1/reports/saved');
  return response.data;
}

export async function createSavedReport(dto: {
  name: string;
  reportType: string;
  filters: Record<string, unknown>;
  isShared?: boolean;
}): Promise<SavedReport> {
  const response = await api.post<SavedReport>('/api/v1/reports/saved', dto);
  return response.data;
}

export async function deleteSavedReport(id: string): Promise<void> {
  await api.delete(`/api/v1/reports/saved/${id}`);
}

// ---------------------------------------------------------------------------
// Async Export (EP-07)
// ---------------------------------------------------------------------------

export async function queueExportJob(type: string): Promise<{ jobId: string }> {
  const response = await api.post<{ jobId: string }>('/api/v1/reports/export-job', { type });
  return response.data;
}

export async function getExportJobStatus(jobId: string): Promise<{
  status: 'waiting' | 'active' | 'completed' | 'failed';
  csv?: string;
  error?: string;
}> {
  const response = await api.get(`/api/v1/reports/export-job/${jobId}`);
  return response.data;
}
