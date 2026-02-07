import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '../store';
import { generateShareUrl, compressProject } from '../utils/shareUtils';
import type { ProjectData } from '../utils/shareUtils';
import { exportPrototype, downloadPrototype, htmlToDataUri } from '../utils/exportPrototype';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { keyframes, transitions, functionalStates, components, frameSize, canvasBackground, interactions, variables } = useEditorStore();
  
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dataSize, setDataSize] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportSize, setExportSize] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  const buildProjectData = useCallback((): ProjectData => ({
    version: '1.0',
    keyframes,
    transitions,
    functionalStates,
    components,
    frameSize,
    canvasBackground,
    interactions,
    variables,
  }), [keyframes, transitions, functionalStates, components, frameSize, canvasBackground, interactions, variables]);

  const handleExportPrototype = useCallback(() => {
    setExporting(true);
    setError('');
    setExportDone(false);
    setTimeout(() => {
      try {
        const html = exportPrototype({
          projectName: 'Toumo Prototype',
          canvasBackground: canvasBackground || '#0d0d0e',
          frameSize,
          keyframes,
          transitions,
          interactions: interactions || [],
          variables: variables || [],
        });
        const sizeKB = (new Blob([html]).size / 1024).toFixed(1);
        setExportSize(sizeKB);
        downloadPrototype(html);
        setExportDone(true);
        setExporting(false);
        setTimeout(() => setExportDone(false), 3000);
      } catch (err) {
        console.error('Export failed:', err);
        setError('导出失败，请重试');
        setExporting(false);
      }
    }, 50);
  }, [canvasBackground, frameSize, keyframes, transitions, interactions, variables]);

  const handleCopyDataUri = useCallback(() => {
    try {
      const html = exportPrototype({
        projectName: 'Toumo Prototype',
        canvasBackground: canvasBackground || '#0d0d0e',
        frameSize,
        keyframes,
        transitions,
        interactions: interactions || [],
        variables: variables || [],
      });
      const uri = htmlToDataUri(html);
      navigator.clipboard.writeText(uri).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch (err) {
      console.error('Copy data URI failed:', err);
      setError('复制失败');
    }
  }, [canvasBackground, frameSize, keyframes, transitions, interactions, variables]);

  const handleGenerateLink = useCallback(() => {
    setGenerating(true);
    setError('');
    setCopied(false);
    
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        const projectData = buildProjectData();
        
        // Calculate compressed size for display
        const compressed = compressProject(projectData);
        const sizeKB = (compressed.length * 2 / 1024).toFixed(1);
        setDataSize(sizeKB);
        
        // Check URL length limits (browsers typically support ~2MB in hash)
        const url = generateShareUrl(projectData);
        if (url.length > 2_000_000) {
          setError('Project is too large to share via URL. Try reducing elements.');
          setGenerating(false);
          return;
        }
        
        setShareUrl(url);
        setGenerating(false);
      } catch (err) {
        console.error('Failed to generate share link:', err);
        setError('Failed to generate link. Project may be too complex.');
        setGenerating(false);
      }
    }, 50);
  }, [buildProjectData]);

  // Auto-generate link when modal opens
  useEffect(() => {
    if (isOpen && !shareUrl) {
      handleGenerateLink();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShareUrl('');
      setCopied(false);
      setError('');
      setDataSize('');
      setExporting(false);
      setExportDone(false);
      setExportSize('');
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback: select the input text
      if (urlInputRef.current) {
        urlInputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  }, [shareUrl]);

  const handleOpenPreview = useCallback(() => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  const elementCount = keyframes.reduce((sum, kf) => sum + (kf.keyElements?.length || 0), 0);
  const frameCount = keyframes.length;
  const transitionCount = transitions.length;
  const interactionCount = (interactions || []).length;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔗</span>
            <h2 style={{ margin: 0, fontSize: 16, color: '#fff' }}>分享项目</h2>
          </div>
          <button onClick={onClose} style={closeButtonStyle} title="关闭 (Esc)">×</button>
        </div>
        
        <div style={contentStyle}>
          {/* Project summary */}
          <div style={summaryStyle}>
            <div style={summaryItemStyle}>
              <span style={summaryValueStyle}>{frameCount}</span>
              <span style={summaryLabelStyle}>画面</span>
            </div>
            <div style={summaryDividerStyle} />
            <div style={summaryItemStyle}>
              <span style={summaryValueStyle}>{elementCount}</span>
              <span style={summaryLabelStyle}>元素</span>
            </div>
            <div style={summaryDividerStyle} />
            <div style={summaryItemStyle}>
              <span style={summaryValueStyle}>{transitionCount}</span>
              <span style={summaryLabelStyle}>转场</span>
            </div>
            <div style={summaryDividerStyle} />
            <div style={summaryItemStyle}>
              <span style={summaryValueStyle}>{interactionCount}</span>
              <span style={summaryLabelStyle}>交互</span>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div style={errorStyle}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {/* Generating state */}
          {generating && (
            <div style={generatingStyle}>
              <div style={spinnerStyle} />
              <span>正在生成分享链接...</span>
            </div>
          )}

          {/* URL display + actions */}
          {shareUrl && !generating && (
            <>
              <div style={urlContainerStyle}>
                <input
                  ref={urlInputRef}
                  type="text"
                  value={shareUrl}
                  readOnly
                  style={urlInputStyle}
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                {dataSize && (
                  <span style={dataSizeStyle}>
                    📦 压缩后 {dataSize} KB
                  </span>
                )}
              </div>
              
              <div style={buttonGroupStyle}>
                <button 
                  onClick={handleCopy} 
                  style={copied ? copyButtonCopiedStyle : copyButtonStyle}
                >
                  {copied ? '✅ 已复制!' : '📋 复制链接'}
                </button>
                <button onClick={handleOpenPreview} style={openButtonStyle}>
                  👁️ 预览
                </button>
                <button onClick={handleGenerateLink} style={refreshButtonStyle} title="重新生成">
                  🔄
                </button>
              </div>
            </>
          )}
          
          {/* Export Prototype section */}
          <div style={exportSectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15 }}>📄</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>导出独立原型</span>
            </div>
            <div style={buttonGroupStyle}>
              <button
                onClick={handleExportPrototype}
                disabled={exporting}
                style={exporting ? exportBtnDisabledStyle : exportDone ? exportBtnDoneStyle : exportBtnStyle}
              >
                {exporting ? '⏳ 导出中...' : exportDone ? '✅ 已下载!' : '📥 下载 HTML'}
              </button>
              <button onClick={handleCopyDataUri} style={openButtonStyle}>
                🔗 复制 Data URI
              </button>
            </div>
            {exportSize && (
              <span style={dataSizeStyle}>📄 HTML 文件 {exportSize} KB</span>
            )}
          </div>

          {/* Info section */}
          <div style={infoStyle}>
            <div style={infoItemStyle}>
              <span>📦</span>
              <span>项目数据压缩后存储在链接中，无需服务器</span>
            </div>
            <div style={infoItemStyle}>
              <span>👁️</span>
              <span>打开链接即可全屏预览并体验交互</span>
            </div>
            <div style={infoItemStyle}>
              <span>📄</span>
              <span>导出为独立 HTML，可离线分享和演示</span>
            </div>
            <div style={infoItemStyle}>
              <span>✏️</span>
              <span>预览者可点击「编辑」进入编辑模式</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---

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
  maxWidth: '90vw',
  border: '1px solid #333',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
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
  padding: '4px 8px',
  borderRadius: 4,
};

const contentStyle: React.CSSProperties = {
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const summaryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: '12px 16px',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #252525',
};

const summaryItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#fff',
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
};

