import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Request Interceptor: Attach JWT Token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages & handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      const data = error.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      } else if (data.detail) {
        message = data.detail;
      } else if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        message = Array.isArray(firstVal) ? firstVal[0] : `${firstKey}: ${firstVal}`;
      }

      if (error.response.status === 401) {
        // Token expired or invalid
        // localStorage.removeItem('token');
        // localStorage.removeItem('role');
      }
    } else if (error.request) {
      message = 'Unable to connect to the MedQ server. Please ensure the backend is running.';
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
export { API_BASE_URL };
