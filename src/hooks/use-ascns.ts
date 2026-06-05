import { useState, useEffect, useCallback } from 'react';
import { ascnService, ASCN, ASCNFilters } from '@/services/ascn-service';
import { PaginatedResponse } from '@/services/project-service';
import toast from 'react-hot-toast';

export const useASCNs = (initialFilters: ASCNFilters = {}) => {
  const [data, setData] = useState<PaginatedResponse<ASCN> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ASCNFilters>({
    page: 1,
    search: '',
    ...initialFilters,
  });

  const fetchASCNs = useCallback(async () => {
    try {
      const response = await ascnService.getAll(filters);
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to fetch ASCNs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchASCNs();
  }, [fetchASCNs]);

  const updateFilters = (newFilters: Partial<ASCNFilters>) => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
  };

  const refresh = () => {
    setLoading(true);
    fetchASCNs();
  };

  return {
    ascns: data?.results || [],
    totalCount: data?.count || 0,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
  };
};
