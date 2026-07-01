import axios from 'axios';

// Detect if we are running in production (Vercel) or development (local)
const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';

const baseURL = isProd 
  ? 'https://smart-katha-book.onrender.com/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Safe inject token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kb_token');
    if (token) {
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        config.headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
