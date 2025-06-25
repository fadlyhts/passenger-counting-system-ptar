import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { authService } from '../services';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';
  
  useEffect(() => {
    // Check if user is a driver trying to access admin pages
    const userType = authService.getUserType();
    if (userType === 'driver') {
      console.log('Driver detected in admin layout, redirecting to /driver');
      navigate('/driver', { replace: true });
    }
  }, [navigate]);
  
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar activeItem={currentPath} />
      <div className="flex-1" style={{ marginLeft: '260px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
