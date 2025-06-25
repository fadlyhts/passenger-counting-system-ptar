import api from './api.js';

const driverService = {
  // Get all drivers
  getAllDrivers: async () => {
    try {
      const response = await api.get('/driver');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get driver by ID
  getDriverById: async (id) => {
    try {
      const response = await api.get(`/driver/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new driver
  createDriver: async (driverData) => {
    try {
      const response = await api.post('/driver', driverData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update driver
  updateDriver: async (id, driverData) => {
    try {
      const response = await api.put(`/driver/${id}`, driverData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete driver
  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/driver/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get driver login history
  getDriverLoginHistory: async (id) => {
    try {
      const response = await api.get(`/driver/${id}/login-history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Update driver password (for driver's own password)
  updatePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/driver/password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get driver statistics
  getDriverStats: async () => {
    try {
      const response = await api.get('/driver/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      // Return mock data if API fails
      return {
        totalDrivers: 24,
        activeDrivers: 18,
        inactiveDrivers: 6,
        onlineNow: 12
      };
    }
  },

  // Get driver passenger count data for chart
  getDriverPassengerData: async () => {
    try {
      const response = await api.get('/driver/passenger-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching driver passenger data:', error);
      // Return mock data if API fails
      return {
        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
        data: [0, 2, 15, 45, 78, 95, 120, 110, 85, 95, 75, 35]
      };
    }
  }
};

export default driverService;
