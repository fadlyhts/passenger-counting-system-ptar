import React, { useState, useEffect, useCallback } from 'react';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { sessionService, driverService, vehicleService } from '../services';

const Sessions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    totalPassengers: 0
  });

  const [sessionDurationChartData, setSessionDurationChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Session Duration (hours)',
        data: [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
      },
    ],
  });
  
  const [sessionStatusChartData, setSessionStatusChartData] = useState({
    labels: ['Active', 'Completed'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(156, 39, 176, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(76, 175, 80, 0.9)',
          'rgba(156, 39, 176, 0.9)'
        ]
      }
    ]
  });

  // Modal state for adding session
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState({
    driver_id: '',
    mobil_id: ''
  });
  const [addSessionError, setAddSessionError] = useState('');
  const [addSessionLoading, setAddSessionLoading] = useState(false);

  // Modal state for ending session
  const [showEndModal, setShowEndModal] = useState(false);
  const [endSessionId, setEndSessionId] = useState(null);
  const [endSessionLoading, setEndSessionLoading] = useState(false);

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

  // Handle add session modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setAddSessionForm({
      driver_id: '',
      mobil_id: ''
    });
    setAddSessionError('');
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddSessionForm({
      driver_id: '',
      mobil_id: ''
    });
    setAddSessionError('');
  };

  const handleAddSessionChange = (e) => {
    const { name, value } = e.target;
    setAddSessionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleAddSession = async (e) => {
    e.preventDefault();
    setAddSessionError('');
    setAddSessionLoading(true);

    try {
      await sessionService.startSession(addSessionForm.driver_id, addSessionForm.mobil_id);
      
      // Add a small delay to ensure the backend has processed the new session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchSessionData();
      handleCloseAddModal();
    } catch (error) {
      console.error('Error starting session:', error);
      setAddSessionError(
        error.response?.data?.message || 
        error.message || 
        'Failed to start session'
      );
    } finally {
      setAddSessionLoading(false);
    }
  };

  // Handle end session modal
  const handleOpenEndModal = (sessionId) => {
    setEndSessionId(sessionId);
    setShowEndModal(true);
  };

  const handleCloseEndModal = () => {
    setShowEndModal(false);
    setEndSessionId(null);
  };
  const handleEndSession = async () => {
    if (!endSessionId) return;
    
    setEndSessionLoading(true);
    try {
      await sessionService.endSession(endSessionId);
      
      // Add a small delay to ensure the backend has processed the session end
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await fetchSessionData();
      handleCloseEndModal();
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session: ' + (error.response?.data?.message || error.message));
    } finally {
      setEndSessionLoading(false);
    }
  };  // Fetch sessions data
  const fetchSessionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);      // Get both active sessions and ALL historical sessions for admin dashboard
      const [activeSessionsData, dateRangeSessionsData] = await Promise.all([
        sessionService.getActiveSessions(),
        (async () => {
          // Get ALL sessions by using a very broad date range (last 5 years)
          // Account for timezone differences (Jakarta is UTC+7)
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 1); // Add 1 day to ensure we catch today's sessions
          
          const startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 5); // Go back 5 years
          startDate.setDate(startDate.getDate() - 1); // Go back 1 extra day to be safe
          
          console.log('Date range for session fetch:', {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            localTime: new Date().toLocaleString(),
            utcTime: new Date().toISOString()
          });
          
          return await sessionService.getSessionsByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
        })()
      ]);// Combine sessions, avoiding duplicates and prioritizing active sessions
      const allSessionsMap = new Map();
      
      // Add date range sessions first (as base)
      if (Array.isArray(dateRangeSessionsData)) {
        dateRangeSessionsData.forEach(session => {
          allSessionsMap.set(session.id, session);
        });
      }
      
      // Add or update with active sessions (they should be most current)
      if (Array.isArray(activeSessionsData)) {
        activeSessionsData.forEach(session => {
          allSessionsMap.set(session.id, session);
        });
      }
        const sessionsData = Array.from(allSessionsMap.values())
        .sort((a, b) => new Date(b.start_time || b.created_at) - new Date(a.start_time || a.created_at));      console.log('Sessions fetched for admin dashboard:', {
        activeSessionsCount: activeSessionsData?.length || 0,
        dateRangeSessionsCount: dateRangeSessionsData?.length || 0,
        totalUniqueSessionsCount: sessionsData.length,
        activeSessionsData: activeSessionsData,
        dateRangeSessionsData: dateRangeSessionsData,
        combinedSessionsData: sessionsData
      });

      setSessions(Array.isArray(sessionsData) ? sessionsData : []);      // Calculate stats
      const stats = {
        totalSessions: sessionsData.length,
        activeSessions: sessionsData.filter(session => session.status === 'active').length,  
        completedSessions: sessionsData.filter(session => session.status === 'completed').length,
        totalPassengers: sessionsData.reduce((sum, session) => sum + (session.passenger_count || 0), 0)
      };
      
      console.log('Admin dashboard session statistics:', stats);
      console.log('Individual session status breakdown:', sessionsData.map(session => ({
        id: session.id,
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time,
        passenger_count: session.passenger_count
      })));
      
      setSessionStats(stats);

      // Prepare duration chart data
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      const dailyDurations = last7Days.map(date => {
        const daySessions = sessionsData.filter(session => 
          session.start_time && session.start_time.startsWith(date)
        );
        const totalDuration = daySessions.reduce((sum, session) => {
          if (session.start_time && session.end_time) {
            const start = new Date(session.start_time);
            const end = new Date(session.end_time);
            return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
          }
          return sum;
        }, 0);
        return totalDuration;
      });

      setSessionDurationChartData({
        labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Total Session Duration (hours)',
            data: dailyDurations,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
          },
        ],
      });

      // Update status chart
      setSessionStatusChartData(prev => ({
        ...prev,
        datasets: [
          {
            ...prev.datasets[0],
            data: [stats.activeSessions, stats.completedSessions]
          }
        ]
      }));

    } catch (error) {
      console.error('Error fetching session data:', error);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch drivers and vehicles for dropdowns
  const fetchDropdownData = useCallback(async () => {
    try {
      const [driversData, vehiclesData] = await Promise.all([
        driverService.getAllDrivers(),
        vehicleService.getAllVehicles()
      ]);
      
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }, []);
  useEffect(() => {
    fetchSessionData();
    fetchDropdownData();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchSessionData();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchSessionData, fetchDropdownData]);

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
              onClick={fetchSessionData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>
            Sessions
          </h1>
          <button 
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onClick={fetchSessionData}
            title="Refresh vehicle data"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            Refresh Data
          </button>
        </div>
      </div>        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>
                  Total Sessions
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                  {sessionStats.totalSessions}
                </div>
                <div style={{ fontSize: '12px', color: '#2196F3', fontWeight: '500' }}>
                  All time
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>
                  Active Sessions
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                  {sessionStats.activeSessions}
                </div>
                <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                  Currently running
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>
                  Completed Sessions
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                  {sessionStats.completedSessions}
                </div>
                <div style={{ fontSize: '12px', color: '#9C27B0', fontWeight: '500' }}>
                  Finished trips
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>
                  Total Passengers
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                  {sessionStats.totalPassengers}
                </div>
                <div style={{ fontSize: '12px', color: '#FF9800', fontWeight: '500' }}>
                  All sessions
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg style={{ width: '24px', height: '24px', color: '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>        {/* Charts */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
                Session Duration Trends
              </h3>
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                Last 7 days duration
              </p>
            </div>
            <div style={{ height: '300px' }}>
              <LineChart data={sessionDurationChartData} />
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '20px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
                Session Status
              </h3>
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                Active vs Completed
              </p>
            </div>
            <div style={{ height: '250px' }}>
              <DonutChart data={sessionStatusChartData} />
            </div>
          </div>
        </div>{/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>Recent Sessions</h3>
              <div className="flex gap-3">
                <button
                  onClick={fetchSessionData}
                  disabled={loading}
                  className="px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 disabled:opacity-50"
                  title="Refresh sessions"
                >
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Driver</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Vehicle</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Start Time</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">End Time</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Duration</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Passengers</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {session.driver?.nama_driver || 'N/A'}
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
                        </td>                        <td className="py-3 px-4">
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: session.status === 'active' ? '#e8f5e8' : '#f3e5f5',
                            color: session.status === 'active' ? '#2e7d32' : '#7b1fa2'
                          }}>
                            {session.status === 'active' ? 'Active' : 'Completed'}
                          </span>
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

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>Start New Session</h3>
            
            {addSessionError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {addSessionError}
              </div>
            )}
            
            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver *
                </label>
                <select
                  name="driver_id"
                  value={addSessionForm.driver_id}
                  onChange={handleAddSessionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a driver</option>
                  {drivers.filter(driver => driver.status === 'active').map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.nama_driver}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle *
                </label>
                <select
                  name="mobil_id"
                  value={addSessionForm.mobil_id}
                  onChange={handleAddSessionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.filter(vehicle => vehicle.status === 'active').map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nomor_mobil}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={addSessionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSessionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold"
                >
                  {addSessionLoading ? 'Starting...' : 'Start Session'}
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
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>End Session</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this session? This action cannot be undone.
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
    </div>
  );
};

export default Sessions;
