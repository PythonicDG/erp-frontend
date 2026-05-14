'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, UserCog, Briefcase, Check, X, Info } from 'lucide-react';

const modules = [
  { id: 'projects', label: 'Projects Management' },
  { id: 'team', label: 'Team & HR' },
  { id: 'workflow', label: 'Workflow Designer' },
  { id: 'dashboard', label: 'Dashboard Analytics' },
  { id: 'reports', label: 'Financial Reports' },
  { id: 'settings', label: 'System Settings' },
];

const permissions = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
];

type Role = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<Role>('SUPERVISOR');

  return (
    <div className="space-y-6">
      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['ADMIN', 'SUPERVISOR', 'EMPLOYEE'] as Role[]).map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
              selectedRole === role 
                ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
              selectedRole === role ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {role === 'ADMIN' && <Shield className="h-6 w-6" />}
              {role === 'SUPERVISOR' && <UserCog className="h-6 w-6" />}
              {role === 'EMPLOYEE' && <Briefcase className="h-6 w-6" />}
            </div>
            <h3 className="font-bold text-slate-900">{role}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {role === 'ADMIN' ? 'Full system access & user control' : 
               role === 'SUPERVISOR' ? 'Project oversight & team approval' : 
               'Standard project execution tasks'}
            </p>
            {selectedRole === role && (
              <div className="absolute top-4 right-4">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card 
        title={`${selectedRole} Permissions Matrix`} 
        subtitle={`Configure which modules and actions the ${selectedRole.toLowerCase()} can access.`}
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-8 py-4 min-w-[200px]">Module / Feature</th>
                {permissions.map((p) => (
                  <th key={p.id} className="px-4 py-4 text-center">{p.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{module.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{module.id}</span>
                    </div>
                  </td>
                  {permissions.map((p) => {
                    const isAllowed = getInitialPermission(selectedRole, module.id, p.id);
                    const isLocked = selectedRole === 'ADMIN';

                    return (
                      <td key={p.id} className="px-4 py-4">
                        <div className="flex justify-center">
                          <button
                            disabled={isLocked}
                            className={`h-6 w-10 rounded-full transition-all relative flex items-center p-1 ${
                              isAllowed ? 'bg-blue-600' : 'bg-slate-200'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className={`h-4 w-4 rounded-full bg-white transition-transform ${
                              isAllowed ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {selectedRole === 'ADMIN' && (
          <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs border border-blue-100">
            <Info className="h-4 w-4" />
            Admin permissions are system-locked and cannot be modified.
          </div>
        )}
      </Card>
    </div>
  );
}

// Mock initial permissions logic
function getInitialPermission(role: Role, moduleId: string, actionId: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'SUPERVISOR') {
    if (moduleId === 'settings' && actionId !== 'view') return false;
    if (moduleId === 'reports' && actionId === 'delete') return false;
    return true;
  }
  if (role === 'EMPLOYEE') {
    if (['settings', 'team', 'workflow'].includes(moduleId)) return false;
    if (['create', 'edit', 'view'].includes(actionId) && moduleId === 'projects') return true;
    if (actionId === 'view' && moduleId === 'dashboard') return true;
    return false;
  }
  return false;
}
