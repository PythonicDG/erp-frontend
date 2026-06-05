'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Printer,
  Eye,
  Search,
  Filter,
  Calendar,
  Layers,
  Building2,
  FileEdit,
  ArrowUpDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useASCNs } from '@/hooks/use-ascns';
import { ASCN, ascnService, ASCNStatus } from '@/services/ascn-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface ASCNListProps {
  role: 'admin' | 'supervisor' | 'employee';
}

export function ASCNList({ role }: ASCNListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = role === 'admin' || user?.role === 'ADMIN';

  const {
    ascns,
    loading,
    totalCount,
    filters,
    updateFilters,
    refresh
  } = useASCNs();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ascnToDelete, setAscnToDelete] = useState<ASCN | null>(null);

  // Local filter states for the custom dropdown
  const [localFilters, setLocalFilters] = useState({
    status: '',
    project_name: '',
    customer_name: '',
    date: ''
  });

  const getStatusVariant = (status: ASCNStatus) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Submitted': return 'info';
      case 'Reviewed': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      default: return 'default';
    }
  };

  const handleRowClick = (ascn: ASCN) => {
    router.push(`/${role}/ascn/${ascn.id}`);
  };

  const handleCreateNew = () => {
    router.push(`/${role}/ascn/new`);
  };

  const handleDeleteClick = (e: React.MouseEvent, ascn: ASCN) => {
    e.stopPropagation();
    setAscnToDelete(ascn);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!ascnToDelete) return;
    try {
      await ascnService.delete(ascnToDelete.id);
      toast.success(`ASCN ${ascnToDelete.ascn_number} deleted successfully`);
      refresh();
    } catch (error) {
      toast.error('Failed to delete ASCN');
    } finally {
      setDeleteConfirmOpen(false);
      setAscnToDelete(null);
    }
  };

  const handleSearch = (search: string) => {
    updateFilters({ search });
  };

  const handleSort = (ordering: string) => {
    const currentOrdering = filters.ordering;
    let nextOrdering = ordering;
    if (currentOrdering === ordering) {
      nextOrdering = `-${ordering}`;
    }
    updateFilters({ ordering: nextOrdering });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const applyFilters = () => {
    updateFilters(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters = { status: '', project_name: '', customer_name: '', date: '' };
    setLocalFilters(defaultFilters);
    updateFilters(defaultFilters);
  };

  return (
    <div className="p-6 max-w-(--breakpoint-2xl) mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Application Software Change Note (ASCN)</h1>
          <p className="text-slate-500 mt-1">
            Initiate, track, and approve Application Software Change Notes across all active projects.
          </p>
        </div>
        <Button
          className="shadow-blue-500/20 shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-medium self-start md:self-auto"
          onClick={handleCreateNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Raise New ASCN
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total ASCNs', value: totalCount, bgColor: 'bg-blue-50 border-blue-100', textVal: 'text-blue-700' },
          { label: 'Approved ASCNs', value: ascns.filter(e => e.status === 'Approved').length, bgColor: 'bg-emerald-50 border-emerald-100', textVal: 'text-emerald-700' },
          { label: 'Under Review', value: ascns.filter(e => e.status === 'Reviewed' || e.status === 'Submitted').length, bgColor: 'bg-amber-50 border-amber-100', textVal: 'text-amber-700' },
          { label: 'Drafts', value: ascns.filter(e => e.status === 'Draft').length, bgColor: 'bg-slate-50 border-slate-100', textVal: 'text-slate-700' },
          { label: 'Rejected', value: ascns.filter(e => e.status === 'Rejected').length, bgColor: 'bg-red-50 border-red-100', textVal: 'text-red-700' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-xl border shadow-xs transition-all ${stat.bgColor}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.textVal}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        data={ascns}
        columns={[
          {
            header: "ASCN Number",
            cell: (e) => <span className="font-semibold text-blue-600 tracking-tight">{e.ascn_number || 'Draft'}</span>,
            sortable: true
          },
          {
            header: "Project",
            cell: (e) => (
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{e.project_name}</span>
                <span className="text-xs text-slate-400 font-mono">{e.project_pid}</span>
              </div>
            )
          },
          {
            header: "Customer",
            accessorKey: "customer_name",
            sortable: true
          },
          {
            header: "ASCN Date",
            cell: (e) => e.ascn_date ? new Date(e.ascn_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
            sortable: true
          },
          {
            header: "Raised Dept.",
            accessorKey: "raised_department"
          },
          {
            header: "Initiated By",
            accessorKey: "change_initiated_by"
          },
          {
            header: "Status",
            cell: (e) => (
              <Badge variant={getStatusVariant(e.status)}>
                {e.status}
              </Badge>
            )
          }
        ]}
        loading={loading}
        totalCount={totalCount}
        currentPage={filters.page || 1}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search ASCNs by Number, Project, Customer, Dept..."
        onRowClick={handleRowClick}
        filters={
          <div className="space-y-4 p-1">
            <h3 className="font-semibold text-slate-800 text-sm">Advanced Filters</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                  value={localFilters.status}
                  onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</label>
                <Input
                  placeholder="Filter by Project Name"
                  className="h-9 text-sm"
                  value={localFilters.project_name}
                  onChange={(e) => setLocalFilters({ ...localFilters, project_name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</label>
                <Input
                  placeholder="Filter by Customer Name"
                  className="h-9 text-sm"
                  value={localFilters.customer_name}
                  onChange={(e) => setLocalFilters({ ...localFilters, customer_name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ASCN Date</label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={localFilters.date}
                  onChange={(e) => setLocalFilters({ ...localFilters, date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1 text-slate-500" onClick={resetFilters}>Reset</Button>
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={applyFilters}>Apply</Button>
            </div>
          </div>
        }
        actions={(e) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(evt) => {
                evt.stopPropagation();
                router.push(`/${role}/ascn/${e.id}`);
              }}
              title="View ASCN"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(evt) => {
                evt.stopPropagation();
                router.push(`/${role}/ascn/${e.id}?print=true`);
              }}
              title="Print ASCN"
            >
              <Printer className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                onClick={(evt) => handleDeleteClick(evt, e)}
                title="Delete ASCN"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        emptyState={
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileEdit className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No ASCNs found</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm mb-6">
              Create an application software change note to raise, track, and get approvals for software changes.
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Raise First ASCN
            </Button>
          </div>
        }
      />

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Software Change Note?"
        message={`Are you sure you want to permanently delete ASCN ${ascnToDelete?.ascn_number || 'Draft'}? This action cannot be undone and all change records will be lost.`}
        confirmLabel="Delete ASCN"
        variant="danger"
      />
    </div>
  );
}
