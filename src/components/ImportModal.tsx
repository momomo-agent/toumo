import { useState, useRef } from 'react';
import { useEditorStore } from '../store';

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const store = useEditorStore();

  const handleImport = (jsonString: string) => {
    try {
      setImporting(true);
      const data = JSON.parse(jsonString);
      
      if (!data.keyframes || !Array.isArray(data.keyframes)) {
        throw new Error('Invalid project: missing keyframes');
      }

      // Import data into store
      if (data.keyframes) store.importKeyframes(data.keyframes);
      if (data.transitions) store.importTransitions(data.transitions);
      if (data.frameSize) store.setFrameSize(data.frameSize);
      
      setImporting(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse JSON');
      setImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleImport(content);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Import Project</h3>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        
        <div style={contentStyle}>
          <p style={descStyle}>
            Import a previously exported Toumo project (.json file).
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={importButtonStyle}
            disabled={importing}
          >
            {importing ? '⏳ Importing...' : '📂 Select .json File'}
          </button>
          
          {error && <div style={errorStyle}>❌ {error}</div>}
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#1a1a1a',
  borderRadius: 12,
  width: 400,
  border: '1px solid #333',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #333',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#666',
  fontSize: 20,
  cursor: 'pointer',
};

const contentStyle: React.CSSProperties = {
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const descStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: '#888',
  lineHeight: 1.5,
};

const importButtonStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#7f1d1d',
  borderRadius: 6,
  color: '#fca5a5',
  fontSize: 12,
};
