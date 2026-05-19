import { useState, useEffect, useCallback } from 'react';
import { ecnService, ECN, ECNFilters } from '@/services/ecn-service';
import { PaginatedResponse } from '@/services/project-service';
import toast from 'react-hot-toast';

export const useECNs = (initialFilters: ECNFilters = {}) => {
  const [data, setData] = useState<PaginatedResponse<ECN> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ECNFilters>({
    page: 1,
    search: '',
    ...initialFilters,
  });

  const fetchECNs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ecnService.getAll(filters);
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to fetch ECNs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchECNs();
  }, [fetchECNs]);

  const updateFilters = (newFilters: Partial<ECNFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page || 1 }));
  };

  const refresh = () => fetchECNs();

  return {
    ecns: data?.results || [],
    totalCount: data?.count || 0,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
  };
};
