// /home/atros/Desktop/Current Project/Project 2/Project Folder/signature-app/client/src/components/SignatureEditor.js
import React, { useState } from 'react';
import PDFPreview from './PDFPreview';
import SignatureEditModal from './SignatureEditModal'; // Import the modal
import { 
  DndContext, 
  DragOverlay,
  PointerSensor, 
  useSensor, 
  useSensors, 
} from '@dnd-kit/core';

// A simple visual placeholder for the item being dragged
function SignatureDragVisual() {
    return <div style={{ border: '2px dashed #007bff', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: 'rgba(0,123,255,0.2)' }}>Signature</div>;
}

// Main Editor Component
const SignatureEditor = ({ pdfUrl, existingSignatures = [], onSaveSignature, onCloseEditor, onDeleteSignature, onUpdateSignature }) => {
  const [pageDetails, setPageDetails] = useState({ scale: 1, width: 0, height: 0, originalWidth: 0, originalHeight: 0 });
  const [activeId, setActiveId] = useState(null);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setSelectedSignature(null);
    setIsAddingMode(false);
    setIsModalOpen(false);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, delta } = event;
    const sig = active.data.current?.signature;

    if (!sig || !pageDetails.originalWidth) return;
    
    const scaleFactor = pageDetails.originalWidth / pageDetails.width;

    onUpdateSignature({
      signatureId: sig._id,
      x: sig.x + (delta.x * scaleFactor),
      y: sig.y + (delta.y * scaleFactor),
    });
  };
  
  const handleCanvasClick = (event) => {
    if (!isAddingMode || !pageDetails.originalWidth) return;

    const { clientX, clientY, currentTarget } = event;
    const rect = currentTarget.getBoundingClientRect();
    const scaleFactor = pageDetails.originalWidth / rect.width;
    
    const x = (clientX - rect.left) * scaleFactor;
    const y = (clientY - rect.top) * scaleFactor;

    onSaveSignature({ x, y, page: pageDetails.pageNumber, text: 'New Signature' });
    setIsAddingMode(false);
  };

  const handleSelectSignature = (signature) => {
    // When a signature is clicked, set it as the selected one for the properties panel
    setSelectedSignature(signature);
    setIsAddingMode(false);
    setIsModalOpen(false); // Don't open the modal on click anymore
  };
  
  const handleSaveFromModal = (updateData) => {
    if (onUpdateSignature) {
      onUpdateSignature(updateData);
    }
    setIsModalOpen(false);
    // Keep the signature selected after modal closes
  };
  
  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (selectedSignature) {
      // Create a new object for the updated signature to reflect change immediately
      const updatedSig = { ...selectedSignature, fontSize: newSize };
      setSelectedSignature(updatedSig);
      // Call the main update handler to persist the change
      onUpdateSignature({ signatureId: selectedSignature._id, fontSize: newSize });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 50px)', border: '1px solid #ddd' }}>
        {/* Header */}
        <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', backgroundColor: 'white' }}>
          <h2 style={{ margin: 0 }}>Signature Editor</h2>
          <button onClick={onCloseEditor} style={{padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer' }}>Done Editing</button>
        </div>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: '250px', padding: '15px', borderRight: '1px solid #dee2e6', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tools Section */}
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Tools</h3>
              <button onClick={() => setIsAddingMode(true)} style={{ width: '100%', padding: '10px', background: isAddingMode ? '#28a745' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {isAddingMode ? 'Click on Document...' : 'Add Signature'}
              </button>
            </div>

            {/* Properties Section - shows when a signature is selected */}
            {selectedSignature && (
              <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Properties</h3>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{display: 'block', marginBottom: '5px'}}>Font Size: {selectedSignature.fontSize || 24}px</label>
                  <input 
                      type="range" 
                      min="12" 
                      max="72" 
                      value={selectedSignature.fontSize || 24} 
                      onChange={handleFontSizeChange}
                      style={{ width: '100%' }}
                  />
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{ width: '100%', padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Edit Text, Font & Color...
                </button>
              </div>
            )}
            
            {!selectedSignature && (
                <p style={{marginTop: '15px', fontSize: '0.9em', color: '#6c757d'}}>Click a signature on the document to edit its properties.</p>
            )}
          </div>
          
          {/* PDF Preview Area */}
          <div style={{ flexGrow: 1, position: 'relative', overflow: 'auto', backgroundColor: '#e9ecef', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
            <PDFPreview
              documentUrl={pdfUrl}
              signatures={existingSignatures}
              onDeleteSignature={onDeleteSignature}
              onCanvasClick={handleCanvasClick}
              isAddingMode={isAddingMode}
              onSelectSignature={handleSelectSignature}
              selectedSignatureId={selectedSignature?._id}
              isEditable={true}
              showToolbar={true}
              onPageDetailsChange={setPageDetails}
            />
          </div>
        </div>
      </div>

      {/* The modal is now only used for text/font/color, not for size */}
      <SignatureEditModal
        isOpen={isModalOpen}
        signature={selectedSignature}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFromModal}
      />

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && <SignatureDragVisual />}
      </DragOverlay>
    </DndContext>
  );
};

export default SignatureEditor;
