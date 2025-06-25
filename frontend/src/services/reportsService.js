import api from './api.js';

const reportsService = {
  // Get daily report
  getDailyReport: async (date) => {
    try {
      console.log(`Fetching daily report for date: ${date || 'today'}`);
      const response = await api.get(`/reports/daily${date ? `?date=${date}` : ''}`);
      console.log('Daily report response:', response.data);
      
      // Check if response has data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // If response is already the data object, return it
      if (response.data && typeof response.data === 'object') {
        return response.data;
      }
      
      // Default to empty data if no valid data
      console.warn('Unexpected daily report data format:', response.data);
      return {
        date: date || new Date().toISOString().split('T')[0],
        total_passengers: 0,
        active_sessions: 0,
        sessions: [],
        records: []
      };
    } catch (error) {
      console.error('Error fetching daily report:', error);
      // Return empty data instead of throwing to prevent component from breaking
      return {
        date: date || new Date().toISOString().split('T')[0],
        total_passengers: 0,
        active_sessions: 0,
        sessions: [],
        records: []
      };
    }
  },

  // Get weekly report
  getWeeklyReport: async (startDate, endDate) => {
    try {
      console.log(`Fetching weekly report from ${startDate} to ${endDate}`);
      const response = await api.get(`/reports/weekly?start_date=${startDate}&end_date=${endDate}`);
      console.log('Weekly report response:', response.data);
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      if (response.data && typeof response.data === 'object') {
        return response.data;
      }
      
      console.warn('Unexpected weekly report data format:', response.data);
      return {
        start_date: startDate,
        end_date: endDate,
        total_passengers: 0,
        daily_counts: [],
        driver_performance: [],
        vehicle_performance: []
      };
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      return {
        start_date: startDate,
        end_date: endDate,
        total_passengers: 0,
        daily_counts: [],
        driver_performance: [],
        vehicle_performance: []
      };
    }
  },

  // Get monthly report
  getMonthlyReport: async (year, month) => {
    try {
      console.log(`Fetching monthly report for ${year}-${month}`);
      const response = await api.get(`/reports/monthly?year=${year}&month=${month}`);
      console.log('Monthly report response:', response.data);
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      if (response.data && typeof response.data === 'object') {
        return response.data;
      }
      
      console.warn('Unexpected monthly report data format:', response.data);
      return {
        year: year,
        month: month,
        total_passengers: 0,
        daily_averages: [],
        top_drivers: [],
        top_vehicles: []
      };
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      return {
        year: year,
        month: month,
        total_passengers: 0,
        daily_averages: [],
        top_drivers: [],
        top_vehicles: []
      };
    }
  },

  // Get driver performance report
  getDriverPerformanceReport: async (startDate, endDate) => {
    try {
      console.log(`Fetching driver performance report from ${startDate} to ${endDate}`);
      const response = await api.get(`/reports/driver-performance?start_date=${startDate}&end_date=${endDate}`);
      console.log('Driver performance report response:', response.data);
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected driver performance data format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching driver performance report:', error);
      return [];
    }
  },

  // Get vehicle utilization report
  getVehicleUtilizationReport: async (startDate, endDate) => {
    try {
      console.log(`Fetching vehicle utilization report from ${startDate} to ${endDate}`);
      const response = await api.get(`/reports/vehicle-utilization?start_date=${startDate}&end_date=${endDate}`);
      console.log('Vehicle utilization report response:', response.data);
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('Unexpected vehicle utilization data format:', response.data);
      return [];
    } catch (error) {
      console.error('Error fetching vehicle utilization report:', error);
      return [];
    }
  }
};

export default reportsService;
