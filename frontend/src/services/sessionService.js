import api from './api.js';

const sessionService = {  // Get active sessions
  getActiveSessions: async () => {
    try {
      const response = await api.get('/session/active');
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Default to empty array if no valid data
      return [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  },  // Get sessions by date range
  getSessionsByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/session/date?start_date=${startDate}&end_date=${endDate}`);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Default to empty array if no valid data
      return [];
    } catch (error) {
      console.error('Error fetching sessions by date range:', error);
      // Return empty array instead of throwing to prevent component from breaking
      return [];
    }
  },

  // Get session by ID
  getSessionById: async (id) => {
    try {
      const response = await api.get(`/session/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Start session (clock in)
  startSession: async (driverId, mobilId) => {
    try {
      const response = await api.post('/session/start', {
        driver_id: driverId,
        mobil_id: mobilId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // End session (clock out)
  endSession: async (id) => {
    try {
      const response = await api.put(`/session/${id}/end`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },  // Get sessions by driver ID
  getSessionsByDriverId: async (driverId) => {
    try {
      const response = await api.get(`/session/driver/${driverId}`);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Default to empty array if no valid data
      return [];
    } catch (error) {
      console.error('Error fetching driver sessions:', error);
      throw error;    }
  }
};

export default sessionService;
