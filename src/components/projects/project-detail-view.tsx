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
  FileText,
  Settings2
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

const parseDateString = (str: string) => {
  const parts = str.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(str);
};

const formatDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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
  const [activeTab, setActiveTab] = useState<'workflow' | 'dd-plan'>('workflow');
  const [editComplexity, setEditComplexity] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [isUpdatingTimeline, setIsUpdatingTimeline] = useState(false);

  useEffect(() => {
    if (project) {
      setEditComplexity(project.project_complexity || 'Medium');
      setEditStartDate(project.planned_start_date || '');
    }
  }, [project]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getCascadedStages = (): StageInstance[] => {
    if (!project) return [];
    
    const complexity = project.project_complexity || 'Medium';
    const initialStartStr = project.planned_start_date || project.date_received || new Date().toISOString().split('T')[0];
    
    let currentDate = parseDateString(initialStartStr);
    // If it's a Sunday, bump it to Monday
    if (currentDate.getDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return stages.map((stage) => {
      let dur = 0;
      const temp = stage.template_details;
      if (complexity === 'High') {
        dur = temp?.duration_high ?? 5;
      } else if (complexity === 'Low') {
        dur = temp?.duration_low ?? 1;
      } else {
        dur = temp?.duration_medium ?? 3;
      }
      
      const isConfigured = !!project.planned_start_date;
      
      let pStart = stage.planned_start_date;
      let pEnd = stage.planned_end_date;
      let resolvedDur = stage.duration !== null ? stage.duration : dur;

      if (!isConfigured) {
        // Calculate preview start date
        pStart = formatDateString(currentDate);
        
        // Calculate preview end date = start + duration
        const end = new Date(currentDate);
        end.setDate(end.getDate() + resolvedDur);
        pEnd = formatDateString(end);
        
        // Next stage starts on the calendar day after end, skipping Sunday
        const nextStart = new Date(end);
        nextStart.setDate(nextStart.getDate() + 1);
        if (nextStart.getDay() === 0) { // Sunday is 0 in JS getDay()
          nextStart.setDate(nextStart.getDate() + 1); // bump to Monday
        }
        currentDate = nextStart;
      }

      return {
        ...stage,
        planned_start_date: pStart,
        planned_end_date: pEnd,
        duration: resolvedDur
      };
    });
  };

  const handleUpdateTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingTimeline(true);
    try {
      await projectService.update(id, {
        project_complexity: editComplexity,
        planned_start_date: editStartDate || null
      });
      toast.success('D&D Plan timeline recalculated successfully!', { icon: '📅' });
      await fetchData();
    } catch (error) {
      toast.error('Failed to update timeline');
    } finally {
      setIsUpdatingTimeline(false);
    }
  };

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

    const projectDetailsHtml = `
      <div class="project-details-card">
        <h3 class="project-details-card-title">Project & Customer References</h3>
        <div class="project-details-grid">
          <div class="project-details-item">
            <span class="project-details-label">Project ID (PID)</span>
            <span class="project-details-value" style="font-family: monospace;">${project.pid}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">Project Name</span>
            <span class="project-details-value">${project.name}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">Customer Name</span>
            <span class="project-details-value">${project.customer_name}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">Project Type</span>
            <span class="project-details-value">${project.project_type}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">Customer Part No</span>
            <span class="project-details-value">${project.customer_part_no || '—'}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">PCEPL Part No</span>
            <span class="project-details-value">${project.pcepl_part_no || '—'}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">Applicable Standard</span>
            <span class="project-details-value">${project.applicable_standard || '—'}</span>
          </div>
          <div class="project-details-item">
            <span class="project-details-label">Project Complexity</span>
            <span class="project-details-value">${project.project_complexity || 'Medium'}</span>
          </div>
        </div>
      </div>
    `;

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
              border-bottom: 2px solid #000000;
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
              text-align: center;
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
              color: rgba(239, 68, 68, 0.08);
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
            
            .project-details-card {
              margin-bottom: 25px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              box-sizing: border-box;
            }
            
            .project-details-card-title {
              font-size: 11px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0 0 12px 0;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
            }
            
            .project-details-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
            }
            
            .project-details-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            
            .project-details-label {
              font-size: 9px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .project-details-value {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
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

          ${projectDetailsHtml}

          ${formHtml}

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

  const handlePrintControlSheet = () => {
    if (!project) return;

    const logoUrl = companyProfile?.logo 
      ? (companyProfile.logo.startsWith('http') ? companyProfile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${companyProfile.logo}`)
      : null;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cascadedStages = getCascadedStages();
    const isConfigured = !!project.planned_start_date;

    const rowsHtml = cascadedStages.map((stage, idx) => {
      const isDelayed = stage.delay_days !== null && stage.delay_days > 0;
      const isApproved = stage.status === 'Approved';
      const actualCompletion = stage.actual_completion_date ? formatDate(stage.actual_completion_date) : '—';
      const delayText = isApproved ? (isDelayed ? `+${stage.delay_days} Days` : 'On Time') : '—';
      const delayClass = isApproved && isDelayed ? 'text-red-600 font-bold' : (isApproved ? 'text-emerald-600 font-bold' : '');
      
      return `
        <tr>
          <td class="text-center font-bold">${idx + 1}</td>
          <td class="font-bold">${stage.template_details.name}</td>
          <td class="font-mono text-center">${formatDate(stage.planned_start_date)}</td>
          <td class="text-center font-mono">${stage.duration !== null ? `${stage.duration} Days` : '—'}</td>
          <td class="font-mono text-center">${formatDate(stage.planned_end_date)}</td>
          <td class="font-mono text-center">${actualCompletion}</td>
          <td class="text-center font-mono ${delayClass}">${delayText}</td>
          <td class="text-center font-semibold">${stage.status === 'Pending Approval' ? 'Under Review' : stage.status}</td>
          <td class="remarks-cell">${stage.remarks || stage.current_submission?.remarks || '—'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${companyProfile?.name || 'ERP'} - D&D Plan</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #0f172a; 
              line-height: 1.5; 
              padding: 40px; 
              margin: 0; 
              background-color: #ffffff;
            }
            
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #000000;
              padding-bottom: 16px; 
              margin-bottom: 30px; 
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
            
            .sheet-title { 
              font-size: 20px; 
              font-weight: 700; 
              color: #000000; 
              margin-top: 10px;
              margin-bottom: 25px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              text-align: center;
            }
            
            .project-details-card {
              margin-bottom: 25px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              box-sizing: border-box;
            }
            
            .project-details-card-title {
              font-size: 11px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0 0 12px 0;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
            }
            
            .project-details-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
            }
            
            .project-details-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            
            .project-details-label {
              font-size: 9px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .project-details-value {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
            }
            
            .control-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              font-size: 11px; 
            }
            
            .control-table th { 
              background: #f8fafc; 
              text-align: left; 
              padding: 10px 8px; 
              font-weight: 700; 
              color: #475569; 
              border: 1px solid #cbd5e1; 
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.05em;
            }
            
            .control-table td { 
              padding: 10px 8px; 
              border: 1px solid #cbd5e1; 
              color: #1e293b; 
            }
            
            .text-center {
              text-align: center;
            }
            
            .font-mono {
              font-family: monospace;
              font-size: 11px;
            }
            
            .font-bold {
              font-weight: 700;
            }
            
            .font-semibold {
              font-weight: 600;
            }
            
            .text-red-600 {
              color: #dc2626;
            }
            
            .text-emerald-600 {
              color: #059669;
            }
            
            .remarks-cell {
              max-width: 150px;
              word-wrap: break-word;
              font-style: italic;
              color: #64748b;
            }

            .watermark-draft {
              position: fixed;
              top: 55%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              font-weight: 800;
              color: rgba(245, 158, 11, 0.07);
              z-index: 9999;
              pointer-events: none;
              white-space: nowrap;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              font-family: 'Inter', sans-serif;
              display: block !important;
            }
            
            .footer-info {
              margin-top: 25px;
              font-size: 9px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
            }
            
            @media print {
              body { 
                padding: 0; 
              }
              @page { 
                margin: 1cm; 
                size: A4 landscape;
              }
              .control-table th {
                background-color: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyProfile?.name || 'PCEPL Engineering'}</div>
            <div class="logo-container">${logoUrl ? ` <img src="${logoUrl}" class="logo" />` : '<div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">ERP SYSTEM</div>'}</div>
          </div>
          
          ${!isConfigured ? `<div class="watermark-draft">DRAFT PLAN</div>` : ''}

          <h1 class="sheet-title">Design & Development Plan</h1>

          <div class="project-details-card">
            <div class="project-details-card-title">Project & Plan Specifications</div>
            <div class="project-details-grid">
              <div class="project-details-item">
                <span class="project-details-label">Project ID (PID)</span>
                <span class="project-details-value" style="font-family: monospace;">${project.pid}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Project Name</span>
                <span class="project-details-value">${project.name}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Customer Name</span>
                <span class="project-details-value">${project.customer_name}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Project Complexity</span>
                <span class="project-details-value">${project.project_complexity || 'Medium'}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Planned Start Date</span>
                <span class="project-details-value">${isConfigured ? formatDate(project.planned_start_date) : 'DRAFT (Not Activated)'}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Date Received</span>
                <span class="project-details-value">${formatDate(project.date_received)}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Target Completion</span>
                <span class="project-details-value">${cascadedStages.length > 0 ? formatDate(cascadedStages[cascadedStages.length - 1].planned_end_date) : '—'}</span>
              </div>
              <div class="project-details-item">
                <span class="project-details-label">Plan Status</span>
                <span class="project-details-value">${isConfigured ? 'Active sequential Timeline' : 'DRAFT PREVIEW'}</span>
              </div>
            </div>
          </div>

          <table class="control-table">
            <thead>
              <tr>
                <th style="width: 4%; text-align: center;">Sr.</th>
                <th style="width: 25%;">Activity Description</th>
                <th style="width: 11%; text-align: center;">Planned Start</th>
                <th style="width: 8%; text-align: center;">Duration</th>
                <th style="width: 11%; text-align: center;">Planned End</th>
                <th style="width: 12%; text-align: center;">Actual Completion</th>
                <th style="width: 8%; text-align: center;">Delay</th>
                <th style="width: 9%; text-align: center;">Status</th>
                <th style="width: 12%;">Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-info">
            <span>Generated on: ${new Date().toLocaleString('en-IN')}</span>
            <span>Plan Math: Sunday-bypassing sequential calendar cascade</span>
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
                 onClick={() => {
                   setActiveStage(stage);
                   setActiveTab('workflow');
                 }}
                 className={`relative z-10 flex flex-col items-center gap-3 group cursor-pointer transition-all ${activeStage?.id === stage.id && activeTab === 'workflow' ? 'scale-105' : 'hover:scale-105'}`}
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
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-center leading-tight transition-colors duration-300 ${activeStage?.id === stage.id && activeTab === 'workflow' ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                      {stage.template_details.name}
                    </span>
                    {activeStage?.id === stage.id && activeTab === 'workflow' && (
                      <div className="h-1 w-1 rounded-full bg-white mt-1 shadow-xs shadow-white" />
                    )}
                 </div>
               </button>
             ))}
          </div>
        </div>
      </Card>

      {/* Premium Tab Selection Header */}
      <div className="flex border-b border-slate-200 gap-6 mt-4">
        <button
          type="button"
          onClick={() => setActiveTab('workflow')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'workflow'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Active Workflow Stage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dd-plan')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'dd-plan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📅 Design & Development Plan
        </button>
      </div>

      {activeTab === 'workflow' ? (
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
                        Pending with: {(activeStage.template_details.assigned_role === 'ADMIN' || activeStage.template_details.assigned_role === 'SUPERADMIN') ? 'Administrator' : 'Supervisor'}
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
      ) : (
        /* D&D Spreadsheet Control Sheet */
        <div className="space-y-6">
          {/* Timeline & Recalculation settings card */}
          {canEdit && (
            <Card 
              title="D&D Plan Configuration" 
              subtitle="Modify project complexity and start date to automatically regenerate the timeline cascade."
              className="bg-slate-50/50 shadow-xs border-slate-200"
            >
              <form onSubmit={handleUpdateTimeline} className="flex flex-col md:flex-row md:items-end gap-6 max-w-4xl">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Project Complexity</label>
                  <select 
                    value={editComplexity} 
                    onChange={(e) => setEditComplexity(e.target.value as any)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all font-semibold text-slate-700"
                  >
                    <option value="High">High Complexity (High Stage Durations)</option>
                    <option value="Medium">Medium Complexity (Default Durations)</option>
                    <option value="Low">Low Complexity (1-day Durations)</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Initial Planned Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <Button 
                    type="submit" 
                    loading={isUpdatingTimeline}
                    className="h-11 shadow-lg shadow-blue-500/10 px-6 font-bold"
                  >
                    <Settings2 className="h-4 w-4 mr-2" /> Recalculate Timeline
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* D&D Spreadsheet Sheet Card */}
          <Card 
            title="Design & Development Plan Spreadsheet" 
            subtitle={`Integrated Plan • Project ID: ${project.pid} • Complexity: ${project.project_complexity || 'Medium'}`}
            className="overflow-hidden shadow-xl shadow-blue-500/5"
          >
            {(() => {
              const cascadedStages = getCascadedStages();
              const isConfigured = !!project.planned_start_date;
              return (
                <div className="space-y-4">
                  {!isConfigured && (
                    <div className="bg-amber-50/80 border border-amber-200/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-800 shadow-xs mb-2">
                      <div className="flex gap-3">
                        <span className="text-xl">📅</span>
                        <div>
                          <p className="font-bold text-sm">Draft D&D Plan Preview</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Showing proposed timeline starting from Date Received: <strong className="text-slate-800">{formatDate(project.date_received)}</strong>. Modify properties and click "Recalculate Timeline" above to activate and save this plan.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs bg-white">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                          <th className="py-4 px-4 font-bold text-center border-r border-slate-200 w-12">Sr.</th>
                          <th className="py-4 px-6 font-bold border-r border-slate-200">Activity Description</th>
                          <th className="py-4 px-5 font-bold border-r border-slate-200 w-44">Planned Start Date</th>
                          <th className="py-4 px-4 font-bold text-center border-r border-slate-200 w-24">Duration</th>
                          <th className="py-4 px-5 font-bold border-r border-slate-200 w-44">Planned End Date</th>
                          <th className="py-4 px-5 font-bold border-r border-slate-200 w-44">Actual Completion</th>
                          <th className="py-4 px-4 font-bold text-center border-r border-slate-200 w-28">Delay</th>
                          <th className="py-4 px-5 font-bold border-r border-slate-200 w-36">Status</th>
                          <th className="py-4 px-6 font-bold">Remarks / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans text-xs">
                        {cascadedStages.map((stage, idx) => {
                          const isDelayed = stage.delay_days !== null && stage.delay_days > 0;
                          const isApproved = stage.status === 'Approved';
                          
                          return (
                            <tr 
                              key={stage.id} 
                              className={`hover:bg-slate-50/50 transition-colors ${
                                stage.status === 'In Progress' || stage.status === 'Unlocked' 
                                  ? 'bg-blue-50/20' 
                                  : ''
                              }`}
                            >
                              <td className="py-3.5 px-4 font-semibold text-slate-500 text-center border-r border-slate-200 bg-slate-50/30">
                                {idx + 1}
                              </td>
                              <td className="py-3.5 px-6 font-bold text-slate-900 border-r border-slate-200">
                                {stage.template_details.name}
                              </td>
                              <td className={`py-3.5 px-5 font-mono border-r border-slate-200 ${!isConfigured ? 'text-amber-600 italic bg-amber-50/10' : 'text-slate-600'}`}>
                                {formatDate(stage.planned_start_date)}
                              </td>
                              <td className="py-3.5 px-4 text-center font-semibold text-slate-700 border-r border-slate-200 font-mono">
                                {stage.duration !== null ? `${stage.duration} Days` : '—'}
                              </td>
                              <td className={`py-3.5 px-5 font-mono border-r border-slate-200 ${!isConfigured ? 'text-amber-600 italic bg-amber-50/10' : 'text-slate-600'}`}>
                                {formatDate(stage.planned_end_date)}
                              </td>
                              <td className="py-3.5 px-5 font-mono border-r border-slate-200">
                                {stage.actual_completion_date ? (
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                    {formatDate(stage.actual_completion_date)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Not Completed</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center border-r border-slate-200">
                                {isApproved ? (
                                  isDelayed ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-tight">
                                      ⚠️ +{stage.delay_days} Days
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tight">
                                      On Time
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 border-r border-slate-200">
                                <Badge 
                                  variant={
                                    stage.status === 'Approved' ? 'success' : 
                                    (stage.status === 'Submitted' || stage.status === 'Pending Approval') ? 'pending' :
                                    stage.status === 'Rejected' ? 'danger' :
                                    stage.status === 'Unlocked' || stage.status === 'In Progress' ? 'info' : 'outline'
                                  }
                                >
                                  {stage.status === 'Pending Approval' ? 'Under Review' : stage.status}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 max-w-[200px] truncate" title={stage.remarks || stage.current_submission?.remarks || ''}>
                                {stage.remarks || stage.current_submission?.remarks || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 text-xs">
                    <div className="flex gap-6 text-slate-500 font-medium">
                      <span>🔄 Timeline cascades sequentially: <strong className="text-slate-700">Planned End = Start + Duration</strong>.</span>
                      <span>📆 Sundays are automatically skipped to match corporate scheduling guidelines.</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePrintControlSheet} className="text-slate-600 border-slate-200">
                      <Printer className="h-4 w-4 mr-2" /> Print Plan
                    </Button>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      )}
    </div>
  );
}
