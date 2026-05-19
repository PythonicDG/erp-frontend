'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Clock, 
  User, 
  Calendar, 
  Building2,
  Activity,
  ChevronRight,
  MessageSquare,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project, projectService } from '@/services/project-service';
import { workflowService, StageInstance } from '@/services/workflow-service';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import { DynamicForm } from '@/components/workflow/dynamic-form';
import { generateFullProjectReport } from '@/lib/report-utils';
import toast from 'react-hot-toast';

interface ProjectDetailViewProps {
  id: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ProjectDetailView({ id, role }: ProjectDetailViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<StageInstance[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [activeStage, setActiveStage] = useState<StageInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canEdit = (role === 'admin' || role === 'supervisor' || role === 'employee');
  const canApprove = (role === 'admin' || role === 'supervisor');

  const fetchData = async () => {
    try {
      const [projectData, stagesData, companyData] = await Promise.all([
        projectService.getById(id),
        workflowService.getProjectStages(id),
        settingsService.getCompanyProfile().catch(() => null)
      ]);
      const stagesList = Array.isArray(stagesData) ? stagesData : (stagesData as any)?.results || [];
      
      setProject(projectData);
      setStages(stagesList);
      setCompanyProfile(companyData);
      
      // Default to the first unlocked or in-progress stage
      const current = stagesList.find((s: any) => s.status === 'Unlocked' || s.status === 'Submitted' || s.status === 'Pending Approval' || s.status === 'Rejected' || s.status === 'In Progress') 
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

  const handlePrintStage = () => {
    if (!activeStage || !project) return;

    const logoUrl = companyProfile?.logo 
      ? (companyProfile.logo.startsWith('http') ? companyProfile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${companyProfile.logo}`)
      : null;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formData = activeStage.current_submission?.data || {};
    const fields = activeStage.template_details.fields || [];

    let formHtml = '';
    const sections: Record<string, any[]> = {};
    fields.forEach(f => {
      const sec = f.section || 'General';
      if (!sections[sec]) sections[sec] = [];
      sections[sec].push(f);
    });

    Object.entries(sections).forEach(([name, secFields]) => {
      formHtml += `
        <div class="report-section">
          <h3 class="section-title">${name}</h3>
          <div class="field-grid">
      `;

      secFields.forEach(f => {
        const val = formData[f.name];
        if (f.field_type === 'grid') {
          const rows = val || [];
          const columns = f.configuration?.columns || ['Value', 'Remarks'];
          const hasParameter = (f.configuration?.rows?.length || 0) > 0;
          
          formHtml += `
            <div class="grid-field">
              <label class="field-label">${f.label}</label>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    ${hasParameter ? '<th>Parameter</th>' : ''}
                    ${columns.map((c: string) => `<th>${c}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rows.map((r: any, i: number) => `
                    <tr>
                      <td>${i + 1}</td>
                      ${hasParameter ? `<td>${r.parameter || ''}</td>` : ''}
                      ${columns.map((c: string) => `<td>${r[c] || ''}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        } else if (f.field_type === 'file') {
          const fileVal = val || {};
          formHtml += `
            <div class="field-item">
              <label class="field-label">${f.label}</label>
              <div class="field-value">${fileVal.name ? `📎 ${fileVal.name}` : '—'}</div>
            </div>
          `;
        } else {
          formHtml += `
            <div class="field-item">
              <label class="field-label">${f.label}</label>
              <div class="field-value">${val === true ? 'Yes' : val === false ? 'No' : (val || '—')}</div>
            </div>
          `;
        }
      });

      formHtml += `</div></div>`;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>${companyProfile?.name || 'ERP'} - Stage Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #0f172a; 
              line-height: 1.6; 
              padding: 40px; 
              margin: 0; 
              background-color: #ffffff;
            }
            
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #000000; /* Black horizontal separator line */ 
              padding-bottom: 16px; 
              margin-bottom: 35px; 
            }
            
            .company-name { 
              font-size: 16px; 
              font-weight: 700; 
              color: #0f172a; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
            }
            
            .logo { 
              height: 48px; 
              object-fit: contain; 
            }
            
            .stage-title { 
              font-size: 20px; 
              font-weight: 700; 
              color: #000000; 
              margin-top: 15px;
              margin-bottom: 30px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              text-align: center; /* Centered Form Name */
            }
            
            .report-section { 
              margin-bottom: 30px; 
            }
            
            .section-title { 
              font-size: 13px; 
              font-weight: 700; 
              color: #64748b; 
              border-bottom: 1px solid #e2e8f0; 
              padding-bottom: 6px; 
              margin-bottom: 18px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
            }
            
            .field-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 16px; 
            }
            
            .field-item { 
              display: flex; 
              flex-direction: column; 
              gap: 4px; 
            }
            
            .field-label { 
              font-size: 11px; 
              font-weight: 600; 
              color: #94a3b8; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .field-value { 
              font-size: 13px; 
              color: #0f172a; 
              min-height: 20px; 
              border-bottom: 1.5px solid #f1f5f9; 
              padding-bottom: 2px; 
            }
            
            .grid-field { 
              grid-column: span 2; 
            }
            
            .report-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px; 
              font-size: 12px; 
            }
            
            .report-table th { 
              background: #f8fafc; 
              text-align: left; 
              padding: 10px 12px; 
              font-weight: 600; 
              color: #475569; 
              border: 1px solid #e2e8f0; 
            }
            
            
            .watermark {
              position: fixed;
              top: 55%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 75px;
              font-weight: 800;
              color: rgba(239, 68, 68, 0.08); /* Semi-transparent light red */
              z-index: 9999;
              pointer-events: none;
              white-space: nowrap;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              font-family: 'Inter', sans-serif;
              display: block !important;
            }

            .report-table td { 
              padding: 10px 12px; 
              border: 1px solid #e2e8f0; 
              color: #1e293b; 
            }
            
            @media print {
              body { 
                padding: 0; 
              }
              @page { 
                margin: 1.5cm; 
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyProfile?.name || 'PCEPL Engineering'}</div>
            <div class="logo-container">${logoUrl ? ` <img src="${logoUrl}" class="logo" />` : '<div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">ERP SYSTEM</div>'}</div>
          </div>
          ${activeStage.status === 'Approved' 
            ? `<div class="watermark">${companyProfile?.watermark_released || 'RELEASED'}</div>` 
            : `<div class="watermark">${companyProfile?.watermark_under_approval || 'UNDER APPROVAL'}</div>`}

          <h1 class="stage-title">${activeStage.template_details.name}</h1>

          ${formHtml}

          <!-- Approvals & Signatures Section -->
          <div class="approval-section" style="margin-top: 50px; page-break-inside: avoid;">
            <div style="border-top: 2px solid #000000; margin-bottom: 25px; padding-top: 15px;">
              <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">Approvals & Signatures</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 115px; box-sizing: border-box;">
                <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block;">INITIATED BY</span>
                <div style="margin-top: 15px; text-align: center;">
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${activeStage.current_submission?.submitted_by_name || 'Not Set'}</div>
                  <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Form Submitter</div>
                </div>
              </div>
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 115px; box-sizing: border-box;">
                <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block;">REVIEWED BY</span>
                <div style="margin-top: 15px; text-align: center;">
                  ${activeStage.status === 'Approved' || activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval' ? `
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Peer Review Verified</div>
                    <div style="font-size: 9px; color: #059669; font-weight: 700; margin-top: 2px;">Reviewed ✅</div>
                  ` : `
                    <div style="border-bottom: 1px dashed #94a3b8; width: 80%; margin: 15px auto 0 auto; min-height: 18px;"></div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 5px;">Supervisor Signature</div>
                  `}
                </div>
              </div>
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 115px; box-sizing: border-box;">
                <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block;">APPROVED BY</span>
                <div style="margin-top: 15px; text-align: center;">
                  ${activeStage.status === 'Approved' ? `
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Stage Authorized</div>
                    <div style="font-size: 9px; color: #059669; font-weight: 700; margin-top: 2px;">Approved ✅</div>
                  ` : `
                    <div style="border-bottom: 1px dashed #94a3b8; width: 80%; margin: 15px auto 0 auto; min-height: 18px;"></div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 5px;">Authority Signature</div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintFullReport = async () => {
    await generateFullProjectReport(id);
  };

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
            <Badge 
              variant={
                project.status === 'Closed' ? 'success' : 
                project.status === 'Pending Approval' ? 'pending' :
                project.status === 'Rejected' ? 'danger' : 'info'
              }
            >
              {project.status === 'Pending Approval' ? 'Awaiting Supervisor Approval' : project.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="font-mono font-bold text-blue-600">{project.pid}</span>
            <div className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{project.customer_name}</div>
            <div className="flex items-center gap-1.5"><User className="h-4 w-4" />Created by {project.created_by_name}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <Button variant="outline" size="sm" onClick={handlePrintStage} disabled={!activeStage || (activeStage.status !== 'Approved' && activeStage.status !== 'Submitted' && activeStage.status !== 'Pending Approval')}>
              <Printer className="h-4 w-4 mr-2" /> Print Form
           </Button>
           <Button variant="outline" size="sm" onClick={handlePrintFullReport} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <FileText className="h-4 w-4 mr-2" /> Full Report
           </Button>
           <Button size="sm" onClick={handlePrintStage} disabled={!activeStage || (activeStage.status !== 'Approved' && activeStage.status !== 'Submitted' && activeStage.status !== 'Pending Approval')} className="shadow-lg shadow-blue-500/20">
              <Download className="h-4 w-4 mr-2" /> Download PDF
           </Button>
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
                   (stage.status === 'Submitted' || stage.status === 'Pending Approval') ? 'bg-amber-400 border-amber-400 text-white' :
                   stage.status === 'Unlocked' || stage.status === 'Rejected' ? 'bg-blue-500 border-white text-white' :
                   'bg-slate-800/50 border-white/10 text-white/30'
                 }`}>
                   {stage.status === 'Approved' ? <CheckCircle2 className="h-5 w-5" /> : 
                    stage.status === 'Locked' ? <Lock className="h-4 w-4" /> : 
                    (stage.status === 'Submitted' || stage.status === 'Pending Approval') ? <Clock className="h-5 w-5 animate-pulse" /> :
                    <Clock className="h-5 w-5" />}
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
                <div className="flex items-center gap-3">
                  <Badge variant={
                    activeStage.status === 'Approved' ? 'success' : 
                    (activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval') ? 'pending' :
                    activeStage.status === 'Rejected' ? 'danger' : 'info'
                  }>
                    {(activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval') ? 'Under Review' : activeStage.status}
                  </Badge>
                  
                  {(activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval') && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      Pending with: {activeStage.template_details.assigned_role === 'ADMIN' ? 'Administrator' : 'Supervisor'}
                    </span>
                  )}
                  
                  {(activeStage.status === 'Approved' || activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval') && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Read Only View
                    </span>
                  )}
                </div>

                {(activeStage.status === 'Approved' || activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval') && (
                  <Button variant="ghost" size="sm" onClick={handlePrintStage} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-bold">
                    <Printer className="h-3 w-3 mr-1.5" /> PRINT REPORT
                  </Button>
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

                  {/* 1. Project & Customer Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                      <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">Project & Customer Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</p>
                        <p className="text-sm font-semibold text-slate-700">{project.customer_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</p>
                        <p className="text-sm font-semibold text-slate-700">{project.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Part Number</p>
                        <p className="text-sm font-semibold text-slate-700">{project.customer_part_no || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Type</p>
                        <p className="text-sm font-semibold text-slate-700">{project.project_type}</p>
                      </div>
                    </div>
                  </div>

                  <DynamicForm 
                    key={activeStage.id}
                    fields={activeStage.template_details.fields || []}
                    project={project}
                    initialData={activeStage.current_submission?.data}
                    onSubmit={handleFormSubmit}
                    isLoading={actionLoading}
                    readOnly={activeStage.status === 'Approved' || activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval' || !canEdit}
                    stageStatus={activeStage.status}
                    submittedByName={activeStage.current_submission?.submitted_by_name}
                  />

                  {/* Supervisor Approval Actions */}
                  {(activeStage.status === 'Submitted' || activeStage.status === 'Pending Approval') && canApprove && (
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                      <Button variant="danger" onClick={handleReject} loading={actionLoading}>Reject Stage</Button>
                      <Button onClick={handleApprove} loading={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">Approve Stage</Button>
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
