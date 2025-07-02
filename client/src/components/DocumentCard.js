
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SignatureStatus from './SignatureStatus'; // Restore the import

const DocumentCard = ({ 
    doc, 
    onPreview, 
    onOpenSignatureEditor, 
    onDelete, 
    onShare,
    onLoadSignatures,
    onUpdateSignatureStatus,
    activeDoc,
    activeDocSignatures
}) => {
    const [signaturesVisible, setSignaturesVisible] = useState(false);

    const handleToggleSignatures = (e) => {
        e.stopPropagation(); 
        if (!signaturesVisible) {
            onLoadSignatures(doc);
        }
        setSignaturesVisible(!signaturesVisible);
    };

    const isCurrentActiveDoc = activeDoc && activeDoc._id === doc._id;

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
            <div>
                <h2 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2 truncate" title={doc.filename}>
                    {doc.filename}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                    Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                </p>
            </div>

            {/* Signature Statuses Section */}
            {isCurrentActiveDoc && signaturesVisible && (
                <div className="mt-4 border-t pt-4">
                    <h3 className="font-bold mb-3 text-gray-700">Signature Statuses</h3>
                    {activeDocSignatures.length > 0 ? (
                        activeDocSignatures.map(sig => (
                            <SignatureStatus
                                key={sig._id}
                                signature={sig}
                                onUpdateStatus={onUpdateSignatureStatus}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No signatures to display.</p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => onPreview(doc)}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                    >
                        Preview
                    </button>
                    <button 
                        onClick={() => onOpenSignatureEditor(doc)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                    >
                        Edit Sigs
                    </button>
                </div>
                
                <button
                    onClick={handleToggleSignatures}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                >
                    {signaturesVisible ? 'Hide' : 'Show'} Signatures
                </button>
                
                <button
                    onClick={() => onShare(doc)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                >
                    Share
                </button>
                <button
                    onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/docs/${doc._id}/download`, '_blank')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                >
                    Download
                </button>
                <Link to={`/audit/${doc._id}`} className="block w-full text-center bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm">
                    Audit Trail
                </Link>
                <button 
                    onClick={() => onDelete(doc._id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default DocumentCard;
