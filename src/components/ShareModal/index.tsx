import { useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import { generateShareUrl } from '../../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const store = useEditorStore();

  const handleGenerate = useCallback(() => {
    const data = {
      version: '1.0',
      keyframes: store.keyframes,
      transitions: store.transitions,
      components: store.components,
      frameSize: store.frameSize,
      canvasBackground: store.canvasBackground,
      variables: store.variables,
    };
    const shareUrl = generateShareUrl(data);
    setUrl(shareUrl);
    setCopied(false);
  }, [store]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [url]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,.6)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a1a1a', border: '1px solid #333',
        borderRadius: 12, padding: 24, width: 480,
        boxShadow: '0 16px 48px rgba(0,0,0,.5)',
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#fff' }}>
          🔗 Share Project
        </h2>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
          Generate a shareable link with your project data encoded in the URL.
        </p>
        {!url ? (
          <button onClick={handleGenerate} style={{
            width: '100%', padding: '10px 16px',
            background: '#3b82f6', border: 'none', borderRadius: 6,
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Generate Share Link
          </button>
        ) : (
          <div>
            <input readOnly value={url} style={{
              width: '100%', padding: '8px 12px', marginBottom: 8,
              background: '#111', border: '1px solid #333', borderRadius: 6,
              color: '#ccc', fontSize: 11, boxSizing: 'border-box',
            }} />
            <button onClick={handleCopy} style={{
              width: '100%', padding: '8px 16px',
              background: copied ? '#22c55e' : '#3b82f6',
              border: 'none', borderRadius: 6,
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        )}
        <button onClick={onClose} style={{
          marginTop: 12, width: '100%', padding: '8px',
          background: 'transparent', border: '1px solid #333',
          borderRadius: 6, color: '#888', fontSize: 12, cursor: 'pointer',
        }}>
          Close
        </button>
      </div>
    </div>
  );
}
