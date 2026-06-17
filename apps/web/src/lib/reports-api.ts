import api from './api';
import type {
  PipelineSummaryRow,
  ActivityByRepRow,
  LeadFunnelStats,
  WinLossStats,
  RevenueForecastRow,
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
