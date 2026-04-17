import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Settings, 
  Filter,
  CreditCard,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { walletService } from '../services/api';

const ownerId = 'OWN001'; // Default for demo

const categories = [
  { id: 'FUEL', label: 'Fuel', icon: '⛽', limit: 7000 },
  { id: 'FOOD', label: 'Food', icon: '🍲', limit: 2000 },
  { id: 'TOLL', label: 'Toll', icon: '🛣️', limit: 1000 },
  { id: 'REPAIR', label: 'Repair', icon: '🔧', limit: 500 },
  { id: 'OTHER', label: 'Other', icon: '📦', limit: 500 },
];

const activeWallets = [
  { id: 'W001', driver: 'Rajesh Kumar', truck: 'TRK-9021', route: 'Delhi → Mumbai', allocated: 15000, spent: 8420, status: 'ACTIVE' },
  { id: 'W002', driver: 'Suresh Singh', truck: 'TRK-4412', route: 'Bangalore → Chennai', allocated: 8000, spent: 7850, status: 'CRITICAL' },
  { id: 'W003', driver: 'Amit Verma', truck: 'TRK-1105', route: 'Pune → Surat', allocated: 12000, spent: 2100, status: 'ACTIVE' },
];

const payouts = [
  { id: 'P001', vendor: 'HPCL Petrol Pump', amount: 4500, status: 'PROCESSED', time: '2 mins ago', utr: 'UTR992811' },
  { id: 'P002', vendor: 'Highway Dhaba', amount: 850, status: 'PROCESSING', time: '5 mins ago', utr: 'PENDING' },
  { id: 'P003', vendor: 'Toll Plaza A1', amount: 120, status: 'PROCESSED', time: '12 mins ago', utr: 'UTR992805' },
];

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [allocationData, setAllocationData] = useState({
    driver_id: '',
    truck_id: '',
    route_id: `RT-${Math.floor(Math.random() * 90000) + 10000}`,
    amount_inr: 0
  });

  const fetchData = async () => {
    try {
      const [balData, tripsData] = await Promise.all([
        walletService.getOwnerBalance(ownerId),
        walletService.getOwnerAllTrips(ownerId)
      ]);
      setBalance(balData.available_balance || 0);
      setAllocations(tripsData.wallets || []);
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const fetchAssets = async () => {
      try {
        const [司机, 卡车] = await Promise.all([
          fleetService.listDrivers(),
          fleetService.listTrucks()
        ]);
        setDrivers(司机.drivers || []);
        setTrucks(卡车.trucks || []);
      } catch (e) {
        console.error('Failed to fetch assets for allocation', e);
      }
    };
    fetchAssets();
  }, []);

  const handleLoadFunds = async () => {
    try {
      // Typically this would open a payment gateway link
      const res = await walletService.createLoadLink(ownerId, 5000); // 5000 is example
      if (res.payment_url) {
        window.open(res.payment_url, '_blank');
      } else {
        alert('Payment link generated: ' + (res.checkout_url || 'Check console'));
      }
      setIsLoadModalOpen(false);
    } catch (e) {
      alert('Failed to generate load link');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      await walletService.allocateFunds(ownerId, allocationData);
      setIsAllocateModalOpen(false);
      fetchData();
      setAllocationData({
        driver_id: '',
        truck_id: '',
        route_id: `RT-${Math.floor(Math.random() * 90000) + 10000}`,
        amount_inr: 0
      });
    } catch (e) {
      alert('Allocation failed. Check balance and asset mapping.');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Fleet Wallet</h1>
          <p className="text-gray-400 font-medium mt-1">Manage platform funds, driver allocations, and spending controls.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <History className="w-4 h-4" />
            Statements
          </button>
          <button 
            onClick={handleLoadFunds}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-900 rounded-2xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Load Funds
          </button>
        </div>
      </div>

      {/* Top Section: Balance & Quick Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <WalletIcon className="w-6 h-6 text-white" />
                </div>
                <CreditCard className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-indigo-200 font-bold tracking-wider text-xs uppercase mb-2">Total Platform Balance</p>
              <h2 className="text-4xl font-black mb-8 tracking-tight">₹{balance.toLocaleString()}</h2>
              
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
                  <p className="text-indigo-200 text-[10px] font-bold uppercase mb-1">Allocated</p>
                  <p className="font-bold">₹{allocations.reduce((acc, curr) => acc + (curr.allocated || curr.amount_inr || 0), 0).toLocaleString()}</p>
                </div>
                <div className="flex-1 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
                  <p className="text-indigo-200 text-[10px] font-bold uppercase mb-1">Available</p>
                  <p className="font-bold">₹{balance.toLocaleString()}</p>
                </div>
              </div>
            </div>
            {/* Visual background accents */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">New Trip Allocation</h3>
            </div>
            
            <form onSubmit={handleAllocate} className="grid grid-cols-2 gap-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase px-1">Select Driver</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={allocationData.driver_id}
                  onChange={(e) => setAllocationData({...allocationData, driver_id: e.target.value})}
                >
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.driverId} value={d.driverId}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase px-1">Truck ID</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={allocationData.truck_id}
                  onChange={(e) => setAllocationData({...allocationData, truck_id: e.target.value})}
                >
                  <option value="">Select Truck</option>
                  {trucks.map(t => <option key={t.truckId} value={t.truckId}>{t.truckId}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase px-1">Route / Trip ID</label>
                <input 
                  required
                  type="text" 
                  placeholder="RT-XXXXX" 
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                  value={allocationData.route_id}
                  onChange={(e) => setAllocationData({...allocationData, route_id: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase px-1">Amount (₹)</label>
                <input 
                  required
                  type="number" 
                  placeholder="5000" 
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                  value={allocationData.amount_inr}
                  onChange={(e) => setAllocationData({...allocationData, amount_inr: parseFloat(e.target.value)})}
                />
              </div>
              <div className="col-span-2 pt-2">
                <button type="submit" className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Trip Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Active Wallets & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">Active Trip Wallets</h3>
            <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Driver / Truck</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Route</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Budget</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Spent</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(allocations.length > 0 ? allocations : activeWallets).map((wallet) => (
                  <tr key={wallet.id || wallet.wallet_id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{wallet.driver || wallet.driver_id}</p>
                      <p className="text-xs font-medium text-gray-400">{wallet.truck || wallet.truck_id}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-semibold text-gray-600">{wallet.route || wallet.route_id}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <p className="font-bold text-gray-900">₹{(wallet.allocated || wallet.amount_inr || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <p className={(wallet.status === 'CRITICAL' || wallet.status === 'EXHAUSTED') ? 'font-bold text-rose-600' : 'font-bold text-gray-900'}>
                        ₹{(wallet.spent || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={(wallet.status === 'CRITICAL' || wallet.status === 'EXHAUSTED') ? 'bg-rose-500 h-full' : 'bg-indigo-600 h-full'} 
                          style={{ width: `${((wallet.spent || 0) / (wallet.allocated || wallet.amount_inr || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">Category Limits</h3>
            <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-bold text-gray-700">{cat.label}</span>
                  </div>
                  <span className="text-xs font-black text-gray-400 tracking-tight">Max ₹{cat.limit}</span>
                </div>
                <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-900 h-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Status: GPay-Style */}
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold text-gray-900">Recent Payouts</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3" />
            Live Polling
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payouts.map((payout) => (
            <div key={payout.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-indigo-600">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Vendor Paid</p>
                  <h4 className="font-bold text-gray-900 leading-tight">{payout.vendor}</h4>
                </div>
                <div className={
                  payout.status === 'PROCESSED' 
                    ? 'text-emerald-600' 
                    : payout.status === 'PROCESSING' 
                    ? 'text-amber-500 animate-pulse' 
                    : 'text-gray-400'
                }>
                  {payout.status === 'PROCESSED' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
              </div>
              
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-sm font-bold text-gray-400">₹</span>
                <span className="text-2xl font-black text-gray-900">{payout.amount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                <p className="text-[10px] font-black text-gray-300 uppercase leading-none">Ref: {payout.utr}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${payout.status === 'PROCESSED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">{payout.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
