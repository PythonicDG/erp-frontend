'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  User, 
  Activity, 
  FileText, 
  Settings as SettingsIcon,
  Loader2,
  Calendar,
  FilterX
} from 'lucide-react';
import { settingsService, AuditLog } from '@/services/settings-service';
import toast from 'react-hot-toast';

export function AuditLogs() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async (currentPage = page, searchVal = search, moduleVal = moduleFilter) => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
      };
      if (searchVal.trim() !== '') {
        params.search = searchVal;
      }
      if (moduleVal !== 'all') {
        params.module = moduleVal;
      }
      
      const data = await settingsService.getAuditLogs(params);
      
      if (Array.isArray(data)) {
        setLogs(data);
        setTotalCount(data.length);
      } else {
        setLogs((data as any).results || []);
        setTotalCount((data as any).count || 0);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, search, moduleFilter);
  }, [page, search, moduleFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleModuleChange = (val: string) => {
    setModuleFilter(val);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full lg:max-w-md">
          <Input 
            placeholder="Search logs by user, action or target..." 
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchLogs(page, search, moduleFilter)} 
            className="text-slate-500 hover:text-blue-600"
            loading={loading}
          >
            <Activity className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Module:</span>
            <select 
              value={moduleFilter}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all font-medium min-w-[160px]"
            >
              <option value="all">All Modules</option>
              <option value="projects">Projects</option>
              <option value="workflow">Workflow</option>
              <option value="settings">Settings</option>
              <option value="team">Team</option>
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setModuleFilter('all'); setPage(1); }} className="text-slate-400 hover:text-blue-600">
            <FilterX className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden border-slate-200">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Loading audit history...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Action & Module</th>
                  <th className="px-4 py-5">Performed By</th>
                  <th className="px-4 py-5">Target Resource</th>
                  <th className="px-4 py-5">Date & Time</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                          log.status === 'ERROR' ? 'bg-red-50 text-red-500 border border-red-100' :
                          log.status === 'WARNING' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
                          'bg-blue-50 text-blue-500 border border-blue-100'
                        }`}>
                          {log.module?.toLowerCase() === 'projects' && <FileText className="h-4 w-4" />}
                          {log.module?.toLowerCase() === 'workflow' && <Activity className="h-4 w-4" />}
                          {log.module?.toLowerCase() === 'settings' && <SettingsIcon className="h-4 w-4" />}
                          {log.module?.toLowerCase() === 'team' && <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{log.action}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{log.module}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                         <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-xs">
                            {log.user_name?.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div>
                           <p className="font-bold text-slate-700 leading-none mb-1">{log.user_name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{log.user_role}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="truncate max-w-[200px] bg-slate-50 px-2 py-1 rounded border border-slate-100 text-[11px]">{log.target}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 ml-4.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'} className="font-bold tracking-wider px-2.5">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Search className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium italic">No audit logs match your current filters.</p>
                        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setModuleFilter('all'); setPage(1); }} className="text-blue-600 hover:bg-blue-50">Clear all filters</Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Pagination Summary */}
      {!loading && totalCount > 0 && (
        <div className="flex items-center justify-between px-2 text-slate-500">
          <p className="text-xs font-medium">
            Showing <span className="font-bold text-slate-900">{logs.length}</span> of <span className="font-bold text-slate-900">{totalCount}</span> entries
          </p>
          <div className="flex items-center gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               disabled={page === 1} 
               onClick={() => setPage(p => Math.max(p - 1, 1))}
               className="text-xs h-8 border-slate-200"
             >
               Previous
             </Button>

             <div className="flex items-center gap-1">
               {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => i + 1)
                 .filter(p => p === 1 || p === Math.ceil(totalCount / 10) || Math.abs(p - page) <= 1)
                 .map((p, idx, arr) => {
                   const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                   return (
                     <React.Fragment key={p}>
                       {showEllipsis && <span className="px-1.5 text-xs text-slate-400">...</span>}
                       <Button
                         variant={p === page ? "primary" : "outline"}
                         size="sm"
                         onClick={() => setPage(p)}
                         className={`h-8 w-8 text-xs font-bold ${
                           p === page 
                             ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                             : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                         }`}
                       >
                         {p}
                       </Button>
                     </React.Fragment>
                   );
                 })}
             </div>

             <Button 
               variant="outline" 
               size="sm" 
               disabled={page >= Math.ceil(totalCount / 10)} 
               onClick={() => setPage(p => Math.min(p + 1, Math.ceil(totalCount / 10)))}
               className="text-xs h-8 border-slate-200"
             >
               Next
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
