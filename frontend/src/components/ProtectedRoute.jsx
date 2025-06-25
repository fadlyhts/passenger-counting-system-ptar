import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services';

const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = authService.isLoggedIn();
  
  useEffect(() => {
    console.log('ProtectedRoute rendered at path:', location.pathname);
    console.log('Authentication status:', isAuthenticated);
    console.log('Token in localStorage:', localStorage.getItem('token'));
    console.log('User in localStorage:', localStorage.getItem('user'));
    
    // Check for auth redirect flag and clear it
    const authRedirect = sessionStorage.getItem('auth_redirect');
    if (authRedirect) {
      console.log('Auth redirect flag found, clearing it');
      sessionStorage.removeItem('auth_redirect');
    }
  }, [location.pathname, isAuthenticated]);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  console.log('Authenticated, rendering child routes');
  return <Outlet />;
};

export default ProtectedRoute;
