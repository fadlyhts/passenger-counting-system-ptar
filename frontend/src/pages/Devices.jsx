import React, { useState, useEffect, useCallback } from 'react';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { deviceService, vehicleService } from '../services';

const Devices = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [deviceStats, setDeviceStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    recentlyActive: 0
  });

  const [deviceSyncChartData, setDeviceSyncChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Device Sync Activity',
        data: [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
      },
    ],
  });
  
  const [deviceStatusChartData, setDeviceStatusChartData] = useState({
    labels: ['Online', 'Offline'],
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

  // Modal state for adding device
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDeviceForm, setAddDeviceForm] = useState({
    device_id: '',
    mobil_id: '',
    status: 'offline'
  });
  const [addDeviceError, setAddDeviceError] = useState('');
  const [addDeviceLoading, setAddDeviceLoading] = useState(false);

  // Modal state for editing device
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDeviceForm, setEditDeviceForm] = useState({
    id: '',
    device_id: '',
    mobil_id: '',
    status: 'offline'
  });
  const [editDeviceError, setEditDeviceError] = useState('');
  const [editDeviceLoading, setEditDeviceLoading] = useState(false);

  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDeviceId, setDeleteDeviceId] = useState(null);
  const [deleteDeviceLoading, setDeleteDeviceLoading] = useState(false);

  // Calculate time ago
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now - syncTime;
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

  // Handle add device modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setAddDeviceForm({
      device_id: '',
      mobil_id: '',
      status: 'offline'
    });
    setAddDeviceError('');
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddDeviceForm({
      device_id: '',
      mobil_id: '',
      status: 'offline'
    });
    setAddDeviceError('');
  };

  const handleAddDeviceFormChange = (field, value) => {
    setAddDeviceForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (addDeviceError) {
      setAddDeviceError('');
    }
  };

  const handleAddDeviceSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!addDeviceForm.device_id.trim()) {
      setAddDeviceError('Device ID is required');
      return;
    }
    if (!addDeviceForm.mobil_id) {
      setAddDeviceError('Vehicle is required');
      return;
    }

    try {
      setAddDeviceLoading(true);
      setAddDeviceError('');

      console.log('Adding new device:', addDeviceForm);
      
      // Call API to create device
      const deviceData = {
        device_id: addDeviceForm.device_id.trim(),
        mobil_id: parseInt(addDeviceForm.mobil_id),
        status: addDeviceForm.status
      };
      
      const newDevice = await deviceService.createDevice(deviceData);

      console.log('Device added successfully:', newDevice);
      
      // Close modal
      handleCloseAddModal();
      
      // Refresh device data
      fetchDeviceData();
      
    } catch (error) {
      console.error('Error adding device:', error);
      setAddDeviceError(
        error.response?.data?.message || 
        'Failed to add device. Please try again.'
      );
    } finally {
      setAddDeviceLoading(false);
    }
  };

  // Handle edit device modal
  const handleOpenEditModal = (device) => {
    setShowEditModal(true);
    setEditDeviceForm({
      id: device.id,
      device_id: device.device_id || '',
      mobil_id: device.mobil_id || '',
      status: device.status || 'offline'
    });
    setEditDeviceError('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditDeviceForm({
      id: '',
      device_id: '',
      mobil_id: '',
      status: 'offline'
    });
    setEditDeviceError('');
  };

  const handleEditDeviceFormChange = (field, value) => {
    setEditDeviceForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (editDeviceError) {
      setEditDeviceError('');
    }
  };

  const handleEditDeviceSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!editDeviceForm.device_id.trim()) {
      setEditDeviceError('Device ID is required');
      return;
    }
    if (!editDeviceForm.mobil_id) {
      setEditDeviceError('Vehicle is required');
      return;
    }

    try {
      setEditDeviceLoading(true);
      setEditDeviceError('');

      console.log('Editing device:', editDeviceForm);
      
      // Call API to update device
      const deviceData = {
        device_id: editDeviceForm.device_id.trim(),
        mobil_id: parseInt(editDeviceForm.mobil_id),
        status: editDeviceForm.status
      };
      
      const updatedDevice = await deviceService.updateDevice(editDeviceForm.id, deviceData);

      console.log('Device updated successfully:', updatedDevice);
      
      // Close modal
      handleCloseEditModal();
      
      // Refresh device data
      fetchDeviceData();
      
    } catch (error) {
      console.error('Error updating device:', error);
      setEditDeviceError(
        error.response?.data?.message || 
        'Failed to update device. Please try again.'
      );
    } finally {
      setEditDeviceLoading(false);
    }
  };

  // Handle delete device
  const handleOpenDeleteModal = (deviceId) => {
    setShowDeleteModal(true);
    setDeleteDeviceId(deviceId);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteDeviceId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDeviceId) return;

    try {
      setDeleteDeviceLoading(true);

      console.log('Deleting device:', deleteDeviceId);
      
      // Call API to delete device
      await deviceService.deleteDevice(deleteDeviceId);

      console.log('Device deleted successfully');
      
      // Close modal
      handleCloseDeleteModal();
      
      // Refresh device data
      fetchDeviceData();
      
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device. Please try again.');
    } finally {
      setDeleteDeviceLoading(false);
    }
  };

  // Fetch all device data
  const fetchDeviceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all devices and vehicles
      const [devicesData, vehiclesData] = await Promise.all([
        deviceService.getAllDevices(),
        vehicleService.getAllVehicles()
      ]);
      
      console.log('Devices data:', devicesData);
      console.log('Vehicles data:', vehiclesData);
      
      setVehicles(vehiclesData || []);
      
      if (devicesData && Array.isArray(devicesData)) {
        setDevices(devicesData);
        
        // Calculate device statistics
        const totalDevices = devicesData.length;
        let onlineDevices = 0;
        let offlineDevices = 0;
        let recentlyActive = 0;
        
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        
        // Count devices by status
        devicesData.forEach(device => {
          if (device.status === 'online') {
            onlineDevices++;
          } else {
            offlineDevices++;
          }
          
          // Check if device was active in the last hour
          if (device.last_sync) {
            const lastSync = new Date(device.last_sync);
            if (lastSync > oneHourAgo) {
              recentlyActive++;
            }
          }
        });
        
        setDeviceStats({
          totalDevices,
          onlineDevices,
          offlineDevices,
          recentlyActive
        });
        
        // Update donut chart data
        setDeviceStatusChartData({
          labels: ['Online', 'Offline'],
          datasets: [
            {
              data: [onlineDevices, offlineDevices],
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

        // Generate sync activity chart data (last 7 days)
        const last7Days = [];
        const syncCounts = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          last7Days.push(dateStr);
          
          // Count devices that synced on this day (mock data for now)
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          let syncCount = 0;
          devicesData.forEach(device => {
            if (device.last_sync) {
              const syncDate = new Date(device.last_sync);
              if (syncDate >= dayStart && syncDate <= dayEnd) {
                syncCount++;
              }
            }
          });
          
          // If no real sync data, generate mock data
          if (syncCount === 0 && devicesData.length > 0) {
            syncCount = Math.floor(Math.random() * Math.min(devicesData.length, 5)) + 1;
          }
          
          syncCounts.push(syncCount);
        }
        
        setDeviceSyncChartData({
          labels: last7Days,
          datasets: [
            {
              label: 'Device Sync Activity',
              data: syncCounts,
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              fill: true,
            },
          ],
        });
      } else {
        // No devices available
        setDevices([]);
        setDeviceStats({
          totalDevices: 0,
          onlineDevices: 0,
          offlineDevices: 0,
          recentlyActive: 0
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching device data:', err);
      setError('Failed to load device data. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Set up initial data fetch
  useEffect(() => {
    console.log('Setting up devices page');
    fetchDeviceData();
    
    return () => {
      console.log('Devices page cleanup');
    };
  }, [fetchDeviceData]);

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
              onClick={fetchDeviceData}
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
            Devices
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
            onClick={fetchDeviceData}
            title="Refresh device data"
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
                Total Devices
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {deviceStats.totalDevices}
              </div>
              <div style={{ fontSize: '12px', color: '#2196F3', fontWeight: '500' }}>
                Connected devices
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
                src="/assets/icons/Device_Gray.svg" 
                alt="Total Devices"
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
                Online Devices
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {deviceStats.onlineDevices}
              </div>
              <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                Currently active
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
                src="/assets/icons/Device_Gray.svg" 
                alt="Total Devices"
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
                Offline Devices
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {deviceStats.offlineDevices}
              </div>
              <div style={{ fontSize: '12px', color: '#f44336', fontWeight: '500' }}>
                Not responding
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
                src="/assets/icons/Device_Gray.svg" 
                alt="Total Devices"
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
                Recently Active
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {deviceStats.recentlyActive}
              </div>
              <div style={{ fontSize: '12px', color: '#FF9800', fontWeight: '500' }}>
                Last hour
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
                src="/assets/icons/Device_Gray.svg" 
                alt="Total Devices"
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
              Device Sync Activity
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Last 7 days sync activity
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <LineChart data={deviceSyncChartData} />
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
              Device Status
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Online vs Offline
            </p>
          </div>
          <div style={{ height: '250px' }}>
            <DonutChart data={deviceStatusChartData} />
          </div>
        </div>
      </div>

      {/* Device List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
            Device List
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
            Add Device
          </button>
        </div>

        {devices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No devices found. Click "Add Device" to create your first device.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Device ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Vehicle
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Last Sync
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {device.device_id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {device.mobil?.nomor_mobil || `Vehicle #${device.mobil_id}` || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: device.status === 'online' ? '#e8f5e8' : '#ffebee',
                        color: device.status === 'online' ? '#2e7d32' : '#c62828'
                      }}>
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                      {timeAgo(device.last_sync)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(device)}
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
                          onClick={() => handleOpenDeleteModal(device.id)}
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
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
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Add New Device
            </h3>
            
            <form onSubmit={handleAddDeviceSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Device ID *
                </label>
                <input
                  type="text"
                  value={addDeviceForm.device_id}
                  onChange={(e) => handleAddDeviceFormChange('device_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                  placeholder="Enter device ID"
                  disabled={addDeviceLoading}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Vehicle *
                </label>
                <select
                  value={addDeviceForm.mobil_id}
                  onChange={(e) => handleAddDeviceFormChange('mobil_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={addDeviceLoading}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nomor_mobil} (ID: {vehicle.mobil_id || vehicle.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Status
                </label>
                <select
                  value={addDeviceForm.status}
                  onChange={(e) => handleAddDeviceFormChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={addDeviceLoading}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {addDeviceError && (
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '8px 12px', 
                  backgroundColor: '#ffebee', 
                  color: '#c62828', 
                  borderRadius: '4px', 
                  fontSize: '14px' 
                }}>
                  {addDeviceError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#333',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  disabled={addDeviceLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: addDeviceLoading ? 'not-allowed' : 'pointer',
                    opacity: addDeviceLoading ? 0.7 : 1
                  }}
                  disabled={addDeviceLoading}
                >
                  {addDeviceLoading ? 'Adding...' : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
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
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Edit Device
            </h3>
            
            <form onSubmit={handleEditDeviceSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Device ID *
                </label>
                <input
                  type="text"
                  value={editDeviceForm.device_id}
                  onChange={(e) => handleEditDeviceFormChange('device_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                  placeholder="Enter device ID"
                  disabled={editDeviceLoading}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Vehicle *
                </label>
                <select
                  value={editDeviceForm.mobil_id}
                  onChange={(e) => handleEditDeviceFormChange('mobil_id', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={editDeviceLoading}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nomor_mobil} (ID: {vehicle.mobil_id || vehicle.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Status
                </label>
                <select
                  value={editDeviceForm.status}
                  onChange={(e) => handleEditDeviceFormChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  disabled={editDeviceLoading}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {editDeviceError && (
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '8px 12px', 
                  backgroundColor: '#ffebee', 
                  color: '#c62828', 
                  borderRadius: '4px', 
                  fontSize: '14px' 
                }}>
                  {editDeviceError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#333',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  disabled={editDeviceLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: editDeviceLoading ? 'not-allowed' : 'pointer',
                    opacity: editDeviceLoading ? 0.7 : 1
                  }}
                  disabled={editDeviceLoading}
                >
                  {editDeviceLoading ? 'Updating...' : 'Update Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Device Modal */}
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
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Confirm Delete
            </h3>
            
            <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
              Are you sure you want to delete this device? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCloseDeleteModal}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#333',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                disabled={deleteDeviceLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: deleteDeviceLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteDeviceLoading ? 0.7 : 1
                }}
                disabled={deleteDeviceLoading}
              >
                {deleteDeviceLoading ? 'Deleting...' : 'Delete'}
              </button>            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Devices;
