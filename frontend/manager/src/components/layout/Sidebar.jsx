import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Fuel, 
  ShieldAlert, 
  BarChart3, 
  Users, 
  Truck, 
  Settings, 
  Droplets, 
  Navigation, 
  AlertTriangle,
  Wallet,
  Receipt,
  MapPin
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/overview' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { label: 'Fuel Events', icon: Droplets, path: '/fuel-events' },
  { label: 'Trips', icon: Navigation, path: '/trips' },
  { label: 'Fraud Alerts', icon: AlertTriangle, path: '/fraud-alerts' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Receipt, label: 'Transactions', path: '/transactions' },
  { icon: MapPin, label: 'Stations', path: '/stations' },
  { icon: Users, label: 'Drivers', path: '/drivers' },
  { icon: Truck, label: 'Trucks', path: '/trucks' },
];

export function Sidebar() {
  return (
    <div className="flex shrink-0 w-64 flex-col bg-white border-r border-gray-100 h-screen sticky top-0 overflow-y-auto z-50">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100 shrink-0 sticky top-0 bg-white z-10">
        <div className="bg-indigo-900 p-2 rounded-lg">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl text-indigo-900">FuelGuard</span>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              isActive 
                ? "bg-indigo-900 text-white shadow-lg shadow-indigo-100" 
                : "text-gray-400 hover:bg-gray-50 hover:text-indigo-600"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all duration-200">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </div>
  );
}
