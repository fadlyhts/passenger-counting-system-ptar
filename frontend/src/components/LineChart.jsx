import React, { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, title, height = 300 }) => {
  // Add logging when component receives data
  useEffect(() => {
    console.log('LineChart received data:', data);
  }, [data]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxWidth: 10,
        usePointStyle: true,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        displayColors: true,
        callbacks: {
          labelPointStyle: function(context) {
            return {
              pointStyle: 'circle',
              rotation: 0
            };
          },
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `Passengers: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 8,
        },
        border: {
          display: false,
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
            family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          },
          padding: 10,
          stepSize: 1,
        },
        beginAtZero: true,
        border: {
          display: false,
        }
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        fill: true,
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: 'white',
        hoverBackgroundColor: 'white',
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div style={{ height: height, width: '100%' }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default LineChart;
