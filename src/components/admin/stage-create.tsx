'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { workflowService } from '@/services/workflow-service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings2, ArrowLeft } from 'lucide-react';

export function StageCreateView() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Basic fields for a new stage
      const payload = {
        ...data,
        order: parseInt(data.order),
        is_active: true,
        is_mandatory: true,
        approval_required: true,
      };
      
      // In a real app, we'd call workflowService.createTemplate(payload)
      // Since I haven't added that method yet, I'll use a direct axios call or update service
      const response = await (await import('@/lib/axios')).default.post('/api/workflow/templates/', payload);
      
      toast.success('Stage created successfully!');
      router.push(`/admin/workflow/${response.data.id}/fields`);
    } catch (error) {
      toast.error('Failed to create stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Workflow Stage</h1>
        <p className="text-slate-500">Define the basic properties of the new project stage.</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input 
                label="Stage Name" 
                placeholder="e.g. Technical Feasibility Check"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message as string}
              />
            </div>
            <div>
              <Input 
                label="Stage Code" 
                placeholder="e.g. FEAS-01"
                {...register('code', { required: 'Code is required' })}
                error={errors.code?.message as string}
              />
            </div>
            <div>
              <Input 
                label="Sequence Order" 
                type="number"
                placeholder="e.g. 1"
                {...register('order', { required: 'Order is required' })}
                error={errors.order?.message as string}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assigned Role</label>
              <select 
                {...register('assigned_role')}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
               <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    {...register('description')}
                    className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                    placeholder="Describe the objective of this stage..."
                  />
               </div>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full h-12 shadow-lg shadow-blue-500/20">
            Create Stage & Continue to Form Design
          </Button>
        </form>
      </Card>
    </div>
  );
}
