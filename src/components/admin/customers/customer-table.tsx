'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/services/customer-service';
import { DataTable, Column } from '@/components/ui/data-table';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterChange: (category: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onFilterChange,
  onEdit,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState('');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    onFilterChange(value);
  };

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
    <DataTable
      data={customers}
      columns={columns}
      loading={loading}
      totalCount={totalCount}
      currentPage={currentPage}
      onPageChange={onPageChange}
      onSearch={onSearch}
      searchPlaceholder="Search customers by name, email, or mobile..."
      filters={
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="VIP">VIP</option>
              <option value="OEM">OEM</option>
              <option value="Partner">Partner</option>
            </select>
          </div>
        </div>
      }
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
  );
};
