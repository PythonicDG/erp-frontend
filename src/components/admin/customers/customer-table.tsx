'use client';

import React from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  UserCheck,
  Upload,
  Download,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/services/customer-service';
import { DataTable, Column } from '@/components/ui/data-table';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onBulkUpload?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onEdit,
  onDelete,
  onAdd,
  onBulkUpload,
  onExport,
  isExporting = false,
  searchQuery,
  onSearchChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) => {

  const columns: Column<Customer>[] = [
    {
      header: "Customer Name",
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900">{customer.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">ID: {String(customer.id).substring(0, 8)}</p>
          </div>
        </div>
      )
    },
    {
      header: "Contact Details",
      cell: (customer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs">{customer.mobile_number}</span>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      cell: (customer) => (
        <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">
          {customer.category || 'General'}
        </Badge>
      )
    },
    {
      header: "Last Updated",
      cell: (customer) => (
        <span className="text-slate-500 font-medium text-xs">
          {new Date(customer.updated_at).toLocaleDateString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Search & Actions Panel */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Search Bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all w-full font-medium"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-row flex-nowrap items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0">
          {onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              disabled={isExporting}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-nowrap shrink-0 font-medium"
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
              className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm whitespace-nowrap shrink-0 font-medium"
            >
              <Upload className="h-4 w-4 mr-2 text-slate-500" /> Bulk Upload
            </Button>
          )}
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 whitespace-nowrap shrink-0 font-bold">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </Card>

      {/* Main DataTable with Numbered Pagination */}
      <DataTable
        data={customers}
        columns={columns}
        loading={false}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={onPageChange}
        actions={(customer) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(customer);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(customer.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        emptyState={
          <div className="flex flex-col items-center gap-3">
            <UserCheck className="h-12 w-12 text-slate-200" />
            <p className="font-medium text-slate-500">No customers found. Add your first customer to get started.</p>
          </div>
        }
      />
    </div>
  );
};
