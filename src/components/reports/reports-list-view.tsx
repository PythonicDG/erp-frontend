'use client';

import React from 'react';
import { ProjectTable } from '@/components/projects/project-table';
import { useProjects } from '@/hooks/use-projects';
import { Project } from '@/services/project-service';
import { useRouter } from 'next/navigation';

interface ReportsListViewProps {
  role: 'admin' | 'supervisor' | 'employee';
}

export function ReportsListView({ role }: ReportsListViewProps) {
  const router = useRouter();
  
  // Fetch only projects that are currently in processing (at least one form is filled)
  const { 
    projects, 
    loading, 
    totalCount, 
    filters, 
    updateFilters
  } = useProjects({ in_processing: 'true' } as any);

  const handleRowClick = (project: Project) => {
    router.push(`/${role}/reports/${project.id}`);
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports & Submissions</h1>
          <p className="text-slate-500 mt-1">
            Access, view, and print all submitted forms and attached specifications for active, in-processing projects.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Reports', value: totalCount, bgColor: 'bg-blue-50 border-blue-100', textVal: 'text-blue-700' },
          { label: 'In Progress Projects', value: projects.filter(p => p.status === 'In Progress').length, bgColor: 'bg-amber-50 border-amber-100', textVal: 'text-amber-700' },
          { label: 'Closed/Archived Reports', value: projects.filter(p => p.status === 'Closed').length, bgColor: 'bg-emerald-50 border-emerald-100', textVal: 'text-emerald-700' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-xl border shadow-xs transition-all ${stat.bgColor}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.textVal}`}>{stat.value}</p>
          </div>
        ))}
      </div>

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
