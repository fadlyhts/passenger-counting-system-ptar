import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services';

const Sidebar = ({ activeItem }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      iconGray: '/assets/icons/Dashboard_Gray.svg',
      iconWhite: '/assets/icons/Dashboard_White.svg'
    },
    { 
      id: 'passenger-count', 
      label: 'Passenger Count', 
      iconGray: '/assets/icons/Passenger_Gray.svg',
      iconWhite: '/assets/icons/Passenger_White.svg'
    },
    { 
      id: 'vehicles', 
      label: 'Vehicles', 
      iconGray: '/assets/icons/Vehicle_Gray.svg',
      iconWhite: '/assets/icons/Vehicle_White.svg'
    },    { 
      id: 'drivers', 
      label: 'Drivers', 
      iconGray: '/assets/icons/Driver_Gray.svg',
      iconWhite: '/assets/icons/Driver_White.svg'
    },
    { 
      id: 'devices', 
      label: 'Devices', 
      iconGray: '/assets/icons/Device_Gray.svg',
      iconWhite: '/assets/icons/Device_White.svg'
    },
    { 
      id: 'sessions', 
      label: 'Sessions', 
      iconGray: '/assets/icons/Session_Gray.svg',
      iconWhite: '/assets/icons/Session_White.svg'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      iconGray: '/assets/icons/Report_Gray.svg',
      iconWhite: '/assets/icons/Report_White.svg'
    }
  ];

  const handleLogout = async () => {
    try {
      // Clear any running intervals first
      const intervals = window._dashboardIntervals || [];
      intervals.forEach(intervalId => clearInterval(intervalId));
      window._dashboardIntervals = [];
      
      // Perform logout
      await authService.logout();
      
      // Use navigate from react-router instead of setTimeout or window.location
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still use navigate even in error case
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      top: '0',
      left: '0',
      backgroundColor: 'white',
      color: '#333',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '1px 0 5px rgba(0, 0, 0, 0.05)',
      zIndex: '100'
    }}>
      {/* Logo and Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <img
            src="/assets/logo/PTAR_Logo.png"
            alt="PTAR Logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain'
            }}
          />
        </div>        <div style={{
          fontSize: '14px',
          color: '#333',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Passenger Counting System
        </div>
      </div>
      
      {/* Navigation */}
      <nav style={{
        flex: '1',
        padding: '20px 0',
        overflowY: 'auto'
      }}>
        <ul style={{
          listStyle: 'none',
          padding: '0',
          margin: '0'
        }}>
          {navItems.map(item => (
            <li 
              key={item.id}
              style={{
                marginBottom: '5px',
                borderLeft: activeItem === item.id ? '4px solid #4CAF50' : '4px solid transparent'
              }}
            >
              <Link 
                to={`/${item.id}`} 
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  color: activeItem === item.id ? 'white' : '#333',
                  backgroundColor: activeItem === item.id ? '#0A3D62' : 'transparent',
                  fontWeight: activeItem === item.id ? '600' : '500'
                }}
                onMouseEnter={(e) => {
                  if (activeItem !== item.id) {
                    e.target.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeItem !== item.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  marginRight: '12px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={activeItem === item.id ? item.iconWhite : item.iconGray} 
                    alt={item.label}
                    style={{
                      width: '20px',
                      height: '20px'
                    }}
                  />
                </span>
                <span style={{
                  fontSize: '14px'
                }}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer */}
      <div style={{
        padding: '0',
        borderTop: '1px solid #f0f0f0',
        marginTop: 'auto'
      }}>
        <div style={{
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Link 
            to="/settings" 
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              width: '100%'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span style={{
              marginRight: '12px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/assets/icons/Setting_Gray.svg" 
                alt="Settings"
                style={{
                  width: '20px',
                  height: '20px'
                }}
              />
            </span>            <span style={{
              fontSize: '14px',
              color: '#666',
              fontWeight: '500'
            }}>
              Settings
            </span>
          </Link>
        </div>
        <div 
          style={{
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={handleLogout}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            width: '100%'
          }}>
            <span style={{
              marginRight: '12px',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/assets/icons/Logout.svg" 
                alt="Logout"
                style={{
                  width: '20px',
                  height: '20px'
                }}
              />
            </span>            <span style={{
              fontSize: '14px',
              color: '#666',
              fontWeight: '500'
            }}>
              Logout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
