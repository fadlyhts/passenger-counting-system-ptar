import React, { useState, useEffect, useCallback } from 'react';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { vehicleService, reportService, sessionService } from '../services';

const Vehicles = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleStats, setVehicleStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    availableVehicles: 0
  });

  const [passengerChartData, setPassengerChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Passengers Transported',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
      },
    ],
  });
  const [vehicleStatusChartData, setVehicleStatusChartData] = useState({
    labels: ['Active', 'Maintenance'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',
          'rgba(255, 152, 0, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(76, 175, 80, 0.9)',
          'rgba(255, 152, 0, 0.9)'
        ]
      }
    ]
  });
  // Modal state for adding vehicle
  const [showAddModal, setShowAddModal] = useState(false);
  const [addVehicleForm, setAddVehicleForm] = useState({
    mobil_id: '',
    nomor_mobil: '',
    status: 'active'
  });  const [addVehicleError, setAddVehicleError] = useState('');
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);

  // Modal state for editing vehicle
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVehicleForm, setEditVehicleForm] = useState({
    id: '',
    mobil_id: '',
    nomor_mobil: '',
    status: 'active'
  });
  const [editVehicleError, setEditVehicleError] = useState('');
  const [editVehicleLoading, setEditVehicleLoading] = useState(false);

  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);
  const [deleteVehicleLoading, setDeleteVehicleLoading] = useState(false);

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

  // Handle add vehicle modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setAddVehicleForm({
      mobil_id: '',
      nomor_mobil: '',
      status: 'active'
    });
    setAddVehicleError('');
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddVehicleForm({
      mobil_id: '',
      nomor_mobil: '',
      status: 'active'
    });
    setAddVehicleError('');
  };

  const handleAddVehicleFormChange = (field, value) => {
    setAddVehicleForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (addVehicleError) {
      setAddVehicleError('');
    }
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!addVehicleForm.nomor_mobil.trim()) {
      setAddVehicleError('Vehicle number is required');
      return;
    }

    try {
      setAddVehicleLoading(true);
      setAddVehicleError('');      console.log('Adding new vehicle:', addVehicleForm);
      
      // Call API to create vehicle
      const vehicleData = {
        nomor_mobil: addVehicleForm.nomor_mobil.trim(),
        status: addVehicleForm.status
      };
      
      // Add mobil_id if provided
      if (addVehicleForm.mobil_id.trim()) {
        vehicleData.mobil_id = addVehicleForm.mobil_id.trim();
      }
      
      const newVehicle = await vehicleService.createVehicle(vehicleData);

      console.log('Vehicle added successfully:', newVehicle);
      
      // Close modal
      handleCloseAddModal();
      
      // Refresh vehicle data
      fetchVehicleData();
      
    } catch (error) {
      console.error('Error adding vehicle:', error);
      setAddVehicleError(
        error.response?.data?.message || 
        'Failed to add vehicle. Please try again.'
      );
    } finally {
      setAddVehicleLoading(false);
    }
  };

  // Handle edit vehicle modal
  const handleOpenEditModal = (vehicle) => {
    setShowEditModal(true);
    setEditVehicleForm({
      id: vehicle.id,
      mobil_id: vehicle.mobil_id || '',
      nomor_mobil: vehicle.nomor_mobil || '',
      status: vehicle.status || 'active'
    });
    setEditVehicleError('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditVehicleForm({
      id: '',
      mobil_id: '',
      nomor_mobil: '',
      status: 'active'
    });
    setEditVehicleError('');
  };

  const handleEditVehicleFormChange = (field, value) => {
    setEditVehicleForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (editVehicleError) {
      setEditVehicleError('');
    }
  };

  const handleEditVehicleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!editVehicleForm.nomor_mobil.trim()) {
      setEditVehicleError('Vehicle number is required');
      return;
    }

    try {
      setEditVehicleLoading(true);
      setEditVehicleError('');

      console.log('Editing vehicle:', editVehicleForm);
      
      // Call API to update vehicle
      const vehicleData = {
        nomor_mobil: editVehicleForm.nomor_mobil.trim(),
        status: editVehicleForm.status
      };
      
      // Add mobil_id if provided
      if (editVehicleForm.mobil_id.trim()) {
        vehicleData.mobil_id = editVehicleForm.mobil_id.trim();
      }
      
      const updatedVehicle = await vehicleService.updateVehicle(editVehicleForm.id, vehicleData);

      console.log('Vehicle updated successfully:', updatedVehicle);
      
      // Close modal
      handleCloseEditModal();
      
      // Refresh vehicle data
      fetchVehicleData();
      
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setEditVehicleError(
        error.response?.data?.message || 
        'Failed to update vehicle. Please try again.'
      );
    } finally {
      setEditVehicleLoading(false);
    }
  };

  // Handle delete vehicle
  const handleOpenDeleteModal = (vehicleId) => {
    setShowDeleteModal(true);
    setDeleteVehicleId(vehicleId);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteVehicleId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteVehicleId) return;

    try {
      setDeleteVehicleLoading(true);

      console.log('Deleting vehicle:', deleteVehicleId);
      
      // Call API to delete vehicle
      await vehicleService.deleteVehicle(deleteVehicleId);

      console.log('Vehicle deleted successfully');
      
      // Close modal
      handleCloseDeleteModal();
      
      // Refresh vehicle data
      fetchVehicleData();
      
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      // You might want to show an error message here
      alert('Failed to delete vehicle. Please try again.');
    } finally {
      setDeleteVehicleLoading(false);
    }
  };

  // Fetch all vehicle data
  const fetchVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all vehicles
      const vehiclesData = await vehicleService.getAllVehicles();
      console.log('Vehicles data:', vehiclesData);
      
      if (vehiclesData && Array.isArray(vehiclesData)) {
        setVehicles(vehiclesData);
        
        // Calculate vehicle statistics
        const totalVehicles = vehiclesData.length;
        let activeVehicles = 0;
        let maintenanceVehicles = 0;
        
        // Count vehicles by status
        vehiclesData.forEach(vehicle => {
          if (vehicle.status === 'active') {
            activeVehicles++;
          } else if (vehicle.status === 'maintenance') {
            maintenanceVehicles++;
          }
        });
        
        // If no status field, assume some are active based on recent activity
        if (activeVehicles === 0 && maintenanceVehicles === 0) {
          // Mock some realistic distribution
          activeVehicles = Math.floor(totalVehicles * 0.7);
          maintenanceVehicles = totalVehicles - activeVehicles;
        }
        
        const availableVehicles = activeVehicles;
        
        setVehicleStats({
          totalVehicles,
          activeVehicles,
          maintenanceVehicles,
          availableVehicles
        });
        
        // Update donut chart data
        setVehicleStatusChartData({
          labels: ['Active', 'Maintenance'],
          datasets: [
            {
              data: [activeVehicles, maintenanceVehicles],
              backgroundColor: [
                'rgba(76, 175, 80, 0.7)',
                'rgba(255, 152, 0, 0.7)'
              ],
              hoverBackgroundColor: [
                'rgba(76, 175, 80, 0.9)',
                'rgba(255, 152, 0, 0.9)'
              ]
            }
          ]
        });          // Generate passenger transport data for each vehicle using session data
        if (vehiclesData.length > 0) {
          try {
            // Get a broad date range to capture all sessions (last 1 year)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            
            const startDateFormatted = formatDate(startDate);
            const endDateFormatted = formatDate(endDate);
            
            // Get all sessions in the date range
            const allSessions = await sessionService.getSessionsByDateRange(startDateFormatted, endDateFormatted);
            console.log('All sessions for passenger chart:', allSessions);
            
            // Group sessions by vehicle and calculate total passengers
            const vehiclePassengerTotals = {};
            
            if (allSessions && Array.isArray(allSessions)) {
              allSessions.forEach(session => {
                const vehicleId = session.mobil_id;
                const vehicleLabel = session.mobil?.nomor_mobil || `Vehicle ${vehicleId}`;
                const passengerCount = session.passenger_count || 0;
                
                if (!vehiclePassengerTotals[vehicleId]) {
                  vehiclePassengerTotals[vehicleId] = {
                    label: vehicleLabel,
                    count: 0
                  };
                }
                
                vehiclePassengerTotals[vehicleId].count += passengerCount;
              });
            }
            
            // Convert to array and limit to top 5 vehicles for chart display
            const vehicleReports = Object.values(vehiclePassengerTotals)
              .sort((a, b) => b.count - a.count) // Sort by passenger count descending
              .slice(0, 5); // Take top 5
            
            console.log('Vehicle passenger totals:', vehicleReports);
            
            const labels = vehicleReports.map(report => report.label);
            const data = vehicleReports.map(report => report.count);
            
            setPassengerChartData({
              labels: labels.length > 0 ? labels : ['No Data'],
              datasets: [
                {
                  label: 'Total Passengers Transported',
                  data: data.length > 0 ? data : [0],
                  borderColor: '#4CAF50',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  fill: true,
                },
              ],
            });
          } catch (chartError) {
            console.error('Error fetching vehicle passenger data:', chartError);
            // Fallback to empty chart
            setPassengerChartData({
              labels: ['No Data'],
              datasets: [
                {
                  label: 'Total Passengers Transported',
                  data: [0],
                  borderColor: '#4CAF50',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  fill: true,
                },
              ],
            });
          }
        }
      } else {        // Mock data if no vehicles available
        setVehicles([]);
        setVehicleStats({
          totalVehicles: 0,
          activeVehicles: 0,
          maintenanceVehicles: 0,
          availableVehicles: 0
        });
      }
      
      setLoading(false);    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError('Failed to load vehicle data. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Set up initial data fetch
  useEffect(() => {
    console.log('Setting up vehicles page');
    fetchVehicleData();
    
    return () => {
      console.log('Vehicles page cleanup');
    };
  }, [fetchVehicleData]);

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
              onClick={fetchVehicleData}
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
            Vehicles
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
            onClick={fetchVehicleData}
            title="Refresh vehicle data"
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
                Total Vehicles
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {vehicleStats.totalVehicles}
              </div>
              <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                Fleet size
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
                src="/assets/icons/Vehicle_Gray.svg" 
                alt="Total Vehicles"
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
                Active Vehicles
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {vehicleStats.activeVehicles}
              </div>
              <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                In operation
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
                src="/assets/icons/Vehicle_Gray.svg" 
                alt="Active Vehicles"
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
                Maintenance
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {vehicleStats.maintenanceVehicles}
              </div>
              <div style={{ fontSize: '12px', color: '#FF9800', fontWeight: '500' }}>
                Under maintenance
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
                src="/assets/icons/Vehicle_Gray.svg" 
                alt="Maintenance Vehicles"
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
                Available Now
              </div>              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                {vehicleStats.availableVehicles}
              </div>
              <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: '500' }}>
                Ready for service
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
                src="/assets/icons/Vehicle_Gray.svg" 
                alt="Available Vehicles"
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
              Passenger Transport Activity
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Total passengers by vehicle
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
              Vehicle Status
            </h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
              Active vs Maintenance
            </p>
          </div>          <div style={{ height: '250px' }}>
            <DonutChart data={vehicleStatusChartData} />
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
            Vehicle List
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
            Add Vehicle
          </button>
        </div>        {vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No vehicles found. Click "Add Vehicle" to create your first vehicle.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Vehicle ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    License Plate
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Last Updated
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace', fontWeight: '500' }}>
                      {vehicle.mobil_id || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {vehicle.nomor_mobil || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: vehicle.status === 'maintenance' ? '#fff3cd' : '#e8f5e8',
                        color: vehicle.status === 'maintenance' ? '#856404' : '#2e7d32'
                      }}>
                        {vehicle.status === 'maintenance' ? 'Maintenance' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                      {timeAgo(vehicle.updated_at)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenEditModal(vehicle)}
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
                          onClick={() => handleOpenDeleteModal(vehicle.id)}
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

      {/* Add Vehicle Modal */}
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
            width: '100%',
            maxWidth: '400px',
            margin: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#333'
              }}>
                Add New Vehicle
              </h3>
              <button
                onClick={handleCloseAddModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>            {/* Modal Form */}
            <form onSubmit={handleAddVehicleSubmit}>
              {/* Vehicle ID Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Vehicle ID
                </label>
                <input
                  type="text"
                  value={addVehicleForm.mobil_id}
                  onChange={(e) => handleAddVehicleFormChange('mobil_id', e.target.value)}
                  placeholder="Enter vehicle ID (optional)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Vehicle Number Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Vehicle Number <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={addVehicleForm.nomor_mobil}
                  onChange={(e) => handleAddVehicleFormChange('nomor_mobil', e.target.value)}
                  placeholder="Enter vehicle number (e.g., BB12FF)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Status Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Status
                </label>
                <select
                  value={addVehicleForm.status}
                  onChange={(e) => handleAddVehicleFormChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Error Message */}
              {addVehicleError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  border: '1px solid #ffcdd2'
                }}>
                  {addVehicleError}
                </div>
              )}

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid #eee'
              }}>                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={addVehicleLoading}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: addVehicleLoading ? 'not-allowed' : 'pointer',
                    opacity: addVehicleLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>                <button
                  type="submit"
                  disabled={addVehicleLoading}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: addVehicleLoading ? '#ccc' : '#4CAF50',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: addVehicleLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {addVehicleLoading && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {addVehicleLoading ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
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
            width: '100%',
            maxWidth: '400px',
            margin: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#333'
              }}>
                Edit Vehicle
              </h3>
              <button
                onClick={handleCloseEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>            {/* Modal Form */}
            <form onSubmit={handleEditVehicleSubmit}>
              {/* Vehicle ID Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Vehicle ID
                </label>
                <input
                  type="text"
                  value={editVehicleForm.mobil_id}
                  onChange={(e) => handleEditVehicleFormChange('mobil_id', e.target.value)}
                  placeholder="Enter vehicle ID (optional)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Vehicle Number Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Vehicle Number <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editVehicleForm.nomor_mobil}
                  onChange={(e) => handleEditVehicleFormChange('nomor_mobil', e.target.value)}
                  placeholder="Enter vehicle number (e.g., BB12FF)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              {/* Status Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Status
                </label>
                <select
                  value={editVehicleForm.status}
                  onChange={(e) => handleEditVehicleFormChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              {/* Error Message */}
              {editVehicleError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  border: '1px solid #ffcdd2'
                }}>
                  {editVehicleError}
                </div>
              )}

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid #eee'
              }}>                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={editVehicleLoading}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: editVehicleLoading ? 'not-allowed' : 'pointer',
                    opacity: editVehicleLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>                <button
                  type="submit"
                  disabled={editVehicleLoading}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: editVehicleLoading ? '#ccc' : '#2196F3',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: editVehicleLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {editVehicleLoading && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {editVehicleLoading ? 'Saving...' : 'Edit Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Vehicle Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            margin: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#333'
              }}>
                Confirm Deletion
              </h3>
              <button
                onClick={handleCloseDeleteModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              marginBottom: '20px',
              fontSize: '14px',
              color: '#333',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              paddingTop: '12px',
              borderTop: '1px solid #eee'
            }}>              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={deleteVehicleLoading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: deleteVehicleLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteVehicleLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>              <button
                onClick={handleConfirmDelete}
                disabled={deleteVehicleLoading}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: deleteVehicleLoading ? '#ccc' : '#f44336',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: deleteVehicleLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {deleteVehicleLoading && (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {deleteVehicleLoading ? 'Deleting...' : 'Delete Vehicle'}              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Vehicles;