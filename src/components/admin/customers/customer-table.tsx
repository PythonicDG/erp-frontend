'use client';

import React from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MoreHorizontal,
  UserCheck,
  Upload,
  Download,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/services/customer-service';

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
}) => {
  return (
    <Card className="p-0 overflow-hidden shadow-xl shadow-blue-500/5 border-slate-200">
      <div className="p-6 border-b bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all w-full"
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
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 whitespace-nowrap shrink-0">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Contact Details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Last Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{customer.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">ID: {String(customer.id).substring(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3 w-3" />
                    <span className="text-xs">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">{customer.mobile_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">
                    {customer.category || 'General'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {new Date(customer.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                      onClick={() => onEdit(customer)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                      onClick={() => onDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-400 italic bg-slate-50/50">
                  <div className="flex flex-col items-center gap-3">
                    <UserCheck className="h-12 w-12 text-slate-200" />
                    <p>No customers found. Add your first customer to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
