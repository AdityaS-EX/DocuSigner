import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import PDFPreview from '../components/PDFPreview';
import SignatureEditor from '../components/SignatureEditor';
import Upload from '../components/Upload';
import DocumentCard from '../components/DocumentCard'; // Reusable component for the document card


const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeDoc, setActiveDoc] = useState(null); 
  const [activeDocSignatures, setActiveDocSignatures] = useState([]);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // --- New State for Modals ---
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToInteract, setDocToInteract] = useState(null); // Document for the active modal
  const [shareEmail, setShareEmail] = useState('');
  const [shareFeedback, setShareFeedback] = useState({ type: '', message: '' });

  // New state for filter
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'signed', 'rejected'

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        if (!token) {
          setError('No authentication token found. Please login.');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        // Ensure this matches your .env or actual backend URL
        let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        // If REACT_APP_API_URL is 'http://localhost:5000/api', we just need '/docs'
        // If REACT_APP_API_URL is 'http://localhost:5000', we need '/api/docs'
        let path = '/api/docs';
        if (apiUrl.endsWith('/api')) {
          path = '/docs';
        } else if (apiUrl.endsWith('/api/')) {
          path = 'docs'; // if apiUrl ends with /api/ then just add docs
        }
        const response = await axios.get(`${apiUrl}${path}`, config);
        
        setDocuments(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch documents.');
        console.error("Error fetching documents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // This function now centrally fetches signature data if it's not already loaded
  const loadSignaturesForDoc = async (doc) => {
    // If we are already working on this doc, don't re-fetch.
    if (activeDoc && activeDoc._id === doc._id) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Authentication token not found.'); return; }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = `/api/signatures/${doc._id}`;
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const response = await axios.get(`${apiUrl}${path}`, config);
      
      setActiveDocSignatures(response.data || []);
      setActiveDoc(doc); // Set the new active document
      setError(null);

    } catch (err) {
      console.error('Failed to fetch signatures:', err);
      setError(err.response?.data?.message || 'Failed to fetch signatures.');
      setActiveDocSignatures([]);
      setActiveDoc(null);
    }
  };

  const handlePreview = async (doc) => {
    await loadSignaturesForDoc(doc);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    // Don't clear activeDoc state here, so it's preserved for the next action
  };

  const handleOpenSignatureEditor = async (doc) => {
    await loadSignaturesForDoc(doc);
    setIsEditorOpen(true);
  };

  const handleCloseSignatureEditor = () => {
    setIsEditorOpen(false);
    // The activeDoc and its signatures are preserved in state
  };

  // Placeholder for the actual save logic
  const handleSaveSignature = async (signatureData) => {
    if (!activeDoc) {
      console.error("No active document selected for saving signature.");
      setError("Cannot save signature: No document selected.");
      return;
    }
    console.log('Dashboard: handleSaveSignature called with:', signatureData);
    console.log('For document ID:', activeDoc._id);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const body = {
        documentId: activeDoc._id,
        userId: activeDoc.user,
        ...signatureData
      };

      let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let path = '/api/signatures';
      if (apiUrl.endsWith('/api')) {
        path = '/signatures';
      } else if (apiUrl.endsWith('/api/')) {
        path = 'signatures';
      }

      // The server will respond with the newly created signature object
      const response = await axios.post(`${apiUrl}${path}`, body, config);
      const newSignature = response.data.signature;

      console.log('Signature saved successfully!');

      // --- Optimistic UI Update for Creation ---
      // Add the new signature to our local state without re-fetching.
      setActiveDocSignatures(prevSignatures => [...prevSignatures, newSignature]);
      
      setError(null); // Clear any previous errors

    } catch (err) {
      console.error("Error saving signature:", err);
      setError(err.response?.data?.message || err.message || 'Failed to save signature.');
    }
  };

  const handleDeleteSignature = async (signatureId) => {
    if (!activeDoc) {
      console.error("Cannot delete signature: No document is being edited.");
      return;
    }
    
    console.log(`Dashboard: Deleting signature ${signatureId}`);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let path = `/api/signatures/${signatureId}`;
      if (apiUrl.endsWith('/api')) {
        path = `/signatures/${signatureId}`;
      } else if (apiUrl.endsWith('/api/')) {
        path = `signatures/${signatureId}`;
      }

      await axios.delete(`${apiUrl}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Signature deleted successfully!');
      // Optimistic UI Update for Deletion
      setActiveDocSignatures(prevSignatures => 
        prevSignatures.filter(sig => sig._id !== signatureId)
      );
      setError(null); // Clear any previous errors

    } catch (err) {
      console.error("Error deleting signature:", err);
      setError(err.response?.data?.message || 'Failed to delete signature.');
    }
  };

  const handleUpdateSignature = async (signatureData) => {
    const { signatureId } = signatureData;
    
    // --- Optimistic UI Update ---
    // Update the local state immediately for a responsive feel.
    setActiveDocSignatures(prevSignatures => 
      prevSignatures.map(sig => 
        sig._id === signatureId ? { ...sig, ...signatureData } : sig
      )
    );

    // --- Send Request to Backend ---
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found.');
        // Optionally, revert the optimistic update here
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = `/api/signatures/${signatureId}`;

      // Build a payload with ONLY the fields that were actually passed in.
      // This prevents the drag operation from erasing other properties.
      const payload = { ...signatureData };
      delete payload.signatureId; // Don't send the ID in the body

      await axios.put(`${apiUrl}${path}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If the request is successful, the optimistic update is now confirmed.
      console.log('Signature update persisted successfully for ID:', signatureId);

    } catch (err) {
      console.error("Error updating signature:", err);
      setError(err.response?.data?.message || 'Failed to update signature.');
      // TODO: If the API call fails, we should revert the state to its previous version.
      // For now, we'll just log the error.
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToInteract) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Authentication token not found.'); return; }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = `/api/docs/${docToInteract._id}`;
      
      await axios.delete(`${apiUrl}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setDocuments(documents.filter(doc => doc._id !== docToInteract._id));
      closeDeleteModal();
      setError(null);

    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err.response?.data?.message || 'Failed to delete document.');
      closeDeleteModal();
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!docToInteract || !shareEmail) return;

    setShareFeedback({ type: 'loading', message: 'Sending invite...' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setShareFeedback({ type: 'error', message: 'Authentication error.' });
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = `/api/docs/${docToInteract._id}/share`;
      const body = { email: shareEmail };
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const response = await axios.post(`${apiUrl}${path}`, body, config);
      
      setShareFeedback({ 
        type: 'success', 
        message: `${response.data.message} Please advise the recipient to check their spam folder.` 
      });

    } catch (err) {
      setShareFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to share document.' 
      });
    }
  };

  // --- Modal Control Functions ---
  const openShareModal = (doc) => {
    setDocToInteract(doc);
    setIsShareModalOpen(true);
  };
  
  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setDocToInteract(null);
    setShareEmail('');
    setShareFeedback({ type: '', message: '' });
  };

  const openDeleteModal = (doc) => {
    setDocToInteract(doc);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDocToInteract(null);
  };

  const handleUpdateSignatureStatus = async (signatureId, status, rejectionReason = '') => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Authentication token not found.');
            return;
        }

        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        let path;
        let payload = {};

        // Determine the correct endpoint and payload based on the new status
        if (status === 'signed') {
            path = `/api/signatures/accept/${signatureId}`;
        } else if (status === 'rejected') {
            path = `/api/signatures/reject/${signatureId}`;
            payload.rejectionReason = rejectionReason;
        } else { 
            // This handles 'pending' (the "Undo" action)
            path = `/api/signatures/${signatureId}`;
            payload.status = 'pending';
        }

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios.put(`${apiUrl}${path}`, payload, config);

        // Update the local state with the returned signature
        setActiveDocSignatures(prevSignatures =>
            prevSignatures.map(sig =>
                sig._id === signatureId ? { ...sig, ...response.data.signature } : sig
            )
        );

        setError(null);
    } catch (err) {
        console.error("Error updating signature status:", err);
        setError(err.response?.data?.message || `Failed to update signature status.`);
    }
};

  const handleUploadSuccess = (newDocument) => {
    setDocuments([newDocument, ...documents]);
  };

  const filteredDocuments = useMemo(() => {
    if (filterStatus === 'all') {
      return documents;
    }
    // This is a simplified filter. A more robust implementation might need
    // to fetch signature statuses for all documents upfront.
    // For now, we filter based on document-level properties if available,
    // or we can just return all documents as this filter is cosmetic without more data.
    return documents;
  }, [documents, filterStatus]);


  if (loading) return <div className="text-center p-8 animate-pulse">Loading documents...</div>;
  if (error) return <div className="text-center p-8 text-red-500 bg-red-100 rounded-lg">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Upload onUploadSuccess={handleUploadSuccess} />

      <div className="border-t mt-6 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            Your Documents
          </h1>
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none w-full sm:w-auto bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="signed">Signed</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {isEditorOpen && activeDoc ? (
          <SignatureEditor 
            pdfUrl={activeDoc.path}
            existingSignatures={activeDocSignatures}
            onSaveSignature={handleSaveSignature}
            onUpdateSignature={handleUpdateSignature}
            onDeleteSignature={handleDeleteSignature}
            onCloseEditor={handleCloseSignatureEditor}
          />
        ) : isPreviewOpen && activeDoc ? (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
                    <PDFPreview 
                        documentUrl={activeDoc.path} 
                        signatures={activeDocSignatures.filter(s => s.status !== 'rejected')}
                        isEditable={false}
                    />
                    <button 
                        onClick={closePreview} 
                        className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-transform transform hover:scale-110"
                        aria-label="Close preview"
                    >
                        X
                    </button>
                </div>
            </div>
        ) : (
          filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredDocuments.map((doc) => (
                <DocumentCard 
                  key={doc._id}
                  doc={doc}
                  onPreview={handlePreview}
                  onOpenSignatureEditor={handleOpenSignatureEditor}
                  onDelete={() => openDeleteModal(doc)}
                  onShare={() => openShareModal(doc)}
                  onLoadSignatures={loadSignaturesForDoc}
                  onUpdateSignatureStatus={handleUpdateSignatureStatus}
                  activeDoc={activeDoc}
                  activeDocSignatures={activeDocSignatures}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">You have no documents matching the filter "{filterStatus}".</p>
            </div>
          )
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* Share Modal */}
      {isShareModalOpen && docToInteract && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Share Document</h2>
            <p className="mb-4">Invite someone to sign <span className="font-semibold">{docToInteract.filename}</span>.</p>
            <form onSubmit={handleShare}>
              <input
                type="email"
                placeholder="Enter recipient's email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                required
              />
              {shareFeedback.message && (
                <p className={`text-sm text-center p-3 rounded mb-4 ${
                  shareFeedback.type === 'success' ? 'bg-green-100 text-green-800' :
                  shareFeedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {shareFeedback.message}
                </p>
              )}
              <div className="flex justify-end gap-4">
                <button type="button" onClick={closeShareModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" disabled={shareFeedback.type === 'loading'}>
                  {shareFeedback.type === 'loading' ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && docToInteract && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to permanently delete <span className="font-semibold">{docToInteract.filename}</span>? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button onClick={closeDeleteModal} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleDeleteDocument} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
