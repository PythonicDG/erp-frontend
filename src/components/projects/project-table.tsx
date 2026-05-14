'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  User,
  Hash,
  Activity,
  Printer,
  FileText,
  Trash2,
  X,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useAuthStore } from '@/store/auth-store';
import { Project, ProjectStatus } from '@/services/project-service';
import { generateFullProjectReport } from '@/lib/report-utils';

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
  onSort: (field: string) => void;
  onRowClick: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  loading,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onFilterChange,
  onSort,
  onRowClick,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: '',
    project_type: '',
    ordering: '-date_received'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete && onDelete) {
      onDelete(projectToDelete);
    }
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };

  const getStatusVariant = (status: ProjectStatus) => {
    switch (status) {
      case 'Open': return 'info';
      case 'In Progress': return 'warning';
      case 'Closed': return 'success';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const defaultFilters = { status: '', project_type: '', ordering: '-date_received' };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
    setShowFilters(false);
  };

  const exportToCSV = () => {
    if (projects.length === 0) return;
    
    const headers = ['PID', 'Project Name', 'Customer', 'Type', 'Status', 'Target Date'];
    const rows = projects.map(p => [
      p.pid,
      p.name,
      p.customer_name,
      p.project_type,
      p.status,
      p.target_completion_date || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalCount / 10); // Assuming 10 per page

  return (
    <div className="space-y-4">
      <DataTable
        data={projects}
        columns={[
          { 
            header: "PID", 
            cell: (p) => <span className="font-medium text-blue-600">{p.pid}</span>,
            sortable: true
          },
          { 
            header: "Project Name", 
            cell: (p) => <span className="font-medium text-slate-900">{p.name}</span>,
            sortable: true
          },
          { 
            header: "Customer", 
            accessorKey: "customer_name",
            sortable: true
          },
          { 
            header: "Type", 
            cell: (p) => (
              <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-tight text-slate-500">
                {p.project_type}
              </span>
            )
          },
          { 
            header: "Status", 
            cell: (p) => (
              <Badge variant={getStatusVariant(p.status)}>
                {p.status}
              </Badge>
            )
          },
          { 
            header: "Target Date", 
            cell: (p) => p.target_completion_date ? new Date(p.target_completion_date).toLocaleDateString() : '-',
            sortable: true
          },
          {
            header: "Progress",
            cell: (p) => (
              <div className="flex items-center gap-2">
                 <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${p.status === 'Closed' ? 'bg-emerald-500 w-full' : 'bg-blue-500 w-1/3'}`}
                    ></div>
                 </div>
                 <span className="text-[10px] text-slate-400 font-medium">
                    {p.status === 'Closed' ? 'Completed' : 'Initiated'}
                 </span>
              </div>
            )
          }
        ]}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onSearch={(q) => onSearch(q)}
        searchPlaceholder="Search projects by PID, name or customer..."
        onRowClick={onRowClick}
        filters={
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
              <select 
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                value={localFilters.status}
                onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Type</label>
              <select 
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                value={localFilters.project_type}
                onChange={(e) => setLocalFilters({...localFilters, project_type: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="New Product Development">New Product Development</option>
                <option value="Process Improvement">Process Improvement</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={resetFilters}>Reset</Button>
              <Button size="sm" className="flex-1" onClick={applyFilters}>Apply</Button>
            </div>
          </div>
        }
        actions={(p) => (
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                generateFullProjectReport(p.id);
              }}
            >
              <Printer className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => handleDeleteClick(e, p)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        emptyState={
          <div className="py-12 text-center text-slate-500">
            No projects found matching your criteria.
          </div>
        }
      />

      <ConfirmationModal 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete project ${projectToDelete?.pid}? This action cannot be undone and all associated workflow data will be permanently removed.`}
        confirmLabel="Delete Project"
        variant="danger"
      />
    </div>
  );
};
