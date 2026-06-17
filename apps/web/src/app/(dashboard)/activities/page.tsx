'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  Users,
  FileText,
  Mail,
  Plus,
  Search,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '@/lib/activities-api';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '@/lib/tasks-api';
import api from '@/lib/api';
import type { Activity, Task, ActivityType, TaskStatus, TaskPriority } from '@/lib/types';

// Fetch lists for select dropdowns
async function fetchContacts() {
  const res = await api.get('/api/v1/contacts', { params: { limit: 100 } });
  return res.data.data || [];
}

async function fetchAccounts() {
  const res = await api.get('/api/v1/accounts', { params: { limit: 100 } });
  return res.data.data || [];
}

async function fetchLeads() {
  const res = await api.get('/api/v1/leads', { params: { limit: 100 } });
  return res.data.data || [];
}

async function fetchOpportunities() {
  const res = await api.get('/api/v1/opportunities', { params: { limit: 100 } });
  return res.data.data || [];
}

async function fetchUsers() {
  const res = await api.get('/api/v1/users', { params: { limit: 100 } });
  return res.data.data || [];
}

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'activities' | 'tasks'>('activities');

  // Filters for Activities
  const [activitySearch, setActivitySearch] = useState('');
  const [activityType, setActivityType] = useState<string>('ALL');

  // Modal open states
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states for Activity Modal
  const [actType, setActType] = useState<ActivityType>('CALL');
  const [actSubject, setActSubject] = useState('');
  const [actBody, setActBody] = useState('');
  const [actDuration, setActDuration] = useState('');
  const [actOutcome, setActOutcome] = useState('');
  const [actContactId, setActContactId] = useState('');
  const [actAccountId, setActAccountId] = useState('');
  const [actLeadId, setActLeadId] = useState('');
  const [actOppId, setActOppId] = useState('');

  // Form states for Task Modal
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskContactId, setTaskContactId] = useState('');
  const [taskAccountId, setTaskAccountId] = useState('');
  const [taskLeadId, setTaskLeadId] = useState('');
  const [taskOppId, setTaskOppId] = useState('');

  // Queries
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', activitySearch, activityType],
    queryFn: () => getActivities({
      q: activitySearch || undefined,
      type: activityType !== 'ALL' ? (activityType as ActivityType) : undefined,
      limit: 100,
    }),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks({ limit: 100 }),
  });

  const { data: contacts = [] } = useQuery({ queryKey: ['contacts-list'], queryFn: fetchContacts });
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts-list'], queryFn: fetchAccounts });
  const { data: leads = [] } = useQuery({ queryKey: ['leads-list'], queryFn: fetchLeads });
  const { data: opportunities = [] } = useQuery({ queryKey: ['opportunities-list'], queryFn: fetchOpportunities });
  const { data: users = [] } = useQuery({ queryKey: ['users-list'], queryFn: fetchUsers });

  // Mutations
  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowActivityModal(false);
      resetActivityForm();
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => updateActivity(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowActivityModal(false);
      setEditingActivity(null);
      resetActivityForm();
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskModal(false);
      resetTaskForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => updateTask(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskModal(false);
      setEditingTask(null);
      resetTaskForm();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Reset helpers
  const resetActivityForm = () => {
    setActType('CALL');
    setActSubject('');
    setActBody('');
    setActDuration('');
    setActOutcome('');
    setActContactId('');
    setActAccountId('');
    setActLeadId('');
    setActOppId('');
  };

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskDue('');
    setTaskPriority('MEDIUM');
    setTaskAssigneeId('');
    setTaskContactId('');
    setTaskAccountId('');
    setTaskLeadId('');
    setTaskOppId('');
  };

  // Submit handlers
  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto = {
      type: actType,
      subject: actSubject,
      body: actBody || undefined,
      duration: actDuration ? parseInt(actDuration, 10) : undefined,
      outcome: actOutcome || undefined,
      contactId: actContactId || undefined,
      accountId: actAccountId || undefined,
      leadId: actLeadId || undefined,
      opportunityId: actOppId || undefined,
      completedAt: new Date().toISOString(),
    };

    if (editingActivity) {
      updateActivityMutation.mutate({ id: editingActivity.id, dto });
    } else {
      createActivityMutation.mutate(dto);
    }
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto = {
      title: taskTitle,
      description: taskDesc || undefined,
      dueAt: taskDue || undefined,
      priority: taskPriority,
      assigneeId: taskAssigneeId || users[0]?.id || '',
      contactId: taskContactId || undefined,
      accountId: taskAccountId || undefined,
      leadId: taskLeadId || undefined,
      opportunityId: taskOppId || undefined,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, dto });
    } else {
      createTaskMutation.mutate(dto);
    }
  };

  const openEditActivity = (act: Activity) => {
    setEditingActivity(act);
    setActType(act.type);
    setActSubject(act.subject);
    setActBody(act.body || '');
    setActDuration(act.duration ? act.duration.toString() : '');
    setActOutcome(act.outcome || '');
    setActContactId(act.contactId || '');
    setActAccountId(act.accountId || '');
    setActLeadId(act.leadId || '');
    setActOppId(act.opportunityId || '');
    setShowActivityModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskDue(task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '');
    setTaskPriority(task.priority);
    setTaskAssigneeId(task.assigneeId);
    setTaskContactId(task.contactId || '');
    setTaskAccountId(task.accountId || '');
    setTaskLeadId(task.leadId || '');
    setTaskOppId(task.opportunityId || '');
    setShowTaskModal(true);
  };

  const moveTaskStatus = (id: string, status: TaskStatus) => {
    updateTaskMutation.mutate({ id, dto: { status } });
  };

  // Activity icon selector
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4 text-emerald-600" />;
      case 'MEETING': return <Users className="h-4 w-4 text-indigo-600" />;
      case 'EMAIL_LOG': return <Mail className="h-4 w-4 text-amber-600" />;
      case 'NOTE': return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activities & Tasks</h1>
            <p className="text-slate-500 mt-1">Log customer interactions and manage your pipeline tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                resetActivityForm();
                setEditingActivity(null);
                setShowActivityModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Log Interaction
            </Button>
            <Button
              onClick={() => {
                resetTaskForm();
                setEditingTask(null);
                if (users.length > 0) setTaskAssigneeId(users[0].id);
                setShowTaskModal(true);
              }}
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('activities')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-all flex items-center gap-2',
              activeTab === 'activities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <FileText className="h-4 w-4" /> Activity Feed
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-all flex items-center gap-2',
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <CheckCircle2 className="h-4 w-4" /> Task Manager
          </button>
        </div>

        {/* Tab 1: Activity Timeline */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm justify-between">
              <div className="flex flex-1 items-center gap-3 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search interactions..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="pl-9 bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none border-none cursor-pointer"
                  >
                    <option value="ALL">All Types</option>
                    <option value="CALL">Calls</option>
                    <option value="MEETING">Meetings</option>
                    <option value="EMAIL_LOG">Emails</option>
                    <option value="NOTE">Notes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            {activitiesLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-500 font-medium">
                Loading activity feed...
              </div>
            ) : (activitiesData?.data || []).length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-800">No activities found</h3>
                <p className="text-slate-500 mt-1 text-sm">Log a new interaction to get started.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-200 space-y-6">
                {(activitiesData?.data || []).map((act) => (
                  <div key={act.id} className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-card-sm hover:shadow-card transition-all">
                    
                    {/* Circle Dot Marker */}
                    <div className="absolute -left-[35px] top-6 bg-slate-50 border border-slate-200 rounded-full p-1.5 shadow-sm">
                      {getActivityIcon(act.type)}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-lg">{act.subject}</span>
                          <span className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full',
                            act.type === 'CALL' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                            act.type === 'MEETING' && 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                            act.type === 'EMAIL_LOG' && 'bg-amber-50 text-amber-700 border border-amber-200',
                            act.type === 'NOTE' && 'bg-blue-50 text-blue-700 border border-blue-200'
                          )}>
                            {act.type}
                          </span>
                        </div>
                        {act.body && <p className="text-slate-600 mt-2 text-sm whitespace-pre-wrap">{act.body}</p>}
                        
                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 mt-4">
                          {act.user && (
                            <span className="flex items-center gap-1 font-medium text-slate-600">
                              <User className="h-3 w-3" /> {act.user.firstName} {act.user.lastName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(act.createdAt).toLocaleString()}
                          </span>
                          {act.duration && (
                            <span><strong>Duration:</strong> {act.duration} mins</span>
                          )}
                          {act.outcome && (
                            <span><strong>Outcome:</strong> {act.outcome}</span>
                          )}
                        </div>

                        {/* Linked Entities */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                          {act.contact && (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              Contact: {act.contact.firstName} {act.contact.lastName}
                            </span>
                          )}
                          {act.account && (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              Account: {act.account.name}
                            </span>
                          )}
                          {act.lead && (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              Lead: {act.lead.firstName} {act.lead.lastName}
                            </span>
                          )}
                          {act.opportunity && (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              Opp: {act.opportunity.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:self-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditActivity(act)}
                          className="hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActivityMutation.mutate(act.id)}
                          className="hover:bg-red-50 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Task Kanban Manager */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {tasksLoading ? (
              <div className="text-center p-12 text-slate-500 font-medium">Loading Tasks Board...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as TaskStatus[]).map((colStatus) => {
                  const columnTasks = (tasksData?.data || []).filter((t) => t.status === colStatus);
                  return (
                    <div key={colStatus} className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200/50 flex flex-col min-h-[500px]">
                      
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="font-bold text-slate-700 tracking-wide text-sm flex items-center gap-2">
                          <span className={cn(
                            'h-2 w-2 rounded-full',
                            colStatus === 'OPEN' && 'bg-blue-500',
                            colStatus === 'IN_PROGRESS' && 'bg-amber-500',
                            colStatus === 'COMPLETED' && 'bg-emerald-500',
                            colStatus === 'CANCELLED' && 'bg-slate-400'
                          )} />
                          {colStatus.replace('_', ' ')}
                        </h3>
                        <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* Column Cards */}
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {columnTasks.length === 0 ? (
                          <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
                            No tasks
                          </div>
                        ) : (
                          columnTasks.map((task) => {
                            const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                            return (
                              <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-3 hover:shadow-card transition-all">
                                
                                <div className="space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>
                                    <span className={cn(
                                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                                      task.priority === 'URGENT' && 'bg-red-50 text-red-600 border border-red-200',
                                      task.priority === 'HIGH' && 'bg-orange-50 text-orange-600 border border-orange-200',
                                      task.priority === 'MEDIUM' && 'bg-blue-50 text-blue-600 border border-blue-200',
                                      task.priority === 'LOW' && 'bg-slate-100 text-slate-500'
                                    )}>
                                      {task.priority}
                                    </span>
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                                  )}
                                </div>

                                {/* Assignee & Due Date */}
                                <div className="space-y-2 border-t border-slate-100 pt-2 text-xs">
                                  <div className="flex items-center justify-between gap-2 text-slate-400">
                                    <span className="flex items-center gap-1 font-medium text-slate-500">
                                      <User className="h-3.5 w-3.5" />
                                      {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                                    </span>
                                  </div>
                                  
                                  {task.dueAt && (
                                    <div className={cn(
                                      'flex items-center gap-1.5 font-medium',
                                      isOverdue ? 'text-red-600' : 'text-slate-400'
                                    )}>
                                      {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
                                      <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Drag-free Move Controls */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 gap-1 flex-wrap">
                                  <select
                                    value={task.status}
                                    onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                                    className="text-[11px] bg-slate-50 border border-slate-200 rounded p-1 text-slate-600 outline-none font-medium cursor-pointer"
                                  >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                  </select>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openEditTask(task)}
                                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteTaskMutation.mutate(task.id)}
                                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Log Interaction / Activity */}
        {showActivityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingActivity ? 'Edit Activity Log' : 'Log Customer Interaction'}
                </h3>
                <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleActivitySubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                    <select
                      value={actType}
                      onChange={(e) => setActType(e.target.value as ActivityType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    >
                      <option value="CALL">Call</option>
                      <option value="MEETING">Meeting</option>
                      <option value="EMAIL_LOG">Email Log</option>
                      <option value="NOTE">Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (minutes)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      value={actDuration}
                      onChange={(e) => setActDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                  <Input
                    placeholder="e.g. Proposal review call"
                    value={actSubject}
                    onChange={(e) => setActSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Details / Body</label>
                  <textarea
                    placeholder="Provide meeting minutes or call details..."
                    value={actBody}
                    onChange={(e) => setActBody(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Outcome</label>
                  <Input
                    placeholder="e.g. Scheduled demo, No response"
                    value={actOutcome}
                    onChange={(e) => setActOutcome(e.target.value)}
                  />
                </div>

                {/* Polymorphic Relationships */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Link to CRM Record</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Contact</label>
                      <select
                        value={actContactId}
                        onChange={(e) => setActContactId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {contacts.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Account</label>
                      <select
                        value={actAccountId}
                        onChange={(e) => setActAccountId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {accounts.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Lead</label>
                      <select
                        value={actLeadId}
                        onChange={(e) => setActLeadId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {leads.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Opportunity</label>
                      <select
                        value={actOppId}
                        onChange={(e) => setActOppId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {opportunities.map((o: any) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                  <Button variant="ghost" onClick={() => setShowActivityModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {editingActivity ? 'Save Changes' : 'Log Activity'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create / Edit Task */}
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h3>
                <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleTaskSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Title</label>
                  <Input
                    placeholder="e.g. Schedule final negotiation call"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    placeholder="Detail the next action steps..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                    <input
                      type="datetime-local"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assignee</label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium"
                    required
                  >
                    <option value="">-- Select Assignee --</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                    ))}
                  </select>
                </div>

                {/* Polymorphic Relationships */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Link to CRM Record</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Contact</label>
                      <select
                        value={taskContactId}
                        onChange={(e) => setTaskContactId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {contacts.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Account</label>
                      <select
                        value={taskAccountId}
                        onChange={(e) => setTaskAccountId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {accounts.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Lead</label>
                      <select
                        value={taskLeadId}
                        onChange={(e) => setTaskLeadId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {leads.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Opportunity</label>
                      <select
                        value={taskOppId}
                        onChange={(e) => setTaskOppId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">-- None --</option>
                        {opportunities.map((o: any) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                  <Button variant="ghost" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
