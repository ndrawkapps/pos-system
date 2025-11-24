import api from "./api";

const productService = {
  getAll: (params) => {
    return api.get("/products", { params });
  },

  getById: (id) => {
    return api.get(`/products/${id}`);
  },

  create: (formData) => {
    return api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  update: (id, formData) => {
    return api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (id) => {
    return api.delete(`/products/${id}`);
  },
};

export default productService;
