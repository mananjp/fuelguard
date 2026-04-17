import React from 'react';
import { 
  Download, 
  Plus, 
  Droplets, 
  CreditCard, 
  AlertTriangle, 
  Filter, 
  ExternalLink 
} from 'lucide-react';
import { transactionService, fleetService } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';

export default function FuelEvents() {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ volume: '0 L', spend: '₹0', anomalies: 0 });
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [stations, setStations] = React.useState([]);
  const [trucks, setTrucks] = React.useState([]);
  const [drivers, setDrivers] = React.useState([]);
  const [formData, setFormData] = React.useState({
    truck_id: '',
    driver_id: '',
    route_id: '',
    station_id: '',
    liters_claimed: 0,
    amount_inr: 0,
    meter_photo: null,
    pump_photo: null,
    receipt_photo: null
  });

  const fetchEvents = async () => {
    try {
      const data = await transactionService.listTransactions();
      setEvents(data.transactions || []);
      // Calculate basic stats if possible, or keep mock if API doesn't provide summary
      const totalLiters = (data.transactions || []).reduce((acc, curr) => acc + (curr.volume || 0), 0);
      const totalSpend = (data.transactions || []).reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
      setStats({
        volume: `${totalLiters.toLocaleString()} L`,
        spend: `₹${totalSpend.toLocaleString()}`,
        anomalies: (data.transactions || []).filter(t => (t.score || 0) > 70).length
      });
    } catch (error) {
      console.error('Failed to fetch fuel events', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEvents();
    const fetchAssets = async () => {
      try {
        const [司机, 卡车, 站点] = await Promise.all([
          fleetService.listDrivers(),
          fleetService.listTrucks(),
          fleetService.listStations()
        ]);
        setDrivers(司机.drivers || []);
        setTrucks(卡车.trucks || []);
        setStations(站点.stations || []);
      } catch (e) {
        console.error('Failed to fetch form assets', e);
      }
    };
    fetchAssets();
  }, []);

  const handleManualEntry = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    try {
      await transactionService.createFuelEntry(data);
      setIsModalOpen(false);
      fetchEvents();
      setFormData({
        truck_id: '',
        driver_id: '',
        route_id: '',
        station_id: '',
        liters_claimed: 0,
        amount_inr: 0,
        meter_photo: null,
        pump_photo: null,
        receipt_photo: null
      });
    } catch (error) {
      alert('Failed to submit fuel entry. Ensure all photos are provided if required.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 relative">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900 font-outfit uppercase tracking-tight">Manual Fuel Check-in</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Direct API submission for offline transactions</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
              >
                 <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleManualEntry} className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Mapping</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all appearance-none cursor-pointer"
                    value={formData.truck_id}
                    onChange={(e) => setFormData({...formData, truck_id: e.target.value})}
                  >
                    <option value="">Select Truck</option>
                    {trucks.map(t => <option key={t.truckId} value={t.truckId}>{t.truckId}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operator</label>
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

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fuel Station</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all appearance-none cursor-pointer"
                    value={formData.station_id}
                    onChange={(e) => setFormData({...formData, station_id: e.target.value})}
                  >
                    <option value="">Select Station</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Route / Trip ID</label>
                  <input 
                    required
                    type="text" 
                    placeholder="RT-XXXXX"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                    value={formData.route_id}
                    onChange={(e) => setFormData({...formData, route_id: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Volume (Liters)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                    value={formData.liters_claimed}
                    onChange={(e) => setFormData({...formData, liters_claimed: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (INR)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-100 transition-all"
                    value={formData.amount_inr}
                    onChange={(e) => setFormData({...formData, amount_inr: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidence Portfolio (Required)</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="meter" 
                      className="hidden" 
                      onChange={(e) => setFormData({...formData, meter_photo: e.target.files[0]})}
                    />
                    <label htmlFor="meter" className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer h-32 ${formData.meter_photo ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                      <Droplets className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase text-center">{formData.meter_photo ? 'Meter Added' : 'Meter Photo'}</span>
                    </label>
                  </div>
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="pump" 
                      className="hidden" 
                      onChange={(e) => setFormData({...formData, pump_photo: e.target.files[0]})}
                    />
                    <label htmlFor="pump" className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer h-32 ${formData.pump_photo ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase text-center">{formData.pump_photo ? 'Pump Added' : 'Pump Photo'}</span>
                    </label>
                  </div>
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="receipt" 
                      className="hidden" 
                      onChange={(e) => setFormData({...formData, receipt_photo: e.target.files[0]})}
                    />
                    <label htmlFor="receipt" className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer h-32 ${formData.receipt_photo ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                      <Download className="w-5 h-5 rotate-180" />
                      <span className="text-[9px] font-black uppercase text-center">{formData.receipt_photo ? 'Receipt Added' : 'Receipt Photo'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-900 py-4 rounded-2xl text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-800 transition-all mt-4"
              >
                Submit Verification Data
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fuel Events</h1>
          <p className="text-gray-400 font-medium mt-1">Real-time monitoring of fleet fuel transactions and anomaly detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 rounded-xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Liters Pumped (24h)" 
          value={stats.volume} 
          trend="+5.2% vs yesterday" 
          icon={Droplets}
        />
        <StatCard 
          title="Total Spend (24h)" 
          value={stats.spend} 
          trend="+2.1% vs yesterday" 
          icon={CreditCard}
        />
        <StatCard 
          title="High Risk Anomalies" 
          value={stats.anomalies.toString()} 
          trend="-12% vs avg" 
          icon={AlertTriangle}
          alert={true}
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl w-fit">
            <button className="px-4 py-2 bg-indigo-900 text-white text-sm font-bold rounded-lg shadow-md">All Transactions</button>
            <button className="px-4 py-2 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors">High Risk <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px]">14</span></button>
            <button className="px-4 py-2 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors">Commercial Stations</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer">
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Driver</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Station</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Fraud Score</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center font-bold text-gray-400 uppercase tracking-widest">Compiling fuel analytics...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-20 text-center font-bold text-gray-400 uppercase tracking-widest">No fuel events recorded.</td></tr>
              ) : (
                events.map((tx) => (
                  <tr key={tx.id || tx.transaction_id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-600">{tx.timestamp || tx.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-700 shadow-inner">
                          {(tx.driver || '??').split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{tx.driver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{tx.vehicle || tx.truck_id}</span>
                        <span className="text-xs font-medium text-gray-400 uppercase">{tx.vehiclePlate || 'STANDARD'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-gray-600">{tx.station}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{tx.amount || tx.volume || 0} L</span>
                        <span className="text-xs font-medium text-gray-400">₹{tx.cost || tx.total_amount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              (tx.fraudScore || tx.score || 0) > 80 ? "bg-red-500" : (tx.fraudScore || tx.score || 0) > 40 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${tx.fraudScore || tx.score || 5}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-black min-w-[45px]",
                          (tx.fraudScore || tx.score || 0) > 80 ? "text-red-500" : (tx.fraudScore || tx.score || 0) > 40 ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {tx.fraudScore || tx.score || 5}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100">
                        Review <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">Showing 1 to 4 of 42 transactions</p>
          <div className="flex items-center gap-1">
             <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-900 text-white text-xs font-black shadow-lg">1</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xs font-black text-gray-400 transition-colors">2</button>
             <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xs font-black text-gray-400 transition-colors">3</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
