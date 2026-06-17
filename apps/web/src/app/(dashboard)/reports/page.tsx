'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Briefcase,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Trash2,
  Bookmark,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getPipelineSummary,
  getActivityByRep,
  getLeadFunnel,
  getWinLossAnalysis,
  getRevenueForecast,
  getSavedReports,
  createSavedReport,
  deleteSavedReport,
  queueExportJob,
  getExportJobStatus,
} from '@/lib/reports-api';
import type { SavedReport } from '@/lib/types';

type ReportType = 'pipeline-summary' | 'activity-by-rep' | 'lead-funnel' | 'win-loss' | 'revenue-forecast';
type ExportStatus = 'idle' | 'queuing' | 'polling' | 'completed' | 'failed';

export default function ReportsPage() {
  const queryClient = useQueryClient();

  const [selectedReport, setSelectedReport] = useState<ReportType>('pipeline-summary');

  // Save modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveShared, setSaveShared] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Async export state
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportCsv, setExportCsv] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queries — report data
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['report-pipeline'],
    queryFn: getPipelineSummary,
    enabled: selectedReport === 'pipeline-summary',
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['report-activity'],
    queryFn: getActivityByRep,
    enabled: selectedReport === 'activity-by-rep',
  });

  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['report-lead'],
    queryFn: getLeadFunnel,
    enabled: selectedReport === 'lead-funnel',
  });

  const { data: winLossData, isLoading: winLossLoading } = useQuery({
    queryKey: ['report-winloss'],
    queryFn: getWinLossAnalysis,
    enabled: selectedReport === 'win-loss',
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: ['report-forecast'],
    queryFn: getRevenueForecast,
    enabled: selectedReport === 'revenue-forecast',
  });

  // Query — saved reports
  const { data: savedReports, isLoading: savedReportsLoading } = useQuery({
    queryKey: ['saved-reports'],
    queryFn: getSavedReports,
  });

  // Loading state helper
  const isLoading = pipelineLoading || activityLoading || leadLoading || winLossLoading || forecastLoading;

  // Currency formatter helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // ---------------------------------------------------------------------------
  // Async export
  // ---------------------------------------------------------------------------

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Start polling whenever exportJobId is set
  useEffect(() => {
    if (!exportJobId) return;

    // Clear any existing interval before starting a new one
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const result = await getExportJobStatus(exportJobId);
        if (result.status === 'completed') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          setExportCsv(result.csv ?? null);
          setExportStatus('completed');
        } else if (result.status === 'failed') {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          setExportError(result.error ?? 'Export failed');
          setExportStatus('failed');
        }
        // 'waiting' or 'active' — keep polling
      } catch {
        clearInterval(pollIntervalRef.current!);
        pollIntervalRef.current = null;
        setExportError('Failed to check export status');
        setExportStatus('failed');
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [exportJobId]);

  const handleExportCsv = async () => {
    setExportStatus('queuing');
    setExportJobId(null);
    setExportError(null);
    setExportCsv(null);
    try {
      const { jobId } = await queueExportJob(selectedReport);
      setExportJobId(jobId);
      setExportStatus('polling');
    } catch {
      setExportError('Failed to queue export job');
      setExportStatus('failed');
    }
  };

  const triggerBrowserDownload = () => {
    if (!exportCsv) return;
    const blob = new Blob([exportCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `opsnext-${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetExport = () => {
    setExportStatus('idle');
    setExportJobId(null);
    setExportError(null);
    setExportCsv(null);
  };

  // Reset export state whenever the selected report changes
  useEffect(() => {
    resetExport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport]);

  // ---------------------------------------------------------------------------
  // Saved reports
  // ---------------------------------------------------------------------------

  const handleSaveCurrentView = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      await createSavedReport({
        name: saveName.trim(),
        reportType: selectedReport,
        filters: {},
        isShared: saveShared,
      });
      await queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      setSaveModalOpen(false);
      setSaveName('');
      setSaveShared(false);
    } catch (err) {
      console.error('Failed to save report:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedReport = async (id: string) => {
    try {
      await deleteSavedReport(id);
      await queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
    } catch (err) {
      console.error('Failed to delete saved report:', err);
    }
  };

  const handleLoadSavedReport = (report: SavedReport) => {
    setSelectedReport(report.reportType as ReportType);
  };

  // ---------------------------------------------------------------------------
  // Export button rendering
  // ---------------------------------------------------------------------------

  const renderExportButton = () => {
    if (exportStatus === 'idle') {
      return (
        <Button
          onClick={handleExportCsv}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      );
    }

    if (exportStatus === 'queuing' || exportStatus === 'polling') {
      return (
        <Button disabled className="bg-indigo-400 text-white font-medium shadow-sm flex items-center gap-2 cursor-not-allowed">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating...
        </Button>
      );
    }

    if (exportStatus === 'completed') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={triggerBrowserDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> Download ready — click to save
          </button>
          <button
            onClick={resetExport}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (exportStatus === 'failed') {
      return (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4" /> Export failed{exportError ? `: ${exportError}` : ''}
          </span>
          <button
            onClick={resetExport}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reporting & Analytics</h1>
            <p className="text-slate-500 mt-1">Acquire insights, monitor rep performance, and forecast sales pipeline value.</p>
          </div>
          <div>{renderExportButton()}</div>
        </div>

        {/* Dashboard Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Navigation */}
          <div className="space-y-6 lg:col-span-1">

            {/* Available Reports nav */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Available Reports</h3>
              <div className="space-y-2">
                {[
                  { id: 'pipeline-summary', label: 'Pipeline Summary', icon: Briefcase },
                  { id: 'activity-by-rep', label: 'Rep Activity Leaderboard', icon: Users },
                  { id: 'lead-funnel', label: 'Lead Conversion Funnel', icon: Layers },
                  { id: 'win-loss', label: 'Win / Loss Analysis', icon: PieChart },
                  { id: 'revenue-forecast', label: 'Revenue Forecast', icon: Calendar },
                ].map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id as ReportType)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all border',
                      selectedReport === report.id
                        ? 'bg-white border-indigo-100 text-indigo-700 shadow-sm'
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    )}
                  >
                    <report.icon className={cn('h-4.5 w-4.5', selectedReport === report.id ? 'text-indigo-600' : 'text-slate-400')} />
                    {report.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Reports panel */}
            <div>
              <div className="flex items-center justify-between mb-3 px-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Reports</h3>
                <button
                  onClick={() => setSaveModalOpen(true)}
                  title="Save current view"
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5" /> Save view
                </button>
              </div>

              {savedReportsLoading ? (
                <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                </div>
              ) : (savedReports ?? []).length === 0 ? (
                <p className="px-3 text-xs text-slate-400 italic">No saved reports yet.</p>
              ) : (
                <div className="space-y-1">
                  {(savedReports ?? []).map((report) => (
                    <div
                      key={report.id}
                      className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 hover:border-slate-200 transition-all"
                    >
                      <button
                        onClick={() => handleLoadSavedReport(report)}
                        className="flex-1 text-left text-sm font-medium text-slate-600 group-hover:text-slate-900 truncate leading-tight"
                        title={report.name}
                      >
                        {report.name}
                        {report.isShared && (
                          <span className="ml-1.5 text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                            shared
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSavedReport(report.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-300 transition-all flex-shrink-0"
                        title="Delete saved report"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Main Visualizer Content */}
          <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-card-sm flex flex-col justify-between min-h-[500px]">

            {/* Header Description */}
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedReport === 'pipeline-summary' && 'Pipeline Value Distribution'}
                {selectedReport === 'activity-by-rep' && 'Rep Activity Performance Leaderboard'}
                {selectedReport === 'lead-funnel' && 'Lead Stage Conversion Rates'}
                {selectedReport === 'win-loss' && 'Opportunity Won vs. Lost Deal Summary'}
                {selectedReport === 'revenue-forecast' && 'Estimated Month-over-Month Forecasting'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {selectedReport === 'pipeline-summary' && 'Aggregated pipeline values and weighted probabilities grouped by opportunity stages.'}
                {selectedReport === 'activity-by-rep' && 'Activity metrics logged per sales representative across calls, meetings, notes, and emails.'}
                {selectedReport === 'lead-funnel' && 'Visualizes the funnel from lead creation up to conversions.'}
                {selectedReport === 'win-loss' && 'Shows the comparative ratios and amounts of closed-won deals against lost ones.'}
                {selectedReport === 'revenue-forecast' && 'Projected cash flow forecasts based on predicted opportunity close dates.'}
              </p>
            </div>

            {/* Visual Charts / Tables */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                  <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Aggregating real-time stats...</span>
                </div>
              ) : (
                <>

                  {/* Pipeline Summary Report */}
                  {selectedReport === 'pipeline-summary' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                          <span className="text-xs font-bold text-slate-400 uppercase">Total Pipeline Value</span>
                          <h4 className="text-2xl font-black text-slate-800 mt-1">
                            {formatCurrency((pipelineData || []).reduce((acc, row) => acc + row.totalValue, 0))}
                          </h4>
                        </div>
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <span className="text-xs font-bold text-indigo-500 uppercase">Weighted Expected Value</span>
                          <h4 className="text-2xl font-black text-indigo-700 mt-1">
                            {formatCurrency((pipelineData || []).reduce((acc, row) => acc + row.expectedValue, 0))}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(pipelineData || []).map((row, idx) => {
                          const maxVal = Math.max(...(pipelineData || []).map((r) => r.totalValue), 1);
                          const percent = (row.totalValue / maxVal) * 100;
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between text-sm font-semibold">
                                <span className="text-slate-700">{row.name} ({row.count} deals)</span>
                                <span className="text-slate-800">{formatCurrency(row.totalValue)} <span className="text-slate-400 text-xs font-normal">(Exp: {formatCurrency(row.expectedValue)})</span></span>
                              </div>
                              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                                <div style={{ width: `${percent}%` }} className="bg-indigo-500 h-full rounded-full transition-all duration-500" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rep Activity Leaderboard */}
                  {selectedReport === 'activity-by-rep' && (
                    <div className="space-y-6">
                      {(activityData || []).map((row, idx) => {
                        const maxAct = Math.max(...(activityData || []).map((r) => r.total), 1);
                        const percent = (row.total / maxAct) * 100;
                        return (
                          <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-600 text-white font-bold h-8 w-8 rounded-full flex items-center justify-center text-sm">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">{row.name}</h4>
                                <span className="text-xs text-slate-400">{row.email}</span>
                              </div>
                            </div>

                            <div className="flex-1 max-w-md space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-slate-500">
                                <span>{row.total} Activities logged</span>
                                <span>{Math.round(percent)}% performance</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div style={{ width: `${percent}%` }} className="bg-indigo-600 h-full rounded-full transition-all duration-500" />
                              </div>
                            </div>

                            <div className="flex gap-2 text-xs font-semibold text-slate-500">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded">Call: {row.CALL}</span>
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded">Meet: {row.MEETING}</span>
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded">Mail: {row.EMAIL_LOG}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Lead Funnel */}
                  {selectedReport === 'lead-funnel' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase">Total Leads</span>
                          <h4 className="text-2xl font-black text-slate-800 mt-1">{leadData?.statusCounts.total || 0}</h4>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase">Converted Leads</span>
                          <h4 className="text-2xl font-black text-slate-800 mt-1">{leadData?.statusCounts.CONVERTED || 0}</h4>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 col-span-2">
                          <span className="text-xs font-bold text-indigo-500 uppercase">Funnel Conversion Rate</span>
                          <h4 className="text-2xl font-black text-indigo-700 mt-1">{leadData?.conversionRate || 0}%</h4>
                        </div>
                      </div>

                      {/* Funnel Stack */}
                      <div className="flex flex-col items-center space-y-2 max-w-md mx-auto pt-6">
                        {[
                          { key: 'NEW', label: 'New Lead stage', bg: 'bg-indigo-650', width: 'w-full' },
                          { key: 'CONTACTED', label: 'Contacted stage', bg: 'bg-indigo-550', width: 'w-[85%]' },
                          { key: 'QUALIFIED', label: 'Qualified stage', bg: 'bg-indigo-450', width: 'w-[70%]' },
                          { key: 'CONVERTED', label: 'Converted stage', bg: 'bg-indigo-350', width: 'w-[55%]' },
                        ].map((funnelRow, idx) => {
                          const count = (leadData?.statusCounts as Record<string, number>)?.[funnelRow.key] || 0;
                          return (
                            <div key={idx} className={cn(funnelRow.width, funnelRow.bg, 'text-white px-4 py-3 rounded-lg flex justify-between items-center text-sm font-semibold shadow-sm transition-all duration-300')}>
                              <span>{funnelRow.label}</span>
                              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{count} leads</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Win/Loss Analysis */}
                  {selectedReport === 'win-loss' && (
                    <div className="space-y-6">
                      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-indigo-500 uppercase">Overall Deal Win Rate</span>
                          <h3 className="text-4xl font-black text-indigo-700 mt-1">{winLossData?.winRate || 0}%</h3>
                        </div>
                        <TrendingUp className="h-10 w-10 text-indigo-600" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Won Box */}
                        <div className="border border-emerald-100 p-5 rounded-2xl bg-emerald-50/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-emerald-700 uppercase">Closed-Won Deals</span>
                            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                          </div>
                          <h4 className="text-3xl font-black text-emerald-800">{formatCurrency(winLossData?.wonValue || 0)}</h4>
                          <span className="text-xs font-medium text-emerald-600">{winLossData?.wonCount || 0} Opportunities won</span>
                        </div>

                        {/* Lost Box */}
                        <div className="border border-red-100 p-5 rounded-2xl bg-red-50/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-red-700 uppercase">Closed-Lost Deals</span>
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          </div>
                          <h4 className="text-3xl font-black text-red-800">{formatCurrency(winLossData?.lostValue || 0)}</h4>
                          <span className="text-xs font-medium text-red-600">{winLossData?.lostCount || 0} Opportunities lost</span>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Revenue Forecast */}
                  {selectedReport === 'revenue-forecast' && (
                    <div className="space-y-6">
                      {(forecastData || []).length === 0 ? (
                        <div className="text-center p-12 text-slate-400">No forecasting data available. Make sure opportunities have Close Dates.</div>
                      ) : (
                        <div className="space-y-5">
                          {(forecastData || []).map((row, idx) => {
                            const maxVal = Math.max(...(forecastData || []).map((r) => r.totalValue), 1);
                            const totalPercent = (row.totalValue / maxVal) * 100;
                            const expPercent = (row.expectedValue / maxVal) * 100;
                            return (
                              <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                  <span className="text-slate-800 font-bold">{row.month}</span>
                                  <span className="text-slate-700">{formatCurrency(row.totalValue)} <span className="text-indigo-600 text-xs">(Weighted expected: {formatCurrency(row.expectedValue)})</span></span>
                                </div>
                                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden relative">
                                  {/* Total Value Bar */}
                                  <div style={{ width: `${totalPercent}%` }} className="bg-slate-300 h-full rounded-full absolute left-0 top-0 transition-all duration-500" />
                                  {/* Expected Value Bar */}
                                  <div style={{ width: `${expPercent}%` }} className="bg-indigo-600 h-full rounded-full absolute left-0 top-0 transition-all duration-500" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Save Report Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Save current view</h3>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="save-report-name">
                  Report name
                </label>
                <input
                  id="save-report-name"
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={`My ${selectedReport} report`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCurrentView(); }}
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={saveShared}
                  onChange={(e) => setSaveShared(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  Share with team members
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSaveCurrentView}
                disabled={!saveName.trim() || isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
