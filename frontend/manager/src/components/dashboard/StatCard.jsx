import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function StatCard({ icon: Icon, title, value, trend, trendValue, iconBg, iconColor, alert }) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        
        {trendValue && (
          <div className={cn(
            "text-xs font-bold px-2 py-1 rounded-lg",
            isPositive ? "text-emerald-600 bg-emerald-50" : 
            isNegative ? "text-rose-600 bg-rose-50" : "text-gray-600 bg-gray-50"
          )}>
            {isPositive ? '+' : ''}{trendValue}
          </div>
        )}

        {alert && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
            High Alert
          </div>
        )}
      </div>

      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">{value}</h3>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gray-50 rounded-full group-hover:scale-150 transition-transform duration-500 -z-10 opacity-50"></div>
    </div>
  );
}
