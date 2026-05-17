'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Shield, FileText, Calendar, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Standard } from '@/services/standards-service';

const standardSchema = z.object({
  standard_number: z.string().min(2, 'Standard Number must be at least 2 characters'),
  standard_name: z.string().min(2, 'Standard Name must be at least 2 characters'),
  revision: z.string().optional(),
  release_year: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().int().min(1900, 'Invalid year').max(new Date().getFullYear() + 10, 'Invalid year').optional()
  ),
  category: z.enum(['ISO', 'IEC', 'Marine IEC', 'IP', 'EMC', 'Defence']),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type StandardFormValues = z.infer<typeof standardSchema>;

interface StandardFormProps {
  standard?: Standard | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const StandardForm: React.FC<StandardFormProps> = ({
  standard,
  onSubmit,
  onClose,
  isLoading
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<StandardFormValues>({
    resolver: zodResolver(standardSchema) as any,
    defaultValues: standard ? {
      standard_number: standard.standard_number,
      standard_name: standard.standard_name,
      revision: standard.revision || '',
      release_year: standard.release_year,
      category: standard.category,
      description: standard.description || '',
      status: standard.status,
    } : {
      standard_number: '',
      standard_name: '',
      revision: '',
      release_year: undefined,
      category: 'ISO',
      description: '',
      status: 'Active',
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{standard ? 'Edit Standard' : 'Add New Standard'}</h2>
            <p className="text-sm text-slate-500">Fill in the standards master details below.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Standard Number *
              </label>
              <Input 
                {...register('standard_number')} 
                placeholder="e.g. IEC 61439-1" 
                className={errors.standard_number ? 'border-rose-500' : ''}
              />
              {errors.standard_number && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.standard_number.message}</p>}
            </div>

            {/* Standard Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Standard Name *
              </label>
              <Input 
                {...register('standard_name')} 
                placeholder="e.g. Switchgear Assembly Rule" 
                className={errors.standard_name ? 'border-rose-500' : ''}
              />
              {errors.standard_name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.standard_name.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Category *
              </label>
              <select 
                {...register('category')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              >
                <option value="ISO">ISO</option>
                <option value="IEC">IEC</option>
                <option value="Marine IEC">Marine IEC</option>
                <option value="IP">IP</option>
                <option value="EMC">EMC</option>
                <option value="Defence">Defence</option>
              </select>
              {errors.category && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.category.message}</p>}
            </div>

            {/* Revision */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="h-3 w-3" /> Revision / Edition
              </label>
              <Input 
                {...register('revision')} 
                placeholder="e.g. Edition 3.0" 
                className={errors.revision ? 'border-rose-500' : ''}
              />
              {errors.revision && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.revision.message}</p>}
            </div>

            {/* Release Year */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Release Year
              </label>
              <Input 
                {...register('release_year')} 
                type="number"
                placeholder="e.g. 2020" 
                className={errors.release_year ? 'border-rose-500' : ''}
              />
              {errors.release_year && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.release_year.message}</p>}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="h-3 w-3" /> Status *
              </label>
              <select 
                {...register('status')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all font-bold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.status && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.status.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Description
              </label>
              <textarea 
                {...register('description')}
                placeholder="Detailed explanation of the standard scope..."
                className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              <Save className="h-4 w-4 mr-2" /> {standard ? 'Update Standard' : 'Save Standard'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
