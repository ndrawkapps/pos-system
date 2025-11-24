import api from "./api";

const authService = {
  login: (username, password) => {
    return api.post("/auth/login", { username, password });
  },

  getCurrentUser: () => {
    return api.get("/auth/me");
  },

  changePassword: (oldPassword, newPassword) => {
    return api.post("/auth/change-password", { oldPassword, newPassword });
  },
};

export default authService;
