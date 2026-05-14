'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, MapPin, Globe, Upload, Loader2 } from 'lucide-react';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import toast from 'react-hot-toast';

export function GeneralSettings() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchProfile();
  }, []);

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
            <div className="h-32 w-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden">
               {profile?.logo ? (
                 <img src={profile.logo} alt="Logo" className="h-full w-full object-contain p-2" />
               ) : (
                 <Building2 className="h-12 w-12 text-slate-300 group-hover:scale-110 transition-transform" />
               )}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" variant="outline" className="bg-white border-none h-8 text-[10px]">
                    <Upload className="h-3 w-3 mr-1" /> Change
                  </Button>
               </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 max-w-[200px]">
                Recommended size: 512x512px. PNG or SVG preferred.
              </p>
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
