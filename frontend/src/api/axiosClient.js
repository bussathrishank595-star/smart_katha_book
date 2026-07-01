import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
