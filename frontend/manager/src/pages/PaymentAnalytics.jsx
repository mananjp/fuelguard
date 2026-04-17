import React from 'react';
import { Filter, Download, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { paymentService } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';

const barData = [
  { name: 'T-101', value: 28 },
  { name: 'T-102', value: 42 },
  { name: 'T-103', value: 15 },
  { name: 'T-104', value: 32 },
  { name: 'T-105', value: 38 },
];

const routeData = [
  { name: 'I-95 SOUTH', value: 18, total: '$18k' },
  { name: 'I-80 WEST', value: 11, total: '$11k' },
  { name: 'ROUTE-66', value: 6, total: '$6k' },
  { name: 'HWY 101', value: 5, total: '$5k' },
];

const monthlyData = [
  { name: 'JAN', value: 45 },
  { name: 'FEB', value: 52 },
  { name: 'MAR', value: 48 },
  { name: 'APR', value: 61 },
  { name: 'MAY', value: 55 },
  { name: 'JUN', value: 68 },
];

export default function PaymentAnalytics() {
  const [analyticsData, setAnalyticsData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await paymentService.getAnalytics();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Analytics</h1>
          <p className="text-gray-400 font-medium mt-1">Detailed insights into fuel spending and operational costs across your entire fleet.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 rounded-xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="TOTAL FUEL SPEND" 
          value={analyticsData?.total_spend?.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) || "$42,850.00"} 
          trend="+12.5% vs last month" 
          icon={DollarSign}
        />
        <StatCard 
          title="AVG. COST/TRUCK" 
          value={analyticsData?.avg_cost_per_truck?.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) || "$1,240.00"} 
          trend="-2.1% vs average" 
          icon={TrendingUp}
        />
        <StatCard 
          title="EFFICIENCY SCORE" 
          value={analyticsData?.efficiency_score?.toString() || "88.4"} 
          trend="Optimized • +4 pts improvement" 
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-gray-900 text-lg">Fuel Spend per Truck</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Top 5 high-usage vehicles</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">$42.8k</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+8% this month</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
                />
                <Bar dataKey="value" fill="#312E81" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-gray-900 text-lg">Spend per Route</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Most expensive logistics corridors</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">$38.2k</p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+5% efficiency</p>
            </div>
          </div>
          <div className="space-y-6">
            {routeData.map((route) => (
              <div key={route.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>{route.name}</span>
                  <span className="text-gray-900">{route.total}</span>
                </div>
                <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner flex items-center pr-4">
                  <div 
                    className="h-2 bg-indigo-900 rounded-full ml-1 transition-all duration-1000 shadow-[0_0_8px_rgba(49,46,129,0.3)]"
                    style={{ width: `${(route.value / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-gray-900 text-lg">Total Monthly Expenses</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">6-month trend analysis</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900">$156.4k</p>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">-2% year-over-year</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#312E81" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#312E81" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                dy={10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
              />
              <Area type="monotone" dataKey="value" stroke="#312E81" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
