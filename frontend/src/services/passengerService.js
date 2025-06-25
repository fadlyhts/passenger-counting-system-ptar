import api from './api.js';

const passengerService = {
  // Record passenger (from ESP32 device)
  recordPassenger: async (rfidCode, deviceId) => {
    try {
      const response = await api.post('/passenger/record', {
        rfid_code: rfidCode,
        device_id: deviceId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get passengers by session ID
  getPassengersBySessionId: async (sessionId) => {
    try {
      const response = await api.get(`/passenger/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get passenger by ID
  getPassengerById: async (id) => {
    try {
      const response = await api.get(`/passenger/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get passengers by RFID
  getPassengersByRfid: async (rfidCode) => {
    try {
      const response = await api.get(`/passenger/rfid/${rfidCode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default passengerService;
