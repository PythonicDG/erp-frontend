'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  Edit, 
  Check, 
  X, 
  Loader2, 
  Building2, 
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  FileText,
  Paperclip,
  Download,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { ascnService, ASCN, ASCNStatus } from '@/services/ascn-service';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ASCNDetailProps {
  id: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ASCNDetail({ id, role }: ASCNDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [ascn, setAscn] = useState<ASCN | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const isAdmin = role === 'admin' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const isSupervisor = role === 'supervisor' || user?.role === 'SUPERVISOR' || isAdmin;

  const logoUrl = companyProfile?.logo 
    ? (companyProfile.logo.startsWith('http') ? companyProfile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${companyProfile.logo}`)
    : null;

  // Load ASCN Details and Company Profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ascnData, companyData] = await Promise.all([
          ascnService.getById(id),
          settingsService.getCompanyProfile().catch(() => null)
        ]);
        setAscn(ascnData);
        setCompanyProfile(companyData);
      } catch (err) {
        toast.error('Failed to load ASCN details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handle auto-trigger print from query param
  useEffect(() => {
    if (ascn && searchParams.get('print') === 'true') {
      const timer = setTimeout(() => {
        handlePrint();
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ascn, searchParams]);

  const handlePrint = () => {
    if (!ascn) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to view report');
      return;
    }

    const companyName = companyProfile?.name || 'PCEPL Engineering';
    const imageLogo = logoUrl 
      ? `<img src="${logoUrl}" style="height: 48px; object-fit: contain;" alt="Company Logo" />` 
      : '<div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">ERP SYSTEM</div>';

    // 1. Details of Change rows
    const detailsRows = ascn.details_of_change?.filter(row => row.description?.trim() || row.reason?.trim()).map((row, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b; padding: 10px 12px; border: 1px solid #e2e8f0;">${row.sr_no || idx + 1}</td>
        <td style="font-weight: 500; color: #0f172a; white-space: pre-wrap; line-height: 1.5; padding: 10px 12px; border: 1px solid #e2e8f0;">${row.description}</td>
        <td style="color: #475569; white-space: pre-wrap; line-height: 1.5; padding: 10px 12px; border: 1px solid #e2e8f0;">${row.reason}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px; border: 1px solid #e2e8f0;">No change details provided</td></tr>';

    const ascnDateStr = ascn.ascn_date ? new Date(ascn.ascn_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
    const oldRevDateStr = ascn.old_revision_date ? new Date(ascn.old_revision_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

    printWindow.document.write(`
      <html>
        <head>
          <title>ASCN Report - ${ascn.ascn_number || 'Draft'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
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
              margin-bottom: 25px; 
            }
            
            .company-name { 
              font-size: 16px; 
              font-weight: 700; 
              color: #0f172a; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
            }
            
            .logo-container { 
              height: 48px; 
              display: flex;
              align-items: center;
            }
            
            .report-title { 
              font-size: 20px; 
              font-weight: 700; 
              color: #000000; 
              margin-top: 15px;
              margin-bottom: 30px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              text-align: center;
            }

            .section-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              background-color: #ffffff;
              page-break-inside: avoid;
            }

            .section-title {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
              margin-top: 0;
              margin-bottom: 16px;
            }

            .metadata-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
            }

            .meta-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .meta-label {
              font-size: 9px;
              font-weight: 600;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .meta-value {
              font-size: 12px;
              font-weight: 500;
              color: #0f172a;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 5px;
              font-size: 12px;
            }

            table th {
              background-color: #f8fafc;
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

            table td {
              padding: 10px 12px;
              border: 1px solid #e2e8f0;
              color: #334155;
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
            <div class="company-name">${companyName}</div>
            <div class="logo-container">${imageLogo}</div>
          </div>
          ${ascn.status === 'Approved' 
            ? `<div class="watermark">${companyProfile?.watermark_released || 'RELEASED'}</div>` 
            : `<div class="watermark">${companyProfile?.watermark_under_approval || 'UNDER APPROVAL'}</div>`}

          <h1 class="report-title">Application Software Change Note (ASCN)</h1>

          <!-- Section 1: Details -->
          <div class="section-card">
            <h3 class="section-title">Section 1: Project & Customer Details</h3>
            <div class="metadata-grid">
              <div class="meta-item">
                <span class="meta-label">ASCN Number</span>
                <span class="meta-value" style="font-weight: 700; color: #2563eb; font-family: monospace;">${ascn.ascn_number || 'Draft'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">ASCN Date</span>
                <span class="meta-value">${ascnDateStr}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Status</span>
                <span class="meta-value" style="font-weight: 600; color: #d97706;">${ascn.status}</span>
              </div>

              <div class="meta-item" style="grid-column: span 3; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 4px;"></div>

              <div class="meta-item">
                <span class="meta-label">Customer Name</span>
                <span class="meta-value">${ascn.customer_name}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Product / Project Name</span>
                <span class="meta-value" style="font-weight: 600;">${ascn.product_name}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Project PID</span>
                <span class="meta-value" style="font-family: monospace;">${ascn.project_pid}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Customer Drawing / Part No.</span>
                <span class="meta-value">${ascn.customer_part_no || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">PCEPL Part Number</span>
                <span class="meta-value">${ascn.pcepl_part_no || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Applicable Standard</span>
                <span class="meta-value">${ascn.applicable_standard || '—'}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Inspection Authority</span>
                <span class="meta-value">${ascn.inspection_authority || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">ASCN Raised Department</span>
                <span class="meta-value">${ascn.raised_department || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Change Initiated By</span>
                <span class="meta-value">${ascn.change_initiated_by || '—'}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Old Revision No.</span>
                <span class="meta-value">${ascn.old_revision_no || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Old Revision Date</span>
                <span class="meta-value">${oldRevDateStr}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">New Revision</span>
                <span class="meta-value" style="font-weight: 600; color: #2563eb;">${ascn.new_revision || '—'}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Details of Change -->
          <div class="section-card">
            <h3 class="section-title">Section 2: Details of Change</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 60px; text-align: center;">Sr. No.</th>
                  <th style="width: 50%;">Description of Change</th>
                  <th>Reason for Change</th>
                </tr>
              </thead>
              <tbody>
                ${detailsRows}
              </tbody>
            </table>
          </div>

          <!-- Approvals & Signatures Section -->
          <div class="approval-section" style="margin-top: 50px; page-break-inside: avoid;">
            <div style="border-top: 2px solid #000000; margin-bottom: 25px; padding-top: 15px;">
              <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px;">Approvals & Signatures</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 115px; box-sizing: border-box;">
                <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block;">INITIATED BY</span>
                <div style="margin-top: 15px; text-align: center;">
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${ascn.initiator_name || 'Not Set'}</div>
                  <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Form Submitter</div>
                </div>
              </div>
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; background-color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; min-height: 115px; box-sizing: border-box;">
                <span style="font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block;">APPROVED BY</span>
                <div style="margin-top: 15px; text-align: center;">
                  ${ascn.approved_by_name ? `
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${ascn.approved_by_name}</div>
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

  const handleEdit = () => {
    router.push(`/${role}/ascn/${id}/edit`);
  };

  const downloadAttachment = (file: { name: string; type: string; base64: string }) => {
    try {
      const link = document.createElement('a');
      link.href = file.base64;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${file.name}...`);
    } catch (err) {
      toast.error('Failed to download attachment');
    }
  };

  // Status Workflow Handlers
  const handleWorkflowAction = async (nextStatus: ASCNStatus) => {
    if (!ascn) return;
    try {
      setWorkflowLoading(true);
      const updated = await ascnService.update(id, { 
        status: nextStatus,
        reviewed_by: nextStatus === 'Reviewed' ? user?.id : ascn.reviewed_by
      });
      setEcn(updated);
      toast.success(`ASCN status updated to ${nextStatus}!`, { icon: '🔄' });
    } catch (err) {
      toast.error('Failed to update ASCN workflow state');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const setEcn = (updated: ASCN) => {
    setAscn(updated);
  };

  const getStatusVariant = (status: ASCNStatus) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Submitted': return 'info';
      case 'Reviewed': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading ASCN...</p>
      </div>
    );
  }

  if (!ascn) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">ASCN Not Found</h3>
        <p className="text-slate-500 text-sm mb-6">The requested change record could not be loaded.</p>
        <Button onClick={() => router.push(`/${role}/ascn`)}>Back to ASCN List</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 print:p-0 print:shadow-none print:border-none print:max-w-full">
      {/* CSS PRINT RULES */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: #0f172a !important;
            font-size: 11px !important;
          }
          .sidebar, .dashboard-header, .no-print, button, .badge-container, .print-hide {
            display: none !important;
          }
          .print-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-bottom: 2px solid #000000 !important;
            padding-bottom: 16px !important;
            margin-bottom: 25px !important;
          }
          .print-logo {
            height: 48px !important;
            object-fit: contain !important;
          }
          .print-company-name {
            font-size: 16px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          .print-title {
            display: block !important;
            text-align: center !important;
            font-size: 20px !important;
            font-weight: 700 !important;
            color: #000000 !important;
            margin-top: 15px !important;
            margin-bottom: 30px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          .card {
            border: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin-bottom: 25px !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
          }
          .card-header {
            background-color: transparent !important;
            border-bottom: none !important;
            padding: 0 !important;
            margin-bottom: 12px !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            color: #64748b !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px 10px !important;
            text-align: left !important;
          }
          th {
            background-color: #f8fafc !important;
            font-weight: 600 !important;
            color: #475569 !important;
          }
        }
      `}</style>

      {/* TOP NAVIGATION BAR & WORKFLOW BAR (no-print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
            onClick={() => router.push(`/${role}/ascn`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                ASCN Details: <span className="font-mono text-blue-600">{ascn.ascn_number || 'Draft'}</span>
              </h1>
              <Badge variant={getStatusVariant(ascn.status)}>{ascn.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Raised on {ascn.ascn_date ? new Date(ascn.ascn_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button */}
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs h-9 text-xs"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5 mr-2 text-slate-500" />
            Print / PDF
          </Button>

          {/* Edit Button (Allowed if Draft/Rejected, or Admin) */}
          {(ascn.status === 'Draft' || ascn.status === 'Rejected' || isAdmin) && (
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50/50 shadow-xs h-9 text-xs"
              onClick={handleEdit}
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Edit ASCN
            </Button>
          )}

          {/* Workflow Action Triggers */}
          {workflowLoading ? (
            <Button disabled className="h-9 text-xs">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Routing...
            </Button>
          ) : (
            <>
              {/* Draft state -> Submit */}
              {ascn.status === 'Draft' && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 text-xs"
                  onClick={() => handleWorkflowAction('Submitted')}
                >
                  <Check className="h-3.5 w-3.5 mr-2" />
                  Submit ASCN
                </Button>
              )}

              {/* Submitted or Reviewed state -> Approve/Reject directly */}
              {(ascn.status === 'Submitted' || ascn.status === 'Reviewed') && ascn.approved_by === user?.id && (
                <div className="flex gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 text-xs shadow-md"
                    onClick={() => handleWorkflowAction('Approved')}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-2" />
                    Approve Change
                  </Button>
                  <Button
                    variant="danger"
                    className="h-9 text-xs"
                    onClick={() => handleWorkflowAction('Rejected')}
                  >
                    <X className="h-3.5 w-3.5 mr-2" />
                    Reject Change
                  </Button>
                </div>
              )}

              {/* Rejected state -> Re-Draft */}
              {ascn.status === 'Rejected' && (
                <Button
                  className="bg-slate-600 hover:bg-slate-700 text-white font-medium h-9 text-xs"
                  onClick={() => handleWorkflowAction('Draft')}
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Re-submit Draft
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* FORMAL PRINT BANNER HEADER (Only visible during print) */}
      <div className="hidden print-header">
        <div className="print-company-name">
          {companyProfile?.name || 'PCEPL Engineering'}
        </div>
        <div className="logo-container">
          {logoUrl ? (
            <img src={logoUrl} className="print-logo" alt="Company Logo" />
          ) : (
            <div className="text-xl font-extrabold tracking-wide">ERP SYSTEM</div>
          )}
        </div>
      </div>

      <h1 className="hidden print-title">
        Application Software Change Note (ASCN)
      </h1>

      {/* SECTION 1: Project & Customer Details */}
      <Card title="Section 1: Project & Customer Details" className="card print-hide">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ASCN Number</span>
            <span className="font-semibold font-mono text-blue-600 text-base">{ascn.ascn_number || 'Draft'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ASCN Date</span>
            <span className="font-medium text-slate-900">{ascn.ascn_date ? new Date(ascn.ascn_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
            <span className="font-medium">
              <Badge variant={getStatusVariant(ascn.status)} className="mt-0.5">{ascn.status}</Badge>
            </span>
          </div>

          <div className="border-t border-slate-100/80 pt-3 col-span-full grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name</span>
              <span className="font-medium text-slate-800 flex items-center mt-1">
                <Building2 className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                {ascn.customer_name}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product / Project Name</span>
              <span className="font-semibold text-slate-900 mt-1 block">{ascn.product_name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project PID</span>
              <span className="font-mono text-xs text-slate-500 mt-1 block">{ascn.project_pid}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Drawing / Part No.</span>
              <span className="font-medium text-slate-800 mt-1 block">{ascn.customer_part_no || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PCEPL Part Number</span>
              <span className="font-medium text-slate-800 mt-1 block">{ascn.pcepl_part_no || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applicable Standard</span>
              <span className="font-medium text-slate-850 mt-1 block">{ascn.applicable_standard || '-'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspection Authority</span>
              <span className="font-medium text-slate-850 mt-1 block">{ascn.inspection_authority || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ASCN Raised Department</span>
              <span className="font-medium text-slate-850 mt-1 block">{ascn.raised_department || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Initiated By</span>
              <span className="font-medium text-slate-850 mt-1 block">{ascn.change_initiated_by || '-'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Old Revision No.</span>
              <span className="font-medium text-slate-850 mt-1 block">{ascn.old_revision_no || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Old Revision Date</span>
              <span className="font-medium text-slate-850 mt-1 block">{ascn.old_revision_date ? new Date(ascn.old_revision_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Revision</span>
              <span className="font-semibold text-slate-900 mt-1 block text-blue-600">{ascn.new_revision || '-'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: Details of Change */}
      <Card title="Section 2: Details of Change" className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 print:bg-transparent">
                <th className="py-3 px-4 w-16 text-center">Sr. No.</th>
                <th className="py-3 px-4">Description of Change</th>
                <th className="py-3 px-4">Reason for Change</th>
              </tr>
            </thead>
            <tbody>
              {ascn.details_of_change?.filter(row => row.description?.trim() || row.reason?.trim()).map((row, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                  <td className="py-3 px-4 text-center text-sm font-semibold text-slate-500">
                    {row.sr_no}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {row.description}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {row.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 3: File Attachments */}
      {ascn.attachments && ascn.attachments.length > 0 && (
        <Card title="Section 3: File Attachments" className="card no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ascn.attachments.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{file.type.split('/')[1] || file.type || 'File'}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50/50 rounded-full"
                  onClick={() => downloadAttachment(file)}
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* APPROVALS & SIGNATURES SECTION (Only visible on screen) */}
      <Card title="Approvals & Signatures" className="card no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between min-h-[120px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Initiated By</span>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                {ascn.initiator_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{ascn.initiator_name || 'Not Set'}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Form Submitter</p>
              </div>
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between min-h-[120px]">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Approved By</span>
            <div className="mt-4">
              {ascn.approved_by_name ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    {ascn.approved_by_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{ascn.approved_by_name}</p>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle className="h-3 w-3" /> Approved
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 border border-dashed border-slate-200 rounded-lg p-2">
                  <p className="text-xs font-semibold">Under Approval Status</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Awaiting signature from designated Admin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* APPROVALS & SIGNATURES SECTION (Only visible on print page layout) */}
      <div className="hidden print:block print:avoid-break" style={{ marginTop: '50px' }}>
        <div style={{ borderTop: '2px solid #000000', marginBottom: '25px', paddingTop: '15px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Approvals & Signatures</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '115px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>INITIATED BY</span>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{ascn.initiator_name || 'Not Set'}</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Form Submitter</div>
            </div>
          </div>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '115px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>APPROVED BY</span>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              {ascn.approved_by_name ? `
                <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${ascn.approved_by_name}</div>
                <div style="font-size: 9px; color: #059669; font-weight: 700; margin-top: 2px;">Approved ✅</div>
              ` : `
                <div style="border-bottom: 1px dashed #94a3b8; width: 80%; margin: 15px auto 0 auto; min-height: 18px;"></div>
                <div style="font-size: 9px; color: #64748b; margin-top: 5px;">Authority Signature</div>
              `}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
