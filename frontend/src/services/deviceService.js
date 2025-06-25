import api from './api.js';

const deviceService = {
  // Get all devices
  getAllDevices: async () => {
    try {
      console.log('Fetching all devices...');
      const response = await api.get('/device');
      console.log('Device response:', response.data);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Default to empty array if no valid data
      console.warn('Unexpected device data format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  },

  // Get device by ID
  getDeviceById: async (id) => {
    try {
      const response = await api.get(`/device/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new device
  createDevice: async (deviceData) => {
    try {
      const response = await api.post('/device', deviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update device
  updateDevice: async (id, deviceData) => {
    try {
      const response = await api.put(`/device/${id}`, deviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete device
  deleteDevice: async (id) => {
    try {
      const response = await api.delete(`/device/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update device status
  updateDeviceStatus: async (id, status) => {
    try {
      const response = await api.put(`/device/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default deviceService;
