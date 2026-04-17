import React from 'react';
import { MapPin, Search, Filter, Phone, Clock, Star, ExternalLink, Droplets } from 'lucide-react';
import { fleetService } from '../services/api';

export default function Stations() {
  const [stations, setStations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await fleetService.listStations();
        setStations(data.stations || []);
      } catch (error) {
        console.error('Failed to fetch stations', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight font-outfit">Fuel Stations</h1>
          <p className="text-gray-400 font-medium mt-1">Explore and manage verified fueling locations across your operational routes.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <button className="text-sm font-black text-indigo-900 border-b-2 border-indigo-900 pb-2">Network Stations</button>
             <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors pb-2">Partners</button>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search by city or zip..." 
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
             <div className="col-span-full py-20 text-center font-bold text-gray-400 uppercase tracking-widest">Pinpointing network locations...</div>
          ) : stations.length === 0 ? (
             <div className="col-span-full py-20 text-center font-bold text-gray-400 uppercase tracking-widest">No stations found.</div>
          ) : (
            stations.map((station) => (
              <div key={station.id || station.station_id} className="group bg-white rounded-[2rem] border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-900 group-hover:text-white transition-all duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black text-amber-700">{station.rating || '4.8'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-900 transition-colors">{station.name}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{station.city || 'National Highway'}</p>
                  </div>

                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span className="text-xs font-bold">{station.phone || '+91 98765-43210'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">Open 24/7 • High Capacity</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <Droplets className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-black text-indigo-900 lowercase tracking-tight">₹{station.fuel_price || '96.42'}/L avg</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-3 bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-indigo-900 uppercase tracking-widest group-hover:bg-indigo-900 group-hover:text-white transition-all shadow-sm hover:shadow-indigo-100">
                    View Logistics Port
                    <ExternalLink className="w-3 h-3" />
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
