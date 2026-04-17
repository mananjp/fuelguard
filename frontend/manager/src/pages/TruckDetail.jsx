import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  Activity, 
  ShieldAlert, 
  Wrench, 
  ArrowLeft,
  Gauge,
  Fuel,
  TrendingUp,
  History
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import LiveMap from '../components/dashboard/LiveMap';
import { fleetService } from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const fuelData = [
  { time: '08:00', efficiency: 6.2 },
  { time: '10:00', efficiency: 5.8 },
  { time: '12:00', efficiency: 6.5 },
  { time: '14:00', efficiency: 6.1 },
  { time: '16:00', efficiency: 5.9 },
  { time: '18:00', efficiency: 6.3 },
];

export default function TruckDetail() {
  const { id } = useParams();
  const [truckDetail, setTruckDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchTruck = async () => {
      try {
        const data = await fleetService.getTruck(id);
        setTruckDetail(data);
      } catch (error) {
        console.error('Failed to fetch truck details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTruck();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black text-gray-400 tracking-widest uppercase">Initializing Asset Telemetry...</div>;
  if (!truckDetail) return <div className="p-20 text-center font-black text-red-400 tracking-widest uppercase">Asset Not Found</div>;

  const truck = {
    truckId: truckDetail.truckId || id,
    model: truckDetail.model || 'Volvo VNL 800',
    status: truckDetail.status || 'On Trip',
    driver: truckDetail.driver || 'Unassigned',
    lastUpdated: truckDetail.last_updated || '2 mins ago',
    efficiency: `${truckDetail.efficiency || 6.2} km/L`,
    totalDistance: `${(truckDetail.total_distance || 85420).toLocaleString()} km`,
    fuelLevel: `${truckDetail.fuel_level || 78}%`,
    location: truckDetail.location || 'Ahmedabad, Gujarat',
    position: truckDetail.position || [23.0225, 72.5714]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/trucks" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{truck.truckId}</h1>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                {truck.status}
              </span>
            </div>
            <p className="text-gray-400 font-medium mt-1">{truck.model} • Driver: <span className="text-gray-600 font-bold">{truck.driver}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            Maintenance Logs
          </button>
          <button className="px-5 py-2.5 bg-indigo-900 rounded-xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100">
            Immobilize Asset
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Fuel Efficiency" value={truck.efficiency} trend="+2.5%" icon={Fuel} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Fuel Level" value={truck.fuelLevel} trend="Stable" icon={Gauge} iconBg="bg-orange-50" iconColor="text-orange-600" />
        <StatCard title="Total Distance" value={truck.totalDistance} trend="+1,240 km" icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard title="Security Status" value="SAFE" trend="No Spoofing" icon={ShieldAlert} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Tracking */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Live Asset Location</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400">Last updated: {truck.lastUpdated}</span>
          </div>
          <div className="flex-1 relative bg-gray-50">
            <LiveMap trucks={[truck]} />
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Trip Efficiency</h3>
          </div>
          
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fuelData}>
                <defs>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                />
                <Area type="monotone" dataKey="efficiency" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">Security Report</p>
            </div>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              GPS anti-spoofing check passed. No anomalies detected in the last 20 heartbeats. Signal strength is optimal.
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-600" />
              <h3 className="font-black text-gray-900 text-base font-outfit">Upcoming Maintenance</h3>
            </div>
            <button className="text-xs font-black text-indigo-600 hover:underline">Full Schedule</button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Brake Pad Replacement</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In 1,200 km (Est. 4 days)</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-white rounded-lg text-xs font-black text-orange-600 shadow-sm border border-orange-100">Schedule</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-gray-900 text-base font-outfit">Recent Fuel Events</h3>
            </div>
            <button className="text-xs font-black text-indigo-600 hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">HPCL Station Refill</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">85.4L • ₹8,420 • Clean Checkin</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
