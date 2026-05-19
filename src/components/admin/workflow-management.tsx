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

      <div className="grid grid-cols-1 gap-4">
        {templates.map((template, index) => (
          <Card key={template.id} className="group hover:border-blue-200 transition-all cursor-default overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
               <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-50 text-slate-400 font-bold border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
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
                 <div className="flex items-center gap-4 pt-1">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Layers className="h-3 w-3" /> {template.fields?.length || 0} Dynamic Fields
                    </span>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Assigned to {template.assigned_role}
                    </span>
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <Link href={`/admin/workflow/${template.id}/fields`}>
                   <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
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

        {templates.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             <Layers className="h-12 w-12 mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-900">No Stages Defined</h3>
             <p className="text-slate-500 max-w-xs mx-auto">Get started by creating your first workflow stage and designing its form.</p>
             <Button className="mt-6">Create First Stage</Button>
          </div>
        )}
      </div>
    </div>
  );
}
