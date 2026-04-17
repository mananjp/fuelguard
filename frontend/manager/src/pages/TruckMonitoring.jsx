import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  ArrowRightLeft, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  ChevronRight, 
  Wrench, 
  Plus, 
  Download 
} from 'lucide-react';
import { fleetService } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';
import LiveMap from '../components/dashboard/LiveMap';

const maintenanceQueue = [
  { id: 1, truckId: 'TX-1122', task: 'Brake inspection', date: 'Today', color: 'amber' },
  { id: 2, truckId: 'TX-8801', task: 'Oil Change', date: 'Jun 14', color: 'indigo' },
];

export default function TruckMonitoring() {
  const [truckList, setTruckList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    active: '128',
    onRoad: '84',
    alerts: '6',
    efficiency: '94.2%'
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [truckData, overview] = await Promise.all([
          fleetService.listTrucks(),
          fleetService.getOverview()
        ]);
        setTruckList(truckData.trucks || []);
        if (overview) {
          setStats({
            active: overview.total_trucks || '128',
            onRoad: overview.active_trips || '84',
            alerts: overview.total_alerts || '6',
            efficiency: '94.2%'
          });
        }
      } catch (error) {
        console.error('Failed to fetch truck data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-outfit">Truck Monitoring</h1>
          <p className="text-gray-400 font-medium mt-1">Real-time oversight of active fleet operations and asset status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button 
            onClick={() => alert('Backend API for truck registration is not available yet. This feature is coming soon.')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 rounded-xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Register Truck
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Trucks" value={stats.active} trend="+5.2%" icon={Truck} />
        <StatCard title="On Road" value={stats.onRoad} trend="-1.4%" icon={ArrowRightLeft} />
        <StatCard title="Fuel Alerts" value={stats.alerts} trend="Requires action" icon={AlertTriangle} alert={true} />
        <StatCard title="Fleet Efficiency" value={stats.efficiency} trend="+0.8%" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-lg font-outfit">Live Fleet Status</h3>
            <button className="text-xs font-black text-indigo-900 uppercase tracking-widest hover:underline underline-offset-4">Filter</button>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 sticky top-0 bg-white z-10 border-b border-gray-100">
                  <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Truck ID</th>
                  <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                  <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Speed</th>
                  <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                   <tr><td colSpan="5" className="px-8 py-10 text-center font-bold text-gray-400 uppercase tracking-widest">Loading fleet assets...</td></tr>
                ) : truckList.length === 0 ? (
                   <tr><td colSpan="5" className="px-8 py-10 text-center font-bold text-gray-400 uppercase tracking-widest">No trucks registered.</td></tr>
                ) : (
                  truckList.map((truck) => (
                    <tr key={truck.id || truck.truckId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <Link to={`/trucks/${truck.truckId}`} className="group/item">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm font-black text-gray-900 group-hover/item:text-indigo-600 transition-colors">{truck.truckId}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{truck.model || 'Standard Model'}</p>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all" />
                          </div>
                        </Link>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-white shadow-inner flex shrink-0 items-center justify-center text-[10px] font-black text-indigo-300">
                            {(truck.driver || '??').split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-bold text-gray-600">{truck.driver || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span className="text-sm font-bold text-gray-600">{truck.location || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-gray-900">{truck.speed || '0 mph'}</td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          (truck.statusColor === 'emerald' || truck.status === 'On Trip') ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          (truck.statusColor === 'amber' || truck.status === 'Idle')? "bg-amber-50 text-amber-600 border border-amber-100" :
                          (truck.statusColor === 'indigo' || truck.status === 'Maintenance') ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                          "bg-red-50 text-red-600 border border-red-100"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", 
                            (truck.statusColor === 'emerald' || truck.status === 'On Trip') ? "bg-emerald-500" :
                            (truck.statusColor === 'amber' || truck.status === 'Idle')? "bg-amber-500" :
                            (truck.statusColor === 'indigo' || truck.status === 'Maintenance') ? "bg-indigo-500" : "bg-red-500"
                          )} />
                          {truck.status || 'OFFLINE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-50 mt-auto flex items-center justify-between">
             <p className="text-[10px] font-bold text-gray-400">Showing 5 of 128 trucks</p>
             <div className="flex items-center gap-1">
               <button className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 rounded-lg">Prev</button>
               <button className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-900 text-white text-[10px] font-black">1</button>
               <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[10px] font-black text-gray-400">2</button>
               <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[10px] font-black text-gray-400">3</button>
               <button className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 rounded-lg">Next</button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="px-8 py-4 border-b border-gray-50 flex items-center justify-between">
               <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest font-outfit">Geofence Overview</h3>
            </div>
            <div className="flex-1 bg-gray-50 relative">
               <LiveMap trucks={truckList} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-6 font-outfit">Maintenance Queue</h3>
            <div className="space-y-4">
              {maintenanceQueue.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    item.color === 'amber' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                  )}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900">{item.truckId}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.task}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                    item.color === 'amber' ? "bg-amber-100/50 text-amber-700" : "bg-indigo-100/50 text-indigo-700"
                  )}>{item.date}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all">View Full Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
