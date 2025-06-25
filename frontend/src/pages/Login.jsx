import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin'); // 'admin' or 'driver'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login form submitted');
      
      if (userType === 'admin') {
        const response = await authService.adminLogin(username, password);
        console.log('Admin login successful, response:', response);
      } else {
        const response = await authService.driverLogin(username, password);
        console.log('Driver login successful, response:', response);
      }
        // Check if user is logged in after login attempt
      const isLoggedIn = authService.isLoggedIn();
      console.log('Is user logged in after login?', isLoggedIn);
      
      // Redirect based on user type
      const redirectPath = userType === 'driver' ? '/driver' : '/dashboard';
      console.log(`Attempting to navigate to ${redirectPath}`);
        try {
        navigate(redirectPath);
        console.log('Navigation function called');
        
        // Set a timeout to check if navigation worked
        setTimeout(() => {
          // If we're still on the login page after navigation, use window.location as fallback
          if (window.location.pathname.includes('login')) {
            console.log('Still on login page after navigation, using window.location fallback');
            window.location.href = redirectPath;
          }
        }, 500);
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback to window.location if navigate throws an error - use the correct redirect path
        window.location.href = redirectPath;
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (    <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-full bg-white rounded-lg overflow-hidden" style={{ maxWidth: '450px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div className="py-8 px-5 text-center border-b border-gray-200" style={{ backgroundColor: '#f9f9f9' }}>
          <img 
            src="/assets/logo/PTAR_Logo.png" 
            alt="PTAR Logo" 
            className="mx-auto mb-4" 
            style={{ width: '120px' }}
          />
          <h1 className="text-gray-800 font-medium m-0" style={{ fontSize: '22px' }}>Passenger Counting System</h1>
        </div>

        <div className="p-8">
          <div className="flex mb-6 rounded border border-gray-300 overflow-hidden">
            <button 
              className={`flex-1 py-3 px-4 font-medium transition-all duration-200 border-none cursor-pointer ${
                userType === 'admin' 
                  ? 'text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={userType === 'admin' ? { backgroundColor: '#054568' } : {}}
              onClick={() => setUserType('admin')}
            >
              Admin
            </button>
            <button 
              className={`flex-1 py-3 px-4 font-medium transition-all duration-200 border-none cursor-pointer ${
                userType === 'driver' 
                  ? 'text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={userType === 'driver' ? { backgroundColor: '#054568' } : {}}
              onClick={() => setUserType('driver')}
            >
              Driver
            </button>
          </div>          <form onSubmit={handleSubmit} className="flex flex-col">
            {error && (
              <div className="text-red-700 p-3 rounded mb-5 text-sm" style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
                {error}
              </div>
            )}
            
            <div className="mb-5">
              <label htmlFor="username" className="block mb-2 text-sm" style={{ color: '#555' }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="w-full py-3 px-3 border border-gray-300 rounded text-base transition-colors duration-200 focus:outline-none"
                style={{ 
                  padding: '12px',
                  fontSize: '16px',
                  borderColor: '#ddd'
                }}
                onFocus={(e) => e.target.style.borderColor = '#054568'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block mb-2 text-sm" style={{ color: '#555' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full py-3 px-3 border border-gray-300 rounded text-base transition-colors duration-200 focus:outline-none"
                style={{ 
                  padding: '12px',
                  fontSize: '16px',
                  borderColor: '#ddd'
                }}
                onFocus={(e) => e.target.style.borderColor = '#054568'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <button 
              type="submit" 
              className="border-none rounded text-base cursor-pointer transition-colors duration-200 mt-3 disabled:cursor-not-allowed"
              style={{
                padding: '12px',
                backgroundColor: loading ? '#6c757d' : '#054568',
                color: 'white',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#043a52';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#054568';
              }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
