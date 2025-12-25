import axios from 'axios';
import { logout } from './auth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

/* =========================
   Request Interceptor
========================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   Response Interceptor
========================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout on auth failure
    if (error.response && error.response.status === 401) {
      logout();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
