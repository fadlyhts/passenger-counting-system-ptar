import React, { useState, useEffect, useCallback } from 'react';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { driverService } from '../services';

const Drivers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drivers, setDrivers] = useState([]);
  
  // Modal state for adding driver
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({
    rfid_code: '',
    nama_driver: '',
    username: '',
    email: '',
    password: '',
    status: 'active'
  });
  const [addDriverError, setAddDriverError] = useState('');
  const [addDriverLoading, setAddDriverLoading] = useState(false);

  // Modal state for editing driver
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDriverForm, setEditDriverForm] = useState({
    id: '',
    rfid_code: '',
    nama_driver: '',
    username: '',
    email: '',
    status: 'active'
  });
  const [editDriverError, setEditDriverError] = useState('');
  const [editDriverLoading, setEditDriverLoading] = useState(false);

  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDriverId, setDeleteDriverId] = useState(null);  const [deleteDriverLoading, setDeleteDriverLoading] = useState(false);
  
  const [driverStats, setDriverStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    inactiveDrivers: 0,
    onlineNow: 0
  });

  const [passengerChartData, setPassengerChartData] = useState({
    labels: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
    datasets: [
      {
        label: 'Passenger Count Today',
        data: [12, 25, 30, 45, 40, 35, 20],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
      },
    ],
  });

  const [driverStatusChartData, setDriverStatusChartData] = useState({
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(244, 67, 54, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(76, 175, 80, 0.9)',
          'rgba(244, 67, 54, 0.9)'
        ]
      }
    ]
  });

  // Calculate time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    
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
  };  // Fetch all driver data
  const fetchDriverData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch drivers data from API
      const driversResponse = await driverService.getAllDrivers();
      
      console.log('Drivers data:', driversResponse);
      
      // Set drivers data
      let driversData = [];
      if (driversResponse && Array.isArray(driversResponse)) {
        driversData = driversResponse;
      } else if (driversResponse && driversResponse.data && Array.isArray(driversResponse.data)) {
        driversData = driversResponse.data;
      }
      
      setDrivers(driversData);
      
      // Calculate real statistics from the actual data
      if (driversData.length > 0) {
        const totalDrivers = driversData.length;
        const activeDrivers = driversData.filter(driver => driver.status === 'active').length;
        const inactiveDrivers = driversData.filter(driver => driver.status === 'inactive').length;
        
        // Calculate "online now" based on recent login activity (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const onlineNow = driversData.filter(driver => {
          if (!driver.last_login) return false;
          const lastLogin = new Date(driver.last_login);
          return lastLogin > oneDayAgo && driver.status === 'active';
        }).length;
        
        setDriverStats({
          totalDrivers,
          activeDrivers,
          inactiveDrivers,
          onlineNow
        });
        
        // Update donut chart data with real stats
        setDriverStatusChartData({
          labels: ['Active', 'Inactive'],
          datasets: [
            {
              data: [activeDrivers, inactiveDrivers],
              backgroundColor: [
                'rgba(76, 175, 80, 0.7)',
                'rgba(244, 67, 54, 0.7)'
              ],
              hoverBackgroundColor: [
                'rgba(76, 175, 80, 0.9)',
                'rgba(244, 67, 54, 0.9)'
              ]
            }
          ]
        });
        
        // Generate realistic passenger data based on active drivers
        const currentHour = new Date().getHours();
        const timeLabels = [];
        const passengerData = [];
        
        // Generate hourly data for the past 12 hours
        for (let i = 11; i >= 0; i--) {
          const hour = (currentHour - i + 24) % 24;
          const timeLabel = hour === 0 ? '12 AM' : 
                           hour < 12 ? `${hour} AM` : 
                           hour === 12 ? '12 PM' : 
                           `${hour - 12} PM`;
          timeLabels.push(timeLabel);
          
          // Generate passenger count based on time of day and active drivers
          let basePassengers = 0;
          if (hour >= 6 && hour <= 9) basePassengers = activeDrivers * 8; // Morning rush
          else if (hour >= 10 && hour <= 16) basePassengers = activeDrivers * 12; // Day time
          else if (hour >= 17 && hour <= 20) basePassengers = activeDrivers * 10; // Evening rush
          else basePassengers = activeDrivers * 2; // Off hours
          
          // Add some variation
          const variation = Math.floor(Math.random() * (basePassengers * 0.3));
          passengerData.push(Math.max(0, basePassengers + variation - (basePassengers * 0.15)));
        }
        
        setPassengerChartData({
          labels: timeLabels,
          datasets: [
            {
              label: 'Passenger Count Today',
              data: passengerData,
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              fill: true,
            },
          ],
        });
      } else {
        // No drivers found
        setDriverStats({
          totalDrivers: 0,
          activeDrivers: 0,
          inactiveDrivers: 0,
          onlineNow: 0
        });
        
        setDriverStatusChartData({
          labels: ['Active', 'Inactive'],
          datasets: [
            {
              data: [0, 0],
              backgroundColor: [
                'rgba(76, 175, 80, 0.7)',
                'rgba(244, 67, 54, 0.7)'
              ],
              hoverBackgroundColor: [
                'rgba(76, 175, 80, 0.9)',
                'rgba(244, 67, 54, 0.9)'
              ]
            }
          ]
        });
        
        setPassengerChartData({
          labels: ['No Data'],
          datasets: [
            {
              label: 'Passenger Count Today',
              data: [0],
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              fill: true,
            },
          ],
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load driver data. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Handler functions for driver modals
  
  // Handle add driver modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setAddDriverForm({
      rfid_code: '',
      nama_driver: '',
      username: '',
      email: '',
      password: '',
      status: 'active'
    });
    setAddDriverError('');
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddDriverForm({
      rfid_code: '',
      nama_driver: '',
      username: '',
      email: '',
      password: '',
      status: 'active'
    });
    setAddDriverError('');
  };

  const handleAddDriverFormChange = (field, value) => {
    setAddDriverForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (addDriverError) {
      setAddDriverError('');
    }
  };

  const handleAddDriverSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!addDriverForm.rfid_code.trim()) {
      setAddDriverError('RFID code is required');
      return;
    }
    if (!addDriverForm.nama_driver.trim()) {
      setAddDriverError('Driver name is required');
      return;
    }
    if (!addDriverForm.username.trim()) {
      setAddDriverError('Username is required');
      return;
    }
    if (!addDriverForm.email.trim()) {
      setAddDriverError('Email is required');
      return;
    }
    if (!addDriverForm.password.trim()) {
      setAddDriverError('Password is required');
      return;
    }

    try {
      setAddDriverLoading(true);
      setAddDriverError('');

      console.log('Adding driver:', addDriverForm);
      
      // Call API to create driver
      const driverData = {
        rfid_code: addDriverForm.rfid_code.trim(),
        nama_driver: addDriverForm.nama_driver.trim(),
        username: addDriverForm.username.trim(),
        email: addDriverForm.email.trim(),
        password: addDriverForm.password.trim(),
        status: addDriverForm.status
      };
      
      const newDriver = await driverService.createDriver(driverData);

      console.log('Driver created successfully:', newDriver);
      
      // Close modal
      handleCloseAddModal();
      
      // Refresh driver data
      fetchDriverData();
      
    } catch (error) {
      console.error('Error creating driver:', error);
      setAddDriverError(
        error.response?.data?.message || 
        'Failed to create driver. Please try again.'
      );
    } finally {
      setAddDriverLoading(false);
    }
  };

  // Handle edit driver modal
  const handleOpenEditModal = (driver) => {
    setShowEditModal(true);
    setEditDriverForm({
      id: driver.id,
      rfid_code: driver.rfid_code || '',
      nama_driver: driver.nama_driver || '',
      username: driver.username || '',
      email: driver.email || '',
      status: driver.status || 'active'
    });
    setEditDriverError('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditDriverForm({
      id: '',
      rfid_code: '',
      nama_driver: '',
      username: '',
      email: '',
      status: 'active'
    });
    setEditDriverError('');
  };

  const handleEditDriverFormChange = (field, value) => {
    setEditDriverForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (editDriverError) {
      setEditDriverError('');
    }
  };

  const handleEditDriverSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!editDriverForm.rfid_code.trim()) {
      setEditDriverError('RFID code is required');
      return;
    }
    if (!editDriverForm.nama_driver.trim()) {
      setEditDriverError('Driver name is required');
      return;
    }
    if (!editDriverForm.username.trim()) {
      setEditDriverError('Username is required');
      return;
    }
    if (!editDriverForm.email.trim()) {
      setEditDriverError('Email is required');
      return;
    }

    try {
      setEditDriverLoading(true);
      setEditDriverError('');

      console.log('Editing driver:', editDriverForm);
      
      // Call API to update driver
      const driverData = {
        rfid_code: editDriverForm.rfid_code.trim(),
        nama_driver: editDriverForm.nama_driver.trim(),
        username: editDriverForm.username.trim(),
        email: editDriverForm.email.trim(),
        status: editDriverForm.status
      };
      
      const updatedDriver = await driverService.updateDriver(editDriverForm.id, driverData);

      console.log('Driver updated successfully:', updatedDriver);
      
      // Close modal
      handleCloseEditModal();
      
      // Refresh driver data
      fetchDriverData();
      
    } catch (error) {
      console.error('Error updating driver:', error);
      setEditDriverError(
        error.response?.data?.message || 
        'Failed to update driver. Please try again.'
      );
    } finally {
      setEditDriverLoading(false);
    }
  };

  // Handle delete driver
  const handleOpenDeleteModal = (driverId) => {
    setShowDeleteModal(true);
    setDeleteDriverId(driverId);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteDriverId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDriverId) return;

    try {
      setDeleteDriverLoading(true);

      console.log('Deleting driver:', deleteDriverId);
      
      // Call API to delete driver
      await driverService.deleteDriver(deleteDriverId);

      console.log('Driver deleted successfully');
      
      // Close modal
      handleCloseDeleteModal();
      
      // Refresh driver data
      fetchDriverData();
      
    } catch (error) {
      console.error('Error deleting driver:', error);
      // You might want to show an error message here
      alert('Failed to delete driver. Please try again.');
    } finally {
      setDeleteDriverLoading(false);
    }
  };

  // Set up initial data fetch
  useEffect(() => {
    console.log('Setting up drivers page');
    fetchDriverData();
    
    return () => {
      console.log('Drivers page cleanup');
    };
  }, [fetchDriverData]);
  // Show loading or error state
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
            <div style={{ color: '#dc2626', fontSize: '18px', marginBottom: '8px' }}>Error</div>
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
      <div className="p-6">
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0' }}>
            Drivers
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
            onClick={fetchDriverData}
            title="Refresh driver data"
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
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
                Total Drivers
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {driverStats.totalDrivers}
              </div>
              <div style={{ fontSize: '12px', color: '#2196F3', fontWeight: '500' }}>
                Registered drivers
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
              <img 
                src="/assets/icons/Driver_Gray.svg" 
                alt="Total Drivers"
                style={{ width: '24px', height: '24px', opacity: '0.6' }}
              />
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
                Active Drivers
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {driverStats.activeDrivers}
              </div>
              <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                Ready to drive
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
              <img 
                src="/assets/icons/Driver_Gray.svg" 
                alt="Active Drivers"
                style={{ width: '24px', height: '24px', opacity: '0.6' }}
              />
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
                Inactive Drivers
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {driverStats.inactiveDrivers}
              </div>
              <div style={{ fontSize: '12px', color: '#F44336', fontWeight: '500' }}>
                Not available
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
              <img 
                src="/assets/icons/Driver_Gray.svg" 
                alt="Inactive Drivers"
                style={{ width: '24px', height: '24px', opacity: '0.6' }}
              />
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
                Online Now
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {driverStats.onlineNow}
              </div>
              <div style={{ fontSize: '12px', color: '#FF9800', fontWeight: '500' }}>
                Currently online
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
              <img 
                src="/assets/icons/Driver_Gray.svg" 
                alt="Online Drivers"
                style={{ width: '24px', height: '24px', opacity: '0.6' }}
              />
            </div>
          </div>
        </div>
      </div>
        {/* Charts */}
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
              Driver Activity
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Passenger count today
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <LineChart data={passengerChartData} />
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
              Driver Status
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Active vs Inactive
            </p>
          </div>
          <div style={{ height: '250px' }}>
            <DonutChart data={driverStatusChartData} />
          </div>
        </div>
      </div>
      
      {/* Driver List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '20px'
      }}>        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
            Driver List
          </h3>
          <button
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Add Driver
          </button>
        </div>{drivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No drivers found. Click "Add Driver" to create your first driver.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Driver ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    RFID Code
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Name
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Username
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Email
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Last Login
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Actions
                  </th>
                </tr>
              </thead>              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {driver.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {driver.rfid_code || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {driver.nama_driver}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {driver.username}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {driver.email || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: driver.status === 'active' ? '#e8f5e8' : '#ffebee',
                        color: driver.status === 'active' ? '#2e7d32' : '#c62828'
                      }}>
                        {driver.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                      {timeAgo(driver.last_login)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(driver)}
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
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(driver.id)}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>            </table>
          </div>
        )}
      </div>
      
      {/* Add Driver Modal */}
      {showAddModal && (        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            width: '90%',
            maxWidth: '640px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                Driver Information
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                Please fill in all the required fields to create a new driver account.
              </p>
            </div>
            
            {addDriverError && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '24px',
                border: '1px solid #fecaca'
              }}>
                {addDriverError}
              </div>
            )}
            
            <form onSubmit={handleAddDriverSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    RFID Code<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={addDriverForm.rfid_code}
                    onChange={(e) => handleAddDriverFormChange('rfid_code', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter RFID code"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Driver Name<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={addDriverForm.nama_driver}
                    onChange={(e) => handleAddDriverFormChange('nama_driver', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter driver full name"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Username<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={addDriverForm.username}
                    onChange={(e) => handleAddDriverFormChange('username', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter username"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Email Address<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="email"
                    value={addDriverForm.email}
                    onChange={(e) => handleAddDriverFormChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter email address"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Password<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password"
                      value={addDriverForm.password}
                      onChange={(e) => handleAddDriverFormChange('password', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        color: '#374151',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        backgroundColor: 'white'
                      }}
                      placeholder="Enter secure password"
                      required
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Status<span style={{ color: '#dc2626' }}>*</span>
                  </label>                  <select 
                    value={addDriverForm.status}
                    onChange={(e) => handleAddDriverFormChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '32px'
              }}>                <button 
                  type="button"
                  onClick={handleCloseAddModal}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  Cancel
                </button>                <button 
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: addDriverLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '140px',
                    opacity: addDriverLoading ? 0.7 : 1
                  }}
                  disabled={addDriverLoading}
                  onMouseEnter={(e) => {
                    if (!addDriverLoading) {
                      e.target.style.backgroundColor = '#15803d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!addDriverLoading) {
                      e.target.style.backgroundColor = '#16a34a';
                    }
                  }}                >
                  {addDriverLoading ? 'Creating...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* Edit Driver Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            width: '90%',
            maxWidth: '640px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                Driver Information
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0'
              }}>
                Please fill in all the required fields to edit driver account.
              </p>
            </div>
            
            {editDriverError && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '24px',
                border: '1px solid #fecaca'
              }}>
                {editDriverError}
              </div>
            )}
            
            <form onSubmit={handleEditDriverSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    RFID Code<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={editDriverForm.rfid_code}
                    onChange={(e) => handleEditDriverFormChange('rfid_code', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter RFID code"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Driver Name<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={editDriverForm.nama_driver}
                    onChange={(e) => handleEditDriverFormChange('nama_driver', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter driver full name"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Username<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={editDriverForm.username}
                    onChange={(e) => handleEditDriverFormChange('username', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter username"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Email Address<span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="email"
                    value={editDriverForm.email}
                    onChange={(e) => handleEditDriverFormChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white'
                    }}
                    placeholder="Enter email address"
                    required
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Status<span style={{ color: '#dc2626' }}>*</span>
                  </label>                  <select 
                    value={editDriverForm.status}
                    onChange={(e) => handleEditDriverFormChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '32px'
              }}>                <button 
                  type="button"
                  onClick={handleCloseEditModal}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '100px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  Cancel
                </button>                <button 
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: editDriverLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '120px',
                    opacity: editDriverLoading ? 0.7 : 1
                  }}
                  disabled={editDriverLoading}
                  onMouseEnter={(e) => {
                    if (!editDriverLoading) {
                      e.target.style.backgroundColor = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editDriverLoading) {
                      e.target.style.backgroundColor = '#3b82f6';
                    }
                  }}
                >
                  {editDriverLoading ? 'Saving...' : 'Edit Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* Delete Driver Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            width: '90%',
            maxWidth: '420px',
            position: 'relative'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                Delete Driver
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0 0 8px 0'
              }}>
                Are you sure you want to delete this driver?
              </p>
              <p style={{
                fontSize: '12px',
                color: '#ef4444',
                margin: '0'
              }}>
                This action cannot be undone.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>              <button 
                onClick={handleCloseDeleteModal}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                Cancel
              </button>              <button 
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: deleteDriverLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '120px',
                  opacity: deleteDriverLoading ? 0.7 : 1
                }}
                disabled={deleteDriverLoading}
                onMouseEnter={(e) => {
                  if (!deleteDriverLoading) {
                    e.target.style.backgroundColor = '#b91c1c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteDriverLoading) {
                    e.target.style.backgroundColor = '#dc2626';
                  }
                }}
              >                {deleteDriverLoading ? 'Deleting...' : 'Delete Driver'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Drivers;
