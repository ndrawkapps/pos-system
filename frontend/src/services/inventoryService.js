import api from './api';

// ==================== INGREDIENTS ====================

export const getIngredients = async (isActive = null) => {
  try {
    const params = {};
    if (isActive !== null) {
      params.is_active = isActive;
    }
    const response = await api.get('/inventory/ingredients', { params });
    return response.data;
  } catch (error) {
    console.error('Get ingredients error:', error);
    throw error;
  }
};

export const getIngredientById = async (id) => {
  try {
    const response = await api.get(`/inventory/ingredients/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get ingredient error:', error);
    throw error;
  }
};

export const createIngredient = async (data) => {
  try {
    const response = await api.post('/inventory/ingredients', data);
    return response.data;
  } catch (error) {
    console.error('Create ingredient error:', error);
    throw error;
  }
};

export const updateIngredient = async (id, data) => {
  try {
    const response = await api.put(`/inventory/ingredients/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update ingredient error:', error);
    throw error;
  }
};

export const deleteIngredient = async (id) => {
  try {
    const response = await api.delete(`/inventory/ingredients/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete ingredient error:', error);
    throw error;
  }
};

// ==================== STOCK MOVEMENTS ====================

export const adjustStock = async (data) => {
  try {
    const response = await api.post('/inventory/stock/adjust', data);
    return response.data;
  } catch (error) {
    console.error('Adjust stock error:', error);
    throw error;
  }
};

export const getStockMovements = async (filters = {}) => {
  try {
    const response = await api.get('/inventory/stock/movements', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Get stock movements error:', error);
    throw error;
  }
};

// ==================== PRODUCT RECIPES ====================

export const getProductRecipe = async (productId) => {
  try {
    const response = await api.get(`/inventory/recipes/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Get product recipe error:', error);
    throw error;
  }
};

export const setProductRecipe = async (productId, recipes) => {
  try {
    const response = await api.post(`/inventory/recipes/${productId}`, { recipes });
    return response.data;
  } catch (error) {
    console.error('Set product recipe error:', error);
    throw error;
  }
};

// ==================== STOCK CHECK ====================

export const checkProductsStock = async (items) => {
  try {
    const response = await api.post('/inventory/check-stock', { items });
    return response.data;
  } catch (error) {
    console.error('Check products stock error:', error);
    throw error;
  }
};
