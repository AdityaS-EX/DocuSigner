import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if a message was passed from the redirect
    if (location.state?.message) {
      setInfoMessage(location.state.message);
      // Optional: Clear the state so the message doesn't reappear on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Determine API URL from environment variables or use a default
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let path = '/api/auth/login';

      // Adjust path if the base URL already contains '/api'
      if (apiUrl.endsWith('/api')) {
        path = '/auth/login';
      } else if (apiUrl.endsWith('/api/')) {
        path = 'auth/login';
      }

      const response = await axios.post(`${apiUrl}${path}`, {
        login, // Send the 'login' field to the backend
        password,
      });

      // Assuming the backend returns a token
      const { token } = response.data;

      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Notify the parent component (App.js) that login was successful
      if (onLogin) {
        onLogin();
      }

      // Redirect to the dashboard
      navigate('/dashboard');

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error("Login error:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
      <form onSubmit={handleLogin}>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
        {infoMessage && <p className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-center">{infoMessage}</p>}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login">
            Username or Email
          </label>
          <input
            id="login"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            autoComplete="username"
          />
        </div>

        <div className="mb-2">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="text-right mb-6">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot Password?
            </Link>
        </div>

        <div className="flex flex-col items-center">
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign In
          </button>
          <p className="mt-4 text-center text-sm">
            Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
