import React, { useState } from 'react';

const SignatureStatus = ({ signature, onUpdateStatus, token }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    await onUpdateStatus(signature._id, 'signed');
  };

  const handleRejectClick = () => {
    setIsRejecting(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason) {
      alert('Rejection reason is required.');
      return;
    }
    await onUpdateStatus(signature._id, 'rejected', rejectionReason);
    setIsRejecting(false);
    setRejectionReason('');
  };

  const handleUndo = async () => {
    if (window.confirm('Are you sure you want to revert this action? The signature status will be set back to "pending".')) {
      await onUpdateStatus(signature._id, 'pending');
    }
  };

  const statusColor = {
    pending: 'bg-yellow-200 text-yellow-800',
    signed: 'bg-green-200 text-green-800',
    rejected: 'bg-red-200 text-red-800',
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{signature.userId ? signature.userId.name : 'Public Signer'}</p>
          <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${statusColor[signature.status]}`}>
            {signature.status}
          </p>
          {signature.status === 'rejected' && signature.rejectionReason && (
            <p className="text-xs text-red-600 mt-1">Reason: {signature.rejectionReason}</p>
          )}
        </div>
        {signature.status === 'pending' && !isRejecting && (
          <div className="flex gap-2">
            <button onClick={handleAccept} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
              Accept
            </button>
            <button onClick={handleRejectClick} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              Reject
            </button>
          </div>
        )}
        {(signature.status === 'signed' || signature.status === 'rejected') && (
          <button onClick={handleUndo} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
            Undo
          </button>
        )}
      </div>
      {isRejecting && (
        <div className="mt-4">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Provide a reason for rejection..."
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setIsRejecting(false)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button onClick={handleRejectSubmit} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
              Confirm Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureStatus;
