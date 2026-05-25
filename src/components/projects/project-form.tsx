'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Send, ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Project, projectService } from '@/services/project-service';
import { workflowService, StageTemplate } from '@/services/workflow-service';
import { customerService, Customer } from '@/services/customer-service';
import { standardsService, Standard } from '@/services/standards-service';
import { inspectionAuthorityService, InspectionAuthority } from '@/services/inspection-authority-service';
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
  inspection_authority_fk: z.string().optional().nullable(),
  applicable_standard: z.string().optional(),
  standard: z.string().optional().nullable(),
  date_received: z.string().min(1, 'Date received is required'),
  target_completion_date: z.string().optional().nullable(),
  status: z.enum(['Draft', 'Open', 'In Progress', 'Closed', 'Rejected', 'Pending Approval']).default('Open'),
  project_complexity: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  planned_start_date: z.string().optional().nullable(),
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

  // Standards dropdown state
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardSearch, setStandardSearch] = useState('');
  const [showStandardDropdown, setShowStandardDropdown] = useState(false);
  const [selectedStandards, setSelectedStandards] = useState<string[]>(() => {
    if (initialData?.applicable_standard) {
      return initialData.applicable_standard
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  });

  // Inspection Authorities dropdown state
  const [authorities, setAuthorities] = useState<InspectionAuthority[]>([]);
  const [authoritySearch, setAuthoritySearch] = useState('');
  const [showAuthorityDropdown, setShowAuthorityDropdown] = useState(false);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>(() => {
    if (initialData?.inspection_authority) {
      return initialData.inspection_authority
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  });
 
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

  useEffect(() => {
    const fetchActiveStandards = async () => {
      try {
        const data = await standardsService.getAll({ status: 'Active' });
        const list = Array.isArray(data) ? data : data.results || [];
        setStandards(list);
      } catch (error) {
        // Silently fail
      }
    };
    fetchActiveStandards();
  }, []);

  useEffect(() => {
    const fetchActiveAuthorities = async () => {
      try {
        const data = await inspectionAuthorityService.getAll({ status: 'Active' });
        const list = Array.isArray(data) ? data : data.results || [];
        setAuthorities(list);
      } catch (error) {
        // Silently fail
      }
    };
    fetchActiveAuthorities();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.standards-dropdown-container')) {
        setShowStandardDropdown(false);
      }
      if (!target.closest('.customers-dropdown-container')) {
        setShowCustomerDropdown(false);
      }
      if (!target.closest('.authorities-dropdown-container')) {
        setShowAuthorityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStandards = standards.filter(std => 
    std.standard_number.toLowerCase().includes(standardSearch.toLowerCase()) ||
    std.standard_name.toLowerCase().includes(standardSearch.toLowerCase())
  );

  const filteredAuthorities = authorities.filter(auth => 
    auth.authority_id.toLowerCase().includes(authoritySearch.toLowerCase()) ||
    auth.name.toLowerCase().includes(authoritySearch.toLowerCase())
  );

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
      inspection_authority_fk: initialData?.inspection_authority_fk?.toString() || '',
      applicable_standard: initialData?.applicable_standard || '',
      standard: initialData?.standard?.toString() || null,
      date_received: initialData?.date_received || new Date().toISOString().split('T')[0],
      target_completion_date: initialData?.target_completion_date || '',
      status: initialData?.status || 'Open',
      customer: initialData?.customer?.toString() || '',
      project_complexity: initialData?.project_complexity || 'Medium',
      planned_start_date: initialData?.planned_start_date || '',
    },
  });

  const handleSelectCustomer = (customer: Customer) => {
    setValue('customer', customer.id.toString());
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
              <div className="relative space-y-2 customers-dropdown-container">
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
                  { label: 'OTHER', value: 'OTHER' },
                  { label: 'LCP', value: 'LCP' },
                  { label: 'EWH', value: 'EWH' },
                  { label: 'RCP', value: 'RCP' },
                  { label: 'SP', value: 'SP' },
                  { label: 'AWH', value: 'AWH' },
                  { label: 'JB', value: 'JB' },
                  { label: 'BATTERY CABLE', value: 'BATTERY CABLE' },
                  { label: 'DROP IN PLATE', value: 'DROP IN PLATE' },
                  { label: 'BATTERY BOX', value: 'BATTERY BOX' },
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

          <Card title="Technical Specifications" subtitle="Authorities and standards applicable" className="overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative space-y-2 authorities-dropdown-container">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Inspection Authority</label>
                <div className="relative">
                  <Input
                    placeholder="Search or type custom authority..."
                    value={authoritySearch}
                    onChange={(e) => {
                      setAuthoritySearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = authoritySearch.trim();
                        if (trimmed && !selectedAuthorities.includes(trimmed)) {
                          const updated = [...selectedAuthorities, trimmed];
                          setSelectedAuthorities(updated);
                          setValue('inspection_authority', updated.join(', '));
                          setValue('inspection_authority_fk', null);
                          setAuthoritySearch('');
                          toast.success(`Added Custom Authority: ${trimmed}`);
                        }
                      }
                    }}
                    onFocus={() => setShowAuthorityDropdown(true)}
                    className={errors.inspection_authority_fk ? 'border-rose-500' : ''}
                  />
                </div>
                {errors.inspection_authority_fk && <p className="text-xs text-rose-500 font-bold uppercase tracking-tighter mt-1">{errors.inspection_authority_fk.message}</p>}
                
                {showAuthorityDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-slate-50 border-b flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Authority</span>
                      <button 
                        type="button" 
                        onClick={() => setShowAuthorityDropdown(false)} 
                        className="text-[10px] text-blue-600 font-bold uppercase hover:text-blue-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {authoritySearch.trim() && !filteredAuthorities.some(auth => auth.name.toLowerCase() === authoritySearch.trim().toLowerCase()) && (
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between border-b border-slate-100 font-semibold text-blue-600 text-xs"
                          onClick={() => {
                            const trimmed = authoritySearch.trim();
                            if (!selectedAuthorities.includes(trimmed)) {
                              const updated = [...selectedAuthorities, trimmed];
                              setSelectedAuthorities(updated);
                              setValue('inspection_authority', updated.join(', '));
                              setValue('inspection_authority_fk', null);
                            }
                            setAuthoritySearch('');
                            setShowAuthorityDropdown(false);
                            toast.success(`Added Custom Authority: ${trimmed}`);
                          }}
                        >
                          <span>+ Add &quot;{authoritySearch.trim()}&quot; as custom authority</span>
                        </button>
                      )}

                      {filteredAuthorities.length > 0 ? (
                        filteredAuthorities.map((auth) => {
                          const isAlreadySelected = selectedAuthorities.includes(auth.name);
                          return (
                            <button
                              key={auth.id}
                              type="button"
                              disabled={isAlreadySelected}
                              className={`w-full px-4 py-3 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between border-b last:border-0 border-slate-100 group ${isAlreadySelected ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                              onClick={() => {
                                if (!selectedAuthorities.includes(auth.name)) {
                                  const updated = [...selectedAuthorities, auth.name];
                                  setSelectedAuthorities(updated);
                                  setValue('inspection_authority', updated.join(', '));
                                  setValue('inspection_authority_fk', null);
                                  toast.success(`Selected Authority: ${auth.name}`, { icon: '🛡️' });
                                }
                                setAuthoritySearch('');
                                setShowAuthorityDropdown(false);
                              }}
                            >
                              <div>
                                <span className="font-bold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">{auth.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 font-mono">{auth.authority_id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAlreadySelected && (
                                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 rounded uppercase">
                                    Selected
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase">
                                  {auth.category}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        !authoritySearch.trim() && (
                          <div className="p-4 text-center text-xs text-slate-400 italic">No matching authorities found</div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Tags Display */}
                {selectedAuthorities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {selectedAuthorities.map((auth, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-in zoom-in-95 duration-100 hover:bg-blue-100/55 transition-all"
                      >
                        {auth}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = selectedAuthorities.filter((_, i) => i !== idx);
                            setSelectedAuthorities(updated);
                            setValue('inspection_authority', updated.join(', '));
                            setValue('inspection_authority_fk', null);
                            toast.success(`Removed: ${auth}`, { icon: '🗑️' });
                          }}
                          className="text-blue-400 hover:text-blue-600 hover:bg-blue-200/50 transition-colors p-0.5 rounded-full flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative space-y-2 standards-dropdown-container">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Applicable Standard</label>
                <div className="relative">
                  <Input
                    placeholder="Search or type custom standard..."
                    value={standardSearch}
                    onChange={(e) => {
                      setStandardSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = standardSearch.trim();
                        if (trimmed && !selectedStandards.includes(trimmed)) {
                          const updated = [...selectedStandards, trimmed];
                          setSelectedStandards(updated);
                          setValue('applicable_standard', updated.join(', '));
                          setValue('standard', null);
                          setStandardSearch('');
                          toast.success(`Added Custom Standard: ${trimmed}`);
                        }
                      }
                    }}
                    onFocus={() => setShowStandardDropdown(true)}
                    className={errors.applicable_standard ? 'border-rose-500' : ''}
                  />
                </div>
                {errors.applicable_standard && <p className="text-xs text-rose-500 font-bold uppercase tracking-tighter mt-1">{errors.applicable_standard.message}</p>}
                
                {showStandardDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-slate-50 border-b flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Standard</span>
                      <button 
                        type="button" 
                        onClick={() => setShowStandardDropdown(false)} 
                        className="text-[10px] text-blue-600 font-bold uppercase hover:text-blue-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {standardSearch.trim() && !filteredStandards.some(std => std.standard_number.toLowerCase() === standardSearch.trim().toLowerCase()) && (
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between border-b border-slate-100 font-semibold text-blue-600 text-xs"
                          onClick={() => {
                            const trimmed = standardSearch.trim();
                            if (!selectedStandards.includes(trimmed)) {
                              const updated = [...selectedStandards, trimmed];
                              setSelectedStandards(updated);
                              setValue('applicable_standard', updated.join(', '));
                              setValue('standard', null);
                            }
                            setStandardSearch('');
                            setShowStandardDropdown(false);
                            toast.success(`Added Custom Standard: ${trimmed}`);
                          }}
                        >
                          <span>+ Add &quot;{standardSearch.trim()}&quot; as custom standard</span>
                        </button>
                      )}

                      {filteredStandards.length > 0 ? (
                        filteredStandards.map((std) => {
                          const isAlreadySelected = selectedStandards.includes(std.standard_number);
                          return (
                            <button
                              key={std.id}
                              type="button"
                              disabled={isAlreadySelected}
                              className={`w-full px-4 py-3 text-left hover:bg-blue-50/50 transition-colors flex items-center justify-between border-b last:border-0 border-slate-100 group ${isAlreadySelected ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                              onClick={() => {
                                if (!selectedStandards.includes(std.standard_number)) {
                                  const updated = [...selectedStandards, std.standard_number];
                                  setSelectedStandards(updated);
                                  setValue('applicable_standard', updated.join(', '));
                                  setValue('standard', null);
                                  toast.success(`Selected Standard: ${std.standard_number}`, { icon: '📜' });
                                }
                                setStandardSearch('');
                                setShowStandardDropdown(false);
                              }}
                            >
                              <div>
                                <span className="font-bold text-slate-900 block text-xs group-hover:text-blue-600 transition-colors">{std.standard_number}</span>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 line-clamp-1">{std.standard_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAlreadySelected && (
                                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-1.5 py-0.5 rounded uppercase">
                                    Selected
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase font-mono">
                                  {std.category}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        !standardSearch.trim() && (
                          <div className="p-4 text-center text-xs text-slate-400 italic">No matching standards found</div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Tags Display */}
                {selectedStandards.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {selectedStandards.map((std, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-in zoom-in-95 duration-100 hover:bg-blue-100/55 transition-all"
                      >
                        {std}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = selectedStandards.filter((_, i) => i !== idx);
                            setSelectedStandards(updated);
                            setValue('applicable_standard', updated.join(', '));
                            setValue('standard', null);
                            toast.success(`Removed: ${std}`, { icon: '🗑️' });
                          }}
                          className="text-blue-400 hover:text-blue-600 hover:bg-blue-200/50 transition-colors p-0.5 rounded-full flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
          <Card title="Timeline & Planning" subtitle="Project deadlines and complexity">
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
              
              <Select
                label="Project Complexity"
                options={[
                  { label: 'High Complexity (e.g. JB)', value: 'High' },
                  { label: 'Medium Complexity (Standard)', value: 'Medium' },
                  { label: 'Low Complexity', value: 'Low' },
                ]}
                {...register('project_complexity')}
                error={errors.project_complexity?.message}
              />

              <Input
                label="Initial Planned Start Date (Stage 1)"
                type="date"
                {...register('planned_start_date')}
                error={errors.planned_start_date?.message}
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
