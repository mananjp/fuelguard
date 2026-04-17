import React from 'react';
import { 
  FileText, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Ban, 
  Eye 
} from 'lucide-react';
import { alertService } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';

export default function FraudAlerts() {
  const [alertsList, setAlertsList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ pending: 12, resolved: 8, score: 24.5 });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertService.getAlerts();
      setAlertsList(data.alerts || []);
      // Ideally these would come from an analytics endpoint
      setStats({
        pending: (data.alerts || []).length,
        resolved: 8,
        score: 24.5
      });
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAlerts();
  }, []);

  const resolveAlert = async (id) => {
    try {
      await alertService.resolveAlert(id);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert', error);
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fraud Monitoring</h1>
          <p className="text-gray-400 font-medium mt-1">Real-time AI analysis of fleet fueling behavior and risk scoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-900 rounded-xl text-sm font-bold text-white hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100">
            <Zap className="w-4 h-4" />
            Force Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="HIGH RISK ALERTS" 
          value={stats.pending.toString()} 
          trend="+4%" 
          icon={ShieldAlert}
          alert={true}
        />
        <StatCard 
          title="AVG FRAUD SCORE" 
          value={stats.score.toString()} 
          trend="-12%" 
          icon={Zap}
        />
        <StatCard 
          title="RESOLVED TODAY" 
          value={stats.resolved.toString()} 
          trend="In progress" 
          icon={ShieldCheck}
        />
      </div>

      <div className="border-b border-gray-100 pb-4 flex items-center gap-8">
        <button className="flex items-center gap-2 text-sm font-black text-indigo-900 border-b-2 border-indigo-900 pb-4 -mb-4.5">
          <AlertCircle className="w-4 h-4" />
          Pending Review (12)
        </button>
        <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
          <CheckCircle2 className="w-4 h-4" />
          Resolved
        </button>
        <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
          <Ban className="w-4 h-4" />
          Blocked Drivers
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest">Scanning fleet for anomalies...</div>
        ) : alertsList.length === 0 ? (
          <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest">No active fraud alerts detected.</div>
        ) : (
          alertsList.map((alert) => (
            <div key={alert.id || alert.alert_id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row relative group hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
              <div className={cn(
                "w-1 md:w-2 shrink-0 h-full absolute left-0 top-0",
                (alert.status === 'High' || alert.priority === 'CRITICAL') ? "bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.3)]" : (alert.status === 'Medium' || alert.priority === 'MEDIUM') ? "bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.3)]" : "bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.3)]"
              )} />
              
              <div className="flex-1 p-8 md:pl-12 flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center text-indigo-400 font-black shadow-inner">
                      {(alert.driver || alert.driver_id || '??').split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg leading-tight">{alert.driver || alert.driver_id}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {alert.driverId || alert.id} • Truck: {alert.truck || alert.truck_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</p>
                    <p className="text-sm font-bold text-gray-600 mt-1">{alert.timestamp || alert.time}</p>
                  </div>
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-400">
                      <span>Fraud Score</span>
                      <span className={cn(
                        (alert.status === 'High' || alert.priority === 'CRITICAL') ? "text-red-500" : (alert.status === 'Medium' || alert.priority === 'MEDIUM') ? "text-amber-500" : "text-blue-500"
                      )}>{alert.fraudScore || alert.score || 85}/100</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          (alert.status === 'High' || alert.priority === 'CRITICAL') ? "bg-red-500" : (alert.status === 'Medium' || alert.priority === 'MEDIUM') ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${alert.fraudScore || alert.score || 85}%` }}
                      />
                    </div>
                  </div>
  
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Issue Description</p>
                    <p className="text-sm font-bold text-gray-600 leading-relaxed">{alert.issue || alert.description}</p>
                  </div>
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-900 rounded-2xl text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100 group-hover:-translate-y-0.5 active:translate-y-0">
                    <Eye className="w-4 h-4" />
                    Investigate
                  </button>
                  <button 
                    onClick={() => resolveAlert(alert.id || alert.alert_id)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-100 rounded-2xl text-emerald-700 text-sm font-black uppercase tracking-widest hover:bg-emerald-200 transition-all group-hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-100 rounded-2xl text-red-600 text-sm font-black uppercase tracking-widest hover:bg-red-200 transition-all group-hover:-translate-y-0.5 active:translate-y-0">
                    <Ban className="w-4 h-4" />
                    Block
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between py-6 pt-12">
        <p className="text-sm font-bold text-gray-400">Showing <span className="text-gray-900">1-3</span> of <span className="text-gray-900">12</span> alerts</p>
        <div className="flex items-center gap-1.5">
           <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-900 text-white text-sm font-black shadow-lg shadow-indigo-100">1</button>
           <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-sm font-black text-gray-400 transition-all">2</button>
           <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-sm font-black text-gray-400 transition-all">3</button>
           <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-sm font-black text-gray-400 transition-all">4</button>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
