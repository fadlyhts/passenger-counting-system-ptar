import React, { useState, useEffect } from 'react';
import { authService } from '../services';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Account Information State
  const [accountInfo, setAccountInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    status: ''
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load current user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Get user data from localStorage instead of API call
      const userData = authService.getCurrentUser();
      
      if (!userData) {
        setError('No user data found. Please login again.');
        return;
      }
      
      setAccountInfo({
        firstName: userData.name?.split(' ')[0] || userData.username || '',
        lastName: userData.name?.split(' ')[1] || '',
        email: userData.email || '',
        status: userData.status || 'Active'
      });
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountInfoChange = (e) => {
    const { name, value } = e.target;
    setAccountInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePasswordData = () => {
    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    return true;
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Update account information
      await authService.updateProfile({
        name: `${accountInfo.firstName} ${accountInfo.lastName}`.trim(),
        email: accountInfo.email
      });

      // Update password if provided
      if (passwordData.currentPassword && passwordData.newPassword) {
        if (!validatePasswordData()) {
          return;
        }

        await authService.changePassword({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        });

        // Clear password fields after successful change
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }

      setSuccess('Settings updated successfully');
      
      // Reload user data to reflect changes
      await loadUserData();
      
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset forms to original state
    loadUserData();
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Account Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h2>
          <p className="text-gray-600 mb-6">Update your account details and preferences</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={accountInfo.firstName}
                onChange={handleAccountInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={accountInfo.lastName}
                onChange={handleAccountInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="mt-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={accountInfo.email}
              onChange={handleAccountInfoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your email address"
            />
          </div>

          {/* Account Status */}
          <div className="mt-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <input
              type="text"
              id="status"
              name="status"
              value={accountInfo.status}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Change Password Section */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h2>
          <p className="text-gray-600 mb-6">Update your password to keep your account secure</p>

          {/* Current Password */}
          <div className="mb-6">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your current password"
            />
          </div>

          {/* New Password */}
          <div className="mb-6">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your new password"
            />
            <p className="text-sm text-gray-500 mt-1">Password must be at least 6 characters long</p>
          </div>

          {/* Confirm New Password */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
