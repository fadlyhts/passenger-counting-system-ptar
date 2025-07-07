import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { driverService, sessionService } from '../services';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('driver');

  // Driver reports state
  const [driverReports, setDriverReports] = useState([]);
  const [driverLoading, setDriverLoading] = useState(false);

  const [reportData, setReportData] = useState({
    summary: {
      totalPassengers: 0,
      activeSessions: 0,
      totalSessions: 0,
      averagePerSession: 0
    },
    chartData: {
      labels: [],
      datasets: []
    },
    details: []
  });

  // Fetch driver reports
  const fetchDriverReport = useCallback(async () => {
    try {
      setDriverLoading(true);
      setError(null);

      // Get all drivers
      const driversResponse = await driverService.getAllDrivers();
      const drivers = Array.isArray(driversResponse.data) ? driversResponse.data : driversResponse;

      // Get driver statistics
      const driverStats = await Promise.all(drivers.map(async (driver) => {
        try {
          // Get driver sessions
          const sessionsResponse = await sessionService.getSessionsByDriverId(driver.id);
          const sessions = Array.isArray(sessionsResponse.data) ? sessionsResponse.data : sessionsResponse;

          // Calculate working hours
          let totalWorkingHours = 0;
          let totalSessions = sessions.length;
          let totalPassengers = 0;

          sessions.forEach(session => {
            if (session.start_time && session.end_time) {
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              const duration = (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
              totalWorkingHours += duration;
            }
            totalPassengers += session.passenger_count || 0;
          });

          return {
            id: driver.id,
            name: driver.nama_driver,
            phone: driver.no_telepon,
            license: driver.no_lisensi,
            status: driver.status,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100, // Round to 2 decimal places
            totalSessions: totalSessions,
            totalPassengers: totalPassengers,
            averagePassengersPerSession: totalSessions > 0 ? Math.round((totalPassengers / totalSessions) * 100) / 100 : 0,
            sessionsDetails: sessions
          };
        } catch (error) {
          console.error(`Error fetching sessions for driver ${driver.id}:`, error);
          return {
            id: driver.id,
            name: driver.nama_driver,
            phone: driver.no_telepon,
            license: driver.no_lisensi,
            status: driver.status,
            totalWorkingHours: 0,
            totalSessions: 0,
            totalPassengers: 0,
            averagePassengersPerSession: 0,
            sessionsDetails: []
          };
        }
      }));

      setDriverReports(driverStats);
      
      // Calculate summary for driver reports
      const totalDrivers = driverStats.length;
      const totalPassengers = driverStats.reduce((sum, driver) => sum + driver.totalPassengers, 0);
      const totalSessions = driverStats.reduce((sum, driver) => sum + driver.totalSessions, 0);
      const totalWorkingHours = driverStats.reduce((sum, driver) => sum + driver.totalWorkingHours, 0);

      setReportData({
        summary: {
          totalPassengers: totalPassengers,
          activeSessions: totalSessions,
          totalSessions: totalSessions,
          averagePerSession: totalSessions > 0 ? Math.round((totalPassengers / totalSessions) * 100) / 100 : 0
        },
        chartData: { labels: [], datasets: [] },
        details: driverStats
      });

    } catch (error) {
      console.error('Error fetching driver reports:', error);
      setError('Failed to load driver reports');
    } finally {
      setDriverLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverReport();
  }, [fetchDriverReport]);

  // Export report data to PDF
  const exportReport = async () => {
    try {
      // Create a container for the PDF content
      const reportElement = document.getElementById('report-content');
      if (!reportElement) {
        alert('Report content not found');
        return;
      }

      // Show loading state
      const originalButton = document.querySelector('[data-export-button]');
      if (originalButton) {
        originalButton.textContent = 'Exporting...';
        originalButton.disabled = true;
      }

      // Generate canvas from the report content
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title page
      pdf.setFontSize(20);
      pdf.text('Passenger Counting System Report', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, 50);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);
      
      // Add summary
      pdf.text(`Total Passengers: ${reportData.summary.totalPassengers}`, 20, 85);
      pdf.text(`Active Sessions: ${reportData.summary.activeSessions}`, 20, 100);
      pdf.text(`Total Sessions: ${reportData.summary.totalSessions}`, 20, 115);
      pdf.text(`Average Passengers per Session: ${reportData.summary.averagePerSession.toFixed(1)}`, 20, 130);
      
      // Add new page for the visual content
      pdf.addPage();
      
      // Check if image needs to be split across multiple pages
      if (imgHeight > pdfHeight - 20) {
        // Split the image across multiple pages
        let yPosition = 0;
        const pageHeight = pdfHeight - 20; // 10mm margin top and bottom
        
        while (yPosition < imgHeight) {
          const remainingHeight = imgHeight - yPosition;
          const currentPageHeight = Math.min(pageHeight, remainingHeight);
          
          // Create a canvas for the current page section
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = (currentPageHeight / imgHeight) * canvas.height;
          
          const pageCtx = pageCanvas.getContext('2d');
          pageCtx.drawImage(
            canvas,
            0, (yPosition / imgHeight) * canvas.height,
            canvas.width, (currentPageHeight / imgHeight) * canvas.height,
            0, 0,
            pageCanvas.width, pageCanvas.height
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, currentPageHeight);
          
          yPosition += currentPageHeight;
          
          if (yPosition < imgHeight) {
            pdf.addPage();
          }
        }
      } else {
        // Image fits on one page
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }
      
      // Save the PDF
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      // Reset button state
      if (originalButton) {
        originalButton.textContent = 'Export to PDF';
        originalButton.disabled = false;
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      
      // Reset button state
      const originalButton = document.querySelector('[data-export-button]');
      if (originalButton) {
        originalButton.textContent = 'Export to PDF';
        originalButton.disabled = false;
      }
    }
  };

  if (loading || driverLoading) {
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
              onClick={fetchDriverReport}
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
        {/* Header */}
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>Reports & Analytics</h1>
              <p className="text-gray-600">Analyze passenger data and system performance</p>
            </div>
            <button
              onClick={exportReport}
              data-export-button
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              title="Export report to PDF"
              onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              Export to PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div id="report-content">
          {/* Driver Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 8px 0'
                  }}>Total Drivers</p>
                  <p style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '0'
                  }}>{driverReports.length}</p>
                </div>
                <div style={{
                  backgroundColor: '#dbeafe',
                  borderRadius: '50%',
                  padding: '12px'
                }}>
                  <svg style={{ width: '24px', height: '24px' }} fill="#3b82f6" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 8px 0'
                  }}>Total Passengers</p>
                  <p style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '0'
                  }}>{reportData.summary.totalPassengers}</p>
                </div>
                <div style={{
                  backgroundColor: '#dcfce7',
                  borderRadius: '50%',
                  padding: '12px'
                }}>
                  <svg style={{ width: '24px', height: '24px' }} fill="#22c55e" viewBox="0 0 24 24">
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 8px 0'
                  }}>Total Sessions</p>
                  <p style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '0'
                  }}>{reportData.summary.totalSessions}</p>
                </div>
                <div style={{
                  backgroundColor: '#fef3c7',
                  borderRadius: '50%',
                  padding: '12px'
                }}>
                  <svg style={{ width: '24px', height: '24px' }} fill="#f59e0b" viewBox="0 0 24 24">
                    <path d="M14,6V4H10V6H14M20,8V19A1,1 0 0,1 19,20H5A1,1 0 0,1 4,19V8A1,1 0 0,1 5,7H19A1,1 0 0,1 20,8Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0 0 8px 0'
                  }}>Total Working Hours</p>
                  <p style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '0'
                  }}>{driverReports.reduce((sum, driver) => sum + driver.totalWorkingHours, 0).toFixed(1)}</p>
                </div>
                <div style={{
                  backgroundColor: '#fce7f3',
                  borderRadius: '50%',
                  padding: '12px'
                }}>
                  <svg style={{ width: '24px', height: '24px' }} fill="#ec4899" viewBox="0 0 24 24">
                    <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
                  Driver Performance Report
                </h3>
              </div>
              
              <div className="p-6">
                {driverReports.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No driver data available</h3>
                    <p className="mt-1 text-sm text-gray-500">No driver reports found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Driver Name</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Working Hours</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Sessions</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Total Passengers</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Avg/Session</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverReports.map((driver, index) => (
                          <tr key={driver.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {driver.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {driver.totalWorkingHours} hours
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {driver.totalSessions}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {driver.totalPassengers}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {driver.averagePassengersPerSession}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                driver.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {driver.status || 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
