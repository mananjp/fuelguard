import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import FuelEvents from './pages/FuelEvents';
import FraudAlerts from './pages/FraudAlerts';
import PaymentAnalytics from './pages/PaymentAnalytics';
import DriverManagement from './pages/DriverManagement';
import TruckMonitoring from './pages/TruckMonitoring';
import Trips from './pages/Trips';
import Wallet from './pages/Wallet';
import TruckDetail from './pages/TruckDetail';
import DriverDetail from './pages/DriverDetail';
import Stations from './pages/Stations';
import Transactions from './pages/Transactions';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/fuel-events" element={<FuelEvents />} />
          <Route path="/fraud-alerts" element={<FraudAlerts />} />
          <Route path="/analytics" element={<PaymentAnalytics />} />
          <Route path="/drivers" element={<DriverManagement />} />
          <Route path="/drivers/:id" element={<DriverDetail />} />
          <Route path="/trucks" element={<TruckMonitoring />} />
          <Route path="/trucks/:id" element={<TruckDetail />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
