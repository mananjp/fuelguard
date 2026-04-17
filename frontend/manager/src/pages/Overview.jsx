import React from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { SpendChart } from '../components/dashboard/SpendChart';
import { RiskProfile } from '../components/dashboard/RiskProfile';
import { AlertsTable } from '../components/dashboard/AlertsTable';
import { Truck, MapPin, Receipt, AlertTriangle } from 'lucide-react';
import { fleetService } from '../services/api';

export default function Overview() {
  const [stats, setStats] = React.useState({
    total_trucks: '1,248',
    active_trips: '856',
    fuel_spend_today: '$42,305',
    fraud_alerts: '12'
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fleetService.getOverview();
        if (data) {
          setStats({
            total_trucks: data.total_trucks?.toLocaleString() || '1,248',
            active_trips: data.active_trips?.toLocaleString() || '856',
            fuel_spend_today: `₹${data.fuel_spend_today?.toLocaleString() || '42,305'}`,
            fraud_alerts: data.total_alerts || '12'
          });
        }
      } catch (e) {
        console.error('Fleet overview failed', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview Dashboard</h1>
        <p className="text-gray-400 font-medium mt-1">Real-time monitoring of fleet performance and fuel security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Truck} 
          title="Total Trucks" 
          value={stats.total_trucks} 
          trend="up" 
          trendValue="2.5%" 
          iconBg="bg-blue-50" 
          iconColor="text-blue-600"
        />
        <StatCard 
          icon={MapPin} 
          title="Active Trips" 
          value={stats.active_trips} 
          trend="up" 
          trendValue="4.1%" 
          iconBg="bg-purple-50" 
          iconColor="text-purple-600"
        />
        <StatCard 
          icon={Receipt} 
          title="Fuel Spend Today" 
          value={stats.fuel_spend_today} 
          trend="down" 
          trendValue="1.2%" 
          iconBg="bg-orange-50" 
          iconColor="text-orange-600"
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Fraud Alerts" 
          value={stats.fraud_alerts} 
          alert={true}
          iconBg="bg-rose-50" 
          iconColor="text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SpendChart />
        </div>
        <div>
          <RiskProfile />
        </div>
      </div>

      <AlertsTable />
    </div>
  );
}
