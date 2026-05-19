'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Calendar, 
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  FileEdit
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardService, DashboardData } from '@/services/dashboard-service';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function DashboardOverview() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Defaults to current year and current month
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString();

  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const years = [
    { value: 'all', label: 'All Years' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' }
  ];

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const fetchDashboard = async (yearVal: string, monthVal: string) => {
    setIsRefreshing(true);
    try {
      const res = await dashboardService.getData({
        year: yearVal === 'all' ? undefined : yearVal,
        month: monthVal === 'all' ? undefined : monthVal
      });
      setData(res);
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboard(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  if (loading || !data) return <div className="p-20 text-center animate-pulse text-slate-500">Calculating analytics...</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time operational metrics and system overview.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-3 py-1">
             <Calendar className="h-3 w-3 mr-1.5" /> FY {data.system_info.financial_year}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 px-3 py-1">
             <Info className="h-3 w-3 mr-1.5" /> {data.system_info.version}
          </Badge>
        </div>
      </div>

      {/* Year-wise and Month-wise Dashboard Filters */}
      <Card className="p-4 bg-slate-50/50 border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-slate-700 font-bold text-sm">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>Operational Dashboard Filter</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Year Dropdown */}
          <div className="w-full sm:w-40 relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-10 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all shadow-xs cursor-pointer appearance-none pr-8"
            >
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Month Dropdown */}
          <div className="w-full sm:w-44 relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full h-10 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all shadow-xs cursor-pointer appearance-none pr-8"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Reset button */}
          {(selectedYear !== 'all' || selectedMonth !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className="text-xs text-blue-600 hover:bg-blue-50 font-bold whitespace-nowrap"
            >
              Reset to All-time
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className={`stats-grid transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
        <StatCard 
          title="Total Projects" 
          value={data.stats.total} 
          icon={<Layers className="text-blue-600" />} 
          trend="+12%" 
          color="blue"
          onClick={() => router.push(user ? `/${user.role.toLowerCase()}/projects` : '/projects')}
        />
        <StatCard 
          title="Open Projects" 
          value={data.stats.open} 
          icon={<Clock className="text-amber-600" />} 
          trend="-2" 
          color="amber"
          onClick={() => router.push(user ? `/${user.role.toLowerCase()}/dashboard/open` : '/dashboard/open')}
        />
        <StatCard 
          title="Closed Projects" 
          value={data.stats.closed} 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          trend="+5%" 
          color="emerald"
          onClick={() => router.push(user ? `/${user.role.toLowerCase()}/dashboard/closed` : '/dashboard/closed')}
        />
        <StatCard 
          title="ECN" 
          value={data.stats.ecns ?? 0} 
          icon={<FileEdit className="text-indigo-600" />} 
          trend="" 
          color="indigo"
          onClick={() => router.push(user ? `/${user.role.toLowerCase()}/ecn` : '/ecn')}
        />
        <StatCard 
          title="Completion Rate" 
          value={`${data.stats.completion_rate}%`} 
          icon={<TrendingUp className="text-emerald-600" />} 
          trend="+2.4%" 
          color="emerald"
        />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Monthly Trend */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Project Intake Trend</h3>
            <Badge variant="outline" className="text-[10px]">Monthly Data</Badge>
          </div>
          <div className="h-80 w-full min-h-[320px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data.charts.monthly_trend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Project Type Distribution */}
        <Card className="p-6 space-y-6">
           <h3 className="font-bold text-slate-900">Type Distribution</h3>
           <div className="h-64 w-full min-h-[256px]">
             {mounted && (
               <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                 <PieChart>
                   <Pie
                     data={data.charts.type_distribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="count"
                     nameKey="project_type"
                   >
                     {data.charts.type_distribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             )}
           </div>
           <div className="space-y-2">
             {data.charts.type_distribution.map((item, index) => (
               <div key={item.project_type} className="flex items-center justify-between text-xs">
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

      <div className={`grid grid-cols-1 gap-8 transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Recent Projects Table - Now Full Width */}
        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
          <div className="p-6 border-b flex justify-between items-center bg-white">
            <div>
              <h3 className="font-bold text-slate-900">Recent Projects</h3>
              <p className="text-xs text-slate-500 mt-1">Live tracking of the latest projects and their current workflow status.</p>
            </div>
            <button 
              className="text-xs font-bold text-blue-600 hover:underline px-4 py-2 bg-blue-50 rounded-lg"
              onClick={() => router.push(user ? `/${user.role.toLowerCase()}/projects` : '/projects')}
            >
              View All Projects
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">PID</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Current Stage (Form)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Received Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.recent_projects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px]">
                        {p.pid}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{p.customer_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="font-semibold text-slate-700">{p.current_stage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          p.status === 'Closed' ? 'success' : 
                          p.status === 'Pending Approval' ? 'pending' :
                          p.status === 'Rejected' ? 'danger' : 'info'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(p.date_received).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, onClick }: any) {
  const isPositive = trend.startsWith('+');
  return (
    <Card 
      className={`p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-transparent hover:border-${color}-200 group`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`h-12 w-12 rounded-2xl bg-${color}-50 flex items-center justify-center border border-${color}-100 group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>
          {React.cloneElement(icon, { size: 24, className: `group-hover:text-white transition-colors` })}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h2 className="text-3xl font-bold text-slate-900 mt-1">{value}</h2>
      
      {onClick && (
        <div className="mt-4 flex items-center text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          VIEW DETAILS <ChevronDown size={10} className="-rotate-90 ml-1" />
        </div>
      )}
    </Card>
  );
}
