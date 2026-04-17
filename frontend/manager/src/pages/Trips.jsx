import React from 'react';
import { 
  Plus, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  MoreHorizontal, 
  User, 
  Truck, 
  ChevronRight 
} from 'lucide-react';
import { tripService, fleetService } from '../services/api';

export default function Trips() {
  const [trips, setTrips] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ active: 0, completed: 0, pending: 0 });
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [drivers, setDrivers] = React.useState([]);
  const [trucks, setTrucks] = React.useState([]);
  const [formData, setFormData] = React.useState({
    truck_id: '',
    driver_id: '',
    route_id: `RT-${Math.floor(Math.random() * 90000) + 10000}`,
    start_location: '',
    start_odometer: 0
  });

  const fetchTrips = async () => {
    try {
      const data = await tripService.listTrips();
      const wallets = data.wallets || [];
      setTrips(wallets);
      setStats({
        active: data.summary?.total_trips || wallets.filter(t => t.status === 'ACTIVE').length,
        completed: wallets.filter(t => t.status === 'CLOSED' || t.status === 'COMPLETED').length,
        pending: wallets.filter(t => t.status === 'WAITING_PAYMENT' || t.status === 'SCHEDULED' || t.status === 'PENDING').length
      });
    } catch (error) {
      console.error('Failed to fetch trips', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTrips();
    // Fetch drivers and trucks for the form
    const fetchAssets = async () => {
      try {
        const [driversData, trucksData] = await Promise.all([
          fleetService.listDrivers(),
          fleetService.listTrucks()
        ]);
        setDrivers(driversData.drivers || []);
        setTrucks(trucksData.trucks || []);
      } catch (e) {
        console.error('Failed to fetch assets for form', e);
      }
    };
    fetchAssets();
  }, []);

  const handleStartTrip = async (e) => {
    e.preventDefault();
    try {
      await tripService.startTrip(formData);
      setIsModalOpen(false);
      fetchTrips();
      setFormData({
        truck_id: '',
        driver_id: '',
        route_id: `RT-${Math.floor(Math.random() * 90000) + 10000}`,
        start_location: '',
        start_odometer: 0
      });
    } catch (error) {
      alert('Failed to start trip. Please check API connection.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 font-sans relative">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-outfit">Deploy New Trip</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configure asset assignment & route</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
              >
                 <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleStartTrip} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vehicle Selection</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all appearance-none cursor-pointer"
                    value={formData.truck_id}
                    onChange={(e) => setFormData({...formData, truck_id: e.target.value})}
                  >
                    <option value="">Select Truck</option>
                    {trucks.map(t => <option key={t.truckId} value={t.truckId}>{t.truckId} - {t.model}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Driver</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all appearance-none cursor-pointer"
                    value={formData.driver_id}
                    onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Route Descriptor / Start Location</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Mumbai Logistics Hub"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                  value={formData.start_location}
                  onChange={(e) => setFormData({...formData, start_location: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Odometer Start</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                    value={formData.start_odometer}
                    onChange={(e) => setFormData({...formData, start_odometer: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trip ID (System Gen)</label>
                  <input 
                    disabled
                    type="text" 
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-400 outline-none cursor-not-allowed"
                    value={formData.route_id}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-900 py-4 rounded-2xl text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-800 transition-all mt-4 hover:-translate-y-0.5 active:translate-y-0"
              >
                Initialize Asset Trip
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-outfit">Trip Management</h1>
          <p className="text-gray-400 font-medium mt-1">Plan, assign, and track fleet journeys in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-900 rounded-2xl text-sm font-black text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
            Create New Trip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Active Trips</p>
              <p className="text-2xl font-black text-gray-900">{stats.active}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-emerald-500">↑ 12% vs last week</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Completed Today</p>
              <p className="text-2xl font-black text-gray-900">{stats.completed}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400">Total 1,240 km logged</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pending Assignments</p>
              <p className="text-2xl font-black text-gray-900">{stats.pending}</p>
            </div>
          </div>
          <p className="text-xs font-bold text-amber-500">Requires attention</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <button className="text-sm font-black text-indigo-900 border-b-2 border-indigo-900 pb-2">Active Trips</button>
             <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pb-2">Scheduled</button>
             <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pb-2">Completed</button>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search trips, drivers..." 
                 className="pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-100 transition-all outline-none w-64 font-bold"
               />
             </div>
             <button className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-all">
               <Filter className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
          {loading ? (
             <div className="col-span-full py-20 text-center font-bold text-gray-400 uppercase tracking-widest">Tracing active fleet movements...</div>
          ) : trips.length === 0 ? (
             <div className="col-span-full py-20 text-center font-bold text-gray-400 uppercase tracking-widest">No active trips found.</div>
          ) : (
            trips.map((trip) => (
              <div key={trip.id || trip.trip_id} className="group bg-white rounded-[2rem] border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 relative border-l-4 border-l-indigo-900">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    {trip.id || trip.trip_id}
                  </span>
                  <button className="text-gray-400 hover:text-gray-900 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
  
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full border-2 border-indigo-900 shrink-0" />
                      <div className="w-0.5 flex-1 bg-dashed border-l border-dashed border-gray-200 my-1" />
                      <div className="w-3 h-3 rounded-full bg-indigo-900 shrink-0" />
                    </div>
                    <div className="flex flex-col gap-6 -mt-1">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Origin</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{trip.origin || trip.start_location || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Destination</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{trip.destination || trip.end_location || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
  
                  <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{trip.driver || trip.driver_id}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Truck</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{(trip.vehicle || trip.truck_id || '').split(' ')[0]}</p>
                    </div>
                  </div>
  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-indigo-900">{trip.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-indigo-900 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(49,46,129,0.4)]"
                        style={{ width: `${trip.progress || 0}%` }}
                      />
                    </div>
                  </div>
  
                  <button className="w-full mt-4 py-3 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-indigo-900 uppercase tracking-widest group-hover:bg-indigo-900 group-hover:text-white transition-all shadow-sm hover:shadow-indigo-100">
                    Manage Activity
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
