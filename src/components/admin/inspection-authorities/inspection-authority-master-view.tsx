'use client';

import React, { useState, useEffect } from 'react';
import { InspectionAuthorityTable } from '@/components/admin/inspection-authorities/inspection-authority-table';
import { InspectionAuthorityForm } from '@/components/admin/inspection-authorities/inspection-authority-form';
import { inspectionAuthorityService, InspectionAuthority } from '@/services/inspection-authority-service';
import { InspectionAuthorityBulkUploadModal } from '@/components/admin/inspection-authorities/inspection-authority-bulk-upload-modal';
import toast from 'react-hot-toast';

export function InspectionAuthorityMasterView() {
  const [authorities, setAuthorities] = useState<InspectionAuthority[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedApprovalType, setSelectedApprovalType] = useState('all');
  const [approvalTypesList, setApprovalTypesList] = useState<string[]>([]);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<InspectionAuthority | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAuthorities = async () => {
    try {
      const data = await inspectionAuthorityService.getAll({
        search: searchQuery || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        approval_type: selectedApprovalType === 'all' ? undefined : selectedApprovalType,
        page: currentPage
      });
      if (data && data.results) {
        setAuthorities(data.results);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / 10));
      } else {
        setAuthorities(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error('Failed to load inspection authorities');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Exporting inspection authorities database...', { icon: '📊' });
    try {
      const blob = await inspectionAuthorityService.exportAuthorities({
        search: searchQuery || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        approval_type: selectedApprovalType === 'all' ? undefined : selectedApprovalType
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Inspection_Authority_Master_Export_${dateStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Inspection authorities exported successfully!', { id: toastId, icon: '✅' });
    } catch (error) {
      toast.error('Failed to export. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Populate dynamic list of unique approval types to filter on
  useEffect(() => {
    if (authorities.length > 0) {
      const uniqueTypes = Array.from(new Set(
        authorities
          .map(a => a.approval_type)
          .filter((t): t is string => !!t && t.trim() !== '')
      ));
      setApprovalTypesList(uniqueTypes);
    }
  }, [authorities]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedCategory, selectedApprovalType]);

  // Debounced fetch trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuthorities();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedCategory, selectedApprovalType, currentPage]);

  const handleAdd = () => {
    setSelectedAuthority(null);
    setIsFormOpen(true);
  };

  const handleEdit = (auth: InspectionAuthority) => {
    setSelectedAuthority(auth);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this inspection authority?')) return;
    try {
      await inspectionAuthorityService.delete(id);
      toast.success('Inspection authority deleted successfully');
      fetchAuthorities();
    } catch (error) {
      toast.error('Failed to delete inspection authority');
    }
  };

  const handleSubmit = async (data: any) => {
    setActionLoading(true);
    try {
      if (selectedAuthority) {
        await inspectionAuthorityService.update(selectedAuthority.id, data);
        toast.success('Inspection authority updated successfully');
      } else {
        await inspectionAuthorityService.create(data);
        toast.success('Inspection authority created successfully');
      }
      setIsFormOpen(false);
      fetchAuthorities();
    } catch (error: any) {
      const errMsg = error.response?.data?.authority_id?.[0] || 'Operation failed';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedApprovalType('all');
    setSearchQuery('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inspection Authority Master</h1>
          <p className="text-slate-500 font-medium mt-1">Configure customer QA, third-party inspection, and classification agency master registers.</p>
        </div>
      </div>

      <InspectionAuthorityTable 
        authorities={authorities}
        onAdd={handleAdd}
        onBulkUpload={() => setIsBulkUploadOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedApprovalType={selectedApprovalType}
        onApprovalTypeChange={setSelectedApprovalType}
        approvalTypesList={approvalTypesList}
        
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        
        onResetFilters={handleResetFilters}
      />

      {isFormOpen && (
        <InspectionAuthorityForm 
          authority={selectedAuthority}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
          isLoading={actionLoading}
        />
      )}

      <InspectionAuthorityBulkUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={fetchAuthorities}
      />
    </div>
  );
}
