'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Upload, 
  Loader2, 
  Image as ImageIcon,
  Save,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  website: z.string().url('Invalid URL (include https://)').optional().or(z.string().length(0)),
  address: z.string().min(5, 'Address is too short'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postal_code: z.string().min(5, 'Valid postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function GeneralSettings() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<ProfileFormValues | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const fetchProfile = async () => {
    try {
      const data = await settingsService.getCompanyProfile();
      setProfile(data);
      reset({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postal_code: data.postal_code || '',
        country: data.country || '',
      });
    } catch (error) {
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading logo...');
    try {
      const updatedProfile = await settingsService.updateLogo(file);
      setProfile(updatedProfile);
      toast.success('Logo updated successfully', { id: toastId });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload logo';
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const confirmSave = async () => {
    if (!pendingData) return;
    
    setSaving(true);
    setIsConfirmOpen(false);
    const toastId = toast.loading('Saving settings...');
    
    try {
      const updated = await settingsService.updateCompanyProfile(pendingData);
      setProfile(updated);
      reset(pendingData);
      toast.success('Settings updated successfully', { id: toastId });
    } catch (error: any) {
      const apiErrors = error.response?.data;
      if (apiErrors && typeof apiErrors === 'object') {
        // Handle field-specific errors from backend
        Object.keys(apiErrors).forEach((key) => {
          toast.error(`${key}: ${apiErrors[key]}`);
        });
      } else {
        toast.error('An unexpected error occurred', { id: toastId });
      }
    } finally {
      setSaving(false);
      setPendingData(null);
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm font-medium">Loading profile...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Company Information" subtitle="Update your organization's basic identity and contact details.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input 
                  label="Company Name" 
                  placeholder="Enter official company name" 
                  {...register('name')}
                  error={errors.name?.message}
                  icon={<Building2 className="h-4 w-4" />}
                />
              </div>
              <Input 
                label="Business Email" 
                type="email" 
                placeholder="contact@company.com" 
                {...register('email')}
                error={errors.email?.message}
                icon={<Mail className="h-4 w-4" />}
              />
              <Input 
                label="Phone Number" 
                placeholder="+91 00000 00000" 
                {...register('phone')}
                error={errors.phone?.message}
                icon={<Phone className="h-4 w-4" />}
              />
              <div className="md:col-span-2">
                <Input 
                  label="Website URL" 
                  placeholder="https://www.company.com" 
                  {...register('website')}
                  error={errors.website?.message}
                  icon={<Globe className="h-4 w-4" />}
                />
              </div>
            </div>
          </Card>

          <Card title="Address Details" subtitle="Global headquarters or primary operational address.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input 
                  label="Street Address" 
                  placeholder="Building, Street, Area" 
                  {...register('address')}
                  error={errors.address?.message}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
              <Input label="City" {...register('city')} error={errors.city?.message} />
              <Input label="State / Province" {...register('state')} error={errors.state?.message} />
              <Input label="Postal Code" {...register('postal_code')} error={errors.postal_code?.message} />
              <Input label="Country" {...register('country')} error={errors.country?.message} />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
             <Button 
                type="button" 
                variant="outline" 
                onClick={() => reset()}
                disabled={!isDirty || saving}
             >
               Discard Changes
             </Button>
             <Button 
                type="submit" 
                loading={saving}
                disabled={!isDirty || saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200"
             >
                <Save className="h-4 w-4 mr-2" /> Save Settings
             </Button>
          </div>
        </div>

        {/* Right Column: Branding & Preferences */}
        <div className="space-y-6">
          <Card title="Company Logo" subtitle="Used for branded reports, invoices, and system-wide identity.">
            <div className="flex flex-col items-center gap-6 py-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={handleLogoClick}
                className={`h-40 w-40 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/30 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                 {profile?.logo ? (
                   <img 
                     src={profile.logo.startsWith('http') ? profile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${profile.logo}`} 
                     alt="Logo" 
                     className="h-full w-full object-contain p-4" 
                   />
                 ) : (
                   <div className="flex flex-col items-center gap-2">
                     <ImageIcon className="h-12 w-12 text-slate-300 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Logo</span>
                   </div>
                 )}
                 
                 <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <Upload className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change Logo</span>
                    </div>
                 </div>

                 {uploading && (
                   <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                     <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                   </div>
                 )}
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 max-w-[200px]">
                  Recommended size: 512x512px. <br />
                  PNG or SVG preferred (Max 2MB).
                </p>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[10px] font-bold"
                  onClick={handleLogoClick}
                  disabled={uploading}
                >
                  BROWSE FILES
                </Button>
              </div>
            </div>
          </Card>

        </div>
      </div>

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmSave}
        loading={saving}
        title="Save Changes?"
        message="Are you sure you want to update the company profile? These details will be reflected in all system-generated reports and documents."
        confirmLabel="Save Settings"
        variant="info"
      />
    </form>
  );
}
