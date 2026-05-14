'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  History, 
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { GeneralSettings } from '@/components/admin/settings/general-settings';
import { RoleManagement } from '@/components/admin/settings/role-management';
import { AuditLogs } from '@/components/admin/settings/audit-logs';

const tabs = [
  { id: 'general', label: 'Company Profile', icon: Building2 },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'audit', label: 'Audit Logs', icon: History },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage company information, user roles, and track system activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">Discard Changes</Button>
          <Button size="sm" className="shadow-lg shadow-blue-500/20">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all whitespace-nowrap ${
                isActive 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-8 transition-all duration-300">
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'audit' && <AuditLogs />}
      </div>
    </div>
  );
}
