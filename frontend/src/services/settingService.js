import api from "./api";

const settingService = {
  getAll: () => {
    return api.get("/settings");
  },

  update: (key, value) => {
    return api.post("/settings", { key, value });
  },
};

export default settingService;
