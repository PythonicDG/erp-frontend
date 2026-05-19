'use client';

import React from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Standard } from '@/services/standards-service';

interface StandardTableProps {
  standards: Standard[];
  onEdit: (standard: Standard) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onBulkUpload?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Filters
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  
  onResetFilters: () => void;
}

export const StandardTable: React.FC<StandardTableProps> = ({
  standards,
  onEdit,
  onDelete,
  onAdd,
  onBulkUpload,
  onExport,
  isExporting = false,
  searchQuery,
  onSearchChange,
  
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedYear,
  onYearChange,
  
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  
  onResetFilters
}) => {
  // Build a list of selectable release years dynamically or fixed
  const yearsList = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const categoriesList = ['ISO', 'IEC', 'Marine IEC', 'IP', 'EMC', 'Defence'];

  return (
    <div className="space-y-4">
      {/* Search & Filters Controls Card */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col gap-4 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search standards by number or name..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all w-full font-medium h-10 shadow-2xs text-slate-700"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider mr-1 shrink-0">
              <Filter className="h-3.5 w-3.5 text-blue-500" />
              <span>Filters:</span>
            </div>

            {/* Category Filter */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="h-10 w-full sm:w-auto px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all cursor-pointer shadow-2xs pr-8 appearance-none"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="h-10 w-full sm:w-auto px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all cursor-pointer shadow-2xs pr-8 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Year Filter */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="h-10 w-full sm:w-auto px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all cursor-pointer shadow-2xs pr-8 appearance-none"
              >
                <option value="all">All Years</option>
                {yearsList.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Reset button */}
            {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedYear !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-10 px-3.5 rounded-xl text-xs text-blue-600 hover:bg-blue-50 font-bold whitespace-nowrap transition-all"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" /> Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <Card className="p-0 overflow-hidden shadow-xl shadow-blue-500/5 border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Standard Number</th>
                <th className="px-6 py-4">Standard Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Revision</th>
                <th className="px-6 py-4 text-center">Release Year</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {standards.map((std) => (
                <tr key={std.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-xs">
                      {std.standard_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{std.standard_name}</p>
                    {std.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-md">{std.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100 font-bold uppercase">
                      {std.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {std.revision || '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-semibold">
                    {std.release_year || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge 
                      variant={std.status === 'Active' ? 'success' : 'danger'}
                      className="font-bold shadow-xs"
                    >
                      {std.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(std)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                        onClick={() => onDelete(std.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {standards.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400 italic bg-slate-50/50">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldAlert className="h-12 w-12 text-slate-200 animate-bounce" />
                      <p className="font-medium">No standards found. Expand filters or upload a template file to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 10 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500 text-center sm:text-left font-medium">
              Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * 10, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalCount}</span> standards
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="h-9 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl"
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
                        className={`w-9 h-9 px-0 rounded-xl transition-all ${currentPage === pageNum ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
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
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="h-9 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
