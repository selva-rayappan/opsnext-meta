'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone,
  Users,
  FileText,
  Mail,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getActivities, createActivity, deleteActivity } from '@/lib/activities-api';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/tasks-api';
import api from '@/lib/api';
import type { Activity, Task, ActivityType, TaskPriority, TaskStatus } from '@/lib/types';

interface ActivityTimelineProps {
  contactId?: string;
  accountId?: string;
  leadId?: string;
  opportunityId?: string;
}

export default function ActivityTimeline({
  contactId,
  accountId,
  leadId,
  opportunityId,
}: ActivityTimelineProps) {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'activities' | 'tasks'>('activities');

  // Form states for log activity
  const [actType, setActType] = useState<ActivityType>('NOTE');
  const [actSubject, setActSubject] = useState('');
  const [actBody, setActBody] = useState('');
  const [actOutcome, setActOutcome] = useState('');
  const [actDuration, setActDuration] = useState('');

  // Form states for create task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  // Queries
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities-timeline', contactId, accountId, leadId, opportunityId],
    queryFn: () => getActivities({
      contactId,
      accountId,
      leadId,
      opportunityId,
      limit: 50,
    }),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-timeline', contactId, accountId, leadId, opportunityId],
    queryFn: () => getTasks({
      contactId,
      accountId,
      leadId,
      opportunityId,
      limit: 50,
    }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list-timeline'],
    queryFn: async () => {
      const res = await api.get('/api/v1/users', { params: { limit: 100 } });
      return res.data.data || [];
    },
  });

  // Mutations
  const createActivityMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
      setActSubject('');
      setActBody('');
      setActOutcome('');
      setActDuration('');
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities-timeline'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-timeline'] });
      setTaskTitle('');
      setTaskDue('');
      setTaskPriority('MEDIUM');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => updateTask(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-timeline'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-timeline'] });
    },
  });

  // Handlers
  const handleLogActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actSubject) return;
    createActivityMutation.mutate({
      type: actType,
      subject: actSubject,
      body: actBody || undefined,
      outcome: actOutcome || undefined,
      duration: actDuration ? parseInt(actDuration, 10) : undefined,
      contactId,
      accountId,
      leadId,
      opportunityId,
      completedAt: new Date().toISOString(),
    });
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    // Use selected assignee, or default to current user/first user
    const assigneeId = taskAssigneeId || users[0]?.id || '';

    createTaskMutation.mutate({
      title: taskTitle,
      dueAt: taskDue || undefined,
      priority: taskPriority,
      assigneeId,
      contactId,
      accountId,
      leadId,
      opportunityId,
    });
  };

  const toggleTaskCompletion = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
    updateTaskMutation.mutate({ id: task.id, dto: { status: newStatus } });
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4 text-emerald-600" />;
      case 'MEETING': return <Users className="h-4 w-4 text-indigo-600" />;
      case 'EMAIL_LOG': return <Mail className="h-4 w-4 text-amber-600" />;
      case 'NOTE': return <FileText className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card-sm overflow-hidden flex flex-col">
      
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setSubTab('activities')}
          className={cn(
            'flex-1 py-3 px-4 font-bold text-xs tracking-wider uppercase border-b-2 text-center transition-all',
            subTab === 'activities'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setSubTab('tasks')}
          className={cn(
            'flex-1 py-3 px-4 font-bold text-xs tracking-wider uppercase border-b-2 text-center transition-all',
            subTab === 'tasks'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          Task Checklist
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Tab 1 Content: Activities Log & Feed */}
        {subTab === 'activities' && (
          <div className="space-y-6">
            
            {/* Quick Log Form */}
            <form onSubmit={handleLogActivitySubmit} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Log</span>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value as ActivityType)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value="NOTE">Log Note</option>
                  <option value="CALL">Log Call</option>
                  <option value="MEETING">Log Meeting</option>
                  <option value="EMAIL_LOG">Log Email</option>
                </select>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Subject / Summary"
                  value={actSubject}
                  onChange={(e) => setActSubject(e.target.value)}
                  className="bg-white h-8 text-xs placeholder:text-slate-400"
                  required
                />
                <textarea
                  placeholder="Enter details..."
                  value={actBody}
                  onChange={(e) => setActBody(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500 resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Outcome"
                    value={actOutcome}
                    onChange={(e) => setActOutcome(e.target.value)}
                    className="bg-white h-7 text-[11px] w-28 placeholder:text-slate-400"
                  />
                  <Input
                    placeholder="Mins"
                    type="number"
                    value={actDuration}
                    onChange={(e) => setActDuration(e.target.value)}
                    className="bg-white h-7 text-[11px] w-16 placeholder:text-slate-400"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3">
                  Log
                </Button>
              </div>
            </form>

            {/* Activities Feed */}
            {activitiesLoading ? (
              <div className="text-center text-xs text-slate-400">Loading feed...</div>
            ) : (activitiesData?.data || []).length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">No interactions logged yet.</div>
            ) : (
              <div className="relative pl-4 border-l border-slate-200 space-y-4">
                {(activitiesData?.data || []).map((act) => (
                  <div key={act.id} className="relative group bg-white p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
                    
                    <div className="absolute -left-[25px] top-3 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                      {getActivityIcon(act.type)}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{act.subject}</h5>
                        {act.body && <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-wrap">{act.body}</p>}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                          <span className="font-semibold text-slate-500">{act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}</span>
                          <span>{new Date(act.createdAt).toLocaleString()}</span>
                          {act.duration && <span>{act.duration} mins</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteActivityMutation.mutate(act.id)}
                        className="text-slate-300 hover:text-red-500 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Tab 2 Content: Tasks Checklist */}
        {subTab === 'tasks' && (
          <div className="space-y-6">
            
            {/* Quick Task Form */}
            <form onSubmit={handleCreateTaskSubmit} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Add Follow-up Task</span>
              
              <Input
                placeholder="Task description..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="bg-white h-8 text-xs placeholder:text-slate-400"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs outline-none text-slate-600"
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">-- Assignee --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3">
                  Add Task
                </Button>
              </div>
            </form>

            {/* Tasks List */}
            {tasksLoading ? (
              <div className="text-center text-xs text-slate-400">Loading checklist...</div>
            ) : (tasksData?.data || []).length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">No tasks scheduled.</div>
            ) : (
              <div className="space-y-3">
                {(tasksData?.data || []).map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && !isCompleted;
                  return (
                    <div key={task.id} className="group bg-white p-3 rounded-lg border border-slate-250 flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskCompletion(task)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckSquare className="h-4.5 w-4.5 text-indigo-600" />
                          ) : (
                            <Square className="h-4.5 w-4.5" />
                          )}
                        </button>
                        
                        <div>
                          <span className={cn(
                            'text-xs font-semibold',
                            isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                          )}>
                            {task.title}
                          </span>
                          
                          <div className="flex items-center gap-2.5 text-[9px] text-slate-400 mt-1">
                            {task.assignee && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <User className="h-2.5 w-2.5" /> {task.assignee.firstName}
                              </span>
                            )}
                            {task.dueAt && (
                              <span className={cn(
                                'flex items-center gap-0.5 font-medium',
                                isOverdue ? 'text-red-500' : 'text-slate-400'
                              )}>
                                <Clock className="h-2.5 w-2.5" /> Due: {new Date(task.dueAt).toLocaleDateString()}
                              </span>
                            )}
                            <span className={cn(
                              'px-1 py-0.2 rounded font-bold uppercase',
                              task.priority === 'URGENT' && 'bg-red-50 text-red-500',
                              task.priority === 'HIGH' && 'bg-orange-50 text-orange-500',
                              task.priority === 'MEDIUM' && 'bg-blue-50 text-blue-500',
                              task.priority === 'LOW' && 'bg-slate-100 text-slate-500'
                            )}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="text-slate-300 hover:text-red-500 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
