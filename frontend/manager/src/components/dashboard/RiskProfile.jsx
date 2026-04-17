import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Low Risk', value: 82, color: '#1E1B4B' },
  { name: 'Suspicious', value: 15, color: '#FDBA74' },
  { name: 'High Risk', value: 3, color: '#EF4444' },
];

export function RiskProfile() {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[400px] flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-8">Fraud Risk Profile</h3>
      
      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-900">12</span>
          <span className="text-xs font-medium text-gray-400">Critical</span>
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.name}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
