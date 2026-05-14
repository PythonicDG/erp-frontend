'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Clock, 
  User, 
  Calendar, 
  Building2,
  Activity,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project, projectService } from '@/services/project-service';
import { workflowService, StageInstance } from '@/services/workflow-service';
import { DynamicForm } from '@/components/workflow/dynamic-form';
import toast from 'react-hot-toast';

interface ProjectDetailViewProps {
  id: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ProjectDetailView({ id, role }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<StageInstance[]>([]);
  const [activeStage, setActiveStage] = useState<StageInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canEdit = (role === 'admin' || role === 'supervisor' || role === 'employee');
  const canApprove = (role === 'admin' || role === 'supervisor');

  const fetchData = async () => {
    try {
      const [projectData, stagesData] = await Promise.all([
        projectService.getById(id),
        workflowService.getProjectStages(id)
      ]);
      const stagesList = Array.isArray(stagesData) ? stagesData : (stagesData as any)?.results || [];
      
      setProject(projectData);
      setStages(stagesList);
      
      // Default to the first unlocked or in-progress stage
      const current = stagesList.find((s: any) => s.status === 'Unlocked' || s.status === 'Submitted' || s.status === 'Rejected' || s.status === 'In Progress') 
                     || stagesList.find((s: any) => s.status === 'Approved' && s.order === stagesList.length)
                     || stagesList[0];
      setActiveStage(current || null);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleFormSubmit = async (data: any) => {
    if (!activeStage) return;
    setActionLoading(true);
    try {
      await workflowService.submitStage(activeStage.id, data);
      toast.success('Stage submitted successfully');
      fetchData();
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeStage) return;
    const remarks = window.prompt('Enter approval remarks (optional):');
    setActionLoading(true);
    try {
      await workflowService.approveStage(activeStage.id, remarks || '');
      toast.success('Stage approved');
      fetchData();
    } catch (error) {
      toast.error('Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeStage) return;
    const remarks = window.prompt('Enter rejection reason (required):');
    if (!remarks) return;
    setActionLoading(true);
    try {
      await workflowService.rejectStage(activeStage.id, remarks);
      toast.success('Stage rejected');
      fetchData();
    } catch (error) {
      toast.error('Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!project) return <div className="p-20 text-center">Project not found</div>;

  const stagesList = Array.isArray(stages) ? stages : [];
  const completedStages = stagesList.filter(s => s.status === 'Approved').length;
  const progressPercent = stagesList.length > 0 
    ? Math.round((completedStages / stagesList.length) * 100) 
    : 0;

  return (
    <div className="p-6 max-w-(--breakpoint-2xl) mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'Closed' ? 'success' : 'info'}>{project.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="font-mono font-bold text-blue-600">{project.pid}</span>
            <div className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{project.customer_name}</div>
            <div className="flex items-center gap-1.5"><User className="h-4 w-4" />Created by {project.created_by_name}</div>
          </div>
        </div>
      </div>

      {/* Progress Tracker (Dynamic) */}
      <Card className="bg-linear-to-r from-blue-700 to-indigo-800 border-none text-white overflow-hidden">
        <div className="overflow-x-auto py-10">
          <div className="flex justify-start gap-x-20 md:gap-x-32 relative px-10 min-w-max">
             {/* The Connector Line */}
             <div className="absolute top-[16px] left-20 right-20 h-0.5 bg-white/10" />
             
             {stages.map((stage, i) => (
               <button 
                 key={stage.id} 
                 onClick={() => setActiveStage(stage)}
                 className={`relative z-10 flex flex-col items-center gap-3 group cursor-pointer transition-all ${activeStage?.id === stage.id ? 'scale-105' : 'hover:scale-105'}`}
               >
                 {/* The Circle Icon */}
                 <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 ${
                   stage.status === 'Approved' ? 'bg-white border-white text-blue-600' :
                   stage.status === 'Submitted' ? 'bg-amber-400 border-amber-400 text-white' :
                   stage.status === 'Unlocked' || stage.status === 'Rejected' ? 'bg-blue-500 border-white text-white' :
                   'bg-slate-800/50 border-white/10 text-white/30'
                 }`}>
                   {stage.status === 'Approved' ? <CheckCircle2 className="h-5 w-5" /> : 
                    stage.status === 'Locked' ? <Lock className="h-4 w-4" /> : <Clock className="h-5 w-5" />}
                 </div>

                 {/* The Stage Label */}
                 <div className="flex flex-col items-center max-w-[120px]">
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-center leading-tight transition-colors duration-300 ${activeStage?.id === stage.id ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                      {stage.template_details.name}
                    </span>
                    {activeStage?.id === stage.id && (
                      <div className="h-1 w-1 rounded-full bg-white mt-1 shadow-xs shadow-white" />
                    )}
                 </div>
               </button>
             ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Stage Form/Details */}
        <div className="lg:col-span-2 space-y-6">
          {activeStage ? (
            <Card 
              title={`Stage ${activeStage.order}: ${activeStage.template_details.name}`}
              subtitle={activeStage.template_details.description}
              className="shadow-xl shadow-blue-500/5"
            >
              <div className="mb-6 flex items-center justify-between">
                <Badge variant={
                  activeStage.status === 'Approved' ? 'success' : 
                  activeStage.status === 'Submitted' ? 'warning' :
                  activeStage.status === 'Rejected' ? 'danger' : 'info'
                }>
                  Status: {activeStage.status}
                </Badge>
                
                {(activeStage.status === 'Approved' || activeStage.status === 'Submitted') && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Read Only View
                  </span>
                )}
              </div>

              {activeStage.status === 'Locked' ? (
                <div className="py-12 text-center space-y-4">
                  <Lock className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="text-slate-500 font-medium">This stage is currently locked. Complete previous stages to unlock.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Rejection Alert */}
                  {activeStage.status === 'Rejected' && activeStage.current_submission?.remarks && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex gap-3 text-red-800">
                      <MessageSquare className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Rejection Remark:</p>
                        <p className="text-sm">{activeStage.current_submission.remarks}</p>
                      </div>
                    </div>
                  )}

                  <DynamicForm 
                    key={activeStage.id}
                    fields={activeStage.template_details.fields || []}
                    project={project}
                    initialData={activeStage.current_submission?.data}
                    onSubmit={handleFormSubmit}
                    isLoading={actionLoading}
                    readOnly={activeStage.status === 'Approved' || activeStage.status === 'Submitted' || !canEdit}
                  />

                  {/* Supervisor Approval Actions */}
                  {activeStage.status === 'Submitted' && canApprove && (
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                      <Button variant="danger" onClick={handleReject} isLoading={actionLoading}>Reject Stage</Button>
                      <Button onClick={handleApprove} isLoading={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">Approve Stage</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <div className="p-20 text-center text-slate-400">Select a stage from the timeline to view details</div>
          )}
        </div>

        {/* Sidebar: Activity & Info */}
        <div className="space-y-6">
          <Card title="Project Summary">
             <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Stages:</span>
                  <span className="font-bold text-slate-900">{stages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Completed:</span>
                  <span className="font-bold text-emerald-600">{completedStages}</span>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                    <span>Overall Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
             </div>
          </Card>

          <Card title="Activity Timeline">
             <div className="space-y-6">
               {(activeStage?.activities || []).map((act: any) => (
                 <div key={act.id} className="relative pl-6 pb-4 last:pb-0 border-l border-slate-100">
                    <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <p className="text-sm font-bold text-slate-900">{act.action}</p>
                    <p className="text-xs text-slate-500">{act.performed_by_name} • {new Date(act.timestamp).toLocaleString()}</p>
                    {act.remarks && <p className="text-xs mt-1 italic text-slate-400">"{act.remarks}"</p>}
                 </div>
               ))}
               {(!activeStage || activeStage.activities.length === 0) && <p className="text-xs text-slate-400 italic">No recent activity</p>}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
