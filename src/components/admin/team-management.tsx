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

    const matchesSearch = 
      fullName.includes(searchStr) ||
      email.includes(searchStr) ||
      empId.includes(searchStr);
    
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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
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

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium">Loading organization data...</div>
        ) : filteredMembers.length > 0 ? (
          <div className="table-container">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">{member.employee_id}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                           {member.first_name[0]}{member.last_name[0]}
                         </div>
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-900">{member.full_name}</span>
                           <span className="text-xs text-slate-400">{member.email}</span>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="outline" className={`flex w-fit items-center gap-1 ${
                         member.role === 'ADMIN' ? 'text-purple-600 border-purple-100 bg-purple-50' : 
                         member.role === 'SUPERVISOR' ? 'text-blue-600 border-blue-100 bg-blue-50' : 
                         'text-slate-600 border-slate-100 bg-slate-50'
                       }`}>
                         {member.role === 'ADMIN' ? <Shield size={12} /> : member.role === 'SUPERVISOR' ? <UserCheck size={12} /> : <User size={12} />}
                         {member.role}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{member.department || '—'}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500"><Mail size={12} /> {member.email}</span>
                          {member.phone && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} /> {member.phone}</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <button onClick={() => toggleStatus(member)} className="cursor-pointer">
                         <Badge variant={member.is_active ? 'success' : 'secondary'} className="px-2.5">
                            {member.is_active ? 'Active' : 'Inactive'}
                         </Badge>
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => { setEditingMember(member); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-600">
                           <Edit2 className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="text-slate-400 hover:text-red-500">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             <UserX className="h-12 w-12 mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-bold text-slate-900">No team members found</h3>
             <p className="text-slate-500 max-w-xs mx-auto">Try adjusting your search or filters to find what you are looking for.</p>
          </div>
        )}
      </div>

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

function UserModal({ onClose, onSubmit, member }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    role: member?.role || 'EMPLOYEE',
    department: member?.department || '',
    remarks: member?.remarks || '',
    password: ''
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{member ? 'Edit Team Member' : 'Add New Member'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{member ? `Modifying profile for ${member.employee_id}` : 'Create a new organizational user account'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><Trash2 className="h-5 w-5" /></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
              label="Phone Number" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
               <select 
                 className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                 value={formData.role}
                 onChange={(e) => setFormData({...formData, role: e.target.value as any})}
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
            <Button type="submit" isLoading={loading} className="px-8 shadow-lg shadow-blue-500/20">
               {member ? 'Update Profile' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
