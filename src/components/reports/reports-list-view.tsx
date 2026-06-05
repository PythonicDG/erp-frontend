'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Eye, 
  Briefcase,
  Building2,
  User,
  Clock,
  FileText,
  FileCode,
  Calendar,
  Settings2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Project, projectService } from '@/services/project-service';
import { workflowService, StageInstance } from '@/services/workflow-service';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import { DynamicForm } from '@/components/workflow/dynamic-form';
import { useProjects } from '@/hooks/use-projects';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ecnService, ECN } from '@/services/ecn-service';
import { ascnService, ASCN } from '@/services/ascn-service';

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

interface ReportsListViewProps {
  role: 'admin' | 'supervisor' | 'employee';
  initialProjectId?: string;
}

export function ReportsListView({ role, initialProjectId }: ReportsListViewProps) {
  const router = useRouter();
  
  // State for selected project reports
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<StageInstance[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'documents' | 'plan' | 'ecn' | 'ascn'>('forms');
  const [viewingStage, setViewingStage] = useState<StageInstance | null>(null);
  const [ecns, setEcns] = useState<ECN[]>([]);
  const [ascns, setAscns] = useState<ASCN[]>([]);

  // Search states for searchable dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch all projects that are currently in processing (at least one form is filled) for the dropdown selection list
  const { 
    projects, 
    loading: loadingProjects
  } = useProjects({ in_processing: 'true', page_size: 1000 } as any);

  // Fetch company profile on mount
  useEffect(() => {
    settingsService.getCompanyProfile()
      .then(data => setCompanyProfile(data))
      .catch(() => null);
  }, []);

  // Sync search query with selected project
  useEffect(() => {
    if (project) {
      setSearchQuery(`${project.pid} - ${project.name} (${project.customer_name})`);
    } else {
      setSearchQuery('');
    }
  }, [project]);

  // Fetch specific project detail reports when selection changes
  const fetchProjectDetails = async (projectId: string) => {
    if (!projectId) {
      setProject(null);
      setStages([]);
      setEcns([]);
      setAscns([]);
      return;
    }
    
    setLoadingDetails(true);
    try {
      const [projectData, stagesData, ecnsData, ascnsData] = await Promise.all([
        projectService.getById(projectId),
        workflowService.getProjectStages(projectId),
        ecnService.getAll({ project: projectId }).catch(() => ({ results: [] })),
        ascnService.getAll({ project: projectId }).catch(() => ({ results: [] }))
      ]);
      const stagesList = Array.isArray(stagesData) ? stagesData : (stagesData as any)?.results || [];
      const ecnsList = Array.isArray(ecnsData) ? ecnsData : (ecnsData as any)?.results || [];
      const ascnsList = Array.isArray(ascnsData) ? ascnsData : (ascnsData as any)?.results || [];
      
      setProject(projectData);
      setStages(stagesList);
      setEcns(ecnsList);
      setAscns(ascnsList);
    } catch (error) {
      toast.error('Failed to load project report specifications');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails(selectedProjectId);
  }, [selectedProjectId]);

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setViewingStage(null);
    if (id) {
      router.push(`/${role}/reports/${id}`);
    } else {
      router.push(`/${role}/reports`);
    }
  };

  // Filter out stages that have filled/submitted forms (including drafts!)
  const getFilledStages = () => {
    return stages.filter(s => s.current_submission);
  };

  // Extract all attachments from submitted forms (including drafts!)
  const getAttachments = () => {
    const list: any[] = [];
    stages.forEach((stage) => {
      const submission = stage.current_submission;
      if (!submission) return;

      const fields = stage.template_details.fields || [];
      fields.forEach((field) => {
        if (field.field_type === 'file') {
          const fileVal = submission.data?.[field.name];
          if (fileVal && fileVal.base64) {
            list.push({
              id: `${stage.id}-${field.id}`,
              fileName: fileVal.name,
              fileType: fileVal.type || 'application/pdf',
              label: field.label,
              stageName: stage.template_details.name,
              uploadedBy: submission.submitted_by_name || 'N/A',
              uploadDate: submission.submitted_at,
              fileData: fileVal,
            });
          }
        }
      });
    });
    return list;
  };

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

  const handlePrintStage = (stage: StageInstance) => {
    if (!stage || !project) return;

    const logoUrl = companyProfile?.logo 
      ? (companyProfile.logo.startsWith('http') ? companyProfile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${companyProfile.logo}`)
      : null;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formData = stage.current_submission?.data || {};
    const fields = stage.template_details.fields || [];

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
          ${stage.status === 'Approved' 
            ? `<div class="watermark">${companyProfile?.watermark_released || 'RELEASED'}</div>` 
            : `<div class="watermark">${companyProfile?.watermark_under_approval || 'UNDER APPROVAL'}</div>`}

          <h1 class="stage-title">${stage.template_details.name}</h1>

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
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${stage.current_submission?.submitted_by_name || 'Not Set'}</div>
                  <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Form Submitter</div>
                </div>
              </div>
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 115px; box-sizing: border-box;">
                <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block;">REVIEWED BY</span>
                <div style="margin-top: 15px; text-align: center;">
                  ${stage.status === 'Approved' || stage.status === 'Submitted' || stage.status === 'Pending Approval' ? `
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
                  ${stage.status === 'Approved' ? `
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

  const handlePrintDnDPlan = () => {
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

  const handleViewDocument = (fileData: any) => {
    const pdfWindow = window.open("");
    if (pdfWindow) {
      pdfWindow.document.write(
        `<iframe width='100%' height='100%' src='${fileData.base64}' style='border:none;'></iframe>`
      );
      pdfWindow.document.title = fileData.name;
      pdfWindow.document.close();
    } else {
      toast.error('Pop-up blocked. Please allow pop-ups for this website.');
    }
  };

  const handlePrintDocument = (fileData: any) => {
    const printWindow = window.open("");
    if (printWindow) {
      if (fileData.type?.startsWith('image/')) {
        printWindow.document.write(`<img src='${fileData.base64}' style='max-width:100%' onload='window.print();window.close();' />`);
      } else {
        printWindow.document.write(`<iframe width='100%' height='100%' src='${fileData.base64}' style='border:none;' onload='window.print();window.close();'></iframe>`);
      }
      printWindow.document.close();
    } else {
      toast.error('Pop-up blocked. Please allow pop-ups for this website.');
    }
  };

  const handleDownloadDocument = (fileData: any) => {
    const link = document.createElement('a');
    link.href = fileData.base64;
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded: ${fileData.name}`);
  };

  const filledStages = getFilledStages();
  const attachments = getAttachments();

  return (
    <div className="p-6 max-w-(--breakpoint-2xl) mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports & Submissions</h1>
        <p className="text-slate-500 mt-1">
          Select an in-processing project to view and download all submitted forms, technical specifications, and project timeline plans.
        </p>
      </div>

      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDropdownOpen(false)}
        />
      )}

      {/* Searchable Project Selector Card */}
      <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl relative overflow-visible shadow-sm">
        <div className="max-w-xl mx-auto space-y-2 relative z-50">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
            Choose Project
          </label>
          {loadingProjects ? (
            <div className="h-12 w-full bg-slate-50 border border-slate-200 rounded-xl animate-pulse flex items-center px-4 text-xs font-medium text-slate-400">
              <Clock className="h-4 w-4 mr-2 animate-spin text-blue-500" /> Loading available projects...
            </div>
          ) : (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search project by PID, Name, or Customer Name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDropdownOpen(true);
                  if (e.target.value.trim() === '') {
                    handleProjectChange('');
                  }
                }}
                onFocus={() => setDropdownOpen(true)}
                className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all font-semibold"
              />
              
              {/* Autocomplete Dropdown list */}
              {dropdownOpen && searchQuery.trim() !== '' && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {projects
                    .filter(p => {
                      const q = searchQuery.toLowerCase();
                      return (
                        p.pid?.toLowerCase().includes(q) ||
                        p.name?.toLowerCase().includes(q) ||
                        p.customer_name?.toLowerCase().includes(q)
                      );
                    })
                    .map(projectOption => (
                      <div
                        key={projectOption.id}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm transition-colors border-b border-slate-100 last:border-0"
                        onClick={() => {
                          handleProjectChange(projectOption.id.toString());
                          setSearchQuery(`${projectOption.pid} - ${projectOption.name} (${projectOption.customer_name})`);
                          setDropdownOpen(false);
                        }}
                      >
                        <div className="font-semibold text-slate-800">{projectOption.pid} - {projectOption.name}</div>
                        <div className="text-xs text-slate-500">{projectOption.customer_name}</div>
                      </div>
                    ))}
                  {projects.filter(p => {
                    const q = searchQuery.toLowerCase();
                    return (
                      p.pid?.toLowerCase().includes(q) ||
                      p.name?.toLowerCase().includes(q) ||
                      p.customer_name?.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No projects match your search</div>
                  )}
                </div>
              )}
            </div>
          )}
          {projects.length === 0 && !loadingProjects && (
            <p className="text-xs text-rose-500 font-medium text-center md:text-left">⚠️ No projects are currently in processing (i.e. at least one form submitted).</p>
          )}
        </div>
      </Card>

      {/* Dynamic Results Dashboard */}
      {!selectedProjectId ? (
        <div className="py-20 text-center bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="h-8 w-8 animate-bounce" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-lg font-bold text-slate-900">No Project Selected</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Please choose an active project from the dropdown selector above to audit stage forms, timeline plans, and drawing attachments.
            </p>
          </div>
        </div>
      ) : loadingDetails ? (
        <div className="py-20 text-center bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col items-center justify-center space-y-3">
          <Clock className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading project report specifications...</p>
        </div>
      ) : project ? (
        <div className="space-y-8 animate-fade-in">
          {/* Project Details Meta Summary Card */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Audit Context</span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">{project.name}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintDnDPlan}
                  className="border-blue-200 hover:bg-blue-50 text-blue-700 font-bold"
                >
                  <Printer className="h-4 w-4 mr-2 text-blue-600" /> Print D&D Plan
                </Button>
                <Badge variant="outline" className="font-mono text-blue-600 bg-blue-50 border-blue-100 font-bold py-1.5 px-3">
                  {project.pid}
                </Badge>
                <Badge variant={project.status === 'Closed' ? 'success' : 'info'} className="font-bold py-1.5 px-3">
                  {project.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 text-slate-700">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                <p className="text-sm font-semibold">{project.customer_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Type</p>
                <p className="text-sm font-semibold">{project.project_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complexity</p>
                <p className="text-sm font-semibold">{project.project_complexity || 'Medium'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Completion</p>
                <p className="text-sm font-semibold">{project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inspection Authority</p>
                <p className="text-sm font-semibold">{project.inspection_authority || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applicable Standard</p>
                <p className="text-sm font-semibold">{project.applicable_standard || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created By</p>
                <p className="text-sm font-semibold">{project.created_by_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Workflow</p>
                <p className="text-sm font-semibold">{filledStages.length} / {stages.length} Completed</p>
              </div>
            </div>
          </Card>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Filled Stages / Forms</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{filledStages.length} / {stages.length}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileCode className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Attached Drawing Documents</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{attachments.length} files</p>
              </div>
            </div>
          </div>

          {/* Sub Tab selection header */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              type="button"
              onClick={() => { setActiveTab('forms'); setViewingStage(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'forms'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📂 Filled Forms ({filledStages.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('documents'); setViewingStage(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📎 Attached Specifications ({attachments.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('plan'); setViewingStage(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'plan'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📅 Project Plan (D&D Timeline)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('ecn'); setViewingStage(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ecn'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              🛠️ ECN ({ecns.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('ascn'); setViewingStage(null); }}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ascn'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              💻 ASCN ({ascns.length})
            </button>
          </div>

          {/* Sub Tab list contents */}
          <Card className="p-0 overflow-hidden border-slate-200 shadow-md">
            {activeTab === 'forms' ? (
              <DataTable 
                data={filledStages}
                columns={[
                  {
                    header: "Stage Name",
                    cell: (s) => <span className="font-bold text-slate-900">{s.template_details.name}</span>,
                    sortable: true
                  },
                  {
                    header: "Submitted By",
                    cell: (s) => <span className="font-medium text-slate-700">{s.current_submission?.submitted_by_name || '—'}</span>
                  },
                  {
                    header: "Submission Date",
                    cell: (s) => <span>{s.current_submission?.submitted_at ? new Date(s.current_submission.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>,
                    sortable: true
                  },
                  {
                    header: "Status",
                    cell: (s) => {
                      const status = s.current_submission?.status || s.status;
                      return (
                        <Badge variant={
                          status === 'Approved' ? 'success' : 
                          status === 'Rejected' ? 'danger' : 
                          status === 'Draft' ? 'warning' :
                          (status === 'Submitted' || status === 'Pending Approval' || status === 'Under Review') ? 'pending' : 'info'
                        }>
                          {status === 'Pending Approval' ? 'Under Review' : status}
                        </Badge>
                      );
                    }
                  }
                ]}
                onRowClick={(s) => setViewingStage(s)}
                searchPlaceholder="Search filled forms..."
                actions={(s) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="View Form" 
                      onClick={(e) => { e.stopPropagation(); setViewingStage(s); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Print Form" 
                      onClick={(e) => { e.stopPropagation(); handlePrintStage(s); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                emptyState={
                  <div className="py-12 text-center text-slate-400 italic">
                    No submitted forms found for this project yet.
                  </div>
                }
              />
            ) : activeTab === 'documents' ? (
              <DataTable 
                data={attachments}
                columns={[
                  {
                    header: "File Name",
                    cell: (att) => <span className="font-mono font-bold text-blue-600 truncate max-w-xs block" title={att.fileName}>{att.fileName}</span>,
                    sortable: true
                  },
                  {
                    header: "Document Label",
                    cell: (att) => <span className="font-medium text-slate-900">{att.label}</span>,
                    sortable: true
                  },
                  {
                    header: "Stage Source",
                    cell: (att) => <span className="text-slate-500">{att.stageName}</span>,
                    sortable: true
                  },
                  {
                    header: "Uploaded By",
                    cell: (att) => <span className="font-medium text-slate-700">{att.uploadedBy}</span>
                  },
                  {
                    header: "Upload Date",
                    cell: (att) => <span>{att.uploadDate ? new Date(att.uploadDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>,
                    sortable: true
                  }
                ]}
                onRowClick={(att) => handleViewDocument(att.fileData)}
                searchPlaceholder="Search attached documents..."
                actions={(att) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="View Document" 
                      onClick={(e) => { e.stopPropagation(); handleViewDocument(att.fileData); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Print Document" 
                      onClick={(e) => { e.stopPropagation(); handlePrintDocument(att.fileData); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Download Document" 
                      onClick={(e) => { e.stopPropagation(); handleDownloadDocument(att.fileData); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                emptyState={
                  <div className="py-12 text-center text-slate-400 italic">
                    No attached specifications or PDFs found uploaded for this project.
                  </div>
                }
              />
            ) : activeTab === 'ecn' ? (
              <DataTable 
                data={ecns}
                columns={[
                  {
                    header: "ECN Number",
                    cell: (e) => <span className="font-semibold text-blue-600 tracking-tight">{e.ecn_number || 'Draft'}</span>,
                    sortable: true
                  },
                  {
                    header: "ECN Date",
                    cell: (e) => e.ecn_date ? new Date(e.ecn_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
                    sortable: true
                  },
                  {
                    header: "Raised Dept.",
                    accessorKey: "raised_department"
                  },
                  {
                    header: "Initiated By",
                    accessorKey: "change_initiated_by"
                  },
                  {
                    header: "Status",
                    cell: (e) => {
                      const getStatusVariant = (status: string) => {
                        switch (status) {
                          case 'Draft': return 'default';
                          case 'Submitted': return 'info';
                          case 'Reviewed': return 'warning';
                          case 'Approved': return 'success';
                          case 'Rejected': return 'danger';
                          default: return 'default';
                        }
                      };
                      return (
                        <Badge variant={getStatusVariant(e.status)}>
                          {e.status}
                        </Badge>
                      );
                    }
                  }
                ]}
                 onRowClick={(e) => {
                  router.push(`/${role}/ecn/${e.id}`);
                }}
                searchPlaceholder="Search ECNs..."
                actions={(e) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="View ECN" 
                      onClick={(evt) => { evt.stopPropagation(); router.push(`/${role}/ecn/${e.id}`); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <a 
                      href={`/${role}/ecn/${e.id}?print=true`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(evt) => evt.stopPropagation()}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Print ECN" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                )}
                emptyState={
                  <div className="py-12 text-center text-slate-400 italic">
                    No Engineering Change Notes (ECN) found generated for this project.
                  </div>
                }
              />
            ) : activeTab === 'ascn' ? (
              <DataTable 
                data={ascns}
                columns={[
                  {
                    header: "ASCN Number",
                    cell: (e) => <span className="font-semibold text-blue-600 tracking-tight">{e.ascn_number || 'Draft'}</span>,
                    sortable: true
                  },
                  {
                    header: "ASCN Date",
                    cell: (e) => e.ascn_date ? new Date(e.ascn_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
                    sortable: true
                  },
                  {
                    header: "Raised Dept.",
                    accessorKey: "raised_department"
                  },
                  {
                    header: "Initiated By",
                    accessorKey: "change_initiated_by"
                  },
                  {
                    header: "Status",
                    cell: (e) => {
                      const getStatusVariant = (status: string) => {
                        switch (status) {
                          case 'Draft': return 'default';
                          case 'Submitted': return 'info';
                          case 'Reviewed': return 'warning';
                          case 'Approved': return 'success';
                          case 'Rejected': return 'danger';
                          default: return 'default';
                        }
                      };
                      return (
                        <Badge variant={getStatusVariant(e.status)}>
                          {e.status}
                        </Badge>
                      );
                    }
                  }
                ]}
                 onRowClick={(e) => {
                  router.push(`/${role}/ascn/${e.id}`);
                }}
                searchPlaceholder="Search ASCNs..."
                actions={(e) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="View ASCN" 
                      onClick={(evt) => { evt.stopPropagation(); router.push(`/${role}/ascn/${e.id}`); }} 
                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <a 
                      href={`/${role}/ascn/${e.id}?print=true`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(evt) => evt.stopPropagation()}
                    >
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Print ASCN" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                )}
                emptyState={
                  <div className="py-12 text-center text-slate-400 italic">
                    No Application Software Change Notes (ASCN) found generated for this project.
                  </div>
                }
              />
            ) : (
              /* D&D Spreadsheet Plan Tab View */
              <div className="p-6 space-y-6 bg-white rounded-2xl">
                {(() => {
                  const cascadedStages = getCascadedStages();
                  const isConfigured = !!project.planned_start_date;
                  return (
                    <div className="space-y-4">
                      {/* Sub-tab header with print options */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Design & Development Timeline</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Sequential D&D Plan • Complexity: {project.project_complexity || 'Medium'}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handlePrintDnDPlan}
                          className="border-slate-300 text-slate-700 font-bold self-start sm:self-auto"
                        >
                          <Printer className="h-4 w-4 mr-2 text-blue-600" /> Print D&D Plan
                        </Button>
                      </div>

                      {!isConfigured && (
                        <div className="bg-amber-50/80 border border-amber-200/60 p-4 rounded-2xl text-amber-800 shadow-xs mb-2 text-xs">
                          <strong className="font-bold text-sm block">Draft Plan Preview Mode</strong>
                          Proposed scheduling timeline starting from Date Received: {formatDate(project.date_received)}. This sequential timeline is not active or saved yet in the master project sheets.
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
                                <tr key={stage.id} className="hover:bg-slate-50/50 transition-colors">
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
                      
                      <div className="flex gap-6 text-slate-400 font-medium text-[10px] justify-between pt-2">
                        <span>🔄 Timeline planned end date = planned start date + complexity stage duration.</span>
                        <span>📆 Sunday days are automatically bypassed in scheduling dates.</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* Read-only Form Preview Overlay Modal */}
      {viewingStage && project && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewingStage.template_details.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Submitted by <strong className="text-slate-700">{viewingStage.current_submission?.submitted_by_name || 'N/A'}</strong> on {new Date(viewingStage.current_submission?.submitted_at!).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setViewingStage(null)} 
                className="h-8 w-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-500 font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <DynamicForm 
                fields={viewingStage.template_details.fields || []}
                project={project}
                initialData={viewingStage.current_submission?.data}
                readOnly={true}
                onSubmit={() => {}}
                stageStatus={viewingStage.status}
                submittedByName={viewingStage.current_submission?.submitted_by_name}
              />
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePrintStage(viewingStage)}
                className="border-slate-300 text-slate-700 font-bold"
              >
                <Printer className="h-4 w-4 mr-2 text-blue-600" /> Print Form
              </Button>
              <Button 
                size="sm" 
                onClick={() => setViewingStage(null)}
                className="px-6 font-bold"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
