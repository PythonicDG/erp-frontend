'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, User, Mail, Phone, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer } from '@/services/customer-service';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().optional(),
  mobile_number: z.string().regex(/^[0-9+]{10,15}$/, 'Invalid mobile number (10-15 digits)'),
  alternate_mobile_number: z.string().optional().refine(val => !val || /^[0-9+]{10,15}$/.test(val), 'Invalid alternate mobile number'),
  email: z.string().email('Invalid email address'),
  remarks: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CustomerFormValues) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onClose,
  isLoading
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: '',
      category: '',
      mobile_number: '',
      alternate_mobile_number: '',
      email: '',
      remarks: '',
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <p className="text-sm text-slate-500">Fill in the customer master details below.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Name */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User className="h-3 w-3" /> Customer Name *
              </label>
              <Input 
                {...register('name')} 
                placeholder="Full Name / Company Name" 
                className={errors.name ? 'border-rose-500' : ''}
              />
              {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email Address *
              </label>
              <Input 
                {...register('email')} 
                type="email"
                placeholder="customer@example.com"
                className={errors.email ? 'border-rose-500' : ''}
              />
              {errors.email && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.email.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Category
              </label>
              <select 
                {...register('category')}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              >
                <option value="">Select Category</option>
                <option value="New">New</option>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Mobile Number *
              </label>
              <Input 
                {...register('mobile_number')} 
                placeholder="+91 0000000000"
                className={errors.mobile_number ? 'border-rose-500' : ''}
              />
              {errors.mobile_number && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.mobile_number.message}</p>}
            </div>

            {/* Alternate Mobile Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Alternate Mobile
              </label>
              <Input 
                {...register('alternate_mobile_number')} 
                placeholder="Optional"
                className={errors.alternate_mobile_number ? 'border-rose-500' : ''}
              />
              {errors.alternate_mobile_number && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.alternate_mobile_number.message}</p>}
            </div>

            {/* Remarks */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Remarks / Notes
              </label>
              <textarea 
                {...register('remarks')}
                placeholder="Any special instructions or details..."
                className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              <Save className="h-4 w-4 mr-2" /> {customer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
