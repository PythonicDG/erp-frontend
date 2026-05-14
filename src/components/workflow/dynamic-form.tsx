'use client';

import React from 'react';
import { useForm, useFormContext, FormProvider } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/services/workflow-service';
import { Project } from '@/services/project-service';
import { Info, Plus, Trash2 } from 'lucide-react';

interface DynamicFormProps {
  fields: FormField[];
  project: Project;
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ 
  fields, 
  project,
  initialData, 
  onSubmit, 
  isLoading,
  readOnly 
}) => {
  const formMethods = useForm({
    defaultValues: initialData || {}
  });

  const { register, handleSubmit, formState: { errors } } = formMethods;

  // Group fields by section
  const sections = fields.reduce((acc, field) => {
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
      default: return null;
    }
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
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
