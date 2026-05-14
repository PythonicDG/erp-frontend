'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  Table, 
  Type, 
  ArrowLeft,
  Settings2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { workflowService } from '@/services/workflow-service';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface FormBuilderProps {
  stageId: string;
}

export function FormBuilder({ stageId }: FormBuilderProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const data = await workflowService.getTemplates();
        const templatesList = Array.isArray(data) ? data : (data as any)?.results || [];
        const stage = templatesList.find((t: any) => t.id.toString() === stageId);
        if (stage) {
          setFields(stage.fields.sort((a: any, b: any) => a.order - b.order));
        }
      } catch (error) {
        toast.error('Failed to load fields');
      } finally {
        setLoading(false);
      }
    };
    fetchFields();
  }, [stageId]);

  const addField = () => {
    const newField = {
      id: `temp_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: 'New Field Label',
      field_type: 'text',
      section: 'General',
      order: fields.length,
      configuration: { columns: [], rows: [] },
      options: []
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: any, updates: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: any) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Send fields to the new sync endpoint
      await api.post(`/api/workflow/templates/${stageId}/sync_fields/`, {
        fields: fields.map((f, i) => ({
          ...f,
          name: f.name || `field_${i}`, // Ensure machine name exists
          order: i
        }))
      });
      toast.success('Form design saved and live!');
      router.push('/admin/workflow');
    } catch (error) {
      toast.error('Failed to save form design');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-500">Loading Form Designer...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stage Form Designer</h2>
            <p className="text-sm text-slate-500">Design how the inputs will appear for this stage.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSave} loading={saving} className="shadow-lg shadow-blue-500/20 px-8 h-11">
            <Save className="h-4 w-4 mr-2" /> Save & Publish Form
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="border-slate-200 hover:border-blue-200 transition-all shadow-xs group">
            <div className="flex items-stretch min-h-[100px]">
              <div className="w-10 bg-slate-50 flex items-center justify-center border-r border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                <GripVertical className="h-4 w-4 text-slate-300" />
              </div>

              <div className="flex-1 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                   <div className="md:col-span-4">
                     <Input 
                       label="Display Label" 
                       value={field.label || ''} 
                       onChange={(e) => updateField(field.id, { label: e.target.value })}
                       placeholder="e.g. Technical Feasibility"
                     />
                   </div>
                   <div className="md:col-span-3">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Input Type</label>
                     <select 
                       value={field.field_type} 
                       onChange={(e) => updateField(field.id, { field_type: e.target.value })}
                       className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                     >
                       <option value="text">Short Text</option>
                       <option value="textarea">Long Text / Remarks</option>
                       <option value="dropdown">Dropdown (Select One)</option>
                       <option value="grid">Table / Grid Input</option>
                       <option value="date">Date Picker</option>
                       <option value="boolean">Checkbox</option>
                     </select>
                   </div>
                   <div className="md:col-span-3">
                     <Input 
                       label="Section Group" 
                       value={field.section || ''} 
                       onChange={(e) => updateField(field.id, { section: e.target.value })}
                       placeholder="e.g. Risk Assessment"
                     />
                   </div>
                   <div className="md:col-span-2 flex items-end justify-end pb-1.5">
                     <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                </div>

                {/* Advanced Config for Tables */}
                {field.field_type === 'grid' && (
                  <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider">
                      <Table className="h-4 w-4" /> Table Settings
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Columns (comma separated)</label>
                         <textarea 
                           className="w-full p-3 rounded-lg border border-slate-200 text-sm h-20 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                           placeholder="Status, Remarks, Action..."
                           value={field.configuration?.columns?.join(', ') || ''}
                           onChange={(e) => updateField(field.id, { configuration: { ...field.configuration, columns: e.target.value.split(',').map(s => s.trim()).filter(s => s) }})}
                         />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Predefined Rows (one per line)</label>
                         <textarea 
                           className="w-full p-3 rounded-lg border border-slate-200 text-sm h-20 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                           placeholder="Row 1\nRow 2..."
                           value={field.configuration?.rows?.join('\n') || ''}
                           onChange={(e) => updateField(field.id, { configuration: { ...field.configuration, rows: e.target.value.split('\n').map(s => s.trim()).filter(s => s) }})}
                         />
                       </div>
                    </div>
                    
                    {/* Column Options UI */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dropdown Column Options (e.g. Status: Yes, No)</label>
                       <Input 
                         placeholder="Format: ColumnName: Option1, Option2"
                         onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes(':')) {
                              const [col, opts] = val.split(':');
                              const colName = col.trim();
                              const optionsList = opts.split(',').map(s => s.trim()).filter(s => s);
                              updateField(field.id, { 
                                configuration: { 
                                  ...field.configuration, 
                                  column_options: { ...field.configuration.column_options, [colName]: optionsList } 
                                } 
                              });
                            }
                         }}
                       />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="checkbox" 
                        checked={field.configuration?.is_dynamic} 
                        onChange={(e) => updateField(field.id, { configuration: { ...field.configuration, is_dynamic: e.target.checked }})}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs font-medium text-slate-600">Enable "Add Row" button for users</label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        <Button 
          variant="outline" 
          onClick={addField}
          className="w-full py-10 border-2 border-dashed border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 group transition-all rounded-2xl"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-6 w-6 text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
            <span className="text-slate-400 font-bold text-sm uppercase tracking-widest group-hover:text-blue-600">Add New Field</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
