'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  TrendingUp,
  Briefcase,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Calendar,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContacts } from '@/lib/contacts-api';
import { getLeadFunnel, getWinLossAnalysis, getPipelineSummary } from '@/lib/reports-api';
import { getActivities } from '@/lib/activities-api';
import { getTasks } from '@/lib/tasks-api';
import type { TaskStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function activityIcon(type: string) {
  switch (type) {
    case 'CALL': return <Phone className="h-3.5 w-3.5 text-emerald-600" />;
    case 'MEETING': return <Users className="h-3.5 w-3.5 text-indigo-600" />;
    case 'EMAIL_LOG': return <Mail className="h-3.5 w-3.5 text-amber-600" />;
    default: return <FileText className="h-3.5 w-3.5 text-blue-600" />;
  }
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  href: string;
  sub?: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { data: contactsData } = useQuery({
    queryKey: ['dashboard-contacts'],
    queryFn: () => getContacts({ limit: 1 }),
  });

  const { data: funnel } = useQuery({
    queryKey: ['dashboard-funnel'],
    queryFn: getLeadFunnel,
  });

  const { data: winLoss } = useQuery({
    queryKey: ['dashboard-winloss'],
    queryFn: getWinLossAnalysis,
  });

  const { data: pipeline } = useQuery({
    queryKey: ['dashboard-pipeline'],
    queryFn: getPipelineSummary,
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => getActivities({ limit: 6 }),
  });

  const { data: openTasks } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: () => getTasks({ status: 'OPEN' as TaskStatus, limit: 6 }),
  });

  // Derived stats
  const totalContacts = contactsData?.total ?? 0;
  const openLeads = funnel
    ? (funnel.statusCounts.NEW + funnel.statusCounts.CONTACTED + funnel.statusCounts.QUALIFIED)
    : 0;
  const openOpps = pipeline ? pipeline.reduce((s, r) => s + r.count, 0) : 0;
  const pipelineValue = pipeline ? pipeline.reduce((s, r) => s + r.totalValue, 0) : 0;

  const now = new Date();
  const overdueTasks = (openTasks?.data ?? []).filter(
    (t) => t.dueAt && new Date(t.dueAt) < now,
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Contacts"
            value={fmt(totalContacts)}
            icon={Users}
            color="bg-indigo-50 text-indigo-600"
            href="/contacts"
          />
          <StatCard
            label="Open Leads"
            value={fmt(openLeads)}
            icon={TrendingUp}
            color="bg-amber-50 text-amber-600"
            href="/leads"
            sub={funnel ? `${fmt(funnel.statusCounts.CONVERTED)} converted` : undefined}
          />
          <StatCard
            label="Open Opportunities"
            value={fmt(openOpps)}
            icon={Briefcase}
            color="bg-emerald-50 text-emerald-600"
            href="/opportunities"
            sub={winLoss ? `${Math.round(winLoss.winRate)}% win rate` : undefined}
          />
          <StatCard
            label="Pipeline Value"
            value={fmtCurrency(pipelineValue)}
            icon={DollarSign}
            color="bg-violet-50 text-violet-600"
            href="/opportunities"
            sub={pipeline && pipeline.length > 0 ? `${pipeline.length} stages` : undefined}
          />
        </div>

        {/* Middle row: pipeline table + win-loss */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Pipeline by stage */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-500" /> Pipeline by Stage
              </h2>
              <Link href="/opportunities" className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            {!pipeline || pipeline.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No open opportunities yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wide">
                      <th className="pb-3 text-left">Stage</th>
                      <th className="pb-3 text-right">Count</th>
                      <th className="pb-3 text-right">Total Value</th>
                      <th className="pb-3 text-right">Expected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pipeline.map((row) => (
                      <tr key={row.name} className="group hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-700">{row.name}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-600">{row.count}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-600">{fmtCurrency(row.totalValue)}</td>
                        <td className="py-2.5 text-right tabular-nums font-semibold text-slate-800">{fmtCurrency(row.expectedValue)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-semibold text-slate-900">
                      <td className="pt-3">Total</td>
                      <td className="pt-3 text-right tabular-nums">{pipeline.reduce((s, r) => s + r.count, 0)}</td>
                      <td className="pt-3 text-right tabular-nums">{fmtCurrency(pipeline.reduce((s, r) => s + r.totalValue, 0))}</td>
                      <td className="pt-3 text-right tabular-nums">{fmtCurrency(pipeline.reduce((s, r) => s + r.expectedValue, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Win/Loss + Lead funnel */}
          <div className="flex flex-col gap-4">

            {/* Win/Loss card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-500" /> Win / Loss
              </h2>
              {winLoss ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Win rate</span>
                    <span className="font-bold text-emerald-600">{Math.round(winLoss.winRate)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.round(winLoss.winRate)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-lg font-bold text-emerald-700">{winLoss.wonCount}</p>
                      <p className="text-xs text-emerald-600">Won</p>
                      <p className="text-xs text-slate-400">{fmtCurrency(winLoss.wonValue)}</p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-3 text-center">
                      <p className="text-lg font-bold text-red-700">{winLoss.lostCount}</p>
                      <p className="text-xs text-red-600">Lost</p>
                      <p className="text-xs text-slate-400">{fmtCurrency(winLoss.lostValue)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-xs text-slate-400">No data yet</div>
              )}
            </div>

            {/* Lead funnel card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" /> Lead Funnel
              </h2>
              {funnel ? (
                <div className="space-y-2">
                  {(
                    [
                      ['NEW', funnel.statusCounts.NEW, 'bg-slate-400'],
                      ['CONTACTED', funnel.statusCounts.CONTACTED, 'bg-blue-400'],
                      ['QUALIFIED', funnel.statusCounts.QUALIFIED, 'bg-amber-400'],
                      ['CONVERTED', funnel.statusCounts.CONVERTED, 'bg-emerald-500'],
                    ] as [string, number, string][]
                  ).map(([label, count, color]) => {
                    const pct = funnel.statusCounts.total > 0
                      ? Math.round((count / funnel.statusCounts.total) * 100)
                      : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-medium text-slate-700">{count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div className={cn('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="pt-2 text-xs text-slate-400 text-right">
                    {Math.round(funnel.conversionRate)}% conversion rate
                  </p>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-xs text-slate-400">No data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: recent activities + open tasks */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Recent activities */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" /> Recent Activities
              </h2>
              <Link href="/activities" className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            {!recentActivities || recentActivities.data.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No activities logged yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {recentActivities.data.map((act) => (
                  <li key={act.id} className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-50">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
                      {activityIcon(act.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{act.subject}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        {act.user && (
                          <span>{act.user.firstName} {act.user.lastName}</span>
                        )}
                        <span>·</span>
                        <span>{timeAgo(act.createdAt)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Open tasks */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Open Tasks
                {overdueTasks > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-100">
                    <AlertCircle className="h-3 w-3" /> {overdueTasks} overdue
                  </span>
                )}
              </h2>
              <Link href="/activities" className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            {!openTasks || openTasks.data.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                No open tasks.
              </div>
            ) : (
              <ul className="space-y-2">
                {openTasks.data.map((task) => {
                  const isOverdue = task.dueAt && new Date(task.dueAt) < now;
                  return (
                    <li
                      key={task.id}
                      className={cn(
                        'flex items-start gap-3 rounded-xl p-2.5 transition',
                        isOverdue ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-slate-50',
                      )}
                    >
                      <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', isOverdue ? 'text-red-400' : 'text-slate-300')} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-medium', isOverdue ? 'text-red-800' : 'text-slate-800')}>
                          {task.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', PRIORITY_COLOR[task.priority])}>
                            {task.priority}
                          </span>
                          {task.dueAt && (
                            <span className={cn('text-xs', isOverdue ? 'font-semibold text-red-600' : 'text-slate-400')}>
                              {isOverdue ? 'Overdue · ' : 'Due '}
                              {new Date(task.dueAt).toLocaleDateString()}
                            </span>
                          )}
                          {task.assignee && (
                            <span className="text-xs text-slate-400">
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
