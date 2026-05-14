'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  FileText, 
  Settings as SettingsIcon,
  Projector,
  AlertCircle
} from 'lucide-react';

const mockLogs = [
  {
    id: 1,
    user: 'Amrit Sharma',
    role: 'ADMIN',
    action: 'Modified Project Standards',
    target: 'Junction Box CSL-102',
    timestamp: '2026-05-14T12:30:00',
    type: 'UPDATE',
    module: 'Projects'
  },
  {
    id: 2,
    user: 'Vikram Singh',
    role: 'SUPERVISOR',
    action: 'Approved Stage 2',
    target: 'Project PRJ-2024-001',
    timestamp: '2026-05-14T11:45:00',
    type: 'APPROVAL',
    module: 'Workflow'
  },
  {
    id: 3,
    user: 'Amrit Sharma',
    role: 'ADMIN',
    action: 'Changed Role Permissions',
    target: 'Employee Role',
    timestamp: '2026-05-14T10:15:00',
    type: 'SECURITY',
    module: 'Settings'
  },
  {
    id: 4,
    user: 'Rahul Mehta',
    role: 'EMPLOYEE',
    action: 'Uploaded Stage Attachment',
    target: 'Stage 1 - Raw Material',
    timestamp: '2026-05-14T09:30:00',
    type: 'CREATE',
    module: 'Workflow'
  },
  {
    id: 5,
    user: 'Sanjay Dutt',
    role: 'ADMIN',
    action: 'Deleted User Account',
    target: 'John Doe (Former Employee)',
    timestamp: '2026-05-13T16:20:00',
    type: 'DELETE',
    module: 'Team'
  }
];

export function AuditLogs() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="w-full lg:max-w-md">
          <Input 
            placeholder="Search logs by user, action or target..." 
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Select 
            options={[
              { label: 'All Modules', value: 'all' },
              { label: 'Projects', value: 'projects' },
              { label: 'Workflow', value: 'workflow' },
              { label: 'Settings', value: 'settings' },
              { label: 'Team', value: 'team' },
            ]}
            defaultValue="all"
            className="min-w-[140px]"
          />
          <Select 
            options={[
              { label: 'All Actions', value: 'all' },
              { label: 'Create', value: 'create' },
              { label: 'Update', value: 'update' },
              { label: 'Delete', value: 'delete' },
              { label: 'Approval', value: 'approval' },
            ]}
            defaultValue="all"
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-8 py-4">Action & Module</th>
                <th className="px-4 py-4">Performed By</th>
                <th className="px-4 py-4">Target Resource</th>
                <th className="px-4 py-4">Date & Time</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                        log.type === 'DELETE' ? 'bg-red-50 text-red-500' :
                        log.type === 'SECURITY' ? 'bg-amber-50 text-amber-500' :
                        log.type === 'APPROVAL' ? 'bg-emerald-50 text-emerald-500' :
                        'bg-blue-50 text-blue-500'
                      }`}>
                        {log.module === 'Projects' && <FileText className="h-4 w-4" />}
                        {log.module === 'Workflow' && <Activity className="h-4 w-4" />}
                        {log.module === 'Settings' && <SettingsIcon className="h-4 w-4" />}
                        {log.module === 'Team' && <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{log.action}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{log.module}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {log.user.split(' ').map(n => n[0]).join('')}
                       </div>
                       <div>
                         <p className="font-medium text-slate-700">{log.user}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{log.role}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="truncate max-w-[150px]">{log.target}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-medium">{new Date(log.timestamp).toLocaleDateString()}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold">Success</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500">Showing 1 to 5 of 124 entries</p>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" disabled className="text-xs h-8">Previous</Button>
             <Button variant="outline" size="sm" className="text-xs h-8">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
