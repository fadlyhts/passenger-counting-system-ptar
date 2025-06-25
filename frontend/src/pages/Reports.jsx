import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { reportsService } from '../services';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

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

  const [passengerTrendChartData, setPassengerTrendChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Passengers',
        data: [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
      },
    ],
  });

  const [sessionDistributionChartData, setSessionDistributionChartData] = useState({
    labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 193, 7, 0.7)',
          'rgba(33, 150, 243, 0.7)',
          'rgba(255, 87, 34, 0.7)',
          'rgba(156, 39, 176, 0.7)'
        ],
        hoverBackgroundColor: [
          'rgba(255, 193, 7, 0.9)',
          'rgba(33, 150, 243, 0.9)',
          'rgba(255, 87, 34, 0.9)',
          'rgba(156, 39, 176, 0.9)'
        ]
      }
    ]
  });
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date and time for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time period from timestamp
  const getTimePeriod = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const hour = new Date(timestamp).getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };

  // Fetch daily report
  const fetchDailyReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await reportsService.getDailyReport(selectedDate);
      console.log('Daily report data:', data);

      // Update summary
      const summary = {
        totalPassengers: data.total_passengers || 0,
        activeSessions: data.active_sessions || 0,
        totalSessions: data.sessions ? data.sessions.length : 0,
        averagePerSession: data.sessions && data.sessions.length > 0 
          ? Math.round(data.total_passengers / data.sessions.length * 100) / 100 
          : 0
      };

      // Prepare hourly chart data
      const hourlyData = new Array(24).fill(0);
      if (data.records && Array.isArray(data.records)) {
        data.records.forEach(record => {
          if (record.timestamp) {
            const hour = new Date(record.timestamp).getHours();
            hourlyData[hour]++;
          }
        });
      }

      const chartData = {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [
          {
            label: 'Passengers by Hour',
            data: hourlyData,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
          },
        ],
      };

      // Prepare session distribution
      const periods = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
      if (data.records && Array.isArray(data.records)) {
        data.records.forEach(record => {
          const period = getTimePeriod(record.timestamp);
          periods[period]++;
        });
      }

      setSessionDistributionChartData(prev => ({
        ...prev,
        datasets: [
          {
            ...prev.datasets[0],
            data: [periods.Morning, periods.Afternoon, periods.Evening, periods.Night]
          }
        ]
      }));

      setReportData({
        summary,
        chartData,
        details: data.sessions || []
      });

      setPassengerTrendChartData(chartData);

    } catch (error) {
      console.error('Error fetching daily report:', error);
      setError('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch weekly report
  const fetchWeeklyReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await reportsService.getWeeklyReport(startDate, endDate);
      console.log('Weekly report data:', data);

      // Update summary
      const summary = {
        totalPassengers: data.total_passengers || 0,
        activeSessions: 0,
        totalSessions: data.daily_counts ? data.daily_counts.reduce((sum, day) => sum + (day.sessions || 0), 0) : 0,
        averagePerSession: data.daily_counts && data.daily_counts.length > 0 
          ? Math.round(data.total_passengers / Math.max(1, data.daily_counts.reduce((sum, day) => sum + (day.sessions || 0), 0)) * 100) / 100 
          : 0
      };

      // Prepare daily chart data
      const chartData = {
        labels: data.daily_counts ? data.daily_counts.map(day => formatDate(day.date)) : [],
        datasets: [
          {
            label: 'Daily Passengers',
            data: data.daily_counts ? data.daily_counts.map(day => day.passengers || 0) : [],
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
          },
        ],
      };

      setReportData({
        summary,
        chartData,
        details: data.driver_performance || []
      });

      setPassengerTrendChartData(chartData);

      // Reset session distribution for weekly view
      setSessionDistributionChartData(prev => ({
        ...prev,
        datasets: [
          {
            ...prev.datasets[0],
            data: [0, 0, 0, 0]
          }
        ]
      }));

    } catch (error) {
      console.error('Error fetching weekly report:', error);
      setError('Failed to load weekly report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch monthly report
  const fetchMonthlyReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await reportsService.getMonthlyReport(selectedYear, selectedMonth);
      console.log('Monthly report data:', data);

      // Update summary
      const summary = {
        totalPassengers: data.total_passengers || 0,
        activeSessions: 0,
        totalSessions: data.daily_averages ? data.daily_averages.length : 0,
        averagePerSession: data.daily_averages && data.daily_averages.length > 0 
          ? Math.round(data.total_passengers / data.daily_averages.length * 100) / 100 
          : 0
      };

      // Prepare monthly chart data
      const chartData = {
        labels: data.daily_averages ? data.daily_averages.map((_, index) => `Day ${index + 1}`) : [],
        datasets: [
          {
            label: 'Daily Average Passengers',
            data: data.daily_averages ? data.daily_averages.map(avg => avg.passengers || 0) : [],
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
          },
        ],
      };

      setReportData({
        summary,
        chartData,
        details: data.top_drivers || []
      });

      setPassengerTrendChartData(chartData);

      // Reset session distribution for monthly view
      setSessionDistributionChartData(prev => ({
        ...prev,
        datasets: [
          {
            ...prev.datasets[0],
            data: [0, 0, 0, 0]
          }
        ]
      }));

    } catch (error) {
      console.error('Error fetching monthly report:', error);
      setError('Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Fetch report based on type
  const fetchReport = useCallback(() => {
    switch (reportType) {
      case 'daily':
        return fetchDailyReport();
      case 'weekly':
        return fetchWeeklyReport();
      case 'monthly':
        return fetchMonthlyReport();
      default:
        return fetchDailyReport();
    }
  }, [reportType, fetchDailyReport, fetchWeeklyReport, fetchMonthlyReport]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
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
        originalButton.textContent = 'Generating PDF...';
        originalButton.disabled = true;
      }

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with A4 size
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit the PDF
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title page
      pdf.setFontSize(20);
      pdf.text('Passenger Counting System Report', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, 45);
      
      let dateText = '';
      if (reportType === 'daily') {
        dateText = `Date: ${formatDate(selectedDate)}`;
      } else if (reportType === 'monthly') {
        dateText = `Month: ${selectedMonth}/${selectedYear}`;
      } else if (reportType === 'custom') {
        dateText = `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
      pdf.text(dateText, 20, 55);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 65);
      
      // Add summary statistics
      pdf.text('Summary:', 20, 85);
      pdf.text(`Total Passengers: ${reportData.summary.totalPassengers.toLocaleString()}`, 20, 95);
      pdf.text(`Total Sessions: ${reportData.summary.totalSessions}`, 20, 105);
      pdf.text(`Active Sessions: ${reportData.summary.activeSessions}`, 20, 115);
      pdf.text(`Average Passengers per Session: ${reportData.summary.averagePerSession.toFixed(1)}`, 20, 125);
      
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
              onClick={fetchReport}
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
      <div className="p-6">        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>Reports & Analytics</h1>
          <p className="text-gray-600">Analyze passenger data and system performance</p>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex space-x-1">
              {['daily', 'weekly', 'monthly'].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    reportType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Date/Period Selection */}
            <div className="flex items-center space-x-4">
              {reportType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {reportType === 'weekly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {reportType === 'monthly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[2024, 2023, 2022, 2021].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>            <button
              onClick={exportReport}
              data-export-button
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Export to PDF
            </button>
          </div>        </div>

        {/* Report Content for PDF Export */}
        <div id="report-content">
          {/* Report Header for PDF */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center border-b pb-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Passenger Counting System Report</h1>
              <div className="text-gray-600">
                <p className="text-lg font-medium mb-1">
                  {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </p>
                <p className="text-sm">
                  {reportType === 'daily' && `Date: ${formatDate(selectedDate)}`}
                  {reportType === 'monthly' && `Month: ${selectedMonth}/${selectedYear}`}
                  {reportType === 'custom' && `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Generated on: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
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
                <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalPassengers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.activeSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg per Session</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.averagePerSession}</p>
              </div>
            </div>
          </div>
        </div>        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>
              {reportType === 'daily' ? 'Hourly Passenger Trends' : 
               reportType === 'weekly' ? 'Daily Passenger Trends' : 
               'Monthly Passenger Trends'}
            </h3>
            <div className="h-80">
              <LineChart data={passengerTrendChartData} />
            </div>
          </div>
          
          {reportType === 'daily' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>Time Period Distribution</h3>
              <div className="h-80">
                <DonutChart data={sessionDistributionChartData} />
              </div>
            </div>
          )}

          {reportType !== 'daily' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>Summary Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Report Period</span>
                  <span className="font-medium">
                    {reportType === 'weekly' ? `${formatDate(startDate)} - ${formatDate(endDate)}` :
                     reportType === 'monthly' ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}` :
                     formatDate(selectedDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Passengers</span>
                  <span className="font-medium">{reportData.summary.totalPassengers}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-medium">{reportData.summary.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Average per Session</span>
                  <span className="font-medium">{reportData.summary.averagePerSession}</span>
                </div>
              </div>
            </div>
          )}
        </div>        {/* Details Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0' }}>
              {reportType === 'daily' ? 'Session Details' :
               reportType === 'weekly' ? 'Driver Performance' :
               'Top Performers'}
            </h3>
          </div>
          
          <div className="p-6">
            {reportData.details.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                <p className="mt-1 text-sm text-gray-500">No details found for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {reportType === 'daily' && (
                        <>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Driver</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Vehicle</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Passengers</th>
                        </>
                      )}
                      {reportType === 'weekly' && (
                        <>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Driver</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Total Passengers</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Sessions</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Average</th>
                        </>
                      )}
                      {reportType === 'monthly' && (
                        <>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Driver</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Total Passengers</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900 text-sm">Rank</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        {reportType === 'daily' && (
                          <>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.driver_name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.mobil_number || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.count || 0}
                            </td>
                          </>
                        )}
                        {reportType === 'weekly' && (
                          <>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.driver_name || item.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.total_passengers || 0}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.sessions || 0}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.average || 0}
                            </td>
                          </>
                        )}
                        {reportType === 'monthly' && (
                          <>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.driver_name || item.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.total_passengers || 0}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              #{index + 1}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* End Report Content */}
        </div>
      </div>
    </div>
  );
};

export default Reports;
