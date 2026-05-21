'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  GripVertical, 
  Settings2, 
  Trash2, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Eye,
  Edit3
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { workflowService, StageTemplate } from '@/services/workflow-service';
import Link from 'next/link';
import toast from 'react-hot-toast';

export function WorkflowManagementView() {
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<StageTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'stages' | 'dd-plan'>('stages');
  const [durationEdits, setDurationEdits] = useState<Record<number, { duration_high: number; duration_medium: number; duration_low: number }>>({});
  const [savingPlan, setSavingPlan] = useState(false);

  // Native Drag and Drop States
  const [canDrag, setCanDrag] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Swap items in templates array locally for real-time visual feedback
    const newTemplates = [...templates];
    const draggedItem = newTemplates[draggedIndex];
    newTemplates.splice(draggedIndex, 1);
    newTemplates.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setTemplates(newTemplates);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    setIsDragging(false);
    setCanDrag(null);
    
    // Generate new ordering payload
    const orders = templates.map((t, idx) => ({
      id: t.id,
      order: idx + 1
    }));
    
    const toastId = toast.loading('Saving stage sequences & propagating to active projects...');
    try {
      await workflowService.reorderTemplates(orders);
      toast.success('Stage sequence updated and propagated to all active projects!', { id: toastId });
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update stage sequence', { id: toastId });
      fetchTemplates();
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await workflowService.getTemplates();
      const templatesList = Array.isArray(data) ? data : (data as any)?.results || [];
      setTemplates(templatesList.sort((a: any, b: any) => a.order - b.order));
    } catch (error) {
      toast.error('Failed to load workflow stages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stage? This cannot be undone.')) return;
    try {
      await workflowService.deleteTemplate(id);
      toast.success('Stage deleted successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete stage');
    }
  };

  const handleEditProperties = (template: StageTemplate) => {
    setEditingTemplate(template);
    setModalOpen(true);
  };

  const handleDurationChange = (templateId: number, field: 'duration_high' | 'duration_medium' | 'duration_low', value: number) => {
    const template = templates.find(t => t.id === templateId);
    const currentEdits = durationEdits[templateId] || {
      duration_high: template?.duration_high ?? 5,
      duration_medium: template?.duration_medium ?? 3,
      duration_low: template?.duration_low ?? 1,
    };
    
    setDurationEdits({
      ...durationEdits,
      [templateId]: {
        ...currentEdits,
        [field]: value
      }
    });
  };

  const handleSavePlanDurations = async () => {
    const editKeys = Object.keys(durationEdits);
    if (editKeys.length === 0) {
      toast.success('No changes to save!');
      return;
    }
    
    setSavingPlan(true);
    try {
      await Promise.all(
        editKeys.map(async (idStr) => {
          const id = parseInt(idStr);
          const edits = durationEdits[id];
          await workflowService.updateTemplate(id, edits);
        })
      );
      toast.success('Master D&D Plan Durations updated successfully!', { icon: '📅' });
      setDurationEdits({});
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to save some durations');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleSaveProperties = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    setUpdating(true);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      order: parseInt(formData.get('order') as string) || 1,
      assigned_role: formData.get('assigned_role') as string,
      duration_high: parseInt(formData.get('duration_high') as string) || 5,
      duration_medium: parseInt(formData.get('duration_medium') as string) || 3,
      duration_low: parseInt(formData.get('duration_low') as string) || 1,
      description: formData.get('description') as string,
      is_active: formData.get('is_active') === 'on',
      approval_required: formData.get('approval_required') === 'on',
      allow_attachments: formData.get('allow_attachments') === 'on',
    };

    try {
      await workflowService.updateTemplate(editingTemplate.id, payload);
      toast.success('Stage properties updated successfully!');
      setModalOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update stage properties');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-500">Loading Workflow Engine...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Workflow Engine</h1>
          <p className="text-slate-500">Design and manage dynamic project stages and forms.</p>
        </div>
        <Link href="/admin/workflow/new">
          <Button className="shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" /> Create New Stage
          </Button>
        </Link>
      </div>

      {/* Premium Tab Selection Header */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('stages')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'stages'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Workflow Stages & Forms
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
          📅 Master D&D Plan Durations Matrix
        </button>
      </div>

      {activeTab === 'stages' ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              💡 Drag the grip handle <GripVertical className="h-3.5 w-3.5 animate-pulse" /> to reorder stages.
            </span>
            <span className="font-semibold text-blue-600 bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              ⚡ Propagation to active project stages is automatic
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
          {templates.map((template, index) => (
            <Card 
              key={template.id} 
              draggable={canDrag === template.id}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group transition-all duration-300 ${
                draggedIndex === index
                  ? 'opacity-40 border-dashed border-blue-500 bg-blue-50/10 scale-[0.98] shadow-inner'
                  : 'hover:border-blue-200 shadow-sm hover:shadow-md'
              } cursor-default overflow-hidden`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                 <div 
                   className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 select-none"
                   onMouseDown={() => setCanDrag(template.id)}
                   onMouseUp={() => setCanDrag(null)}
                 >
                   <GripVertical className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                 </div>
                 
                 <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-50 text-slate-400 font-bold border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    <span className="text-xs uppercase opacity-60">Step</span>
                    <span className="text-lg leading-none">{index + 1}</span>
                 </div>
               
               <div className="flex-1 space-y-1">
                 <div className="flex items-center gap-3">
                   <h3 className="font-bold text-slate-900 text-lg">{template.name}</h3>
                   <Badge variant={template.is_active ? 'success' : 'outline'}>
                     {template.is_active ? 'Active' : 'Disabled'}
                   </Badge>
                   {template.approval_required && <Badge variant="info" className="bg-amber-50 text-amber-600 border-amber-100">Approval Required</Badge>}
                 </div>
                 <p className="text-sm text-slate-500 line-clamp-1">{template.description || 'No description provided.'}</p>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-3 w-3" /> {template.fields?.length || 0} Dynamic Fields
                    </span>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Assigned to {template.assigned_role}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md flex items-center gap-1.5 font-mono">
                      ⏱️ High: <span className="text-rose-600 font-bold">{template.duration_high ?? 5}d</span> | Med: <span className="text-amber-600 font-bold">{template.duration_medium ?? 3}d</span> | Low: <span className="text-emerald-600 font-bold">{template.duration_low ?? 1}d</span>
                    </span>
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="hover:bg-slate-50 border-slate-200 text-slate-700"
                   onClick={() => handleEditProperties(template)}
                 >
                   <Settings2 className="h-4 w-4 mr-2" /> Properties
                 </Button>
                 <Link href={`/admin/workflow/${template.id}/fields`}>
                   <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 border-blue-100 text-blue-600">
                     <Edit3 className="h-4 w-4 mr-2" /> Design Form
                   </Button>
                 </Link>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                   onClick={() => handleDeleteTemplate(template.id)}
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
               </div>
            </div>
          </Card>
        ))}
        </div>

        {templates.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             <Layers className="h-12 w-12 mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-900">No Stages Defined</h3>
             <p className="text-slate-500 max-w-xs mx-auto">Get started by creating your first workflow stage and designing its form.</p>
             <Button className="mt-6">Create First Stage</Button>
          </div>
        )}
      </div>
      ) : (
        /* D&D Master Plan Durations Matrix */
        <Card 
          title="Master D&D Plan Duration Settings" 
          subtitle="Configure default stage durations (in calendar days) for each project complexity. These settings cascade sequentially skipping Sundays."
          className="overflow-hidden shadow-xl shadow-blue-500/5 bg-white border border-slate-200/80 rounded-2xl"
        >
          <div className="space-y-6">
            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                    <th className="py-4 px-4 font-bold text-center border-r border-slate-200 w-12">Step</th>
                    <th className="py-4 px-6 font-bold border-r border-slate-200">Activity / Stage Name</th>
                    <th className="py-4 px-6 font-bold border-r border-slate-200 w-44 text-center text-rose-600 bg-rose-50/20">High Complexity</th>
                    <th className="py-4 px-6 font-bold border-r border-slate-200 w-44 text-center text-amber-600 bg-amber-50/20">Medium Complexity</th>
                    <th className="py-4 px-6 font-bold border-r border-slate-200 w-44 text-center text-emerald-600 bg-emerald-50/20">Low Complexity</th>
                    <th className="py-4 px-6 font-bold w-36 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {templates.map((template, idx) => {
                    const isEdited = !!durationEdits[template.id];
                    const edits = durationEdits[template.id] || {};
                    const highVal = edits.duration_high !== undefined ? edits.duration_high : (template.duration_high ?? 5);
                    const medVal = edits.duration_medium !== undefined ? edits.duration_medium : (template.duration_medium ?? 3);
                    const lowVal = edits.duration_low !== undefined ? edits.duration_low : (template.duration_low ?? 1);

                    return (
                      <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-500 text-center border-r border-slate-200 bg-slate-50/30 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-900 border-r border-slate-200">
                          <div className="flex items-center justify-between gap-4">
                            <span>{template.name}</span>
                            {isEdited && (
                              <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px] font-bold uppercase tracking-tight">
                                Modified
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200 bg-rose-50/5">
                          <input 
                            type="number"
                            min="0"
                            value={highVal}
                            onChange={(e) => handleDurationChange(template.id, 'duration_high', parseInt(e.target.value) || 0)}
                            className="w-full text-center h-10 px-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 outline-hidden transition-all text-sm"
                          />
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200 bg-amber-50/5">
                          <input 
                            type="number"
                            min="0"
                            value={medVal}
                            onChange={(e) => handleDurationChange(template.id, 'duration_medium', parseInt(e.target.value) || 0)}
                            className="w-full text-center h-10 px-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-amber-600 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-hidden transition-all text-sm"
                          />
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200 bg-emerald-50/5">
                          <input 
                            type="number"
                            min="0"
                            value={lowVal}
                            onChange={(e) => handleDurationChange(template.id, 'duration_low', parseInt(e.target.value) || 0)}
                            className="w-full text-center h-10 px-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 outline-hidden transition-all text-sm"
                          />
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <Badge variant={template.is_active ? 'success' : 'outline'}>
                            {template.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 text-xs">
              <span className="text-slate-500 font-medium">
                🔄 Master durations modified here will apply to all <strong className="text-slate-700">new projects</strong>, and can be used for recalculations on active projects.
              </span>
              <div className="flex gap-3 shrink-0">
                {Object.keys(durationEdits).length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDurationEdits({})}
                    className="hover:bg-slate-100 text-slate-700 font-semibold"
                  >
                    Discard Changes
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={handleSavePlanDurations}
                  loading={savingPlan}
                  className="shadow-lg shadow-blue-500/20 px-6 font-bold"
                >
                  Save Master Durations
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Properties Modification Overlay Modal */}
      {modalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Edit Stage Properties</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure standard durations, name, role and behaviors for this stage.</p>
              </div>
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProperties} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Stage Name</label>
                  <input 
                    type="text" 
                    required
                    name="name"
                    defaultValue={editingTemplate.name}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                    placeholder="e.g. Technical Feasibility Check"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Stage Code</label>
                  <input 
                    type="text" 
                    required
                    name="code"
                    defaultValue={editingTemplate.code}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                    placeholder="e.g. FEAS-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sequence Order</label>
                  <input 
                    type="number" 
                    required
                    name="order"
                    defaultValue={editingTemplate.order}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                    placeholder="e.g. 1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Role</label>
                  <select 
                    name="assigned_role"
                    defaultValue={editingTemplate.assigned_role}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Duration Section */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">Standard Durations (Days)</h4>
                  <p className="text-xs text-slate-400">Default durations in calendar days for this stage based on project complexity.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-500 uppercase tracking-widest mb-1.5 ml-1">High Complexity Duration</label>
                  <input 
                    type="number" 
                    required
                    name="duration_high"
                    defaultValue={editingTemplate.duration_high ?? 5}
                    className="w-full h-11 px-4 rounded-xl border border-rose-200 bg-white text-sm focus:ring-2 focus:ring-rose-500/20 outline-hidden transition-all"
                    placeholder="Days (e.g. 5)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5 ml-1">Medium Complexity Duration</label>
                  <input 
                    type="number" 
                    required
                    name="duration_medium"
                    defaultValue={editingTemplate.duration_medium ?? 3}
                    className="w-full h-11 px-4 rounded-xl border border-amber-200 bg-white text-sm focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all"
                    placeholder="Days (e.g. 3)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1.5 ml-1">Low Complexity Duration</label>
                  <input 
                    type="number" 
                    required
                    name="duration_low"
                    defaultValue={editingTemplate.duration_low ?? 1}
                    className="w-full h-11 px-4 rounded-xl border border-emerald-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
                    placeholder="Days (e.g. 1)"
                  />
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea 
                    name="description"
                    defaultValue={editingTemplate.description || ''}
                    className="w-full min-h-[80px] p-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                    placeholder="Describe the objective of this stage..."
                  />
                </div>

                {/* Behavioral Toggles */}
                <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="is_active"
                      defaultChecked={editingTemplate.is_active}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 select-none">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="approval_required"
                      defaultChecked={editingTemplate.approval_required}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 select-none">Appr. Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="allow_attachments"
                      defaultChecked={editingTemplate.allow_attachments}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-700 select-none">Allow Attach.</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={updating}
                  className="shadow-lg shadow-blue-500/20 px-8"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
