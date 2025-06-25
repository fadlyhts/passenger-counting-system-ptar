import api from './api.js';

const adminService = {
  // Get all admins
  getAllAdmins: async () => {
    try {
      const response = await api.get('/admin');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get admin by ID
  getAdminById: async (id) => {
    try {
      const response = await api.get(`/admin/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new admin
  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/admin', adminData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update admin
  updateAdmin: async (id, adminData) => {
    try {
      const response = await api.put(`/admin/${id}`, adminData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete admin
  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/admin/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default adminService;
