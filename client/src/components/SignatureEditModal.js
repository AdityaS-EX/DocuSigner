import React, { useState, useEffect } from 'react';

const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Brush Script MT'];
const availableColors = {
    'Black': '#000000',
    'Deep Blue': '#00008B',
    'Blue': '#0000FF',
    'Green': '#008000',
    'Deep Red': '#8B0000',
};

const SignatureEditModal = ({ signature, isOpen, onClose, onSave }) => {
  const [text, setText] = useState('');
  const [font, setFont] = useState(availableFonts[0]);
  const [color, setColor] = useState(availableColors['Black']);
  const [fontSize, setFontSize] = useState(24); // Add fontSize state

  useEffect(() => {
    if (signature) {
      setText(signature.text || 'Signature');
      setFont(signature.font || availableFonts[0]);
      setColor(signature.color || availableColors['Black']);
      setFontSize(signature.fontSize || 24); // Set font size from signature
    }
  }, [signature]);

  if (!isOpen || !signature) {
    return null;
  }

  const handleSave = () => {
    onSave({ ...signature, signatureId: signature._id, text, font, color, fontSize });
  };

  // Basic modal styling
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px 40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
    width: 'clamp(300px, 40%, 500px)',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Signature</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{display: 'block', marginBottom: '5px'}}>Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{display: 'block', marginBottom: '5px'}}>Font</label>
            <select value={font} onChange={(e) => setFont(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              {availableFonts.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{display: 'block', marginBottom: '5px'}}>Color</label>
            <select value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: color, color: 'white' }}>
              {Object.entries(availableColors).map(([name, value]) => (
                  <option key={value} value={value} style={{ backgroundColor: value, color: 'white' }}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
            <label style={{display: 'block', marginBottom: '5px'}}>Font Size: {fontSize}px</label>
            <input 
                type="range" 
                min="12" 
                max="72" 
                value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
            />
        </div>
        <div style={{fontFamily: font, fontSize: `${fontSize}px`, border: '1px solid #ccc', padding: '10px', marginBottom: '20px', minHeight: '50px', borderRadius: '4px', background: '#f8f9fa', color: color, overflow: 'auto', textAlign: 'center'}}>
          {text}
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
          <button onClick={onClose} style={{padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer'}}>Cancel</button>
          <button onClick={handleSave} style={{padding: '8px 16px', border: 'none', borderRadius: '4px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer'}}>Save Changes</button>
        </div>
      </div>
    </>
  );
};

export default SignatureEditModal;
