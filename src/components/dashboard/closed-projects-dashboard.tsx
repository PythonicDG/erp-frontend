'use client';

import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  CheckCircle2, 
  TrendingUp, 
  ArrowLeft,
  Calendar,
  Download,
  Search,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardService, DashboardData } from '@/services/dashboard-service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

export function ClosedProjectsDashboard() {
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

  if (loading || !data) return <div className="p-20 text-center animate-pulse text-slate-500">Analyzing Historical Success...</div>;

  const closedProjects = data.recent_projects.filter(p => p.status === 'Closed');
  const filteredProjects = closedProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Success Analytics</h1>
          <p className="text-slate-500">Review historical performance and completed project trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6 flex flex-col items-center text-center space-y-2 border-emerald-100 bg-emerald-50/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Closed</h4>
          <h2 className="text-3xl font-black text-slate-900">{data.stats.closed}</h2>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center space-y-2 border-blue-100 bg-blue-50/30">
          <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Efficiency Rate</h4>
          <h2 className="text-3xl font-black text-slate-900">{data.stats.completion_rate}%</h2>
        </Card>
        <Card className="lg:col-span-2 p-6 bg-slate-900 text-white border-none shadow-xl flex items-center gap-6">
           <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
             <Calendar className="h-8 w-8" />
           </div>
           <div>
             <h4 className="text-xs font-medium opacity-60 uppercase tracking-widest">Financial Year Review</h4>
             <h2 className="text-2xl font-bold mt-1">FY {data.system_info.financial_year} Performance</h2>
             <p className="text-xs mt-2 opacity-50">Aggregate success metrics across all project types.</p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Completion Trend */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Monthly Success Trend</h3>
            <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100">Growth Analysis</Badge>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.monthly_trend}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Closed by Type */}
        <Card className="p-6 space-y-6">
           <h3 className="font-bold text-slate-900">Success by Type</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={data.charts.type_distribution}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="count"
                 >
                   {data.charts.type_distribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="space-y-2">
             {data.charts.type_distribution.map((item, index) => (
               <div key={index} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-slate-500">{item.project_type}</span>
                 </div>
                 <span className="font-bold text-slate-900">{item.count}</span>
               </div>
             ))}
           </div>
        </Card>
      </div>

      {/* Historical Record Table */}
      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
        <div className="p-6 border-b bg-white flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Closed Project Registry</h3>
          <div className="flex gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search history..." 
                  className="pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Archive Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">PID</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Completion Date</th>
                <th className="px-6 py-4">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredProjects.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{p.pid}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{p.customer_name}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.date_received).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:bg-emerald-50">
                      DETAILS <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
