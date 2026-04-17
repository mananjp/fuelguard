import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Plus, 
  Users, 
  Shield, 
  MapPin, 
  AlertTriangle, 
  ChevronRight, 
  MoreVertical, 
  Info, 
  ArrowRight 
} from 'lucide-react';
import { fleetService } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';

export default function DriverManagement() {
  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await fleetService.listDrivers();
        setDrivers(data.drivers || []);
      } catch (error) {
        console.error('Failed to fetch drivers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Driver Management</h1>
          <p className="text-gray-400 font-medium mt-1">Performance tracking, trust scores and profile management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => alert('Backend API for adding drivers is not available yet. This feature is coming soon.')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 rounded-xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Active Drivers" value="142" trend="+5.2%" icon={Users} />
        <StatCard title="Fleet Trust Score" value="88.4%" trend="+1.2%" icon={Shield} />
        <StatCard title="Active Trips" value="24" trend="-2%" icon={MapPin} />
        <StatCard title="Fraud Alerts (24h)" value="3" trend="-15%" icon={AlertTriangle} alert={true} />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-8">
          <button className="text-sm font-black text-indigo-900 border-b-2 border-indigo-900 pb-2">All Drivers</button>
          <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pb-2">High Risk</button>
          <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pb-2">Onboarding</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Driver Info</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trust Score</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trips (MTD)</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Fraud History</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-10 text-center font-bold text-gray-400 uppercase tracking-widest">Accessing driver profiles...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-10 text-center font-bold text-gray-400 uppercase tracking-widest">No drivers registered in fleet.</td></tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id || driver.driverId} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <Link to={`/drivers/${driver.driverId}`} className="group/item">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-white shadow-inner flex items-center justify-center text-indigo-300 font-bold group-hover/item:bg-indigo-900 group-hover/item:text-white transition-all">
                            {(driver.name || '??').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm font-black text-gray-900 group-hover/item:text-indigo-600 transition-colors">{driver.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {driver.driverId} • {driver.type || 'Driver'}</p>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              (driver.trustScore || 0) > 80 ? "bg-emerald-500" : (driver.trustScore || 0) > 60 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${driver.trustScore || 0}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-black min-w-[35px]",
                          (driver.trustScore || 0) > 80 ? "text-emerald-500" : (driver.trustScore || 0) > 60 ? "text-amber-500" : "text-red-500"
                        )}>
                          {driver.trustScore || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-sm font-black text-gray-900">{driver.trips || 0} Trips</p>
                        <p className="text-xs font-bold text-gray-400">{driver.distance || '0 km'} total</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        driver.historyColor === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                        driver.historyColor === 'amber' ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                        "bg-red-50 text-red-600 border border-red-100"
                      )}>
                        {driver.history || 'CLEAN RECORD'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-gray-400 hover:text-gray-900 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4">
          <div className="w-12 h-12 bg-indigo-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-indigo-900">Optimization Tip</h3>
            <p className="text-sm font-medium text-indigo-700/80 leading-relaxed">Implement additional training for drivers with a Trust Score below 60% to reduce fraud risk and improve insurance premiums.</p>
            <button className="inline-flex items-center gap-2 text-xs font-black text-indigo-900 uppercase tracking-widest mt-2 hover:underline underline-offset-4">
              View training modules <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 flex gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-red-900">Critical Fraud Alerts</h3>
            <p className="text-sm font-medium text-red-700/80 leading-relaxed">3 anomalous fuel transactions detected in the last 24 hours requiring immediate manual review.</p>
            <button className="inline-flex items-center gap-2 text-xs font-black text-red-900 uppercase tracking-widest mt-2 hover:underline underline-offset-4">
              Review alerts now <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
