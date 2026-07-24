import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token from localStorage into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auraPlanToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Centralized response interceptor for token expiration check
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized or expired token. Redirecting to login...');
      localStorage.removeItem('auraPlanToken');
      localStorage.removeItem('auraPlanUser');
      // Dispatch custom event to let AuthContext know
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
