'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Clock, 
  Layers, 
  ArrowLeft,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboardService, DashboardData } from '@/services/dashboard-service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function OpenProjectsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getData();
        setData(res);
      } catch (error) {
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) return <div className="p-20 text-center animate-pulse text-slate-500">Loading Workflow Pipeline...</div>;

  const filteredProjects = data.recent_projects.filter(p => 
    p.status !== 'Closed' && 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Open Projects Dashboard</h1>
          <p className="text-slate-500">Live monitoring of projects currently in the workflow pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stage-wise Breakdown */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Stage-wise Distribution</h3>
            <Badge variant="info">Active Pipeline</Badge>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.charts.stage_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', width: 120}} width={120} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Insights */}
        <div className="space-y-6">
           <Card className="p-6 bg-blue-600 text-white border-none shadow-lg">
             <div className="flex justify-between items-start mb-4">
               <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                 <Clock className="h-5 w-5" />
               </div>
               <Badge className="bg-white/20 border-white/30 text-white">Live</Badge>
             </div>
             <h4 className="text-sm font-medium opacity-80 uppercase tracking-widest">Total In-Progress</h4>
             <h2 className="text-4xl font-black mt-2">{data.stats.open}</h2>
             <p className="text-xs mt-4 opacity-70 leading-relaxed">
               Currently, {data.stats.open} projects are active across {data.charts.stage_distribution.length} different stages.
             </p>
           </Card>

           <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bottleneck Alerts</h4>
              {data.charts.stage_distribution.slice(0, 3).map((stage: any, i: number) => (
                <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className={`h-2 w-2 rounded-full ${stage.count > 5 ? 'bg-rose-500 animate-ping' : 'bg-blue-500'}`} />
                     <span className="text-xs font-bold text-slate-700">{stage.name}</span>
                   </div>
                   <span className="text-xs font-black text-slate-400">{stage.count} Projects</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Interactive Table with Filters */}
      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
        <div className="p-6 border-b bg-white space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Project List (Filtered)</h3>
            <div className="flex gap-2">
               <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter by Stage</Button>
               <Button variant="outline" size="sm">Export List</Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by PID, Name or Customer..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">PID</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Active Stage</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProjects.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600">{p.pid}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{p.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{p.customer_name}</td>
                  <td className="px-6 py-4">
                     <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold">
                       {p.current_stage}
                     </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50">
                      TRACK <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">No open projects found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
