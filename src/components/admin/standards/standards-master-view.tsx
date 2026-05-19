'use client';

import React, { useState, useEffect } from 'react';
import { StandardTable } from '@/components/admin/standards/standards-table';
import { StandardForm } from '@/components/admin/standards/standards-form';
import { standardsService, Standard } from '@/services/standards-service';
import toast from 'react-hot-toast';
import { StandardBulkUploadModal } from '@/components/admin/standards/standards-bulk-upload-modal';
import { Plus, Upload, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StandardsMasterView() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchStandards = async () => {
    try {
      const data = await standardsService.getAll({
        search: searchQuery || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        release_year: selectedYear === 'all' ? undefined : selectedYear,
        page: currentPage
      });
      if (data && data.results) {
        setStandards(data.results);
        setTotalCount(data.count);
        setTotalPages(Math.ceil(data.count / 10));
      } else {
        setStandards(Array.isArray(data) ? data : []);
        setTotalCount(Array.isArray(data) ? data.length : 0);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error('Failed to load standards database');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Exporting standards database to Excel...', { icon: '📊' });
    try {
      const blob = await standardsService.exportStandards({
        search: searchQuery || undefined,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        release_year: selectedYear === 'all' ? undefined : selectedYear
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Standard_Master_Export_${dateStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Standards exported successfully!', { id: toastId, icon: '✅' });
    } catch (error) {
      toast.error('Failed to export standards. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger search / filter resets on page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedCategory, selectedYear]);

  // General Fetch Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStandards();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedCategory, selectedYear, currentPage]);

  const handleAdd = () => {
    setSelectedStandard(null);
    setIsFormOpen(true);
  };

  const handleEdit = (standard: Standard) => {
    setSelectedStandard(standard);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this standard?')) return;
    try {
      await standardsService.delete(id);
      toast.success('Standard deleted successfully');
      fetchStandards();
    } catch (error) {
      toast.error('Failed to delete standard');
    }
  };

  const handleSubmit = async (data: any) => {
    setActionLoading(true);
    try {
      if (selectedStandard) {
        await standardsService.update(selectedStandard.id, data);
        toast.success('Standard updated successfully');
      } else {
        await standardsService.create(data);
        toast.success('Standard created successfully');
      }
      setIsFormOpen(false);
      fetchStandards();
    } catch (error: any) {
      const errMsg = error.response?.data?.standard_number?.[0] || 'Operation failed';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedYear('all');
    setSearchQuery('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Standards Master</h1>
          <p className="text-slate-500 font-medium mt-1">Configure regulatory and compliance engineering standards.</p>
        </div>
        <div className="flex flex-row flex-nowrap items-center gap-3 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <Button 
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs h-10 px-4 rounded-xl font-semibold transition-all shrink-0 whitespace-nowrap"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
            ) : (
              <Download className="h-4 w-4 mr-2 text-blue-600" />
            )}
            Export to Excel
          </Button>
          <Button 
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs h-10 px-4 rounded-xl font-semibold transition-all shrink-0 whitespace-nowrap"
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2 text-slate-500" />
            Bulk Upload
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-xl shadow-lg shadow-blue-500/20 shrink-0 transition-all whitespace-nowrap"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Standard
          </Button>
        </div>
      </div>

      <StandardTable 
        standards={standards}
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
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        
        onResetFilters={handleResetFilters}
      />

      {isFormOpen && (
        <StandardForm 
          standard={selectedStandard}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
          isLoading={actionLoading}
        />
      )}

      <StandardBulkUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={fetchStandards}
      />
    </div>
  );
}
