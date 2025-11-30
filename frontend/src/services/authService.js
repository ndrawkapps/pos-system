import api from "./api";

// Retry helper for cold start scenarios
const retryRequest = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      const isNetworkError =
        !error.response ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK";

      // Only retry on network errors or 503 (service unavailable)
      const shouldRetry =
        !isLastAttempt && (isNetworkError || error.response?.status === 503);

      if (shouldRetry) {
        console.log(`Login attempt ${i + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
};

const authService = {
  login: (username, password) => {
    return retryRequest(() => api.post("/auth/login", { username, password }));
  },

  getCurrentUser: () => {
    // Add retry for getCurrentUser to handle cold starts after refresh
    return retryRequest(() => api.get("/auth/me"), 2, 1500);
  },

  changePassword: (oldPassword, newPassword) => {
    return api.post("/auth/change-password", { oldPassword, newPassword });
  },
};

export default authService;
