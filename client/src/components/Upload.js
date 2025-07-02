import React, { useState } from 'react';
import axios from 'axios';

const Upload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null); // Clear previous errors on new file selection
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    // Check for file type on the client side for immediate feedback
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    // The key 'documentFile' must match the field name in the backend Multer config
    formData.append('documentFile', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setUploading(false);
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let path = '/api/docs/upload';
      if (apiUrl.endsWith('/api')) {
        path = '/docs/upload';
      } else if (apiUrl.endsWith('/api/')) {
        path = 'docs/upload';
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.post(`${apiUrl}${path}`, formData, config);

      // Notify parent component of the successful upload
      if (onUploadSuccess) {
        onUploadSuccess(response.data.document);
      }

      // Reset form state
      setFile(null);
      e.target.reset(); // Reset the file input form

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'File upload failed.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg mb-8">
      <h2 className="text-2xl font-bold mb-4">Upload a New Document</h2>
      <form onSubmit={handleUpload}>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
        
        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full py-2 px-4 rounded text-white font-semibold transition-colors ${
            uploading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default Upload;
