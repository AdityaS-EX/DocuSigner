
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PDFPreview from '../components/PDFPreview';
import SignatureEditor from '../components/SignatureEditor';

const SharedDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeDoc, setActiveDoc] = useState(null);
    const [activeDocSignatures, setActiveDocSignatures] = useState([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    useEffect(() => {
        const fetchSharedDocuments = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in.');
                setLoading(false);
                return;
            }

            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const response = await axios.get(`${apiUrl}/api/docs/shared`, config);
                setDocuments(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch shared documents.');
            } finally {
                setLoading(false);
            }
        };

        fetchSharedDocuments();
    }, []);

    const loadSignaturesForDoc = async (doc) => {
        if (activeDoc?._id === doc._id) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.get(`${apiUrl}/api/signatures/${doc._id}`, config);
            setActiveDocSignatures(response.data || []);
            setActiveDoc(doc);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch signatures.');
        }
    };

    const handlePreview = async (doc) => {
        await loadSignaturesForDoc(doc);
        setIsPreviewOpen(true);
    };

    const handleOpenEditor = async (doc) => {
        await loadSignaturesForDoc(doc);
        setIsEditorOpen(true);
    };

    const handleSaveSignature = async (signatureData) => {
        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const body = { documentId: activeDoc._id, ...signatureData };
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${apiUrl}/api/signatures`, body, config);
            setActiveDocSignatures([...activeDocSignatures, response.data.signature]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save signature.');
        }
    };
    
    const handleUpdateSignature = async (updateData) => {
        const { signatureId, ...payload } = updateData;

        // --- Optimistic UI Update ---
        const originalSignatures = [...activeDocSignatures];
        setActiveDocSignatures(prevSignatures =>
            prevSignatures.map(sig =>
                sig._id === signatureId ? { ...sig, ...payload } : sig
            )
        );

        // --- Send API Request ---
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };

            const allowedUpdates = {
                x: payload.x,
                y: payload.y,
                text: payload.text,
                font: payload.font,
                fontSize: payload.fontSize,
                color: payload.color,
            };
            Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

            if (Object.keys(allowedUpdates).length === 0) return; // Don't send empty requests

            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            await axios.put(`${apiUrl}/api/signatures/${signatureId}`, allowedUpdates, config);
            // If successful, the optimistic update is confirmed.

        } catch (err) {
            // --- Revert on Failure ---
            setError(err.response?.data?.message || 'Failed to save changes. Please try again.');
            setActiveDocSignatures(originalSignatures);
        }
    };

    const handleDeleteSignature = async (signatureId) => {
        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        try {
            await axios.delete(`${apiUrl}/api/signatures/${signatureId}`, config);
            setActiveDocSignatures(activeDocSignatures.filter(s => s._id !== signatureId));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete signature.');
        }
    };


    if (loading) return <div className="text-center p-8 animate-pulse">Loading shared documents...</div>;
    if (error) return <div className="text-center p-8 text-red-500 bg-red-100 rounded-lg">Error: {error}</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Shared With Me</h1>

            {isEditorOpen && activeDoc && (
                 <SignatureEditor 
                    pdfUrl={activeDoc.path}
                    existingSignatures={activeDocSignatures}
                    onSaveSignature={handleSaveSignature}
                    onUpdateSignature={handleUpdateSignature}
                    onDeleteSignature={handleDeleteSignature}
                    onCloseEditor={() => setIsEditorOpen(false)}
                  />
            )}

            {isPreviewOpen && activeDoc && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                     <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
                        <PDFPreview 
                            documentUrl={activeDoc.path} 
                            signatures={activeDocSignatures.filter(s => s.status !== 'rejected')}
                            isEditable={false} // Preview is not for editing
                        />
                        <button onClick={() => setIsPreviewOpen(false)} className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full w-10 h-10">X</button>
                    </div>
                </div>
            )}
            
            {!isEditorOpen && !isPreviewOpen && (
                documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {documents.map(doc => (
                            <div key={doc._id} className="bg-white shadow-lg rounded-lg p-4 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-blue-600 mb-2 truncate">{doc.filename}</h2>
                                    <p className="text-sm text-gray-500 mb-1">Owner: {doc.user.name}</p>
                                    <p className="text-xs text-gray-500 mb-4">Shared: {new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col space-y-2 mt-4">
                                    <button onClick={() => handlePreview(doc)} className="w-full bg-indigo-500 text-white font-semibold py-2 px-4 rounded">Preview</button>
                                    <button onClick={() => handleOpenEditor(doc)} className="w-full bg-green-500 text-white font-semibold py-2 px-4 rounded">View & Sign</button>
                                    <button onClick={() => window.open(`${process.env.REACT_APP_API_URL}/api/docs/${doc._id}/download`, '_blank')} className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded">Download</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-12 text-gray-600">No documents have been shared with you yet.</p>
                )
            )}
        </div>
    );
};

export default SharedDocuments;
