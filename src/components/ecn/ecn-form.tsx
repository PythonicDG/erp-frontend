'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  Calendar,
  ClipboardList,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  FileEdit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { projectService, Project } from '@/services/project-service';
import { teamService, TeamMember } from '@/services/team-service';
import { ecnService, ECN, DetailOfChange, ImpactAnalysisRow, ActionPlanRow, ECNStatus } from '@/services/ecn-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ECNFormProps {
  id?: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ECNForm({ id, role }: ECNFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectSearch, setProjectSearch] = useState('');

  // Initial State for ECN Form
  const [formData, setFormData] = useState<{
    project: number | '';
    customer_name: string;
    product_name: string;
    customer_part_no: string;
    pcepl_part_no: string;
    applicable_standard: string;
    inspection_authority: string;
    raised_department: string;
    change_initiated_by: string;
    ecn_date: string;
    old_revision_no: string;
    old_revision_date: string;
    new_revision: string;
    details_of_change: DetailOfChange[];
    impact_analysis: ImpactAnalysisRow[];
    action_plan: ActionPlanRow[];
    initiator: number | '';
    reviewed_by: number | '';
    approved_by: number | '';
    status: ECNStatus;
  }>({
    project: '',
    customer_name: '',
    product_name: '',
    customer_part_no: '',
    pcepl_part_no: '',
    applicable_standard: '',
    inspection_authority: '',
    raised_department: '',
    change_initiated_by: '',
    ecn_date: new Date().toISOString().split('T')[0],
    old_revision_no: '',
    old_revision_date: '',
    new_revision: '',
    details_of_change: Array.from({ length: 5 }, (_, i) => ({ sr_no: i + 1, description: '', reason: '' })),
    impact_analysis: [
      { name: "Function / Performance", selection: "No", remarks: "" },
      { name: "Quality", selection: "No", remarks: "" },
      { name: "Safety / Environment", selection: "No", remarks: "" },
      { name: "Cost", selection: "No", remarks: "" },
      { name: "Delivery Schedule", selection: "No", remarks: "" },
      { name: "Customer Approval Required", selection: "No", remarks: "" }
    ],
    action_plan: [{ action: '', responsible: '', target_date: '', remark: '' }],
    initiator: '',
    reviewed_by: '',
    approved_by: '',
    status: 'Draft'
  });

  // Load Projects and Team Members
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [projData, teamData] = await Promise.all([
          projectService.getAll({ page: 1, page_size: 1000 }),
          teamService.getMembers()
        ]);
        setProjects(projData.results || []);
        const membersList = Array.isArray(teamData) ? teamData : teamData.results || [];
        setTeamMembers(membersList);
        
        // If in edit mode, fetch ECN details
        if (isEditMode && id) {
          const ecn = await ecnService.getById(id);
          
          // Make sure project list has this project
          if (ecn.project && !projData.results.some(p => p.id === ecn.project)) {
            const fullProj = await projectService.getById(ecn.project);
            setProjects(prev => [fullProj, ...prev]);
          }

          setFormData({
            project: ecn.project || '',
            customer_name: ecn.customer_name || '',
            product_name: ecn.product_name || '',
            customer_part_no: ecn.customer_part_no || '',
            pcepl_part_no: ecn.pcepl_part_no || '',
            applicable_standard: ecn.applicable_standard || '',
            inspection_authority: ecn.inspection_authority || '',
            raised_department: ecn.raised_department || '',
            change_initiated_by: ecn.change_initiated_by || '',
            ecn_date: ecn.ecn_date || '',
            old_revision_no: ecn.old_revision_no || '',
            old_revision_date: ecn.old_revision_date || '',
            new_revision: ecn.new_revision || '',
            details_of_change: ecn.details_of_change?.length ? ecn.details_of_change : Array.from({ length: 5 }, (_, i) => ({ sr_no: i + 1, description: '', reason: '' })),
            impact_analysis: ecn.impact_analysis?.length ? ecn.impact_analysis : [
              { name: "Function / Performance", selection: "No", remarks: "" },
              { name: "Quality", selection: "No", remarks: "" },
              { name: "Safety / Environment", selection: "No", remarks: "" },
              { name: "Cost", selection: "No", remarks: "" },
              { name: "Delivery Schedule", selection: "No", remarks: "" },
              { name: "Customer Approval Required", selection: "No", remarks: "" }
            ],
            action_plan: ecn.action_plan?.length ? ecn.action_plan : [{ action: '', responsible: '', target_date: '', remark: '' }],
            initiator: ecn.initiator || '',
            reviewed_by: ecn.reviewed_by || '',
            approved_by: ecn.approved_by || '',
            status: ecn.status || 'Draft'
          });
        } else if (user) {
          // New ECN Mode - set default initiator to logged-in user
          setFormData(prev => ({
            ...prev,
            initiator: user.id
          }));
        }
      } catch (err) {
        toast.error('Failed to load form details');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode, user]);

  // Search projects dynamically
  const handleProjectSearch = async (val: string) => {
    setProjectSearch(val);
    if (!val.trim()) return;
    try {
      const data = await projectService.getAll({ search: val, page_size: 1000 });
      setProjects(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Triggered when project is selected
  const handleProjectChange = async (projId: number) => {
    if (!projId) {
      setFormData(prev => ({
        ...prev,
        project: '',
        customer_name: '',
        product_name: '',
        customer_part_no: '',
        pcepl_part_no: '',
        applicable_standard: '',
        inspection_authority: '',
        old_revision_no: '',
        new_revision: ''
      }));
      return;
    }

    const selected = projects.find(p => p.id === projId);
    if (selected) {
      // Calculate ECN revision sequences dynamically
      let oldRev = '';
      let newRev = 'Rev-01';

      try {
        const ecnData = await ecnService.getAll({ project: projId.toString(), page_size: 1000 } as any);
        const projectEcns = ecnData.results || [];
        // Exclude current ECN if in edit mode
        const otherEcns = isEditMode && id ? projectEcns.filter(e => e.id !== Number(id)) : projectEcns;
        // Count non-rejected ECNs
        const activeEcns = otherEcns.filter(e => e.status !== 'Rejected');
        const count = activeEcns.length;

        if (count > 0) {
          oldRev = `Rev-${String(count).padStart(2, '0')}`;
          newRev = `Rev-${String(count + 1).padStart(2, '0')}`;
        }
      } catch (err) {
        console.error('Failed to calculate ECN revision sequences', err);
      }

      setFormData(prev => ({
        ...prev,
        project: projId,
        customer_name: selected.customer_name || 'N/A',
        product_name: selected.name || '',
        customer_part_no: selected.customer_part_no || 'N/A',
        pcepl_part_no: selected.pcepl_part_no || 'N/A',
        applicable_standard: selected.applicable_standard || 'N/A',
        inspection_authority: selected.inspection_authority || 'N/A',
        old_revision_no: oldRev,
        new_revision: newRev
      }));
      toast.success(`Loaded details and revision history for project: ${selected.name}`, { icon: '📂' });
    }
  };

  // Details of Change - Row modification
  const handleDetailRowChange = (index: number, field: keyof DetailOfChange, value: any) => {
    setFormData(prev => {
      const updated = [...prev.details_of_change];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, details_of_change: updated };
    });
  };

  const addDetailRow = () => {
    setFormData(prev => {
      const nextRows = [...prev.details_of_change];
      const newSrNo = nextRows.length > 0 ? Math.max(...nextRows.map(r => r.sr_no)) + 1 : 1;
      return {
        ...prev,
        details_of_change: [...nextRows, { sr_no: newSrNo, description: '', reason: '' }]
      };
    });
  };

  const removeDetailRow = (index: number) => {
    setFormData(prev => {
      if (prev.details_of_change.length <= 1) {
        toast.error('At least one details row is required');
        return prev;
      }
      const filtered = prev.details_of_change.filter((_, i) => i !== index);
      // Re-index Sr Nos
      const reindexed = filtered.map((r, i) => ({ ...r, sr_no: i + 1 }));
      return { ...prev, details_of_change: reindexed };
    });
  };

  // Impact Analysis - Checklist modification
  const handleImpactRowChange = (index: number, field: 'selection' | 'remarks', value: any) => {
    setFormData(prev => {
      const updated = [...prev.impact_analysis];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, impact_analysis: updated };
    });
  };

  // Action Plan - Row modification
  const handleActionRowChange = (index: number, field: keyof ActionPlanRow, value: any) => {
    setFormData(prev => {
      const updated = [...prev.action_plan];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, action_plan: updated };
    });
  };

  const addActionRow = () => {
    setFormData(prev => ({
      ...prev,
      action_plan: [...prev.action_plan, { action: '', responsible: '', target_date: '', remark: '' }]
    }));
  };

  const removeActionRow = (index: number) => {
    setFormData(prev => {
      if (prev.action_plan.length <= 1) {
        toast.error('At least one action item is required');
        return prev;
      }
      return {
        ...prev,
        action_plan: prev.action_plan.filter((_, i) => i !== index)
      };
    });
  };

  // Form Validation & Submission
  const handleSubmit = async (e: React.FormEvent, submitStatus: ECNStatus) => {
    e.preventDefault();

    if (!formData.project) {
      toast.error('Please select a Project Name');
      return;
    }
    if (!formData.raised_department.trim()) {
      toast.error('ECN Raised Department is required');
      return;
    }
    if (!formData.change_initiated_by.trim()) {
      toast.error('Change Initiated By field is required');
      return;
    }
    if (!formData.ecn_date) {
      toast.error('ECN Date is required');
      return;
    }
    if (formData.new_revision !== 'Rev-01' && !formData.old_revision_no.trim()) {
      toast.error('Old Revision Number is required');
      return;
    }
    if (!formData.new_revision.trim()) {
      toast.error('New Revision is required');
      return;
    }
    
    // Validate details of change (must have at least one filled row)
    const validDetails = formData.details_of_change.filter(r => r.description.trim() || r.reason.trim());
    if (validDetails.length === 0) {
      toast.error('Please fill at least one row in Details of Change section');
      return;
    }

    try {
      setSubmitting(submitStatus === 'Draft' ? 'draft' : 'submit');
      const payload = {
        ...formData,
        project: formData.project as number,
        status: submitStatus,
        // Send empty values as nulls for clean backend database storage
        old_revision_date: formData.old_revision_date || null,
        initiator: formData.initiator ? Number(formData.initiator) : null,
        reviewed_by: formData.reviewed_by ? Number(formData.reviewed_by) : null,
        approved_by: formData.approved_by ? Number(formData.approved_by) : null
      };

      if (isEditMode && id) {
        await ecnService.update(id, payload);
        toast.success(`ECN updated successfully as ${submitStatus}!`, { icon: '🎉' });
      } else {
        await ecnService.create(payload);
        toast.success(`ECN raised successfully as ${submitStatus}!`, { icon: '🚀' });
      }
      
      router.push(`/${role}/ecn`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save ECN. Please check all fields.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading ECN details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, formData.status)} className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Change Request' : 'Raise Engineering Change Request'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulate changes, map impact analysis, and route for internal peer approvals.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
            disabled={submitting !== null}
            onClick={(e) => handleSubmit(e, 'Draft')}
          >
            {submitting === 'draft' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-500" />
            ) : (
              <Save className="h-4 w-4 mr-2 text-slate-500" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-blue-500/10 shadow-lg"
            disabled={submitting !== null}
            onClick={(e) => handleSubmit(e, 'Submitted')}
          >
            {submitting === 'submit' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit ECN
          </Button>
        </div>
      </div>

      {/* SECTION 1: Project & Customer Details */}
      <Card 
        title="Section 1: Project & Customer Details" 
        subtitle="Select an existing Project to auto-fill customer and drawing details."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Name Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Project Name <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all focus:border-blue-500 font-medium"
              value={formData.project}
              onChange={(e) => handleProjectChange(Number(e.target.value))}
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.pid} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Name</label>
            <div className="h-10 px-3 flex items-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-sm font-medium">
              <Building2 className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
              <span className="truncate">{formData.customer_name || 'Select project first...'}</span>
            </div>
          </div>

          {/* Product Name (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Product / Project Name</label>
            <div className="h-10 px-3 flex items-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-sm font-medium truncate">
              {formData.product_name || 'Select project first...'}
            </div>
          </div>

          {/* Customer Part / Drawing Number (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer Part / Drawing Number</label>
            <div className="h-10 px-3 flex items-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-sm font-medium truncate">
              {formData.customer_part_no || 'Select project first...'}
            </div>
          </div>

          {/* PCEPL Part Number (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PCEPL Part Number</label>
            <div className="h-10 px-3 flex items-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-sm font-medium truncate">
              {formData.pcepl_part_no || 'Select project first...'}
            </div>
          </div>

          {/* Applicable Standard (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Applicable Standard</label>
            <div className="h-10 px-3 flex items-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-sm font-medium truncate">
              {formData.applicable_standard || 'Select project first...'}
            </div>
          </div>

          {/* Inspection Authority (Auto-filled) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Inspection Authority</label>
            <div className="h-10 px-3 flex items-center bg-slate-50 text-slate-500 rounded-lg border border-slate-200 text-sm font-medium truncate">
              {formData.inspection_authority || 'Select project first...'}
            </div>
          </div>

          {/* ECN Raised Department */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ECN Raised Department <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Quality Assurance, Design, Production"
              value={formData.raised_department}
              onChange={(e) => setFormData({ ...formData, raised_department: e.target.value })}
              className="h-10 rounded-lg"
            />
          </div>

          {/* Change Initiated By */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Change Initiated By <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. John Doe (Design Engineer)"
              value={formData.change_initiated_by}
              onChange={(e) => setFormData({ ...formData, change_initiated_by: e.target.value })}
              className="h-10 rounded-lg"
            />
          </div>

          {/* ECN Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ECN Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.ecn_date}
              onChange={(e) => setFormData({ ...formData, ecn_date: e.target.value })}
              className="h-10 rounded-lg"
            />
          </div>

          {/* Old Revision No */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Old Revision No. {formData.new_revision !== 'Rev-01' && <span className="text-red-500">*</span>}
            </label>
            <Input
              placeholder="e.g. Rev 01"
              value={formData.old_revision_no}
              onChange={(e) => setFormData({ ...formData, old_revision_no: e.target.value })}
              className="h-10 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Old Revision Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Old Revision Date</label>
            <Input
              type="date"
              value={formData.old_revision_date}
              onChange={(e) => setFormData({ ...formData, old_revision_date: e.target.value })}
              className="h-10 rounded-lg"
            />
          </div>

          {/* New Revision */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              New Revision <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Rev 02"
              value={formData.new_revision}
              onChange={(e) => setFormData({ ...formData, new_revision: e.target.value })}
              className="h-10 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              disabled
            />
          </div>
        </div>
      </Card>

      {/* SECTION 2: Details of Change */}
      <Card 
        title="Section 2: Details of Change" 
        subtitle="Detail the exact description of change and its reasoning. Fill at least one row."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 w-16 text-center">Sr. No.</th>
                <th className="py-3 px-4">Description of Change</th>
                <th className="py-3 px-4">Reason for Change</th>
                <th className="py-3 px-4 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.details_of_change.map((row, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                  <td className="py-3 px-4 text-center text-sm font-medium text-slate-500">
                    {row.sr_no}
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      placeholder="e.g. Changed panel wiring diagram layout to improve thermal efficiency"
                      value={row.description}
                      onChange={(e) => handleDetailRowChange(index, 'description', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      placeholder="e.g. Excessive heating reported in pre-testing phases"
                      value={row.reason}
                      onChange={(e) => handleDetailRowChange(index, 'reason', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors"
                      onClick={() => removeDetailRow(index)}
                      title="Remove Row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50/50 hover:border-blue-300 font-semibold text-xs py-1.5"
            onClick={addDetailRow}
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Add Details Row
          </Button>
        </div>
      </Card>

      {/* SECTION 3: Impact Analysis */}
      <Card 
        title="Section 3: Impact Analysis" 
        subtitle="Evaluate the impact of requested changes on standard business metrics."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 w-1/3">Impact Area Name</th>
                <th className="py-3 px-4 w-44">Applicable? (Yes/No)</th>
                <th className="py-3 px-4">Remarks / Details</th>
              </tr>
            </thead>
            <tbody>
              {formData.impact_analysis.map((row, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                  <td className="py-3.5 px-4 text-sm font-semibold text-slate-700">
                    {row.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <select
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all focus:border-blue-500 font-medium"
                      value={row.selection}
                      onChange={(e) => handleImpactRowChange(index, 'selection', e.target.value as 'Yes' | 'No')}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-4">
                    <Input
                      placeholder={`Provide details or remarks for ${row.name}`}
                      value={row.remarks}
                      onChange={(e) => handleImpactRowChange(index, 'remarks', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 4: Action Plan */}
      <Card 
        title="Section 4: Action Plan" 
        subtitle="Formulate specific task actions, map target deadlines, and set responsible personnel."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Action to be Taken</th>
                <th className="py-3 px-4 w-60">Responsible Person</th>
                <th className="py-3 px-4 w-48">Target Date</th>
                <th className="py-3 px-4">Remark</th>
                <th className="py-3 px-4 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.action_plan.map((row, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                  <td className="py-2.5 px-4">
                    <Input
                      placeholder="e.g. Procure updated copper terminals"
                      value={row.action}
                      onChange={(e) => handleActionRowChange(index, 'action', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <select
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all focus:border-blue-500"
                      value={row.responsible}
                      onChange={(e) => handleActionRowChange(index, 'responsible', e.target.value)}
                    >
                      <option value="">-- Select Person --</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.full_name}>
                          {m.full_name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-4">
                    <Input
                      type="date"
                      value={row.target_date}
                      onChange={(e) => handleActionRowChange(index, 'target_date', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <Input
                      placeholder="Remarks"
                      value={row.remark}
                      onChange={(e) => handleActionRowChange(index, 'remark', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors"
                      onClick={() => removeActionRow(index)}
                      title="Remove Row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-start">
          <Button
            type="button"
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50/50 hover:border-blue-300 font-semibold text-xs py-1.5"
            onClick={addActionRow}
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Add Action Row
          </Button>
        </div>
      </Card>



      {/* Bottom Submit Toolbar */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-6 h-10 rounded-lg"
          onClick={() => router.push(`/${role}/ecn`)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          disabled={submitting !== null}
          onClick={(e) => handleSubmit(e, 'Draft')}
        >
          {submitting === 'draft' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-500" />
          ) : (
            <Save className="h-4 w-4 mr-2 text-slate-500" />
          )}
          Save as Draft
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-blue-500/10 shadow-lg px-6 h-10 rounded-lg"
          disabled={submitting !== null}
          onClick={(e) => handleSubmit(e, 'Submitted')}
        >
          {submitting === 'submit' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit Engineering Change Request
        </Button>
      </div>
    </form>
  );
}
