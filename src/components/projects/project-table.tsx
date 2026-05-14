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
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');

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
      {/* Table Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Input
            placeholder="Search projects by PID, name or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="pr-20"
          />
          <Button 
            type="submit" 
            size="sm" 
            className="absolute right-1 top-1 h-8"
          >
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onFilterChange({})}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSort('pid')}>
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> PID <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSort('name')}>
                  <div className="flex items-center gap-1">
                    Project Name <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSort('customer_name')}>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" /> Customer <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSort('target_completion_date')}>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Target Date <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                   <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Stage
                  </div>
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-md"></div></td>
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onRowClick(project)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{project.pid}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-tight text-slate-500">
                        {project.project_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${project.status === 'Closed' ? 'bg-emerald-500 w-full' : 'bg-blue-500 w-1/3'}`}
                            ></div>
                         </div>
                         <span className="text-[10px] text-slate-400 font-medium">
                            {project.status === 'Closed' ? 'Completed' : 'Initiated'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateFullProjectReport(project.id);
                          }}
                          title="Print Project Report"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{projects.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to{' '}
            <span className="font-medium text-slate-900">
              {Math.min(currentPage * 10, totalCount)}
            </span>{' '}
            of <span className="font-medium text-slate-900">{totalCount}</span> results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1; // Simplified for now
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'primary' : 'outline'}
                  size="sm"
                  className="w-9 px-0"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || loading}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
