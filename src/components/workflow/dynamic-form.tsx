'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFormContext, FormProvider } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/services/workflow-service';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import { Project } from '@/services/project-service';
import { Info, Plus, Trash2 } from 'lucide-react';

interface DynamicFormProps {
  fields: FormField[];
  project: Project;
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  stageStatus?: string;
  submittedByName?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ 
  fields, 
  project,
  initialData, 
  onSubmit, 
  isLoading,
  readOnly,
  stageStatus,
  submittedByName
}) => {
  const formMethods = useForm({
    defaultValues: initialData || {}
  });

  const { register, handleSubmit, formState: { errors } } = formMethods;

  const isProjectCustomerSection = (sec?: string) => {
    if (!sec) return false;
    const normalized = sec
      .toLowerCase()
      .replace(/&amp;/g, '&')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    return normalized === 'projectcustomerdetails';
  };

  // Identify fields belonging to "Project & Customer Details"
  const projectCustomerFields = fields.filter(
    field => isProjectCustomerSection(field.section)
  );

  // Group other fields by section
  const sections = fields
    .filter(field => !isProjectCustomerSection(field.section))
    .reduce((acc, field) => {
      const sectionName = field.section || 'General';
      if (!acc[sectionName]) acc[sectionName] = [];
      acc[sectionName].push(field);
      return acc;
    }, {} as Record<string, FormField[]>);

  const renderField = (field: FormField) => {
    if (field.field_type === 'grid') {
      return <GridField field={field} readOnly={readOnly} />;
    }

    const commonProps = {
      label: field.label,
      placeholder: field.placeholder,
      disabled: readOnly || field.is_readonly,
      ...register(field.name, { required: field.is_required ? 'Required' : false }),
      error: errors[field.name]?.message as string,
    };

    switch (field.field_type) {
      case 'text': return <Input {...commonProps} type="text" />;
      case 'email': return <Input {...commonProps} type="email" />;
      case 'number': return <Input {...commonProps} type="number" />;
      case 'textarea':
        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
            <textarea {...register(field.name)} disabled={readOnly} className="min-h-[100px] w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all disabled:bg-slate-50 disabled:text-slate-700 disabled:font-medium" />
          </div>
        );
      case 'dropdown': return <Select {...commonProps} options={field.options || []} />;
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
             <input type="checkbox" {...register(field.name)} disabled={readOnly} className="h-5 w-5 rounded border-slate-300 text-blue-600 disabled:opacity-100" />
             <label className="text-sm font-medium text-slate-700">{field.label}</label>
          </div>
        );
      case 'date': return <Input {...commonProps} type="date" />;
      case 'file': return <FileFieldField field={field} readOnly={readOnly} stageStatus={stageStatus} submittedByName={submittedByName} />;
      default: return null;
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* Section 1: Project & Customer Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
            <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">Project & Customer Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</p>
              <p className="text-sm font-semibold text-slate-700">{project.customer_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</p>
              <p className="text-sm font-semibold text-slate-700">{project.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Part Number</p>
              <p className="text-sm font-semibold text-slate-700">{project.customer_part_no || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Type</p>
              <p className="text-sm font-semibold text-slate-700">{project.project_type}</p>
            </div>
          </div>

          {/* Additional Dynamic Fields for Section 1 */}
          {projectCustomerFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
              {projectCustomerFields.sort((a, b) => a.order - b.order).map(f => (
                <div key={f.id} className={f.field_type === 'grid' || f.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                  {renderField(f)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Sections */}
        {Object.entries(sections).map(([name, sectionFields], index) => (
          <div key={name} className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                {index + 2}
              </div>
              <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">{name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {sectionFields.sort((a, b) => a.order - b.order).map(f => (
                <div key={f.id} className={f.field_type === 'grid' || f.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                  {renderField(f)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {!readOnly && (
          <div className="flex justify-end gap-3 pt-8 border-t">
            <Button type="submit" loading={isLoading} className="px-8 shadow-lg shadow-blue-500/20">Submit Stage Data</Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

const GridField = ({ field, readOnly }: { field: FormField; readOnly?: boolean }) => {
  const { register, watch, setValue } = useFormContext();
  const columns = field.configuration?.columns || ['Value', 'Remarks'];
  const columnOptions = (field.configuration as any)?.column_options || {};
  const fixedRows = field.configuration?.rows || [];
  const isDynamic = field.configuration?.is_dynamic || false;
  
  const gridData = watch(field.name) || (fixedRows.length > 0 ? fixedRows.map(r => ({ parameter: r })) : [{}]);

  const addRow = () => {
    setValue(field.name, [...gridData, {}]);
  };

  const removeRow = (index: number) => {
    const newData = [...gridData];
    newData.splice(index, 1);
    setValue(field.name, newData);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">{field.label}</label>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
            <tr>
              <th className="px-4 py-3 w-16">Sr.</th>
              {fixedRows.length > 0 && <th className="px-4 py-3">Parameter</th>}
              {columns.map(col => <th key={col} className="px-4 py-3">{col}</th>)}
              {isDynamic && !readOnly && <th className="px-4 py-3 w-10 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gridData.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-4 py-3 text-slate-400 font-mono">{i + 1}</td>
                {fixedRows.length > 0 && (
                  <td className="px-4 py-3 font-medium text-slate-700 bg-slate-50/20 max-w-[300px]">
                    {fixedRows[i] || row.parameter}
                    <input type="hidden" {...register(`${field.name}.${i}.parameter`)} defaultValue={fixedRows[i]} />
                  </td>
                )}
                {columns.map(col => {
                  const options = columnOptions[col];
                  return (
                    <td key={col} className="px-2 py-2">
                      {options ? (
                        <select
                          {...register(`${field.name}.${i}.${col}`)}
                          disabled={readOnly}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all disabled:bg-slate-50 disabled:text-slate-700 disabled:font-medium"
                        >
                          <option value="">Select...</option>
                          {options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          {...register(`${field.name}.${i}.${col}`)}
                          defaultValue={row[col] || ''}
                          disabled={readOnly}
                          placeholder="..."
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all disabled:bg-slate-50 disabled:text-slate-700 disabled:font-medium"
                        />
                      )}
                    </td>
                  );
                })}
                {isDynamic && !readOnly && (
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isDynamic && !readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-2">
          <Plus className="h-4 w-4 mr-1" /> Add New Row
        </Button>
      )}
    </div>
  );
};

const isUnderApproval = (status?: string) => {
  if (!status) return false;
  return ['Submitted', 'Pending Approval', 'Reviewed', 'Under Approval'].includes(status);
};

const FileFieldField = ({ 
  field, 
  readOnly,
  stageStatus,
  submittedByName 
}: { 
  field: FormField; 
  readOnly?: boolean;
  stageStatus?: string;
  submittedByName?: string;
}) => {
  const { watch, setValue } = useFormContext();
  const fileData = watch(field.name);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    settingsService.getCompanyProfile()
      .then(data => setProfile(data))
      .catch(() => null);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue(field.name, {
        name: file.name,
        type: file.type,
        base64: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setValue(field.name, null);
  };

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!fileData?.base64) return;

    const fileName = fileData.name;
    const fileType = fileData.type;
    const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(fileName);
    const underApproval = isUnderApproval(stageStatus);
    const isApproved = stageStatus === 'Approved';

    if ((underApproval || isApproved) && isImage) {
      const img = new Image();
      img.src = fileData.base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          triggerDirectDownload(fileData.base64, fileName);
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Calculate responsive size based on image width
        const size = Math.max(20, Math.floor(canvas.width / 12));
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-45 * Math.PI / 180);
        ctx.font = `bold ${size}px 'Inter', sans-serif`;
        ctx.fillStyle = isApproved ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)'; // Green for approved, Red for under approval
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const watermarkText = isApproved 
          ? (profile?.watermark_released || 'RELEASED') 
          : (profile?.watermark_under_approval || 'UNDER APPROVAL');
          
        ctx.fillText(watermarkText, 0, -size / 2);
        
        if (submittedByName) {
          const smallSize = Math.max(12, Math.floor(size / 3.5));
          ctx.font = `bold ${smallSize}px 'Inter', sans-serif`;
          ctx.fillStyle = 'rgba(100, 116, 139, 0.22)'; // Semi-transparent slate
          ctx.fillText(`Uploaded By: ${submittedByName}`, 0, size * 0.7);
        }
        ctx.restore();

        const watermarkedBase64 = canvas.toDataURL(fileType);
        triggerDirectDownload(watermarkedBase64, fileName);
      };
      img.onerror = () => {
        triggerDirectDownload(fileData.base64, fileName);
      };
    } else {
      triggerDirectDownload(fileData.base64, fileName);
    }
  };

  const triggerDirectDownload = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
      
      {fileData?.base64 ? (
        <div className="relative overflow-hidden flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          {/* Dynamic Visual Watermark overlay */}
          {(isUnderApproval(stageStatus) || stageStatus === 'Approved') && (
            <div className="absolute inset-y-0 right-[150px] left-[120px] pointer-events-none flex items-center justify-center opacity-[0.16] select-none overflow-hidden hidden sm:flex">
              <span className={`text-[11px] font-black uppercase tracking-widest rotate-[-12deg] border-2 rounded px-2 whitespace-nowrap bg-rose-50/10 ${stageStatus === 'Approved' ? 'text-emerald-600 border-emerald-400' : 'text-rose-600 border-rose-400'}`}>
                {stageStatus === 'Approved' ? (profile?.watermark_released || 'RELEASED') : (profile?.watermark_under_approval || 'UNDER APPROVAL')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 overflow-hidden z-10">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {fileData.name.split('.').pop() || 'FILE'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{fileData.name}</p>
              <p className="text-xs text-slate-400">
                {stageStatus === 'Approved' || isUnderApproval(stageStatus) ? (
                  <span className={stageStatus === 'Approved' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                    {stageStatus === 'Approved' ? (profile?.watermark_released || 'Released') : (profile?.watermark_under_approval || 'Under Approval')} • {submittedByName ? `By ${submittedByName}` : 'Pending'}
                  </span>
                ) : 'File Attachment'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 z-10">
            <a
              href="#"
              onClick={handleDownload}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Download
            </a>
            {!readOnly && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {readOnly ? (
            <p className="text-sm text-slate-400 italic">No attachment uploaded</p>
          ) : (
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.xlsx,.xls,.doc,.jpg,.jpeg,.png,.gif"
                className="hidden"
                id={`file-upload-${field.id}`}
              />
              <label
                htmlFor={`file-upload-${field.id}`}
                className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-blue-200 rounded-xl bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer transition-all gap-2 text-slate-500 hover:text-blue-600"
              >
                <Plus className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold">Choose file to upload...</span>
              </label>
              <p className="text-[10px] text-slate-400 mt-1">Supports PDF, Word, Excel, Images up to 10MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
