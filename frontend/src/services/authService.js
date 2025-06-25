import api from './api';

const authService = {
  // Admin login
  adminLogin: async (username, password) => {
    try {
      console.log('Attempting admin login with:', { username });
      const response = await api.post('/auth/admin/login', { username, password });
      console.log('Login response:', response.data);
      
      // Check for token in different possible response structures
      const token = response.data.token || 
                   (response.data.data && response.data.data.token);
      
      // Check for user data in different possible response structures
      const userData = response.data.user || 
                      response.data.admin || 
                      (response.data.data && response.data.data.admin);
      
      console.log('Extracted token:', token);
      console.log('Extracted user data:', userData);
      
      if (token) {
        localStorage.setItem('token', token);
        
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // If no user data, create minimal user object
          localStorage.setItem('user', JSON.stringify({ username, role: 'admin' }));
        }
        
        localStorage.setItem('userType', 'admin');
        console.log('Data saved to localStorage');
      } else {
        console.error('No token found in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Driver login
  driverLogin: async (username, password) => {
    try {
      console.log('Attempting driver login with:', { username });
      const response = await api.post('/auth/driver/login', { username, password });
      console.log('Login response:', response.data);
      
      // Check for token in different possible response structures
      const token = response.data.token || 
                   (response.data.data && response.data.data.token);
      
      // Check for user data in different possible response structures
      const userData = response.data.user || 
                      response.data.driver || 
                      (response.data.data && response.data.data.driver);
        console.log('Extracted token:', token);
      console.log('Extracted user data:', userData);
      
      if (token) {
        localStorage.setItem('token', token);
        
        if (userData) {
          // Normalize the driver data to match what the frontend expects
          const normalizedUserData = {
            ...userData,
            nama_driver: userData.name || userData.nama_driver // Backend returns 'name', frontend expects 'nama_driver'
          };
          localStorage.setItem('user', JSON.stringify(normalizedUserData));
        } else {
          // If no user data, create minimal user object
          localStorage.setItem('user', JSON.stringify({ username, role: 'driver' }));
        }
        
        localStorage.setItem('userType', 'driver');
        console.log('Data saved to localStorage');
      } else {
        console.error('No token found in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Driver login error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if the API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
    }
  },

  // Get user type (admin or driver)
  getUserType: () => {
    return localStorage.getItem('userType');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // Get current user profile from API (if needed)
  getCurrentUserProfile: async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error('No current user found');
      }

      // For drivers, get full profile from driver service
      if (authService.getUserType() === 'driver') {
        const driverService = (await import('./driverService')).default;
        return await driverService.getDriverById(user.id);
      }
      
      // For now, return stored user data for admins
      return user;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const userType = authService.getUserType();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        throw new Error('No current user found');
      }

      let response;

      if (userType === 'admin') {
        // Update admin profile using admin routes
        response = await api.put(`/admin/${currentUser.id}`, profileData);
      } else if (userType === 'driver') {
        // Update driver profile
        response = await api.put(`/driver/${currentUser.id}`, profileData);
      } else {
        throw new Error('Invalid user type');
      }

      // Update localStorage with new data
      const updatedUser = { ...currentUser, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const userType = authService.getUserType();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        throw new Error('No current user found');
      }

      let response;

      if (userType === 'admin') {
        // Change admin password using admin routes
        response = await api.put(`/admin/${currentUser.id}`, {
          password: passwordData.new_password
        });
      } else if (userType === 'driver') {
        // Change driver password
        response = await api.put(`/driver/${currentUser.id}`, {
          password: passwordData.new_password
        });
      } else {
        throw new Error('Invalid user type');
      }

      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

export default authService;
