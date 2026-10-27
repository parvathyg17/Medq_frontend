import apiClient from './client';

export const authApi = {
  login: async (identifier, password) => {
    const response = await apiClient.post('/api/auth/login/', { identifier, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post('/api/auth/register/', userData);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get('/api/auth/me/');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await apiClient.patch('/api/auth/me/', profileData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await apiClient.post('/api/auth/change-password/', passwordData);
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await apiClient.post('/api/auth/forgot-password/', { email });
    return response.data;
  },
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/api/auth/reset-password/', { token, new_password: newPassword });
    return response.data;
  },
  getAddresses: async () => {
    const response = await apiClient.get('/api/auth/addresses/');
    return response.data;
  },
  addAddress: async (addressData) => {
    const response = await apiClient.post('/api/auth/addresses/', addressData);
    return response.data;
  },
  updateAddress: async (id, addressData) => {
    const response = await apiClient.put(`/api/auth/addresses/${id}/`, addressData);
    return response.data;
  },
  deleteAddress: async (id) => {
    const response = await apiClient.delete(`/api/auth/addresses/${id}/`);
    return response.data;
  },
  setDefaultAddress: async (id) => {
    const response = await apiClient.post(`/api/auth/addresses/${id}/set-default/`);
    return response.data;
  },
  getDeliveryBoys: async () => {
    const response = await apiClient.get('/api/delivery/all');
    return response.data;
  },
  getAvailableDeliveryBoys: async () => {
    const response = await apiClient.get('/api/delivery/available');
    return response.data;
  }
};

export const productsApi = {
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/api/products/', { params });
    return response.data;
  },
  getProductById: async (idOrSlug) => {
    const response = await apiClient.get(`/api/products/${idOrSlug}/`);
    return response.data;
  },
  getCategories: async () => {
    const response = await apiClient.get('/api/categories/');
    return response.data;
  },
  getByCategory: async (categoryName) => {
    const response = await apiClient.get('/api/products/by-category/', {
      params: { category: categoryName }
    });
    return response.data;
  },
  getFeatured: async () => {
    const response = await apiClient.get('/api/products/featured/');
    return response.data;
  },
  createProduct: async (formData) => {
    const response = await apiClient.post('/api/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  updateProduct: async (id, formData) => {
    const response = await apiClient.patch(`/api/products/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/api/products/${id}/`);
    return response.data;
  }
};

export const cartApi = {
  getCart: async () => {
    const response = await apiClient.get('/api/cart/');
    return response.data;
  },
  addItem: async (productId, quantity = 1) => {
    const response = await apiClient.post('/api/cart/add/', { productId, quantity });
    return response.data;
  },
  updateQuantity: async (productId, quantity) => {
    const response = await apiClient.put(`/api/cart/update/${productId}/`, { quantity });
    return response.data;
  },
  removeItem: async (productId) => {
    const response = await apiClient.delete(`/api/cart/remove/${productId}/`);
    return response.data;
  },
  clearCart: async () => {
    const response = await apiClient.delete('/api/cart/clear/');
    return response.data;
  }
};

export const ordersApi = {
  confirmOrder: async (orderPayload) => {
    const response = await apiClient.post('/api/orders/confirm', orderPayload);
    return response.data;
  },
  getOrders: async (email = null) => {
    const params = email ? { email } : {};
    const response = await apiClient.get('/api/orders/all', { params });
    return response.data;
  },
  getOrderById: async (id) => {
    const response = await apiClient.get(`/api/orders/${id}/`);
    return response.data;
  },
  cancelOrder: async (id) => {
    const response = await apiClient.delete(`/api/orders/${id}`);
    return response.data;
  },
  returnOrder: async (id, reason = '') => {
    const response = await apiClient.post(`/api/orders/${id}/return/`, { reason });
    return response.data;
  },
  getReturns: async (status = null) => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/api/orders/returns/', { params });
    return response.data;
  },
  approveReturn: async (orderId, adminNote = '') => {
    const response = await apiClient.post(`/api/orders/${orderId}/return/approve/`, { adminNote });
    return response.data;
  },
  rejectReturn: async (orderId, rejectionReason = '') => {
    const response = await apiClient.post(`/api/orders/${orderId}/return/reject/`, { rejectionReason });
    return response.data;
  },
  updateStatus: async (orderId, status) => {
    const response = await apiClient.put(`/api/orders/${orderId}/status/`, { status });
    return response.data;
  },
  assignDeliveryBoy: async (orderId, deliveryBoyId) => {
    const response = await apiClient.post('/api/delivery/assign', { orderId, deliveryBoyId });
    return response.data;
  },
  removeDeliveryBoy: async (orderId) => {
    const response = await apiClient.post('/api/delivery/remove', { orderId });
    return response.data;
  },
  getAssignedOrders: async (deliveryBoyId) => {
    const response = await apiClient.get(`/api/delivery/assigned-orders/${deliveryBoyId}`);
    return response.data;
  }
};

export const wishlistApi = {
  getWishlist: async () => {
    const response = await apiClient.get('/api/wishlist/');
    return response.data;
  },
  addItem: async (productId) => {
    const response = await apiClient.post('/api/wishlist/add/', { productId });
    return response.data;
  },
  removeItem: async (productId) => {
    const response = await apiClient.delete(`/api/wishlist/remove/${productId}/`);
    return response.data;
  }
};

export const feedbackApi = {
  submitContact: async (contactData) => {
    const response = await apiClient.post('/api/contact/submit', contactData);
    return response.data;
  },
  getAllMessages: async () => {
    const response = await apiClient.get('/api/contact/all');
    return response.data;
  },
  queryChat: async (query) => {
    const response = await apiClient.post('/api/feedback/chat/', { query });
    return response.data;
  }
};

export const adminApi = {
  getStats: async () => {
    const response = await apiClient.get('/api/admin/stats/');
    return response.data;
  },
  getUsers: async () => {
    const response = await apiClient.get('/api/admin/users/');
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/api/admin/users/${id}/`);
    return response.data;
  }
};
