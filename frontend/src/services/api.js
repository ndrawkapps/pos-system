import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401) {
      // Don't logout on auth check endpoint failure
      if (originalRequest.url?.includes('/auth/me')) {
        return Promise.reject(error);
      }
      
      // Only logout and redirect if it's a genuine auth failure
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Handle network errors or 503 (service unavailable during cold start)
    if (!error.response || error.response?.status === 503) {
      // Don't logout on network/cold start errors
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
