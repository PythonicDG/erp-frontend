import { useState, useEffect, useCallback } from 'react';
import { projectService, Project, ProjectFilters, PaginatedResponse } from '@/services/project-service';
import toast from 'react-hot-toast';

export const useProjects = (initialFilters: ProjectFilters = {}) => {
  const [data, setData] = useState<PaginatedResponse<Project> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({
    page: 1,
    search: '',
    ...initialFilters,
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll(filters);
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
  };

  const refresh = () => fetchProjects();

  return {
    projects: data?.results || [],
    totalCount: data?.count || 0,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
  };
};
