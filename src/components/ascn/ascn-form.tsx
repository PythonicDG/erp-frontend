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
  FileEdit,
  Paperclip,
  X,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { projectService, Project } from '@/services/project-service';
import { teamService, TeamMember } from '@/services/team-service';
import { ascnService, ASCN, DetailOfChange, ASCNStatus } from '@/services/ascn-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ASCNFormProps {
  id?: string;
  role: 'admin' | 'supervisor' | 'employee';
}

export function ASCNForm({ id, role }: ASCNFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<'draft' | 'submit' | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Initial State for ASCN Form
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
    ascn_date: string;
    old_revision_no: string;
    old_revision_date: string;
    new_revision: string;
    details_of_change: DetailOfChange[];
    initiator: number | '';
    reviewed_by: number | '';
    approved_by: number | '';
    status: ASCNStatus;
    attachments: Array<{ name: string; type: string; base64: string }>;
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
    ascn_date: new Date().toISOString().split('T')[0],
    old_revision_no: '',
    old_revision_date: '',
    new_revision: '',
    details_of_change: Array.from({ length: 5 }, (_, i) => ({ sr_no: i + 1, description: '', reason: '' })),
    initiator: '',
    reviewed_by: '',
    approved_by: '',
    status: 'Draft',
    attachments: []
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
        
        // If in edit mode, fetch ASCN details
        if (isEditMode && id) {
          const ascn = await ascnService.getById(id);
          
          // Make sure project list has this project
          if (ascn.project && !projData.results.some(p => p.id === ascn.project)) {
            const fullProj = await projectService.getById(ascn.project);
            setProjects(prev => [fullProj, ...prev]);
          }

          setFormData({
            project: ascn.project || '',
            customer_name: ascn.customer_name || '',
            product_name: ascn.product_name || '',
            customer_part_no: ascn.customer_part_no || '',
            pcepl_part_no: ascn.pcepl_part_no || '',
            applicable_standard: ascn.applicable_standard || '',
            inspection_authority: ascn.inspection_authority || '',
            raised_department: ascn.raised_department || '',
            change_initiated_by: ascn.change_initiated_by || '',
            ascn_date: ascn.ascn_date || '',
            old_revision_no: ascn.old_revision_no || '',
            old_revision_date: ascn.old_revision_date || '',
            new_revision: ascn.new_revision || '',
            details_of_change: ascn.details_of_change?.length ? ascn.details_of_change : Array.from({ length: 5 }, (_, i) => ({ sr_no: i + 1, description: '', reason: '' })),
            initiator: ascn.initiator || '',
            reviewed_by: ascn.reviewed_by || '',
            approved_by: ascn.approved_by || '',
            status: ascn.status || 'Draft',
            attachments: ascn.attachments || []
          });
        } else if (user) {
          // New ASCN Mode - set default initiator to logged-in user
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
  
  // Sync search input query text with selected project on load or change (only when not typing)
  useEffect(() => {
    if (!isFocused) {
      if (formData.project) {
        const selected = projects.find(p => p.id === formData.project);
        if (selected) {
          setProjectSearch(`${selected.pid} - ${selected.name}`);
        }
      } else {
        setProjectSearch('');
      }
    }
  }, [formData.project, projects, isFocused]);

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
  const handleProjectChange = async (projId: number | '') => {
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
      // Calculate ASCN revision sequences dynamically
      let oldRev = '';
      let newRev = 'Rev-01';
      let oldRevDate = '';

      try {
        const ascnData = await ascnService.getAll({ project: projId.toString(), page_size: 1000 } as any);
        const projectAscns = ascnData.results || [];
        // Exclude current ASCN if in edit mode
        const otherAscns = isEditMode && id ? projectAscns.filter(e => e.id !== Number(id)) : projectAscns;
        // Count non-rejected ASCNs
        const activeAscns = otherAscns.filter(e => e.status !== 'Rejected');
        const sortedActiveAscns = [...activeAscns].sort((a, b) => (b.id || 0) - (a.id || 0));
        const count = sortedActiveAscns.length;

        if (count > 0) {
          oldRev = `Rev-${String(count).padStart(2, '0')}`;
          newRev = `Rev-${String(count + 1).padStart(2, '0')}`;
          oldRevDate = sortedActiveAscns[0].ascn_date || '';
        }
      } catch (err) {
        console.error('Failed to calculate ASCN revision sequences', err);
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
        old_revision_date: oldRevDate,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setFormData(prev => ({
            ...prev,
            attachments: [
              ...prev.attachments,
              {
                name: file.name,
                type: file.type,
                base64: base64String
              }
            ]
          }));
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Form Validation & Submission
  const handleSubmit = async (e: React.FormEvent, submitStatus: ASCNStatus) => {
    e.preventDefault();

    if (!formData.project) {
      toast.error('Please select a Project Name');
      return;
    }
    if (!formData.raised_department.trim()) {
      toast.error('ASCN Raised Department is required');
      return;
    }
    if (!formData.change_initiated_by.trim()) {
      toast.error('Change Initiated By field is required');
      return;
    }
    if (!formData.ascn_date) {
      toast.error('ASCN Date is required');
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
    if (submitStatus === 'Submitted' && !formData.approved_by) {
      toast.error('Please select an Approved By administrator');
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
        await ascnService.update(id, payload);
        toast.success(`ASCN updated successfully as ${submitStatus}!`, { icon: '🎉' });
      } else {
        await ascnService.create(payload);
        toast.success(`ASCN raised successfully as ${submitStatus}!`, { icon: '🚀' });
      }
      
      router.push(`/${role}/ascn`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save ASCN. Please check all fields.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading ASCN details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, formData.status)} className="p-6 max-w-5xl mx-auto space-y-8 relative">
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={() => {
            setDropdownOpen(false);
            setIsFocused(false);
          }}
        />
      )}
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Application Software Change Request' : 'Raise Application Software Change Request'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulate changes, attach relevant files, and route for internal peer approvals.
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
            Submit ASCN
          </Button>
        </div>
      </div>

      {/* SECTION 1: Project & Customer Details */}
      <Card 
        title="Section 1: Project & Customer Details" 
        subtitle="Select an existing Project to auto-fill customer and code details."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Name Selection */}
          <div className="space-y-2 relative z-50">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Project Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search project by PID, Name..."
                value={projectSearch}
                onChange={(e) => {
                  setProjectSearch(e.target.value);
                  setDropdownOpen(true);
                  handleProjectSearch(e.target.value);
                  if (e.target.value.trim() === '') {
                    handleProjectChange('');
                  }
                }}
                onFocus={() => {
                  setDropdownOpen(true);
                  setIsFocused(true);
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all focus:border-blue-500 font-medium"
              />
              
              {/* Autocomplete Dropdown list */}
              {dropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {projects
                    .filter(p => {
                      const q = projectSearch.toLowerCase();
                      return (
                        p.pid?.toLowerCase().includes(q) ||
                        p.name?.toLowerCase().includes(q)
                      );
                    })
                    .map(projectOption => (
                      <div
                        key={projectOption.id}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm transition-colors border-b border-slate-100 last:border-0 text-left"
                        onClick={() => {
                          handleProjectChange(projectOption.id);
                          setProjectSearch(`${projectOption.pid} - ${projectOption.name}`);
                          setDropdownOpen(false);
                          setIsFocused(false);
                        }}
                      >
                        <div className="font-semibold text-slate-800">{projectOption.pid} - {projectOption.name}</div>
                        <div className="text-xs text-slate-500">{projectOption.customer_name}</div>
                      </div>
                    ))}
                  {projects.filter(p => {
                    const q = projectSearch.toLowerCase();
                    return (
                      p.pid?.toLowerCase().includes(q) ||
                      p.name?.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No projects match your search</div>
                  )}
                </div>
              )}
            </div>
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

          {/* ASCN Raised Department */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ASCN Raised Department <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Software, QA, Design"
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
              placeholder="e.g. Jane Doe (Software Engineer)"
              value={formData.change_initiated_by}
              onChange={(e) => setFormData({ ...formData, change_initiated_by: e.target.value })}
              className="h-10 rounded-lg"
            />
          </div>

          {/* ASCN Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ASCN Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.ascn_date}
              onChange={(e) => setFormData({ ...formData, ascn_date: e.target.value })}
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
              className="h-10 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              disabled
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

          {/* Approved By */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Approved By <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all focus:border-blue-500 font-medium"
              value={formData.approved_by}
              onChange={(e) => setFormData({ ...formData, approved_by: e.target.value ? Number(e.target.value) : '' })}
              required
            >
              <option value="">-- Select Admin --</option>
              {teamMembers
                .filter((m) => m.role === 'ADMIN' && m.is_active)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} {m.admin_code ? `(${m.admin_code})` : ''}
                  </option>
                ))}
            </select>
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
                      placeholder="e.g. Updated Modbus communication library configuration parameters"
                      value={row.description}
                      onChange={(e) => handleDetailRowChange(index, 'description', e.target.value)}
                      className="h-9 text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      placeholder="e.g. Packet drop observed during peak communication overhead"
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

      {/* SECTION 3: File Attachments */}
      <Card 
        title="Section 3: File Attachments" 
        subtitle="Upload source code diffs, logs, screenshots, or other relevant files (Multiple files allowed)."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Paperclip className="w-8 h-8 text-slate-400 mb-2" />
                <p className="mb-1 text-sm text-slate-600 font-semibold">Click to upload files</p>
                <p className="text-xs text-slate-400">PDF, PNG, JPG, ZIP up to 10MB</p>
              </div>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          </div>

          {formData.attachments && formData.attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {formData.attachments.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all"
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
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors hover:bg-red-50/50 rounded-full"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Bottom Submit Toolbar */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Button
          type="button"
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-6 h-10 rounded-lg"
          onClick={() => router.push(`/${role}/ascn`)}
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
          Submit Application Software Change Request
        </Button>
      </div>
    </form>
  );
}
