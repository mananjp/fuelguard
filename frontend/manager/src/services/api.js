const API_BASE_URL = 'http://localhost:8000';

export const walletService = {
  getOwnerBalance: async (ownerId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/owner/${ownerId}/balance`);
    return response.json();
  },
  loadFunds: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/wallet/owner/load-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  createLoadLink: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/wallet/owner/create-load-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  allocateWallet: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/wallet/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  setLimit: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/wallet/set-limit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  getWalletDetails: async (walletId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/${walletId}`);
    return response.json();
  },
  getDriverActiveWallet: async (driverId, tripId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/driver/${driverId}/active?trip_id=${tripId}`);
    return response.json();
  },
  getWalletExpenses: async (walletId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/${walletId}/expenses`);
    return response.json();
  },
  closeWallet: async (walletId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/${walletId}/close`, {
      method: 'POST',
    });
    return response.json();
  },
  getOwnerAllTrips: async (ownerId, status = 'ACTIVE') => {
    const response = await fetch(`${API_BASE_URL}/wallet/owner/${ownerId}/all-trips?status=${status}`);
    return response.json();
  },
  getPayoutStatus: async (payoutId) => {
    const response = await fetch(`${API_BASE_URL}/wallet/payout-status/${payoutId}`);
    return response.json();
  }
};

export const fleetService = {
  getOverview: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/fleet`);
    return response.json();
  },
  getTruckAnalytics: async (truckId) => {
    const response = await fetch(`${API_BASE_URL}/dashboard/analytics/${truckId}`);
    return response.json();
  },
  listTrucks: async () => {
    const response = await fetch(`${API_BASE_URL}/trucks`);
    return response.json();
  },
  getTruck: async (truckId) => {
    const response = await fetch(`${API_BASE_URL}/trucks/${truckId}`);
    return response.json();
  },
  listDrivers: async () => {
    const response = await fetch(`${API_BASE_URL}/drivers`);
    return response.json();
  },
  getDriver: async (driverId) => {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`);
    return response.json();
  },
  listStations: async () => {
    const response = await fetch(`${API_BASE_URL}/fuel-stations`);
    return response.json();
  }
};

export const tripService = {
  getTrip: async (routeId) => {
    const response = await fetch(`${API_BASE_URL}/trip/${routeId}`);
    return response.json();
  },
  listTrips: async (ownerId = 'OWNER1') => {
    const response = await fetch(`${API_BASE_URL}/wallet/owner/${ownerId}/all-trips?status=ACTIVE`);
    return response.json();
  },
  startTrip: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/trip/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  }
};

export const alertService = {
  getAlerts: async (resolved = false) => {
    const response = await fetch(`${API_BASE_URL}/alerts?resolved=${resolved}`);
    return response.json();
  },
  resolveAlert: async (alertId, resolvedBy = 'fleet_manager') => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve?resolved_by=${resolvedBy}`, {
      method: 'PATCH',
    });
    return response.json();
  }
};

export const paymentService = {
  createPaymentLink: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  getPaymentStatus: async (paymentLinkId) => {
    const response = await fetch(`${API_BASE_URL}/payments/status/${paymentLinkId}`);
    return response.json();
  },
  getAnalytics: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/payments/analytics?${params}`);
    return response.json();
  },
  getDriverHistory: async (driverId) => {
    const response = await fetch(`${API_BASE_URL}/payments/driver/${driverId}`);
    return response.json();
  }
};

export const transactionService = {
  listTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/transactions?${params}`);
    return response.json();
  },
  getTransaction: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`);
    return response.json();
  },
  createFuelEntry: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/fuel/checkin/v2`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }
};

export const securityService = {
  checkGpsSpoofing: async (truckId, lastN = 20) => {
    const response = await fetch(`${API_BASE_URL}/security/gps-spoof/${truckId}?last_n=${lastN}`);
    return response.json();
  },
  getIdleReport: async (truckId, routeId) => {
    const params = routeId ? `?route_id=${routeId}` : '';
    const response = await fetch(`${API_BASE_URL}/security/idle-report/${truckId}${params}`);
    return response.json();
  },
  validateGst: async (gstNumber) => {
    const response = await fetch(`${API_BASE_URL}/security/gst/${gstNumber}`);
    return response.json();
  },
  addToBlacklist: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/security/blacklist/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  checkBlacklist: async (driverId) => {
    const response = await fetch(`${API_BASE_URL}/security/blacklist/${driverId}`);
    return response.json();
  },
  getActiveSos: async () => {
    const response = await fetch(`${API_BASE_URL}/security/sos/active`);
    return response.json();
  },
  verifyTripSeal: async (transactionId) => {
    const response = await fetch(`${API_BASE_URL}/security/seal/verify/${transactionId}`);
    return response.json();
  }
};
