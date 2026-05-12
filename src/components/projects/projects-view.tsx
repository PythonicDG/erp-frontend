'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { ProjectTable } from '@/components/projects/project-table';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/use-projects';
import { Project } from '@/services/project-service';
import { useRouter } from 'next/navigation';

interface ProjectsViewProps {
  role: 'admin' | 'supervisor' | 'employee';
}

export function ProjectsView({ role }: ProjectsViewProps) {
  const router = useRouter();
  const { 
    projects, 
    loading, 
    totalCount, 
    filters, 
    updateFilters 
  } = useProjects();

  const handleRowClick = (project: Project) => {
    router.push(`/${role}/projects/${project.id}`);
  };

  const handleSearch = (search: string) => {
    updateFilters({ search });
  };

  const handleSort = (ordering: string) => {
    const currentOrdering = filters.ordering;
    let nextOrdering = ordering;
    
    if (currentOrdering === ordering) {
      nextOrdering = `-${ordering}`;
    }
    
    updateFilters({ ordering: nextOrdering });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  return (
    <div className="p-6 max-w-(--breakpoint-2xl) mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">
            Manage and track all customer projects, timelines, and statuses.
          </p>
        </div>
        {(role === 'admin' || role === 'supervisor') && (
          <Button className="shadow-blue-500/20 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: totalCount, color: 'blue' },
          { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: 'amber' },
          { label: 'Closed This Month', value: projects.filter(p => p.status === 'Closed').length, color: 'emerald' },
          { label: 'Pending Approval', value: projects.filter(p => p.status === 'Draft').length, color: 'slate' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <ProjectTable
        projects={projects}
        loading={loading}
        totalCount={totalCount}
        currentPage={filters.page || 1}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilterChange={(f) => updateFilters(f)}
        onSort={handleSort}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
