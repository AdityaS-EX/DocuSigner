import React from 'react';

const Signatures = ({ 
  signatures, 
  onSave, 
  onUpdate, 
  onDelete, 
  docId 
}) => {
  
  // This component will render the list of signatures for a document
  // and provide buttons to interact with them.
  // The actual logic for creating, updating, and deleting signatures
  // will be passed down as props from the parent component (e.g., Dashboard).

  const handleCreateNewSignature = () => {
    // Example of how a new signature might be initiated
    // The actual creation logic (e.g., showing a modal or a canvas)
    // would be handled by the parent component, which then calls onSave.
    console.log("Initiating new signature for document:", docId);
    // In a real scenario, this might open a signature pad or placement tool
    // For this example, we'll just log it. The parent will handle the UI.
  };

  return (
    <div className="p-4 border-t mt-4">
      <h3 className="text-xl font-semibold mb-4">Manage Signatures</h3>
      
      {/* Button to add a new signature */}
      <div className="mb-4">
        <button
          onClick={handleCreateNewSignature}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Add New Signature
        </button>
      </div>

      {/* List of existing signatures */}
      {signatures && signatures.length > 0 ? (
        <ul className="space-y-3">
          {signatures.map(sig => (
            <li key={sig._id} className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold">{sig.text || 'Signature'}</p>
                <p className="text-sm text-gray-600">
                  Position: ({sig.x}, {sig.y}) on page {sig.page}
                </p>
                {sig.font && <p className="text-sm text-gray-500">Font: {sig.font}</p>}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdate(sig)} // Pass the full signature object to the update handler
                  className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(sig._id)}
                  className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No signatures have been added to this document yet.</p>
      )}
    </div>
  );
};

export default Signatures;
