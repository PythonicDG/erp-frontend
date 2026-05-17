'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Project, projectService } from '@/services/project-service';
import { workflowService, StageTemplate } from '@/services/workflow-service';
import { customerService, Customer } from '@/services/customer-service';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  customer: z.string().min(1, 'Customer selection is required'),
  customer_name: z.string().optional(),
  customer_part_no: z.string().optional(),
  pcepl_part_no: z.string().optional(),
  project_type: z.string().min(1, 'Project type is required'),
  inspection_authority: z.string().optional(),
  applicable_standard: z.string().optional(),
  date_received: z.string().min(1, 'Date received is required'),
  target_completion_date: z.string().optional().nullable(),
  status: z.enum(['Draft', 'Open', 'In Progress', 'Closed', 'Rejected', 'Pending Approval']).default('Open'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: Partial<Project>;
  role: 'admin' | 'supervisor' | 'employee';
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ initialData, role }) => {
  const router = useRouter();
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [customerSearch, setCustomerSearch] = useState(initialData?.customer_name || '');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
 
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await workflowService.getTemplates();
        const templatesList = Array.isArray(data) ? data : (data as any)?.results || [];
        setTemplates(templatesList.sort((a: any, b: any) => a.order - b.order));
      } catch (error) {
        toast.error('Failed to load templates');
      }
    };
    fetchTemplates();
  }, []);

  // Customer search logic
  useEffect(() => {
    if (customerSearch.length >= 2) {
      const timer = setTimeout(async () => {
        setIsSearchingCustomers(true);
        try {
          const data = await customerService.getAll({ search: customerSearch });
          setCustomerResults(Array.isArray(data) ? data : data.results || []);
          setShowCustomerDropdown(true);
        } catch (error) {
          // Silently fail search
        } finally {
          setIsSearchingCustomers(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [customerSearch]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      customer_name: initialData?.customer_name || '',
      customer_part_no: initialData?.customer_part_no || '',
      pcepl_part_no: initialData?.pcepl_part_no || '',
      project_type: initialData?.project_type || 'OTHER',
      inspection_authority: initialData?.inspection_authority || '',
      applicable_standard: initialData?.applicable_standard || '',
      date_received: initialData?.date_received || new Date().toISOString().split('T')[0],
      target_completion_date: initialData?.target_completion_date || '',
      status: initialData?.status || 'Open',
      customer: initialData?.customer?.toString() || '',
    },
  });

  const handleSelectCustomer = (customer: Customer) => {
    setValue('customer', customer.id);
    setValue('customer_name', customer.name);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    toast.success(`Selected customer: ${customer.name}`, { icon: '🤝' });
  };

  const formData = watch();

  // Autosave logic (only for Drafts)
  useEffect(() => {
    if (isDirty && !isSubmitting && !isDrafting) {
      const timer = setTimeout(() => {
        // handleAutosave();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [formData, isDirty]);

  const onSaveDraft = async () => {
    setIsDrafting(true);
    try {
      const data = { ...formData, status: 'Draft' as const };
      const res = await projectService.create(data);
      toast.success('Project saved as draft');
      setLastSaved(new Date());
      router.push(`/${role}/projects/${res.id}`);
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsDrafting(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const res = await projectService.create({ ...data, status: 'Open' });
      toast.success('Project created successfully');
      router.push(`/${role}/projects/${res.id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
            <p className="text-sm text-slate-500">Fill in the details to initialize a new project workflow.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-slate-400 mr-2">
              Last saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSaveDraft}
            loading={isDrafting}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting}
            className="shadow-blue-500/20 shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Project Information" subtitle="Basic details about the project" className="overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Project Name"
                  placeholder="e.g. JUNCTION BOX CSL-WATERJET"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>
              <div className="relative space-y-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name</label>
                <div className="relative">
                  <Input
                    placeholder="Type to search customers..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (e.target.value === '') setValue('customer', '');
                    }}
                    className={errors.customer ? 'border-rose-500' : ''}
                  />
                  {isSearchingCustomers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                {errors.customer && <p className="text-xs text-rose-500 font-bold uppercase tracking-tighter mt-1">{errors.customer.message}</p>}
                
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-slate-50 border-b flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matching Customers</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">{customerResults.length} Found</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.email} • {c.mobile_number}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md uppercase">Select</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Select
                label="Project Type"
                options={[
                  { label: 'Standard', value: 'STANDARD' },
                  { label: 'Custom', value: 'CUSTOM' },
                  { label: 'Maintenance', value: 'MAINTENANCE' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                {...register('project_type')}
                error={errors.project_type?.message}
              />
            </div>
          </Card>

          <Card title="Part Details" subtitle="Customer and internal part references">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Customer Part Number"
                placeholder="e.g. PAAG464305"
                {...register('customer_part_no')}
                error={errors.customer_part_no?.message}
              />
              <Input
                label="PCEPL Part Number"
                placeholder="e.g. 30071850"
                {...register('pcepl_part_no')}
                error={errors.pcepl_part_no?.message}
              />
            </div>
          </Card>

          <Card title="Technical Specifications" subtitle="Authorities and standards applicable">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Inspection Authority"
                placeholder="e.g. Internal QA / LRS / BV"
                {...register('inspection_authority')}
                error={errors.inspection_authority?.message}
              />
              <Input
                label="Applicable Standard"
                placeholder="e.g. IEC 61439"
                {...register('applicable_standard')}
                error={errors.applicable_standard?.message}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
          <Card title="Timeline" subtitle="Project reception and deadlines">
            <div className="space-y-6">
              <Input
                label="Date Received"
                type="date"
                {...register('date_received')}
                error={errors.date_received?.message}
              />
              <Input
                label="Target Completion Date"
                type="date"
                {...register('target_completion_date')}
                error={errors.target_completion_date?.message}
              />
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Auto-Generated Fields</h4>
                <div className="space-y-2 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>Project ID:</span>
                    <span className="font-mono font-bold">PRJ/YY/MM/00X</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Month Received:</span>
                    <span className="font-bold">Calculated from Date</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Workflow Preview" subtitle="Stages initialized on creation">
            <div className="space-y-3">
              {templates.length > 0 ? (
                templates.map((template, i) => (
                  <div key={template.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`} />
                    <span className={i === 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                      {template.name}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">Loading active workflow stages...</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
};
