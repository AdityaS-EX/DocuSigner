// /home/atros/Desktop/Current Project/Project 2/Project Folder/signature-app/client/src/components/PDFPreview.js
import React, { useState, useRef, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDraggable } from '@dnd-kit/core';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// A simple, non-interactive visual for signatures in read-only mode
function StaticSignature({ signature }) {
  const style = {
    position: 'absolute',
    left: `${signature.x}px`,
    top: `${signature.y}px`,
    zIndex: 10,
    padding: '8px 16px', // Keep padding for spacing
    fontFamily: signature.font || 'Arial',
    color: signature.color || '#000000', // Use signature's color
    fontWeight: 'bold',
    fontSize: `${signature.fontSize || 24}px`, // Use signature's font size
    pointerEvents: 'none',
    whiteSpace: 'nowrap', // Prevent text from wrapping
  };
  return <div style={style}>{signature.text || 'Signature'}</div>;
}

// The interactive signature component for the editor
function DraggableSignature({ signature, onDelete, onSelect, isSelected }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `existing-${signature._id}`,
    data: { signature },
  });

  const style = {
    position: 'absolute',
    left: `${signature.x}px`,
    top: `${signature.y}px`,
    cursor: 'move',
    zIndex: isSelected ? 21 : 20, // Bring selected to front
    padding: '8px 16px',
    borderRadius: '4px',
    fontFamily: signature.font || 'Arial',
    color: signature.color || '#000000',
    fontSize: `${signature.fontSize || 24}px`, // Use signature's font size
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    // Use a subtle outline to show it's selected, instead of a box
    border: isSelected ? '2px solid rgba(40, 167, 69, 0.5)' : '2px solid transparent',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => onSelect(signature)}>
      {signature.text || 'Signature'}
      {isSelected && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(signature._id); }} 
          style={{ position: 'absolute', top: -12, right: -12, background: 'red', color: 'white', borderRadius: '50%', width: '24px', height: '24px', border: 'none', cursor: 'pointer' }}>
          &times;
        </button>
      )}
    </div>
  );
}

const PDFPreview = forwardRef(({
  documentUrl,
  signatures = [],
  onDeleteSignature,
  onCanvasClick,
  isAddingMode,
  onSelectSignature,
  selectedSignatureId,
  isEditable = false,
  showToolbar = true,
  onPageDetailsChange,
}, ref) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  
  const onPageRenderSuccess = (page) => {
    if (onPageDetailsChange) {
      onPageDetailsChange({
        scale: page.scale,
        width: page.width,
        height: page.height,
        originalWidth: page.originalWidth,
        originalHeight: page.originalHeight,
        pageNumber: page.pageNumber,
      });
    }
  };

  const navButtonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '15px 25px', // 5x larger padding
    fontSize: '2em', // 5x larger font size
    cursor: 'pointer',
    margin: '0 10px',
  };
  
  const handleFullscreen = () => {
    if (containerRef.current) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#e9ecef' }}>
      {showToolbar && (
        <div style={{ textAlign: 'center', padding: '15px', borderBottom: '1px solid #ccc', background: 'white', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button style={navButtonStyle} disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)}>‹</button>
          <span style={{ margin: '0 20px', fontSize: '1.2em', fontWeight: 'bold' }}>Page {pageNumber} of {numPages || '--'}</span>
          <button style={navButtonStyle} disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)}>›</button>
          <button onClick={handleFullscreen} style={{...navButtonStyle, fontSize: '1em', padding: '10px 15px', position: 'absolute', right: '20px' }}>Fullscreen</button>
        </div>
      )}
      <div style={{ flexGrow: 1, overflow: 'auto', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
        <div style={{ position: 'relative' }}>
          {documentUrl ? (
            <Document file={documentUrl} onLoadSuccess={onDocumentLoadSuccess} onError={console.error}>
              <Page pageNumber={pageNumber} onRenderSuccess={onPageRenderSuccess} />
            </Document>
          ) : (
            <div>Loading PDF...</div>
          )}
          
          {/* Only render interactive elements if in editable mode */}
          {isEditable && (
            <>
              {/* Event canvas for adding new signatures */}
              <div 
                onClick={onCanvasClick}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  zIndex: 15, 
                  cursor: isAddingMode ? 'crosshair' : 'default', 
                  pointerEvents: isAddingMode ? 'auto' : 'none' 
                }}
              />
              {/* Draggable signatures for editing */}
              {signatures.filter(s => s.page === pageNumber && s.status !== 'rejected').map(sig => (
                <DraggableSignature 
                  key={sig._id} 
                  signature={sig} 
                  onDelete={onDeleteSignature} 
                  onSelect={onSelectSignature}
                  isSelected={sig._id === selectedSignatureId}
                />
              ))}
            </>
          )}

          {/* In non-editable mode, render static signatures */}
          {!isEditable && signatures.filter(s => s.page === pageNumber && s.status === 'signed').map(sig => (
            <StaticSignature key={sig._id} signature={sig} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default React.memo(PDFPreview);
