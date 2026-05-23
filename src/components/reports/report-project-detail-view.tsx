'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Eye, 
  ArrowLeft,
  Briefcase,
  Building2,
  User,
  Clock,
  FileText,
  FileCode
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Project, projectService } from '@/services/project-service';
import { workflowService, StageInstance } from '@/services/workflow-service';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import { DynamicForm } from '@/components/workflow/dynamic-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ReportProjectDetailViewProps {
  id: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ReportProjectDetailView({ id, role }: ReportProjectDetailViewProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<StageInstance[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forms' | 'documents'>('forms');
  const [viewingStage, setViewingStage] = useState<StageInstance | null>(null);

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
    } catch (error) {
      toast.error('Failed to load project report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Filter out stages that have filled/submitted forms
  const getFilledStages = () => {
    return stages.filter(s => s.current_submission && s.current_submission.status !== 'Draft');
  };

  // Extract all attachments from submitted forms
  const getAttachments = () => {
    const list: any[] = [];
    stages.forEach((stage) => {
      const submission = stage.current_submission;
      if (!submission || submission.status === 'Draft') return;

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

  if (loading) return <div className="p-20 text-center flex items-center justify-center gap-2"><Clock className="animate-spin text-blue-600" /> Loading report data...</div>;
  if (!project) return <div className="p-20 text-center text-slate-500 font-medium">Project not found</div>;

  const filledStages = getFilledStages();
  const attachments = getAttachments();

  return (
    <div className="p-6 max-w-(--breakpoint-2xl) mx-auto space-y-8">
      {/* Breadcrumb / Back button */}
      <button 
        onClick={() => router.push(`/${role}/reports`)} 
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Reports
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'Closed' ? 'success' : 'info'}>
              {project.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="font-mono font-bold text-blue-600">{project.pid}</span>
            <div className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{project.customer_name}</div>
            <div className="flex items-center gap-1.5"><User className="h-4 w-4" />Created by {project.created_by_name}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Filled Stages / Forms</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{filledStages.length} / {stages.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Attached Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{attachments.length} files</p>
          </div>
        </div>
      </div>

      {/* Premium Tab Selection Header */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'forms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📂 Filled Forms ({filledStages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📎 Attached Specifications ({attachments.length})
        </button>
      </div>

      {/* Tab Contents */}
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
                cell: (s) => (
                  <Badge variant={s.status === 'Approved' ? 'success' : (s.status === 'Rejected' ? 'danger' : 'info')}>
                    {s.status === 'Pending Approval' ? 'Under Review' : s.status}
                  </Badge>
                )
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  title="Download PDF" 
                  onClick={(e) => { e.stopPropagation(); handlePrintStage(s); }} 
                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
            emptyState={
              <div className="py-12 text-center text-slate-400 italic">
                No submitted forms found for this project yet.
              </div>
            }
          />
        ) : (
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
        )}
      </Card>

      {/* Read-only Form Preview Overlay Modal */}
      {viewingStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
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
