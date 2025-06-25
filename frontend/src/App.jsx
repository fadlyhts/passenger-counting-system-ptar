import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PassengerCount from './pages/PassengerCount.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Drivers from './pages/Drivers.jsx';
import Driver from './pages/DriverPage.jsx';
import Devices from './pages/Devices.jsx';
import Sessions from './pages/Sessions.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

// Services
import { authService } from './services';

function App() {
  console.log('App rendering, isLoggedIn:', authService.isLoggedIn());
  
  return (
    <div className="App">
      <Router>
        <Routes>          {/* Public routes */}
          <Route path="/login" element={
            authService.isLoggedIn() ? (
              <Navigate to={authService.getUserType() === 'driver' ? '/driver' : '/dashboard'} replace />
            ) : <Login />
          } />
            {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Driver-only route (no admin sidebar) */}
            <Route path="/driver" element={<Driver />} />
            
            {/* Admin routes with sidebar */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to={authService.getUserType() === 'driver' ? '/driver' : '/dashboard'} replace />} />
              <Route path="dashboard" element={
                <>
                  {console.log('Dashboard route matched')}
                  <Dashboard />
                </>
              } />              <Route path="passenger-count" element={<PassengerCount />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="devices" element={<Devices />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={
            <>
              {console.log('Fallback route matched')}
              <Navigate to="/" replace />
            </>
          } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;