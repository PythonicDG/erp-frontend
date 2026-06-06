'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Shield, 
  User, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Building,
  Key
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { teamService, TeamMember } from '@/services/team-service';
import toast from 'react-hot-toast';

export function TeamManagementView() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const fetchMembers = async () => {
    try {
      const data = await teamService.getMembers();
      // Handle potential paginated response
      const list = Array.isArray(data) ? data : data.results || [];
      setMembers(list);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await teamService.deleteMember(id);
      toast.success('User deleted successfully');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleStatus = async (member: TeamMember) => {
    try {
      await teamService.updateMember(member.id, { is_active: !member.is_active });
      toast.success(`User ${member.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchMembers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredMembers = members.filter(m => {
    const searchStr = searchTerm.toLowerCase();
    const fullName = (m.full_name || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    const empId = (m.employee_id || '').toLowerCase();
    const username = (m.username || '').toLowerCase();

    const matchesSearch = 
      fullName.includes(searchStr) ||
      email.includes(searchStr) ||
      empId.includes(searchStr) ||
      username.includes(searchStr);
    
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500">Manage organization members, roles, and access levels.</p>
        </div>
        <Button onClick={() => { setEditingMember(null); setIsModalOpen(true); }} className="shadow-lg shadow-blue-500/20">
          <UserPlus className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      </div>

      <DataTable 
        data={filteredMembers}
        columns={[
          { 
            header: "Employee ID", 
            cell: (m) => <span className="font-mono text-xs font-bold text-slate-400">{m.employee_id}</span> 
          },
          { 
            header: "Full Name", 
            cell: (m) => (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                  {m.first_name[0]}{m.last_name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">{m.full_name}</span>
                  <span className="text-xs text-slate-400">{m.email} {m.username ? `| @${m.username}` : ''}</span>
                </div>
              </div>
            )
          },
          { 
            header: "Role", 
            cell: (m) => (
              <Badge variant="outline" className={`flex w-fit items-center gap-1 ${
                m.role === 'SUPERADMIN' ? 'text-rose-600 border-rose-100 bg-rose-50' : 
                m.role === 'ADMIN' ? 'text-purple-600 border-purple-100 bg-purple-50' : 
                m.role === 'SUPERVISOR' ? 'text-blue-600 border-blue-100 bg-blue-50' : 
                'text-slate-600 border-slate-100 bg-slate-50'
              }`}>
                {m.role === 'SUPERADMIN' || m.role === 'ADMIN' ? <Shield size={12} /> : m.role === 'SUPERVISOR' ? <UserCheck size={12} /> : <User size={12} />}
                {m.role} {m.role === 'ADMIN' && m.admin_code ? `(${m.admin_code})` : ''}
              </Badge>
            )
          },
          { header: "Department", accessorKey: "department" },
          { 
            header: "Status", 
            cell: (m) => (
              <button onClick={() => toggleStatus(m)} className="cursor-pointer">
                <Badge variant={m.is_active ? 'success' : 'outline'} className="px-2.5">
                  {m.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </button>
            )
          }
        ]}
        loading={loading}
        onSearch={(q) => setSearchTerm(q)}
        searchPlaceholder="Search by name, email or ID..."
        filters={
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
              <select 
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="SUPERVISOR">Supervisors</option>
                <option value="EMPLOYEE">Employees</option>
              </select>
            </div>
          </div>
        }
        actions={(m) => {
          const isSuperAdmin = m.role === 'SUPERADMIN';
          return (
            <div className="flex justify-end gap-2">
              <Button 
                aria-label="Edit team member" 
                variant="ghost" 
                size="icon" 
                onClick={() => { setEditingMember(m); setIsModalOpen(true); }} 
                className={`text-slate-400 ${isSuperAdmin ? 'opacity-40 cursor-not-allowed' : 'hover:text-blue-600'}`}
                disabled={isSuperAdmin}
                title={isSuperAdmin ? "SuperAdmin can only be edited from Django Admin" : "Edit team member"}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                aria-label="Delete team member" 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDelete(m.id)} 
                className={`text-slate-400 ${isSuperAdmin ? 'opacity-40 cursor-not-allowed' : 'hover:text-red-500'}`}
                disabled={isSuperAdmin}
                title={isSuperAdmin ? "SuperAdmin can only be deleted from Django Admin" : "Delete team member"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        }}
        emptyState={
          <div className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No team members found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        }
      />

      {isModalOpen && (
        <UserModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={fetchMembers}
          member={editingMember}
        />
      )}
    </div>
  );
}

const OPTIONAL_TABS = [
  { key: 'projects', label: 'Project Master' },
  { key: 'ecn', label: 'ECN' },
  { key: 'ascn', label: 'ASCN' },
  { key: 'feedback', label: 'Customer Feedback Form' },
  { key: 'reports', label: 'Reports' },
  { key: 'engineering-tools', label: 'Engineering Tools' },
  { key: 'team', label: 'User Master' },
  { key: 'customers', label: 'Customer Masters' },
  { key: 'standards', label: 'Standards Master' },
  { key: 'inspection-authorities', label: 'Inspection Authority Master' },
  { key: 'workflow', label: 'Workflow Design' },
  { key: 'settings', label: 'Settings' },
];

function UserModal({ onClose, onSubmit, member }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    const role = member?.role || 'EMPLOYEE';
    let allowed_tabs = member ? (member.allowed_tabs || []) : OPTIONAL_TABS.map(t => t.key).filter(k => k !== 'projects');
    if (role === 'EMPLOYEE') {
      allowed_tabs = allowed_tabs.filter((k: string) => k !== 'settings' && k !== 'team');
    }
    return {
      first_name: member?.first_name || '',
      last_name: member?.last_name || '',
      email: member?.email || '',
      username: member?.username || '',
      phone: member?.phone || '',
      role: role,
      admin_code: member?.admin_code || '',
      department: member?.department || '',
      remarks: member?.remarks || '',
      password: '',
      allowed_tabs: allowed_tabs
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (member) {
        await teamService.updateMember(member.id, formData);
        toast.success('Member updated successfully');
      } else {
        await teamService.createMember(formData);
        toast.success('Member added successfully');
      }
      onSubmit();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{member ? 'Edit Team Member' : 'Add New Member'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{member ? `Modifying profile for ${member.employee_id}` : 'Create a new organizational user account'}</p>
          </div>
          <Button aria-label="Close modal" variant="ghost" size="icon" onClick={onClose}><Trash2 className="h-5 w-5" /></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-6">
            <Input 
              label="First Name" 
              value={formData.first_name} 
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
            <Input 
              label="Last Name" 
              value={formData.last_name} 
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
            <Input 
              label="Email Address" 
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={!!member}
            />
            <Input 
              label="Username (Optional)" 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="Leave blank to auto-generate"
            />
            <Input 
              label="Phone Number" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
               <select 
                 className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                 value={formData.role}
                 onChange={(e) => {
                   const newRole = e.target.value;
                   let updatedTabs = formData.allowed_tabs;
                   if (newRole === 'EMPLOYEE') {
                     updatedTabs = updatedTabs.filter((k: string) => k !== 'settings' && k !== 'team');
                   }
                   setFormData({...formData, role: newRole as any, allowed_tabs: updatedTabs});
                 }}
               >
                 <option value="EMPLOYEE">Employee</option>
                 <option value="SUPERVISOR">Supervisor</option>
                 <option value="ADMIN">Administrator</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                 <Building size={10} /> Department
               </label>
               <input 
                 className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                 value={formData.department}
                 onChange={(e) => setFormData({...formData, department: e.target.value})}
                 placeholder="e.g. Quality Assurance"
               />
            </div>

            {formData.role === 'ADMIN' && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Admin Code</label>
                <input 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                  value={formData.admin_code}
                  onChange={(e) => setFormData({...formData, admin_code: e.target.value})}
                  placeholder="e.g. 1003 (Auto-generated if left blank)"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
               <Key size={10} /> {member ? 'Reset Password (Optional)' : 'Security Password'}
             </label>
             <input 
               type="password"
               className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
               value={formData.password}
               onChange={(e) => setFormData({...formData, password: e.target.value})}
               placeholder={member ? "Leave blank to keep current" : "ERP12345 (Default)"}
             />
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
               Sidebar Tab Permissions
             </label>
             <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
               <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-not-allowed select-none">
                 <input type="checkbox" checked disabled className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                 <span>Dashboard (Default)</span>
               </label>
               {OPTIONAL_TABS.map((tab) => {
                 const isSuperAdmin = formData.role === 'SUPERADMIN';
                 const isEmployeeDisabledTab = formData.role === 'EMPLOYEE' && (tab.key === 'settings' || tab.key === 'team');
                 const isDisabled = isSuperAdmin || isEmployeeDisabledTab;
                 const isChecked = isSuperAdmin || (formData.allowed_tabs.includes(tab.key) && !isEmployeeDisabledTab);
                 return (
                   <label key={tab.key} className={`flex items-center gap-2 text-xs font-semibold select-none transition-colors ${
                     isDisabled 
                       ? 'text-slate-400 cursor-not-allowed font-medium' 
                       : 'text-slate-700 cursor-pointer hover:text-slate-900'
                   }`}>
                     <input
                       type="checkbox"
                       checked={isChecked}
                       disabled={isDisabled}
                       className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                       onChange={(e) => {
                         if (isDisabled) return;
                         const updated = e.target.checked
                           ? [...formData.allowed_tabs, tab.key]
                           : formData.allowed_tabs.filter((k: string) => k !== tab.key);
                         setFormData({ ...formData, allowed_tabs: updated });
                       }}
                     />
                     <span>{tab.label}</span>
                   </label>
                 );
               })}
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Administrative Remarks</label>
             <textarea 
               className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
               value={formData.remarks}
               onChange={(e) => setFormData({...formData, remarks: e.target.value})}
               placeholder="Notes about this user..."
             />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} className="px-8 shadow-lg shadow-blue-500/20">
               {member ? 'Update Profile' : 'Create Account'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
