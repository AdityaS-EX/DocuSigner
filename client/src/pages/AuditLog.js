import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const AuditLog = () => {
    const { docId } = useParams();
    const [auditLogs, setAuditLogs] = useState([]);
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleClearAudit = async () => {
        if (window.confirm('Are you sure you want to clear this audit trail? This action is irreversible and the logs will be permanently deleted after 15 days.')) {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                await axios.delete(`${apiUrl}/api/audit/${docId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Optimistically clear the logs from the UI
                setAuditLogs([]);
                alert('Audit trail cleared successfully.');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to clear audit trail.');
            }
        }
    };

    useEffect(() => {
        const fetchAuditLog = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication token not found.');
                    setLoading(false);
                    return;
                }

                const config = {
                    headers: { 'Authorization': `Bearer ${token}` }
                };

                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                
                // Fetch both document details and audit logs
                const [auditRes, docRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/audit/${docId}`, config),
                    axios.get(`${apiUrl}/api/docs/details/${docId}`, config)
                ]);

                // The API sends the array directly, not nested in an object.
                setAuditLogs(auditRes.data); 
                setDocument(docRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch audit log.');
                setLoading(false);
            }
        };

        fetchAuditLog();
    }, [docId]);

    if (loading) return <div className="text-center p-8">Loading audit trail...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-2">Audit Trail</h1>
            {document && <h2 className="text-xl text-gray-600 mb-6">For Document: {document.filename}</h2>}
            
            <div className="flex justify-between items-center mb-6">
                <Link to="/dashboard" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    &larr; Back to Dashboard
                </Link>
                <button 
                    onClick={handleClearAudit}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    disabled={auditLogs.length === 0}
                >
                    Clear Audit Trail
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            <tr key={log._id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{log.action}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {log.userId ? (
                                        <div 
                                            className="relative inline-block"
                                            title={`Email: ${log.userId.email}`} // Hover tooltip
                                        >
                                            <p 
                                                className="text-gray-900 whitespace-no-wrap cursor-pointer hover:text-blue-600"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(log.userId.email);
                                                    // Replace alert with a more subtle notification if desired
                                                    const notification = document.createElement('div');
                                                    notification.textContent = 'Email copied to clipboard!';
                                                    notification.style.position = 'fixed';
                                                    notification.style.bottom = '20px';
                                                    notification.style.left = '50%';
                                                    notification.style.transform = 'translateX(-50%)';
                                                    notification.style.backgroundColor = '#4CAF50';
                                                    notification.style.color = 'white';
                                                    notification.style.padding = '10px';
                                                    notification.style.borderRadius = '5px';
                                                    document.body.appendChild(notification);
                                                    setTimeout(() => {
                                                        document.body.removeChild(notification);
                                                    }, 3000);
                                                }}
                                            >
                                                {log.userId.name} ({log.userId.username})
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-900 whitespace-no-wrap">Public User</p>
                                    )}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{log.ip}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{new Date(log.timestamp).toLocaleString()}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLog;
