import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'SEP 01', value: 400 },
  { name: 'SEP 05', value: 300 },
  { name: 'SEP 10', value: 550 },
  { name: 'SEP 15', value: 800 },
  { name: 'SEP 20', value: 450 },
  { name: 'SEP 25', value: 650 },
  { name: 'SEP 30', value: 500 },
];

export function SpendChart() {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold text-gray-900">Fuel Spend Over Time</h3>
        <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
          {['7D', '30D', '1Y'].map((t) => (
            <button
              key={t}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                t === '30D' ? "bg-indigo-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 3 ? '#1E1B4B' : '#C7D2FE'} 
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
