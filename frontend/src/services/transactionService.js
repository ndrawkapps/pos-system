import api from "./api";

const transactionService = {
  create: (data) => {
    return api.post("/transactions", data);
  },

  getAll: (params) => {
    return api.get("/transactions", { params });
  },

  getById: (id) => {
    return api.get(`/transactions/${id}`);
  },

  saveHeldOrder: (data) => {
    return api.post("/transactions/held-orders", data);
  },

  getHeldOrders: (shift_id) => {
    return api.get("/transactions/held-orders/list", { params: { shift_id } });
  },

  deleteHeldOrder: (id) => {
    return api.delete(`/transactions/held-orders/${id}`);
  },
};

export default transactionService;
