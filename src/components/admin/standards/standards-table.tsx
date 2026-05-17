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
  RefreshCw
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
      {/* Search & Actions Header */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search standards number or name..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all w-full font-medium"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-row flex-nowrap items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0">
            {onExport && (
              <Button
                variant="outline"
                onClick={onExport}
                disabled={isExporting}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-nowrap shrink-0"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                ) : (
                  <Download className="h-4 w-4 mr-2 text-blue-600" />
                )}
                Export to Excel
              </Button>
            )}
            {onBulkUpload && (
              <Button
                variant="outline"
                onClick={onBulkUpload}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-nowrap shrink-0"
              >
                <Upload className="h-4 w-4 mr-2 text-slate-500" /> Bulk Upload
              </Button>
            )}
            <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 whitespace-nowrap shrink-0 font-bold">
              <Plus className="h-4 w-4 mr-2" /> Add Standard
            </Button>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="border-t pt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">
            <Filter className="h-3.5 w-3.5 text-blue-600" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all cursor-pointer shadow-2xs"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all cursor-pointer shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="h-9 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all cursor-pointer shadow-2xs"
          >
            <option value="all">All Years</option>
            {yearsList.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Reset button */}
          {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedYear !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-9 text-xs text-blue-600 hover:bg-blue-50 font-bold whitespace-nowrap"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Reset Filters
            </Button>
          )}
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
        {totalPages > 1 && (
          <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalCount} total standards)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2 border-slate-200 bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-2 border-slate-200 bg-white"
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
