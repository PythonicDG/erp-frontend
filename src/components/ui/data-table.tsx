'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  MoreHorizontal,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export interface Column<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  filters?: React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading,
  totalCount = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  onRowClick,
  filters,
  actions,
  emptyState
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Table Header / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {onSearch && (
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Input
              placeholder={searchPlaceholder}
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
        )}

        <div className="flex items-center gap-2">
          {filters && (
            <div className="relative">
              <Button 
                variant={showFilters ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-5 space-y-4">
                  {filters}
                  <div className="flex justify-end pt-2">
                    <Button size="sm" onClick={() => setShowFilters(false)}>Close</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && <ArrowUpDown className="h-3 w-3 ml-1" />}
                    </div>
                  </th>
                ))}
                {actions && <th className="px-6 py-4"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-4">
                      <div className="h-8 bg-slate-100 rounded-md"></div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-500">
                    {emptyState || "No records found."}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''} group`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col, idx) => (
                      <td key={idx} className={`px-6 py-4 text-sm ${col.className || ''}`}>
                        {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : null)}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 text-right">
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {onPageChange && totalCount > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 text-center sm:text-left font-medium">
              Showing <span className="font-semibold text-slate-900">{totalCount === 0 ? 0 : Math.max(1, (currentPage - 1) * pageSize + 1)}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalCount}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={() => onPageChange(currentPage - 1)}
                className="h-9 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  // Only display near page numbers to prevent layout breaks on large pagination lists
                  if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'outline'}
                        size="sm"
                        className={`w-9 h-9 px-0 rounded-xl transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/10'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'
                        }`}
                        onClick={() => onPageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  // Render ellipses
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return (
                      <span key={pageNum} className="text-slate-400 px-1 font-bold text-xs select-none">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || loading}
                onClick={() => onPageChange(currentPage + 1)}
                className="h-9 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-2xs"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
