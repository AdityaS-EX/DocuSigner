import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = '/api/auth/forgot-password';
      
      const response = await axios.post(`${apiUrl}${path}`, { email });
      
      // Add the spam folder reminder to the success message
      const successMessage = `${response.data.message} Please be sure to check your spam folder if you don't see it in your inbox.`;
      setMessage(successMessage);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Forgot Password</h1>
      <p className="text-center text-gray-600 mb-6">
        Enter your email address and we will send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit}>
        {message && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{message}</p>}
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col items-center">
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <Link to="/login" className="mt-4 text-sm text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
