import axios from 'axios';

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

console.log('Using API endpoint:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      
      // Instead of using window.location.href, we'll set a flag
      // that components can check to redirect using React Router
      sessionStorage.setItem('auth_redirect', 'true');
      
      // If we're not already on the login page, reload the page
      // This will trigger the auth check in ProtectedRoute
      if (!window.location.pathname.includes('/login')) {
        // Use replace state instead of location.href
        window.history.replaceState({}, '', '/login');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
