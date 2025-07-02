import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = `/api/auth/reset-password/${token}`;
      
      const response = await axios.post(`${apiUrl}${path}`, { password });
      
      setMessage(response.data.message);
      
      // If the backend sends a new token, log the user in
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (onLogin) onLogin();
        // Redirect to dashboard after a short delay
        setTimeout(() => navigate('/dashboard'), 2000);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Reset Your Password</h1>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
        <p className="font-bold">Check Your Email</p>
        <p>If you've requested a password reset, please check your inbox and spam folder for the reset link.</p>
      </div>
      <form onSubmit={handleSubmit}>
        {message && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{message}</p>}
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
