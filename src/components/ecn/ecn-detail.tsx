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
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { ecnService, ECN, ECNStatus } from '@/services/ecn-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ECNDetailProps {
  id: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ECNDetail({ id, role }: ECNDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [ecn, setEcn] = useState<ECN | null>(null);
  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const isAdmin = role === 'admin' || user?.role === 'ADMIN';
  const isSupervisor = role === 'supervisor' || user?.role === 'SUPERVISOR' || isAdmin;

  // Load ECN Details
  useEffect(() => {
    const fetchECN = async () => {
      try {
        setLoading(true);
        const data = await ecnService.getById(id);
        setEcn(data);
      } catch (err) {
        toast.error('Failed to load ECN details');
      } finally {
        setLoading(false);
      }
    };
    fetchECN();
  }, [id]);

  // Handle auto-trigger print from query param
  useEffect(() => {
    if (ecn && searchParams.get('print') === 'true') {
      // Small timeout to allow render completion
      const timer = setTimeout(() => {
        window.print();
        // Clear print query param from URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ecn, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    router.push(`/${role}/ecn/${id}/edit`);
  };

  // Status Workflow Handlers
  const handleWorkflowAction = async (nextStatus: ECNStatus) => {
    if (!ecn) return;
    try {
      setWorkflowLoading(true);
      const updated = await ecnService.update(id, { 
        status: nextStatus,
        // Automatically map reviewer and approver user IDs on action
        reviewed_by: nextStatus === 'Reviewed' ? user?.id : ecn.reviewed_by,
        approved_by: nextStatus === 'Approved' ? user?.id : ecn.approved_by
      });
      setEcn(updated);
      toast.success(`ECN status updated to ${nextStatus}!`, { icon: '🔄' });
    } catch (err) {
      toast.error('Failed to update ECN workflow state');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const getStatusVariant = (status: ECNStatus) => {
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
        <p className="text-slate-500 font-medium text-sm">Loading ECN...</p>
      </div>
    );
  }

  if (!ecn) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">ECN Not Found</h3>
        <p className="text-slate-500 text-sm mb-6">The requested change record could not be loaded.</p>
        <Button onClick={() => router.push(`/${role}/ecn`)}>Back to ECN List</Button>
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
            color: black !important;
            font-size: 11px !important;
          }
          .sidebar, .dashboard-header, .no-print, button, .badge-container {
            display: none !important;
          }
          .print-header {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            border-bottom: 2px solid #000 !important;
            padding-bottom: 12px !important;
            margin-bottom: 20px !important;
          }
          .card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            margin-bottom: 15px !important;
            page-break-inside: avoid !important;
          }
          .card-header {
            background-color: #f5f5f5 !important;
            border-bottom: 1px solid #ddd !important;
            font-weight: bold !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ccc !important;
            padding: 6px 8px !important;
          }
          th {
            background-color: #f9f9f9 !important;
          }
          .print-signatures {
            display: grid !important;
            grid-template-cols: repeat(3, 1fr) !important;
            gap: 20px !important;
            margin-top: 40px !important;
            page-break-inside: avoid !important;
          }
          .sig-box {
            border-top: 1px dashed #333 !important;
            text-align: center !important;
            padding-top: 8px !important;
            font-size: 10px !important;
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
            onClick={() => router.push(`/${role}/ecn`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                ECN Details: <span className="font-mono text-blue-600">{ecn.ecn_number || 'Draft'}</span>
              </h1>
              <Badge variant={getStatusVariant(ecn.status)}>{ecn.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Raised on {ecn.ecn_date ? new Date(ecn.ecn_date).toLocaleDateString() : '-'}
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
          {(ecn.status === 'Draft' || ecn.status === 'Rejected' || isAdmin) && (
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50/50 shadow-xs h-9 text-xs"
              onClick={handleEdit}
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Edit ECN
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
              {ecn.status === 'Draft' && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 text-xs"
                  onClick={() => handleWorkflowAction('Submitted')}
                >
                  <Check className="h-3.5 w-3.5 mr-2" />
                  Submit ECN
                </Button>
              )}

              {/* Submitted state -> Review */}
              {ecn.status === 'Submitted' && isSupervisor && (
                <div className="flex gap-2">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium h-9 text-xs"
                    onClick={() => handleWorkflowAction('Reviewed')}
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-2" />
                    Mark as Reviewed
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

              {/* Reviewed state -> Approve */}
              {ecn.status === 'Reviewed' && isAdmin && (
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
              {ecn.status === 'Rejected' && (
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
        <h1 className="text-xl font-bold uppercase tracking-wide">PCEPL Engineering Department</h1>
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mt-1">
          Engineering Change Request (ECN)
        </h2>
        <div className="text-[9px] text-slate-500 mt-2 font-mono flex gap-6">
          <span><strong>ECN NO:</strong> {ecn.ecn_number || 'DRAFT'}</span>
          <span><strong>DATE:</strong> {ecn.ecn_date ? new Date(ecn.ecn_date).toLocaleDateString() : '-'}</span>
          <span><strong>STATUS:</strong> {ecn.status.toUpperCase()}</span>
        </div>
      </div>

      {/* SECTION 1: Project & Customer Details */}
      <Card title="Section 1: Project & Customer Details" className="card">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ECN Number</span>
            <span className="font-semibold font-mono text-blue-600 text-base">{ecn.ecn_number || 'Draft'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ECN Date</span>
            <span className="font-medium text-slate-900">{ecn.ecn_date ? new Date(ecn.ecn_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
            <span className="font-medium">
              <Badge variant={getStatusVariant(ecn.status)} className="mt-0.5">{ecn.status}</Badge>
            </span>
          </div>

          <div className="border-t border-slate-100/80 pt-3 col-span-full grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name</span>
              <span className="font-medium text-slate-800 flex items-center mt-1">
                <Building2 className="h-4 w-4 mr-1.5 text-slate-400 flex-shrink-0" />
                {ecn.customer_name}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product / Project Name</span>
              <span className="font-semibold text-slate-900 mt-1 block">{ecn.product_name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project PID</span>
              <span className="font-mono text-xs text-slate-500 mt-1 block">{ecn.project_pid}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Drawing / Part No.</span>
              <span className="font-medium text-slate-800 mt-1 block">{ecn.customer_part_no || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PCEPL Part Number</span>
              <span className="font-medium text-slate-800 mt-1 block">{ecn.pcepl_part_no || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applicable Standard</span>
              <span className="font-medium text-slate-850 mt-1 block">{ecn.applicable_standard || '-'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspection Authority</span>
              <span className="font-medium text-slate-850 mt-1 block">{ecn.inspection_authority || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ECN Raised Department</span>
              <span className="font-medium text-slate-850 mt-1 block">{ecn.raised_department || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Initiated By</span>
              <span className="font-medium text-slate-850 mt-1 block">{ecn.change_initiated_by || '-'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Old Revision No.</span>
              <span className="font-medium text-slate-850 mt-1 block">{ecn.old_revision_no || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Old Revision Date</span>
              <span className="font-medium text-slate-850 mt-1 block">{ecn.old_revision_date ? new Date(ecn.old_revision_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Revision</span>
              <span className="font-semibold text-slate-900 mt-1 block text-blue-600">{ecn.new_revision || '-'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: Details of Change */}
      <Card title="Section 2: Details of Change" className="card">
        <div className="overflow-hidden border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-4 w-16 text-center">Sr. No.</th>
                <th className="py-2.5 px-4 w-1/2">Description of Change</th>
                <th className="py-2.5 px-4">Reason for Change</th>
              </tr>
            </thead>
            <tbody>
              {ecn.details_of_change?.filter(row => row.description?.trim() || row.reason?.trim()).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/10 transition-colors last:border-b-0">
                  <td className="py-3 px-4 text-center text-sm font-semibold text-slate-500">{row.sr_no || idx + 1}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-850 leading-relaxed whitespace-pre-wrap">{row.description}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 3: Impact Analysis */}
      <Card title="Section 3: Impact Analysis" className="card">
        <div className="overflow-hidden border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-4 w-1/3">Impact Area Name</th>
                <th className="py-2.5 px-4 w-32 text-center">Applicable?</th>
                <th className="py-2.5 px-4">Remarks / Details</th>
              </tr>
            </thead>
            <tbody>
              {ecn.impact_analysis?.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/10 transition-colors last:border-b-0">
                  <td className="py-3 px-4 text-sm font-semibold text-slate-700">{row.name}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={row.selection === 'Yes' ? 'warning' : 'default'} className="px-2.5 py-0.5">
                      {row.selection}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-650">{row.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 4: Action Plan */}
      <Card title="Section 4: Action Plan" className="card">
        <div className="overflow-hidden border border-slate-100 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-4 w-1/3">Action to be Taken</th>
                <th className="py-2.5 px-4 w-44">Responsible Person</th>
                <th className="py-2.5 px-4 w-36">Target Date</th>
                <th className="py-2.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {ecn.action_plan?.filter(row => row.action?.trim()).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/10 transition-colors last:border-b-0">
                  <td className="py-3 px-4 text-sm font-medium text-slate-850 leading-relaxed whitespace-pre-wrap">{row.action}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-700">{row.responsible || '-'}</td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 font-mono">
                    {row.target_date ? new Date(row.target_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-600">{row.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 5: Approvals */}
      <Card title="Section 5: Approvals Routing" className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {/* Initiated */}
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initiated By</span>
            <span className="font-semibold text-slate-800 block text-base">{ecn.initiator_name || 'Not Set'}</span>
            <span className="text-[10px] text-slate-400 block font-mono">Role: Initiator</span>
          </div>

          {/* Reviewed */}
          <div className={`p-4 border rounded-xl space-y-1 ${ecn.reviewed_by_name ? 'bg-amber-50/20 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reviewed By</span>
            <span className="font-semibold text-slate-800 block text-base">{ecn.reviewed_by_name || 'Pending Review'}</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Status: {ecn.reviewed_by_name ? 'Reviewed ✅' : 'Awaiting Peer Review ⏳'}
            </span>
          </div>

          {/* Approved */}
          <div className={`p-4 border rounded-xl space-y-1 ${ecn.approved_by_name ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
            <span className="font-semibold text-slate-800 block text-base">{ecn.approved_by_name || 'Pending Approval'}</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Status: {ecn.approved_by_name ? 'Approved 👑' : 'Awaiting Final Sign-off ⏳'}
            </span>
          </div>
        </div>
      </Card>

      {/* FORMAL SIGNATURE BOXES (Only visible during print) */}
      <div className="hidden print-signatures">
        <div className="flex flex-col items-center">
          <div className="w-3/4 sig-box mt-10">
            <strong>Initiator Signature</strong>
            <div className="text-[9px] text-slate-500 mt-1">{ecn.initiator_name || ecn.change_initiated_by}</div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-3/4 sig-box mt-10">
            <strong>Reviewed By Signature</strong>
            <div className="text-[9px] text-slate-500 mt-1">{ecn.reviewed_by_name || 'Awaiting Review'}</div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-3/4 sig-box mt-10">
            <strong>Approved By Signature</strong>
            <div className="text-[9px] text-slate-500 mt-1">{ecn.approved_by_name || 'Awaiting Approval'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
