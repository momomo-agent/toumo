import { useState } from 'react';
import { useEditorStore } from '../store';

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { keyframes, transitions, components, functionalStates, frameSize } = useEditorStore();
  const [copied, setCopied] = useState(false);

  const projectData = {
    version: '1.0',
    name: 'Untitled Project',
    frameSize,
    keyframes,
    transitions,
    components,
    functionalStates,
    exportedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(projectData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toumo-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Export Project</h3>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        
        <div style={contentStyle}>
          <div style={statsStyle}>
            <span>📊 {keyframes.length} keyframes</span>
            <span>🔗 {transitions.length} transitions</span>
            <span>📦 {components.length} components</span>
          </div>
          
          <textarea
            readOnly
            value={jsonString}
            style={textareaStyle}
          />
          
          <div style={actionsStyle}>
            <button onClick={handleCopy} style={buttonStyle}>
              {copied ? '✓ Copied!' : '📋 Copy JSON'}
            </button>
            <button onClick={handleDownload} style={primaryButtonStyle}>
              💾 Download .json
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#1a1a1a',
  borderRadius: 12,
  width: 500,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
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
  padding: 0,
  lineHeight: 1,
};

const contentStyle: React.CSSProperties = {
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  fontSize: 12,
  color: '#888',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: 300,
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#e5e5e5',
  fontSize: 11,
  fontFamily: 'monospace',
  padding: 12,
  resize: 'none',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: '#252525',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#e5e5e5',
  fontSize: 12,
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
  cursor: 'pointer',
};
