import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService, driverService, authService } from '../../services';

const Driver = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  // Check if user is authorized (must be a driver)
  useEffect(() => {
    const userType = authService.getUserType();
    if (userType !== 'driver') {
      console.log('Non-driver detected in driver page, redirecting to /dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [navigate]);
  
  // Stats state
  const [driverStats, setDriverStats] = useState({
    passengersToday: 0,
    hoursThisWeek: 0,
    sessionsThisMonth: 0,
    currentSessionStatus: 'Inactive'
  });

  // Modal state for starting session
  const [showStartModal, setShowStartModal] = useState(false);
  const [startSessionForm, setStartSessionForm] = useState({
    mobil_id: ''
  });
  const [startSessionError, setStartSessionError] = useState('');
  const [startSessionLoading, setStartSessionLoading] = useState(false);

  // Modal state for ending session
  const [showEndModal, setShowEndModal] = useState(false);
  const [endSessionLoading, setEndSessionLoading] = useState(false);

  // Session details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Calculate session duration
  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for display
  const formatDateOnly = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };  // Get current driver from auth
  const getCurrentDriver = async () => {
    try {
      console.log('=== getCurrentDriver called ===');
      // Get the current user data from auth (stored from login)
      const user = authService.getCurrentUser();
      console.log('Current user from localStorage:', user);
      console.log('User type from localStorage:', authService.getUserType());
      
      if (user && user.id) {
        console.log('User has ID, using stored driver data:', user);
        // Use the stored user data directly since it contains driver info from login
        return user;
      }
      
      console.log('No current user found or user has no ID');
      throw new Error('No driver data available. Please log in again.');
    } catch (error) {
      console.error('=== getCurrentDriver error ===');
      console.error('Error getting current driver:', error);
      throw error;
    }
  };
  // Fetch driver data and sessions
  const fetchDriverData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Starting fetchDriverData ===');

      // Get current driver
      const driver = await getCurrentDriver();
      console.log('Got driver from getCurrentDriver:', driver);
      
      if (!driver) {
        console.error('No driver data available');
        throw new Error('No driver found. Please make sure you are logged in as a driver.');
      }
      
      console.log('Setting driver data:', driver);
      setDriverData(driver);      // Get driver's sessions
      console.log('Fetching sessions for driver ID:', driver.id);
      try {
        const sessionsResponse = await sessionService.getSessionsByDriverId(driver.id);
        console.log('Sessions response:', sessionsResponse);
        
        // Handle different response formats from the API
        let sessionList = [];
        if (sessionsResponse && sessionsResponse.data) {
          sessionList = Array.isArray(sessionsResponse.data) ? sessionsResponse.data : [];
        } else if (Array.isArray(sessionsResponse)) {
          sessionList = sessionsResponse;
        }
        
        console.log('Processed session list:', sessionList);
        
        // Find current active session
        const activeSession = sessionList.find(session => session.status === 'active');
        setCurrentSession(activeSession || null);

        // Set session history (completed sessions)
        const completedSessions = sessionList
          .filter(session => session.status === 'completed')
          .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        setSessionHistory(completedSessions);

        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Passengers today
        const todaySessions = sessionList.filter(session => {
          const sessionDate = new Date(session.start_time);
          return sessionDate >= today;
        });
        const passengersToday = todaySessions.reduce((sum, session) => sum + (session.passenger_count || 0), 0);

        // Hours this week
        const weekSessions = sessionList.filter(session => {
          const sessionDate = new Date(session.start_time);
          return sessionDate >= weekStart;
        });
        const hoursThisWeek = weekSessions.reduce((sum, session) => {
          if (session.start_time && session.end_time) {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            return sum + (end - start) / (1000 * 60 * 60);
          }
          return sum;
        }, 0);

        // Sessions this month
        const monthSessions = sessionList.filter(session => {
          const sessionDate = new Date(session.start_time);
          return sessionDate >= monthStart;
        });

        setDriverStats({
          passengersToday,
          hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
          sessionsThisMonth: monthSessions.length,
          currentSessionStatus: activeSession ? 'Active' : 'Inactive'
        });
      } catch (sessionError) {
        console.warn('Error fetching sessions, using default values:', sessionError);
        // If sessions API fails, just set empty data
        setCurrentSession(null);
        setSessionHistory([]);
        setDriverStats({
          passengersToday: 0,
          hoursThisWeek: 0,
          sessionsThisMonth: 0,
          currentSessionStatus: 'Inactive'
        });
      }
      
      console.log('=== fetchDriverData completed successfully ===');} catch (error) {
      console.error('=== fetchDriverData error ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      setError(`Failed to load driver data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch vehicles for dropdown
  const fetchVehicles = useCallback(async () => {
    try {
      const vehicleService = (await import('../../services')).vehicleService;
      const vehiclesData = await vehicleService.getAllVehicles();
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData.filter(v => v.status === 'active') : []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }, []);

  // Handle start session modal
  const handleOpenStartModal = () => {
    setShowStartModal(true);
    setStartSessionForm({ mobil_id: '' });
    setStartSessionError('');
  };

  const handleCloseStartModal = () => {
    setShowStartModal(false);
    setStartSessionForm({ mobil_id: '' });
    setStartSessionError('');
  };

  const handleStartSessionChange = (e) => {
    setStartSessionForm({ mobil_id: e.target.value });
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStartSessionError('');
    setStartSessionLoading(true);

    try {
      if (!driverData) throw new Error('Driver data not available');
      
      await sessionService.startSession(driverData.id, startSessionForm.mobil_id);
      
      // Add delay and refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchDriverData();
      handleCloseStartModal();
    } catch (error) {
      console.error('Error starting session:', error);
      setStartSessionError(
        error.response?.data?.message || 
        error.message || 
        'Failed to start session'
      );
    } finally {
      setStartSessionLoading(false);
    }
  };

  // Handle end session
  const handleOpenEndModal = () => {
    setShowEndModal(true);
  };

  const handleCloseEndModal = () => {
    setShowEndModal(false);
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    
    setEndSessionLoading(true);
    try {
      await sessionService.endSession(currentSession.id);
      
      // Add delay and refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchDriverData();
      handleCloseEndModal();
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session: ' + (error.response?.data?.message || error.message));
    } finally {
      setEndSessionLoading(false);
    }
  };

  // Handle session details modal
  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSession(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login', { replace: true });
    }
  };
  useEffect(() => {
    // Check if user is a driver
    const userType = authService.getUserType();
    if (userType !== 'driver') {
      navigate('/dashboard', { replace: true });
      return;
    }

    fetchDriverData();
    fetchVehicles();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDriverData();
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchDriverData, fetchVehicles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">Error</div>
            <div className="text-gray-600">{error}</div>
            <button 
              onClick={fetchDriverData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                src="/assets/logo/PTAR_Logo.png"
                alt="PTAR Logo"
                className="h-10 w-auto mr-4"
              />
              <h1 className="text-xl font-bold text-gray-900">
                Driver Portal - {driverData?.nama_driver || 'Driver'}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Track your sessions and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Passengers Today</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.passengersToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hours This Week</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.hoursThisWeek}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sessions This Month</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.sessionsThisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                driverStats.currentSessionStatus === 'Active' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Session</p>
                <p className="text-2xl font-bold text-gray-900">{driverStats.currentSessionStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Session Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Current Session</h3>
          </div>
          
          <div className="p-6">
            {currentSession ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vehicle</p>
                  <p className="text-lg font-bold text-gray-900">{currentSession.mobil?.nomor_mobil || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Time</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(currentSession.start_time)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-gray-900">{calculateDuration(currentSession.start_time, null)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Passengers</p>
                  <p className="text-lg font-bold text-gray-900">{currentSession.passenger_count || 0}</p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleOpenEndModal}
                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    End Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
                <p className="text-gray-600 mb-4">Start a new session to begin tracking your ride</p>
                <button
                  onClick={handleOpenStartModal}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Start Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Session History</h3>
              <button
                onClick={fetchDriverData}
                disabled={loading}
                className="px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 disabled:opacity-50"
                title="Refresh history"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {sessionHistory.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No session history</h3>
                <p className="mt-1 text-sm text-gray-500">Your completed sessions will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Vehicle</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Start Time</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">End Time</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Duration</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Passengers</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory.map((session) => (
                      <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatDateOnly(session.start_time)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {session.mobil?.nomor_mobil || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(session.start_time)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {session.end_time ? formatDate(session.end_time) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {calculateDuration(session.start_time, session.end_time)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {session.passenger_count || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleViewDetails(session)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors duration-200"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Start New Session</h3>
            
            {startSessionError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {startSessionError}
              </div>
            )}
            
            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle *
                </label>
                <select
                  name="mobil_id"
                  value={startSessionForm.mobil_id}
                  onChange={handleStartSessionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nomor_mobil}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseStartModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={startSessionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startSessionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold"
                >
                  {startSessionLoading ? 'Starting...' : 'Start Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">End Session</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to end your current session? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseEndModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={endSessionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={endSessionLoading}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {endSessionLoading ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Session Details</h3>
              <button
                onClick={handleCloseDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Session Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Session ID</p>
                    <p className="font-medium">#{selectedSession.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium">{selectedSession.mobil?.nomor_mobil || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Driver</p>
                    <p className="font-medium">{selectedSession.driver?.nama_driver || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {selectedSession.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Time & Passengers</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Start Time</p>
                    <p className="font-medium">{formatDate(selectedSession.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Time</p>
                    <p className="font-medium">{selectedSession.end_time ? formatDate(selectedSession.end_time) : 'Not ended'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{calculateDuration(selectedSession.start_time, selectedSession.end_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Passengers</p>
                    <p className="font-medium text-2xl text-blue-600">{selectedSession.passenger_count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseDetailsModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Driver;
