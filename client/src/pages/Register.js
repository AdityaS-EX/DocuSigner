import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, name, email, password, confirmPassword } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let path = '/api/auth/register';
      if (apiUrl.endsWith('/api')) path = '/auth/register';
      else if (apiUrl.endsWith('/api/')) path = 'auth/register';

      const response = await axios.post(`${apiUrl}${path}`, {
        username,
        name,
        email,
        password
      });

      const { token } = response.data;
      localStorage.setItem('token', token);

      if (onLogin) {
        onLogin();
      }

      navigate('/dashboard');

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed.';
      setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 border rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Create Your Account</h1>
      <form onSubmit={onSubmit}>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Username</label>
          <input type="text" id="username" name="username" value={username} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" value={name} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" value={email} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input type="password" id="password" name="password" value={password} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={onChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        <div className="flex flex-col items-center">
          <button type="submit" disabled={loading} className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
          <p className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Log in here</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;
