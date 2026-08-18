import axios from 'axios';

const getApiBaseUrl = () => {
  // 1. If env variable is set (e.g. Vercel environment), use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 2. Auto-detect: if running on localhost or local network, use local backend
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') || 
                  hostname.startsWith('10.') || 
                  hostname.startsWith('172.');
  if (isLocal) {
    return `http://${hostname}:5000/api/v1`;
  }
  // 3. Production fallback — Railway backend
  return 'https://sweetflow-backend-production.up.railway.app/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

