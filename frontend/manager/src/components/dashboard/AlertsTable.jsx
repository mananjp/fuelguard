import React from 'react';

const alerts = [
  { id: 'T-1248', status: 'In Transit', location: 'Houston, TX', detail: 'Abnormal Fuel Consumption (+15%)', severity: 'medium' },
  { id: 'T-856', status: 'Stationary', location: 'Austin, TX', detail: 'Multiple Offline Events (Last 1h)', severity: 'high' },
  { id: 'T-423', status: 'Fueling', location: 'Dallas, TX', detail: 'Manual Transaction Bypass Attempt', severity: 'critical' },
];

export function AlertsTable() {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mt-8">
      <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Active Alerts & Anomalies</h3>
        <button className="text-indigo-600 text-xs font-bold hover:underline">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              {['Vehicle ID', 'Status', 'Location', 'Anomaly Detail', 'Actions'].map((h) => (
                <th key={h} className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-5 text-sm font-bold text-gray-900">{alert.id}</td>
                <td className="px-8 py-5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                    {alert.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-gray-500">{alert.location}</td>
                <td className="px-8 py-5 text-sm font-medium text-gray-900">{alert.detail}</td>
                <td className="px-8 py-5">
                  <button className="text-indigo-600 text-xs font-bold bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
