import axios from 'axios';

// When empty, Axios uses relative paths (/api/...) which are proxied by Vite to the backend.
// This ensures mobile/tablet devices on the same Wi-Fi connect seamlessly without CORS or localhost errors.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Attach JWT access token and fallback username/email headers dynamically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('papertrade_access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  const username = localStorage.getItem('papertrade_username');
  if (username) {
    config.headers['X-User-Username'] = username;
  }
  const email = localStorage.getItem('papertrade_user_email');
  if (email) {
    config.headers['X-User-Email'] = email;
  }
  return config;
});

export const stockApi = {
  // Stock Analytics & Indicators
  getMetrics: async (ticker, timeframe = '1y', refresh = false) => {
    const response = await apiClient.get(`/api/stock/${ticker}/metrics`, {
      params: { timeframe, refresh },
    });
    return response.data;
  },

  searchStocks: async (query = '', country = null) => {
    const params = {};
    if (query) params.q = query;
    if (country) params.country = country;
    const response = await apiClient.get('/api/stock/search', { params });
    return response.data;
  },

  getMarketIndices: async () => {
    const response = await apiClient.get('/api/stock/indices');
    return response.data;
  },

  getExportUrl: (ticker, timeframe = '2y', format = 'csv') => {
    const origin = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000');
    return `${origin}/api/stock/${ticker}/export?timeframe=${timeframe}&format=${format}`;
  },

  // Paper Trading Operations (Unified Multi-Market Capital)
  getPortfolio: async () => {
    const response = await apiClient.get('/api/trading/portfolio');
    return response.data;
  },

  executeOrder: async (ticker, orderType, shares) => {
    const response = await apiClient.post('/api/trading/order', {
      ticker,
      order_type: orderType.toUpperCase(),
      shares: parseFloat(shares),
    });
    return response.data;
  },

  getTransactions: async (limit = 50) => {
    const response = await apiClient.get('/api/trading/transactions', {
      params: { limit },
    });
    return response.data;
  },

  resetPortfolio: async () => {
    const response = await apiClient.post('/api/trading/reset');
    return response.data;
  },

  switchCurrency: async (currency) => {
    const response = await apiClient.post('/api/trading/switch-currency', null, {
      params: { currency },
    });
    return response.data;
  },

  // Secure Authentication & Market Profiles
  register: async (username, password, email = null, defaultCountry = 'IN', defaultCurrency = null, avatarUrl = null) => {
    const response = await apiClient.post('/api/auth/register', {
      username,
      password,
      email: email && email.trim() ? email.trim() : null,
      avatar_url: avatarUrl,
      default_country: defaultCountry,
      default_currency: defaultCurrency,
    });
    return response.data;
  },

  googleLogin: async (googleId, email, name, avatarUrl = null, defaultCountry = 'IN') => {
    const response = await apiClient.post('/api/auth/google', {
      google_id: googleId,
      email,
      name,
      avatar_url: avatarUrl,
      default_country: defaultCountry,
    });
    return response.data;
  },

  login: async (usernameOrEmail, password) => {
    const response = await apiClient.post('/api/auth/login', {
      username_or_email: usernameOrEmail,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  },

  updateAvatar: async (avatarUrl) => {
    const response = await apiClient.post('/api/auth/avatar', {
      avatar_url: avatarUrl,
    });
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.post('/api/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  completeOnboarding: async (country, currency = null) => {
    const response = await apiClient.post('/api/auth/onboard', {
      country,
      currency,
    });
    return response.data;
  },

  getMarketProfiles: async () => {
    const response = await apiClient.get('/api/auth/market-profiles');
    return response.data;
  },

  getMarketStatus: async (countryCode) => {
    const response = await apiClient.get(`/api/auth/market-status/${countryCode}`);
    return response.data;
  },
};

export default apiClient;
