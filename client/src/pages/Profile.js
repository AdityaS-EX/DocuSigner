import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = '/api/auth/profile';

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      const response = await axios.put(`${apiUrl}${path}`, { name }, config);
      setUser(response.data);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        let path = '/api/auth/profile';
        if (apiUrl.endsWith('/api')) {
          path = '/auth/profile';
        } else if (apiUrl.endsWith('/api/')) {
          path = 'auth/profile';
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };

        const response = await axios.get(`${apiUrl}${path}`, config);
        setUser(response.data);

      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-center p-8">No user data found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Your Profile</h1>
      {successMessage && <div className="text-center p-4 mb-4 text-green-500">{successMessage}</div>}
      {isEditing ? (
        <form onSubmit={handleUpdateProfile}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-semibold text-gray-500">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Username</span>
            <p className="text-lg text-gray-900">{user.username}</p>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Name</span>
            <p className="text-lg text-gray-900">{user.name}</p>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Email</span>
            <p className="text-lg text-gray-900">{user.email}</p>
          </div>
          <div className="border-t my-2"></div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Member Since</span>
            <p className="text-lg text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right mt-6">
            <button onClick={() => { setIsEditing(true); setName(user.name); }} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