const summaryDividerStyle: React.CSSProperties = {
  width: 1,
  height: 28,
  background: '#333',
};

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  background: '#ef444420',
  border: '1px solid #ef4444',
  borderRadius: 8,
  fontSize: 13,
  color: '#fca5a5',
};

const generatingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '20px 0',
  fontSize: 13,
  color: '#888',
};

const spinnerStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  border: '2px solid #333',
  borderTopColor: '#2563eb',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const urlContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const urlInputStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
  fontFamily: 'monospace',
  outline: 'none',
};

const dataSizeStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#555',
  textAlign: 'right',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const copyButtonStyle: React.CSSProperties = {
  flex: 2,
  padding: '10px 16px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const copyButtonCopiedStyle: React.CSSProperties = {
  ...copyButtonStyle,
  background: '#16a34a',
};

const openButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: '#252525',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#e5e5e5',
  fontSize: 13,
  cursor: 'pointer',
};

const refreshButtonStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#252525',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#888',
  fontSize: 13,
  cursor: 'pointer',
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 4,
  padding: '12px 14px',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #252525',
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: '#666',
};

const exportSectionStyle: React.CSSProperties = {
  padding: '14px 16px',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #252525',
};

const exportBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: '10px 16px',
  background: '#7c3aed',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const exportBtnDoneStyle: React.CSSProperties = {
  ...exportBtnStyle,
  background: '#16a34a',
};

const exportBtnDisabledStyle: React.CSSProperties = {
  ...exportBtnStyle,
  background: '#444',
  cursor: 'not-allowed',
  opacity: 0.7,
};
