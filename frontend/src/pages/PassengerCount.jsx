import React, { useState, useEffect, useCallback } from 'react';
import LineChart from '../components/LineChart';
import { reportService, sessionService, passengerService } from '../services';

const PassengerCount = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyChartData, setWeeklyChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Weekly Passengers',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
      },
    ],
  });
  
  const [monthlyChartData, setMonthlyChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Monthly Passengers',
        data: [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
      },
    ],
  });
  
  const [activeSessions, setActiveSessions] = useState([]);
  const [realtimeLoading, setRealtimeLoading] = useState(true);
  
  // Modal and passenger records state
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [passengerRecords, setPassengerRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  };

  // Calculate time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const now = new Date();
    const updatedAt = new Date(timestamp);
    const diffMs = now - updatedAt;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Handle view passenger records
  const handleViewRecords = async (session) => {
    try {
      setRecordsLoading(true);
      setSelectedSession(session);
      setShowModal(true);
      
      console.log('Fetching passenger records for session:', session.id);
      const response = await passengerService.getPassengersBySessionId(session.id);
      console.log('API Response:', response);
      
      // Extract passengers from response
      let records = [];
      if (response && response.passengers) {
        records = Array.isArray(response.passengers) ? response.passengers : [];
      } else if (response && response.data && response.data.passengers) {
        records = Array.isArray(response.data.passengers) ? response.data.passengers : [];
      } else if (Array.isArray(response)) {
        records = response;
      }
      
      console.log('Processed records:', records);
      setPassengerRecords(records);
    } catch (error) {
      console.error('Error fetching passenger records:', error);
      setPassengerRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setPassengerRecords([]);
  };

  // Fetch chart data function
  const fetchChartData = useCallback(async () => {
    try {
      if (loading) setLoading(true);
      
      // Calculate date ranges
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      
      const todayFormatted = formatDate(today);
      const oneWeekAgoFormatted = formatDate(oneWeekAgo);
      
      // Fetch weekly data
      try {
        const weeklyData = await reportService.getWeeklyReport(oneWeekAgoFormatted, todayFormatted);
        
        console.log('Weekly data received:', weeklyData);
        console.log('Requested date range:', oneWeekAgoFormatted, 'to', todayFormatted);
        console.log('Received date range:', weeklyData?.start_date, 'to', weeklyData?.end_date);
        
        if (weeklyData && weeklyData.daily_counts && weeklyData.daily_counts.length > 0) {
          // Sort the daily counts by date to ensure they're in chronological order
          const sortedDailyCounts = [...weeklyData.daily_counts].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
          
          const labels = sortedDailyCounts.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          });
          
          const data = sortedDailyCounts.map(day => Number(day.count || 0));
          
          setWeeklyChartData({
            labels,
            datasets: [
              {
                label: 'Weekly Passengers',
                data,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
              },
            ],
          });
        }
      } catch (weeklyError) {
        console.error('Error fetching weekly data:', weeklyError);
      }
      
      // Fetch monthly data using the monthly report endpoint
      try {
        // Get current month and year
        const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = today.getFullYear();
        
        console.log('Fetching monthly report for:', currentYear, currentMonth);
        const monthlyData = await reportService.getMonthlyReport(currentMonth, currentYear);
        
        if (monthlyData && monthlyData.daily_counts && monthlyData.daily_counts.length > 0) {
          // Sort the daily counts by date to ensure they're in chronological order
          const sortedDailyCounts = [...monthlyData.daily_counts].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
          
          // Format the dates as day numbers (1, 2, 3, etc.)
          const labels = sortedDailyCounts.map(day => {
            const date = new Date(day.date);
            return date.getDate(); // Just the day number
          });
          
          const data = sortedDailyCounts.map(day => Number(day.count || 0));
          
          // Get month name for the chart title
          const monthName = today.toLocaleDateString('en-US', { month: 'long' });
          
          setMonthlyChartData({
            labels,
            datasets: [
              {
                label: `${monthName} ${currentYear} Passengers`,
                data,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
              },
            ],
          });
        }
      } catch (monthlyError) {
        console.error('Error fetching monthly data:', monthlyError);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load passenger count data. Please try again later.');
      setLoading(false);
    }
  }, [loading]);
    // Fetch real-time data function
  const fetchRealtimeData = useCallback(async () => {
    try {
      // Fetch active sessions for real-time data
      console.log('Refreshing real-time passenger data...', new Date().toLocaleTimeString());
      const sessions = await sessionService.getActiveSessions();
      
      // Set the data from API - handle different response formats
      if (sessions && Array.isArray(sessions)) {
        console.log('Received active sessions data:', sessions.length, 'sessions');
        setActiveSessions(sessions);
      } else if (sessions && sessions.data && Array.isArray(sessions.data)) {
        console.log('Received active sessions data:', sessions.data.length, 'sessions');
        setActiveSessions(sessions.data);
      } else {
        console.log('No active sessions data received or empty array');
        setActiveSessions([]);
      }
      
      // Set loading to false after first successful fetch
      if (realtimeLoading) {
        setRealtimeLoading(false);
      }
    } catch (sessionError) {
      console.error('Error fetching active sessions:', sessionError);
      
      // Set empty array on error
      setActiveSessions([]);
      
      // Set loading to false even if there's an error
      if (realtimeLoading) {
        setRealtimeLoading(false);
      }
    }
  }, [realtimeLoading]);

  // Set up initial data fetch only (no auto-refresh)
  useEffect(() => {
    console.log('Setting up passenger count page (auto-refresh disabled)');
    
    // Initial data fetch
    fetchChartData();
    fetchRealtimeData();
    
    // Clean up function (empty but kept for consistency)
    return () => {
      console.log('Passenger count page cleanup');
    };
  }, [fetchChartData, fetchRealtimeData]);  // Show loading or error state
  if (loading) {    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">Error</div>
            <div className="text-gray-600">{error}</div>
            <button 
              onClick={() => {
                fetchChartData();
                fetchRealtimeData();
              }}
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
      <div className="p-6">
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>
            Passenger Count
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
            onClick={() => {
              fetchChartData();
              fetchRealtimeData();
            }}
            title="Refresh all data"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            textAlign: 'center',
            margin: '0 0 15px 0'
          }}>
            Passenger Count Trend Weekly
          </h3>
          <div style={{ width: '100%' }}>
            <LineChart data={weeklyChartData} height={200} />
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            textAlign: 'center',
            margin: '0 0 15px 0'
          }}>
            Passenger Count Trend This Month
          </h3>
          <div style={{ width: '100%' }}>
            <LineChart data={monthlyChartData} height={200} />
          </div>
        </div>
      </div>
      
      {/* Real-time Passenger Data */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '20px'
      }}>        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            margin: '0'
          }}>
            Real-time Passenger Data
          </h3>
        </div><div style={{
          overflowX: 'auto'
        }}>
          {realtimeLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading real-time data...
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    Vehicle ID
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    Driver
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    Current Count
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    Last Update
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.length > 0 ? (
                  activeSessions.map((session) => (
                    <tr key={session.id} style={{
                      borderBottom: '1px solid #eee'
                    }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: '500'
                      }}>
                        {session.mobil?.nomor_mobil || 'Unknown'}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {session.driver?.nama_driver || 'Unknown'}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px'
                      }}>
                        {session.passenger_count} passengers
                      </td>
                      <td style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {timeAgo(session.updated_at || session.start_time)}
                      </td>
                      <td style={{
                        padding: '12px'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32'
                        }}>
                          Active
                        </span>
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleViewRecords(session)}
                            style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                          >
                            View
                          </button>
                          <button style={{
                            backgroundColor: '#ff9800',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f57c00'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ff9800'}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ 
                      textAlign: 'center', 
                      padding: '40px',
                      fontSize: '14px',
                      color: '#666',
                      borderBottom: 'none'
                    }}>
                      No active sessions found
                    </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
      
      {/* Passenger Records Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            width: '90%',
            maxWidth: '600px',
            padding: '20px',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#333',
                margin: '0'
              }}>
                Passenger Records
              </h3>
              <button 
                onClick={handleCloseModal}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                title="Close"
              >
                &times;
              </button>
            </div>
            
            {recordsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Loading passenger records...
              </div>
            ) : (
              <div>
                {passengerRecords.length > 0 ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        gridColumn: 'span 4',
                        backgroundColor: '#f0f8ff',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #b0e0f0',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333'
                      }}>
                        Session ID: {selectedSession?.id}
                      </div>
                      
                      <div style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <strong>Vehicle ID:</strong> {selectedSession?.mobil?.nomor_mobil || 'Unknown'}
                      </div>
                      
                      <div style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <strong>Driver:</strong> {selectedSession?.driver?.nama_driver || 'Unknown'}
                      </div>
                      
                      <div style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <strong>Start Time:</strong> {new Date(selectedSession?.start_time).toLocaleString()}
                      </div>
                      
                      <div style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <strong>End Time:</strong> {selectedSession?.end_time ? new Date(selectedSession.end_time).toLocaleString() : 'N/A'}
                      </div>
                      
                      <div style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <strong>Total Passengers:</strong> {selectedSession?.passenger_count || 0}
                      </div>
                    </div>
                    
                    <div style={{
                      marginBottom: '15px',
                      fontSize: '14px',
                      color: '#333'
                    }}>
                      <strong>Passenger List:</strong>
                    </div>
                    
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: '20px'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                          <th style={{
                            padding: '10px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#666'
                          }}>
                            ID
                          </th>
                          <th style={{
                            padding: '10px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#666'
                          }}>
                            RFID Code
                          </th>
                          <th style={{
                            padding: '10px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#666'
                          }}>
                            Timestamp
                          </th>
                          <th style={{
                            padding: '10px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#666'
                          }}>
                            Created At
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {passengerRecords.map((record) => (
                          <tr key={record.id} style={{
                            borderBottom: '1px solid #eee'
                          }}>
                            <td style={{
                              padding: '10px',
                              fontSize: '14px',
                              color: '#333'
                            }}>
                              {record.id}
                            </td>
                            <td style={{
                              padding: '10px',
                              fontSize: '14px',
                              color: '#333'
                            }}>
                              {record.rfid_code}
                            </td>
                            <td style={{
                              padding: '10px',
                              fontSize: '14px',
                              color: '#333'
                            }}>
                              {new Date(record.timestamp).toLocaleString()}
                            </td>
                            <td style={{
                              padding: '10px',
                              fontSize: '14px',
                              color: '#333'
                            }}>
                              {new Date(record.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No passenger records found for this session.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerCount;
