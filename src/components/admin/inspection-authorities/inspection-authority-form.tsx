'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Shield, FileText, Tag, Info, User, BookOpen, Settings2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InspectionAuthority } from '@/services/inspection-authority-service';
import { standardsService, Standard } from '@/services/standards-service';

const authoritySchema = z.object({
  authority_id: z.string().min(2, 'Authority ID must be at least 2 characters'),
  name: z.string().min(2, 'Authority Name must be at least 2 characters'),
  category: z.enum(['Marine', 'Customer', 'QA Agency', 'Internal', 'Defence']),
  contact_person: z.string().optional(),
  applicable_standard: z.string().optional().nullable(),
  approval_type: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
});

type AuthorityFormValues = z.infer<typeof authoritySchema>;

interface AuthorityFormProps {
  authority?: InspectionAuthority | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const InspectionAuthorityForm: React.FC<AuthorityFormProps> = ({
  authority,
  onSubmit,
  onClose,
  isLoading
}) => {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AuthorityFormValues>({
    resolver: zodResolver(authoritySchema) as any,
    defaultValues: authority ? {
      authority_id: authority.authority_id,
      name: authority.name,
      category: authority.category,
      contact_person: authority.contact_person || '',
      applicable_standard: authority.applicable_standard || null,
      approval_type: authority.approval_type || '',
      remarks: authority.remarks || '',
      status: authority.status,
    } : {
      authority_id: '',
      name: '',
      category: 'Marine',
      contact_person: '',
      applicable_standard: null,
      approval_type: '',
      remarks: '',
      status: 'Active',
    },
  });

  // Fetch active standards for dropdown selection
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const response = await standardsService.getAll({ status: 'Active' });
        // Handle paginated or list response
        const data = Array.isArray(response) ? response : (response.results || []);
        setStandards(data);

        // Pre-select current standard details if editing
        if (authority?.applicable_standard) {
          const matched = data.find((s: Standard) => String(s.id) === String(authority.applicable_standard));
          if (matched) {
            setSelectedStandard(matched);
            setSearchQuery(`${matched.standard_number} - ${matched.standard_name}`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch standards list', err);
      }
    };
    fetchStandards();
  }, [authority]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query text to matched standard name if blurred without selecting
        if (selectedStandard) {
          setSearchQuery(`${selectedStandard.standard_number} - ${selectedStandard.standard_name}`);
        } else {
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStandard]);

  const filteredStandards = standards.filter((s) =>
    s.standard_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.standard_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStandard = (std: Standard) => {
    setSelectedStandard(std);
    setValue('applicable_standard', std.id, { shouldValidate: true });
    setSearchQuery(`${std.standard_number} - ${std.standard_name}`);
    setIsOpen(false);
  };

  const handleClearStandard = () => {
    setSelectedStandard(null);
    setValue('applicable_standard', null, { shouldValidate: true });
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {authority ? 'Edit Inspection Authority' : 'Add New Inspection Authority'}
            </h2>
            <p className="text-sm text-slate-500">Configure client/third-party QA and inspection rules.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authority ID */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Authority ID *
              </label>
              <Input 
                {...register('authority_id')} 
                placeholder="e.g. IA-001" 
                className={errors.authority_id ? 'border-rose-500' : ''}
              />
              {errors.authority_id && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.authority_id.message}</p>}
            </div>

            {/* Authority Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Authority Name *
              </label>
              <Input 
                {...register('name')} 
                placeholder="e.g. Lloyds Register of Shipping" 
                className={errors.name ? 'border-rose-500' : ''}
              />
              {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name.message}</p>}
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
                <option value="Marine">Marine</option>
                <option value="Customer">Customer</option>
                <option value="QA Agency">QA Agency</option>
                <option value="Internal">Internal</option>
                <option value="Defence">Defence</option>
              </select>
              {errors.category && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.category.message}</p>}
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User className="h-3 w-3" /> Contact Person
              </label>
              <Input 
                {...register('contact_person')} 
                placeholder="e.g. John Miller" 
              />
            </div>

            {/* Searchable Standard Selector */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Applicable Standard</span>
                {selectedStandard && (
                  <button type="button" onClick={handleClearStandard} className="text-rose-500 hover:text-rose-600 normal-case font-semibold text-[9px]">
                    Clear
                  </button>
                )}
              </label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  placeholder="Type to search active standards..."
                  className="pr-10"
                />
                <Search className="h-4 w-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>

              {isOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {filteredStandards.length > 0 ? (
                    filteredStandards.map((std) => (
                      <button
                        key={std.id}
                        type="button"
                        onClick={() => handleSelectStandard(std)}
                        className={`w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 flex flex-col gap-0.5 border-b border-slate-100 last:border-0 ${selectedStandard?.id === std.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <span className="font-bold text-slate-800">{std.standard_number}</span>
                        <span className="text-[10px] text-slate-500 truncate">{std.standard_name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">No active standards found</div>
                  )}
                </div>
              )}
            </div>

            {/* Approval Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings2 className="h-3 w-3" /> Approval Type
              </label>
              <Input 
                {...register('approval_type')} 
                placeholder="e.g. Type approval, LRS Type Cert" 
              />
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

            {/* Remarks */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Remarks
              </label>
              <textarea 
                {...register('remarks')}
                placeholder="Remarks, certifications, and special notes..."
                className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              <Save className="h-4 w-4 mr-2" /> {authority ? 'Update Authority' : 'Save Authority'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
