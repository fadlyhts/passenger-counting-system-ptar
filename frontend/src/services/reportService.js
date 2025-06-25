import api from './api.js';

const reportService = {
  // Get daily report
  getDailyReport: async (date) => {
    try {
      const response = await api.get(`/reports/daily?date=${date}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get weekly report
  getWeeklyReport: async (startDate, endDate) => {
    try {
      console.log('Fetching weekly report...', { startDate, endDate });
      
      // Note: The API may return a different date range than requested
      // For example, requesting 2025-06-12 to 2025-06-19 might return 2025-06-11 to 2025-06-19
      // This is a backend behavior we need to handle
      
      // Use start_date and end_date as query parameters (backend expects these)
      const response = await api.get(`/reports/weekly?startDate=${startDate}&endDate=${endDate}`);
      console.log('Weekly report response:', response.data);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        // Log the actual date range returned by the API
        console.log('API returned date range:', 
                   response.data.data.start_date || 'unknown', 
                   'to', 
                   response.data.data.end_date || 'unknown');
        
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // If response is an object with a specific structure, try to extract data
      if (response.data && typeof response.data === 'object') {
        // Try to find an array property
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`Found array data in property: ${key}`);
            return response.data[key];
          }
        }
      }
      
      // Default to empty array if no valid data
      console.warn('Unexpected report data format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  },

  // Get monthly report
  getMonthlyReport: async (month, year) => {
    try {
      console.log('Fetching monthly report...', { month, year });
      const response = await api.get(`/reports/monthly?month=${month}&year=${year}`);
      console.log('Monthly report response:', response.data);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already an array, return it
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Default to empty object if no valid data
      console.warn('Unexpected monthly report data format:', response.data);
      return {};
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      // Return empty object instead of throwing to prevent dashboard from breaking
      return {};
    }
  },

  // Get driver report
  getDriverReport: async (driverId, startDate, endDate) => {
    try {
      const response = await api.get(`/reports/driver/${driverId}?start_date=${startDate}&end_date=${endDate}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get vehicle report
  getVehicleReport: async (vehicleId, startDate, endDate) => {
    try {
      const response = await api.get(`/reports/mobil/${vehicleId}?start_date=${startDate}&end_date=${endDate}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default reportService;
