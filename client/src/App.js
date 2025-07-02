import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SharedDocuments from './pages/SharedDocuments'; // Import the new page
import LegacySignRedirect from './pages/LegacySignRedirect'; // Import the redirect component
import AuditLog from './pages/AuditLog';

// --- Private Route Component ---
// This component will protect routes that require authentication
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// --- Main App Component ---
function App() {
  // Simple state to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    // No need to navigate here, the PrivateRoute will handle it
  };

  return (
    <Router>
      <div>
        <nav className="bg-gray-800 p-4">
          <ul className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <li>
                  <Link to="/" className="text-white hover:text-gray-300">Home</Link>
                </li>
                {isAuthenticated && (
                  <>
                    <li>
                      <Link to="/dashboard" className="text-white hover:text-gray-300">Dashboard</Link>
                    </li>
                    <li>
                      <Link to="/profile" className="text-white hover:text-gray-300">Profile</Link>
                    </li>
                    <li>
                      <Link to="/shared" className="text-white hover:text-gray-300">Shared With Me</Link>
                    </li>
                  </>
                )}
            </div>
            <div>
              {isAuthenticated ? (
                <button onClick={handleLogout} className="text-white hover:text-gray-300">Logout</button>
              ) : (
                <Link to="/login" className="text-white hover:text-gray-300">Login</Link>
              )}
            </div>
          </ul>
        </nav>

        <div className="container mx-auto mt-8 p-4">
          <Routes>
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword onLogin={handleLogin} />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/shared"
              element={
                <PrivateRoute>
                  <SharedDocuments />
                </PrivateRoute>
              }
            />
            <Route 
              path="/audit/:docId" 
              element={
                <PrivateRoute>
                  <AuditLog />
                </PrivateRoute>
              } 
            />
            {/* --- Legacy Route Handler --- */}
            <Route path="/sign/:token" element={<LegacySignRedirect />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Example Home component
const Home = () => (
  <div className="text-center">
    <h1 className="text-4xl font-bold text-gray-700 mb-4">Welcome to the Document Signature App</h1>
    <p className="text-lg text-gray-600">
      Please <Link to="/login" className="text-blue-500 hover:underline">log in</Link> or <Link to="/register" className="text-blue-500 hover:underline">create an account</Link> to manage your documents.
    </p>
  </div>
);

export default App;
