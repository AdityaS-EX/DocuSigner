
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LegacySignRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This component's purpose is to redirect legacy links.
    // It informs the user that the process has changed and they need to log in.
    navigate('/login', { 
      replace: true, 
      state: { 
        message: 'The document sharing process has been updated for better security. Please log in to view documents shared with you.' 
      } 
    });
  }, [navigate]);

  // Render nothing, as the redirect is immediate.
  // Or render a simple "Redirecting..." message.
  return <div className="text-center p-8">Redirecting...</div>;
};

export default LegacySignRedirect;
