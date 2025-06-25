import api from './api.js';

const vehicleService = {
  // Get all vehicles
  getAllVehicles: async () => {
    try {
      console.log('Fetching all vehicles...');
      const response = await api.get('/mobil');
      console.log('Vehicle response:', response.data);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Default to empty array if no valid data
      console.warn('Unexpected vehicle data format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  },

  // Get vehicle by ID
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/mobil/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new vehicle
  createVehicle: async (vehicleData) => {
    try {
      const response = await api.post('/mobil', vehicleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update vehicle
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await api.put(`/mobil/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete vehicle
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/mobil/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get vehicle session history
  getVehicleSessionHistory: async (id) => {
    try {
      const response = await api.get(`/mobil/${id}/sessions`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default vehicleService;
