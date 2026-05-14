'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, MapPin, Globe, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import toast from 'react-hot-toast';

export function GeneralSettings() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const data = await settingsService.getCompanyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile');
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

    // Basic validation
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
    } catch (error) {
      toast.error('Failed to upload logo', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm font-medium">Loading profile...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Profile Info */}
      <div className="lg:col-span-2 space-y-6">
        <Card title="Company Information" subtitle="Update your organization's basic details.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input 
                label="Company Name" 
                placeholder="Enter company name" 
                defaultValue={profile?.name || ''}
                icon={<Building2 className="h-4 w-4" />}
              />
            </div>
            <Input 
              label="Business Email" 
              type="email" 
              placeholder="contact@company.com" 
              defaultValue={profile?.email || ''}
              icon={<Mail className="h-4 w-4" />}
            />
            <Input 
              label="Phone Number" 
              placeholder="+91 00000 00000" 
              defaultValue={profile?.phone || ''}
              icon={<Phone className="h-4 w-4" />}
            />
            <div className="md:col-span-2">
              <Input 
                label="Website URL" 
                placeholder="https://www.company.com" 
                defaultValue={profile?.website || ''}
                icon={<Globe className="h-4 w-4" />}
              />
            </div>
          </div>
        </Card>

        <Card title="Address Details" subtitle="Physical location of the company headquarters.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input 
                label="Street Address" 
                placeholder="Building, Street, Area" 
                defaultValue={profile?.address || ''}
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>
            <Input label="City" defaultValue={profile?.city || ''} />
            <Input label="State / Province" defaultValue={profile?.state || ''} />
            <Input label="Postal Code" defaultValue={profile?.postal_code || ''} />
            <Input label="Country" defaultValue={profile?.country || ''} />
          </div>
        </Card>
      </div>

      {/* Right Column: Branding */}
      <div className="space-y-6">
        <Card title="Company Logo" subtitle="Used for reports and emails.">
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

        <Card title="System Preferences" subtitle="Global UI and behavior settings.">
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Automatic Reporting</p>
                  <p className="text-slate-500">Send weekly activity summaries</p>
                </div>
                <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-blue-600">
                  <span className="translate-x-4 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                </div>
             </div>
             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Project Notifications</p>
                  <p className="text-slate-500">Enable real-time push alerts</p>
                </div>
                <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-slate-200">
                  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
