import { useState, useCallback } from 'react';
import { useEditorStore } from '../store';
import { generateShareUrl } from '../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { keyframes, transitions, functionalStates, components, frameSize, canvasBackground } = useEditorStore();
  
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateLink = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const projectData = {
        version: '1.0',
        keyframes,
        transitions,
        functionalStates,
        components,
        frameSize,
        canvasBackground,
      };
      const url = generateShareUrl(projectData);
      setShareUrl(url);
      setGenerating(false);
    }, 100);
  }, [keyframes, transitions, functionalStates, components, frameSize, canvasBackground]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [shareUrl]);

  const handleOpenPreview = useCallback(() => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Share Project</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        
        <div style={contentStyle}>
          <p style={descStyle}>
            Generate a shareable link that includes your entire project. 
            Anyone with the link can view and interact with your prototype.
          </p>
          
          {!shareUrl ? (
            <button 
              onClick={handleGenerateLink} 
              style={generateButtonStyle}
              disabled={generating}
            >
              {generating ? '⏳ Generating...' : '🔗 Generate Share Link'}
            </button>
          ) : (
            <div style={urlContainerStyle}>
              <input
                type="text"
                value={shareUrl}
                readOnly
                style={urlInputStyle}
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <div style={buttonGroupStyle}>
                <button onClick={handleCopy} style={actionButtonStyle}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button onClick={handleOpenPreview} style={actionButtonStyle}>
                  🔗 Open
                </button>
              </div>
            </div>
          )}
          
          <div style={infoStyle}>
            <div style={infoItemStyle}>
              <span>📦</span>
              <span>Project data is compressed and stored in the URL</span>
            </div>
            <div style={infoItemStyle}>
              <span>👁️</span>
              <span>Recipients see a full-screen interactive preview</span>
            </div>
          </div>
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
  width: 480,
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

const generateButtonStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  cursor: 'pointer',
};

const urlContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const urlInputStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const actionButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  background: '#252525',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
  cursor: 'pointer',
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 8,
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: '#666',
};
