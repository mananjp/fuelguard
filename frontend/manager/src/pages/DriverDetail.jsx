import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Shield,
  MapPin,
  ArrowLeft,
  CreditCard,
  History,
  AlertTriangle,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { fleetService } from '../services/api';

const paymentHistory = [
  { id: 'TXN101', amount: 8420, category: 'FUEL', vendor: 'HPCL Station', date: 'Yesterday, 14:20', status: 'PROCESSED' },
  { id: 'TXN102', amount: 450, category: 'FOOD', vendor: 'Highway Dhaba', date: 'Yesterday, 13:15', status: 'PROCESSED' },
  { id: 'TXN103', amount: 120, category: 'TOLL', vendor: 'Toll Plaza A1', date: 'Yesterday, 11:45', status: 'PROCESSED' },
  { id: 'TXN104', amount: 2200, category: 'FUEL', vendor: 'Reliance Fuel', date: '2 days ago', status: 'PROCESSED' },
];

export default function DriverDetail() {
  const { id } = useParams();
  const [driverDetail, setDriverDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDriver = async () => {
      try {
        const data = await fleetService.getDriver(id);
        setDriverDetail(data);
      } catch (error) {
        console.error('Failed to fetch driver details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black text-gray-400 tracking-widest uppercase">Authenticating Driver Bio...</div>;
  if (!driverDetail) return <div className="p-20 text-center font-black text-red-400 tracking-widest uppercase">Driver Not Found</div>;

  const driver = {
    name: driverDetail.name || id,
    driverId: driverDetail.driverId || 'DRV-UNKNOWN',
    trustScore: driverDetail.trust_score || 94,
    trips: driverDetail.total_trips || 42,
    distance: `${(driverDetail.total_distance || 8420).toLocaleString()} km`,
    type: driverDetail.license_type || 'Heavy Duty',
    since: driverDetail.joined_date || 'Oct 2023',
    status: driverDetail.status || 'Active',
    walletBalance: `₹${(driverDetail.current_balance || 3420).toLocaleString()} available`
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/drivers" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-900 flex items-center justify-center text-white text-2xl font-black shadow-xl border-4 border-white">
              {driver.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{driver.name}</h1>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                  {driver.status}
                </span>
              </div>
              <p className="text-gray-400 font-medium mt-1">ID: {driver.driverId} • {driver.type} • Since {driver.since}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            Contact Driver
          </button>
          <button className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all border border-red-100">
            Blacklist Driver
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Trust Score" value={`${driver.trustScore}%`} trend="Top 5%" icon={Shield} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard title="Total Trips" value={driver.trips} trend="+4 this month" icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard title="Cumulative Distance" value={driver.distance} trend="Verified" icon={Award} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard title="Current Allocation" value={driver.walletBalance} trend="Expiring in 2d" icon={CreditCard} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">Expense History</h3>
            <button className="text-indigo-600 text-sm font-bold hover:underline">Download Report</button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction / Vendor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paymentHistory.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{txn.vendor}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{txn.id}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
                        {txn.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <p className="font-bold text-gray-900">₹{txn.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-xs font-bold text-gray-400">{txn.date}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* trust analysis & profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-900">Trust Analysis</h3>
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-gray-500">Integrity Score</p>
                <p className="text-2xl font-black text-emerald-500">98/100</p>
              </div>
              <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '98%' }}></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-gray-500">Efficiency Score</p>
                <p className="text-2xl font-black text-indigo-900">89/100</p>
              </div>
              <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-900 h-full" style={{ width: '89%' }}></div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-black text-orange-900 uppercase tracking-widest">Ongoing Risk</p>
                  <p className="text-[10px] font-medium text-orange-700">No active alerts for this driver.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Assigned Active Asset</h4>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <div className="w-10 h-10 bg-indigo-900 rounded-xl flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-indigo-900">TX-7742</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Volvo VNL 800</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
