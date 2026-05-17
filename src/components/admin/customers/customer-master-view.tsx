'use client';

import React, { useState, useEffect } from 'react';
import { CustomerTable } from '@/components/admin/customers/customer-table';
import { CustomerForm } from '@/components/admin/customers/customer-form';
import { customerService, Customer } from '@/services/customer-service';
import toast from 'react-hot-toast';

import { CustomerBulkUploadModal } from '@/components/admin/customers/customer-bulk-upload-modal';

export function CustomerMasterView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll({ search: searchQuery });
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Exporting customer data to Excel...', { icon: '📊' });
    try {
      const blob = await customerService.exportCustomers({ search: searchQuery });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Customer_Master_Export_${dateStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Customers exported successfully!', { id: toastId, icon: '✅' });
    } catch (error) {
      toast.error('Failed to export customers. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAdd = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerService.delete(id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleSubmit = async (data: any) => {
    setActionLoading(true);
    try {
      if (selectedCustomer) {
        await customerService.update(selectedCustomer.id, data);
        toast.success('Customer updated');
      } else {
        await customerService.create(data);
        toast.success('Customer created');
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Masters</h1>
          <p className="text-slate-500 font-medium">Centralized directory of all company clients and partners.</p>
        </div>
      </div>

      <CustomerTable 
        customers={customers}
        onAdd={handleAdd}
        onBulkUpload={() => setIsBulkUploadOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {isFormOpen && (
        <CustomerForm 
          customer={selectedCustomer}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
          isLoading={actionLoading}
        />
      )}

      <CustomerBulkUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}
