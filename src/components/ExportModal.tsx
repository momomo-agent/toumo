import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useEditorStore } from '../store';
import { generateLottieJSON } from '../utils/lottieGenerator';
import { createGifEncoder, addFrameToGif, renderGif, downloadBlob } from '../utils/gifExport';

type ExportTab = 'project' | 'lottie' | 'gif';

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { keyframes, transitions, components, functionalStates, frameSize } = useEditorStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportTab>('project');

  // GIF export state
  const [gifFps, setGifFps] = useState(15);
  const [gifScale, setGifScale] = useState(1);
  const [gifQuality, setGifQuality] = useState(10);
  const [gifRecording, setGifRecording] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifPhase, setGifPhase] = useState<'idle' | 'capturing' | 'encoding' | 'done'>('idle');
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const gifAbortRef = useRef(false);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const projectJsonString = JSON.stringify(projectData, null, 2);

  const lottieData = useMemo(
    () => generateLottieJSON(keyframes, transitions, frameSize),
    [keyframes, transitions, frameSize],
  );
  const lottieJsonString = useMemo(
    () => JSON.stringify(lottieData, null, 2),
    [lottieData],
  );

  const jsonString = activeTab === 'lottie' ? lottieJsonString : projectJsonString;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select textarea content
      const textarea = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'lottie' ? 'toumo-animation.json' : 'toumo-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── GIF Recording ─────────────────────────────────────────────
  const gifWidth = Math.round(frameSize.width * gifScale);
  const gifHeight = Math.round(frameSize.height * gifScale);

  const handleGifRecord = useCallback(async () => {
    // Clean up previous preview
    if (gifPreviewUrl) {
      URL.revokeObjectURL(gifPreviewUrl);
      setGifPreviewUrl(null);
    }
    setGifBlob(null);
    setGifProgress(0);
    setGifPhase('capturing');
    setGifRecording(true);
    gifAbortRef.current = false;

    const w = gifWidth;
    const h = gifHeight;
    const delay = Math.round(1000 / gifFps);

    // Create an offscreen canvas for rendering frames
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d')!;
    captureCanvasRef.current = offscreen;

    const gif = createGifEncoder({ width: w, height: h, fps: gifFps, quality: gifQuality });

    // Capture frames by iterating through transitions
    // Strategy: render each keyframe, then animate between keyframes
    const totalTransitions = transitions.length;
    const framesPerTransition = Math.max(Math.round(gifFps * 0.5), 5); // ~0.5s per transition
    const holdFrames = Math.max(Math.round(gifFps * 0.3), 3); // ~0.3s hold on each keyframe

    // Helper: render a keyframe's elements to canvas
    const renderKeyframeToCanvas = (kfId: string) => {
      const kf = keyframes.find(k => k.id === kfId);
      if (!kf) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, w, h);

      const sharedEls = useEditorStore.getState().sharedElements;
      for (const el of sharedEls) {
        const sx = gifScale;
        const x = el.position.x * sx;
        const y = el.position.y * sx;
        const ew = el.size.width * sx;
        const eh = el.size.height * sx;
        const radius = (el.style?.borderRadius ?? 8) * sx;
        const opacity = el.style?.opacity ?? 1;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Draw rounded rect
        ctx.beginPath();
        ctx.roundRect(x, y, ew, eh, radius);
        ctx.closePath();

        // Fill
        ctx.fillStyle = el.style?.fill || '#3b82f6';
        ctx.fill();

        // Stroke
        if (el.style?.stroke) {
          ctx.strokeStyle = el.style.stroke;
          ctx.lineWidth = (el.style.strokeWidth || 1) * sx;
          ctx.stroke();
        }

        // Text
        if (el.text) {
          const fontSize = (el.style?.fontSize || 14) * sx;
          ctx.fillStyle = el.style?.textColor || '#fff';
          ctx.font = `${el.style?.fontWeight || 'normal'} ${fontSize}px ${el.style?.fontFamily || 'Inter, sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.text, x + ew / 2, y + eh / 2, ew - 8 * sx);
        }

        ctx.restore();
      }
    };

    // Helper: render interpolated frame between two keyframes
    const renderInterpolatedFrame = (fromId: string, toId: string, t: number) => {
      const fromKf = keyframes.find(k => k.id === fromId);
      const toKf = keyframes.find(k => k.id === toId);
      if (!fromKf || !toKf) return;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, w, h);

      // Match elements by id, interpolate position/size/opacity
      const sharedElsAnim = useEditorStore.getState().sharedElements;
      for (const toEl of sharedElsAnim) {
        const fromEl = sharedElsAnim.find(e => e.id === toEl.id);
        const el = fromEl ? {
          ...toEl,
          position: {
            x: fromEl.position.x + (toEl.position.x - fromEl.position.x) * t,
            y: fromEl.position.y + (toEl.position.y - fromEl.position.y) * t,
          },
          size: {
            width: fromEl.size.width + (toEl.size.width - fromEl.size.width) * t,
            height: fromEl.size.height + (toEl.size.height - fromEl.size.height) * t,
          },
          style: {
            ...toEl.style,
            opacity: (fromEl.style?.opacity ?? 1) + ((toEl.style?.opacity ?? 1) - (fromEl.style?.opacity ?? 1)) * t,
            borderRadius: (fromEl.style?.borderRadius ?? 8) + ((toEl.style?.borderRadius ?? 8) - (fromEl.style?.borderRadius ?? 8)) * t,
          },
        } : toEl;

        const sx = gifScale;
        const x = el.position.x * sx;
        const y = el.position.y * sx;
        const ew = el.size.width * sx;
        const eh = el.size.height * sx;
        const radius = (el.style?.borderRadius ?? 8) * sx;
        const opacity = el.style?.opacity ?? 1;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.roundRect(x, y, ew, eh, radius);
        ctx.closePath();
        ctx.fillStyle = el.style?.fill || '#3b82f6';
        ctx.fill();
        if (el.style?.stroke) {
          ctx.strokeStyle = el.style.stroke;
          ctx.lineWidth = (el.style.strokeWidth || 1) * sx;
          ctx.stroke();
        }
        if (toEl.text) {
          const fontSize = (el.style?.fontSize || 14) * sx;
          ctx.fillStyle = el.style?.textColor || '#fff';
          ctx.font = `${toEl.style?.fontWeight || 'normal'} ${fontSize}px ${toEl.style?.fontFamily || 'Inter, sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(toEl.text, x + ew / 2, y + eh / 2, ew - 8 * sx);
        }
        ctx.restore();
      }
    };

    try {
      let frameCount = 0;
      const totalFrames = totalTransitions > 0
        ? totalTransitions * (holdFrames + framesPerTransition) + holdFrames
        : holdFrames * keyframes.length;

      if (totalTransitions === 0) {
        // No transitions: just capture each keyframe as a still
        for (const kf of keyframes) {
          if (gifAbortRef.current) break;
          renderKeyframeToCanvas(kf.id);
          for (let i = 0; i < holdFrames; i++) {
            addFrameToGif(gif, offscreen, delay);
            frameCount++;
            setGifProgress(Math.round((frameCount / totalFrames) * 50));
          }
        }
      } else {
        // Capture transitions with interpolation
        const visited = new Set<string>();
        const queue = [transitions[0].from];

        while (queue.length > 0) {
          if (gifAbortRef.current) break;
          const currentId = queue.shift()!;
          if (visited.has(currentId)) continue;
          visited.add(currentId);

          // Hold on current keyframe
          renderKeyframeToCanvas(currentId);
          for (let i = 0; i < holdFrames; i++) {
            addFrameToGif(gif, offscreen, delay);
            frameCount++;
            setGifProgress(Math.round((frameCount / totalFrames) * 50));
          }

          // Find outgoing transitions
          const outgoing = transitions.filter(t => t.from === currentId);
          for (const tr of outgoing) {
            if (gifAbortRef.current) break;
            // Animate transition
            for (let f = 0; f < framesPerTransition; f++) {
              const t = f / (framesPerTransition - 1);
              // Apply easeInOut
              const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
              renderInterpolatedFrame(currentId, tr.to, eased);
              addFrameToGif(gif, offscreen, delay);
              frameCount++;
              setGifProgress(Math.round((frameCount / totalFrames) * 50));
            }
            if (!visited.has(tr.to)) {
              queue.push(tr.to);
            }
          }
        }
      }

      if (gifAbortRef.current) {
        setGifPhase('idle');
        setGifRecording(false);
        return;
      }

      // Encode
      setGifPhase('encoding');
      const blob = await renderGif(gif, (p) => {
        setGifProgress(50 + Math.round(p * 50));
      });

      setGifBlob(blob);
      setGifPreviewUrl(URL.createObjectURL(blob));
      setGifPhase('done');
    } catch (err) {
      console.error('GIF export failed:', err);
      setGifPhase('idle');
    } finally {
      setGifRecording(false);
    }
  }, [keyframes, transitions, frameSize, gifFps, gifScale, gifQuality, gifWidth, gifHeight, gifPreviewUrl]);

  const handleGifAbort = useCallback(() => {
    gifAbortRef.current = true;
    setGifRecording(false);
    setGifPhase('idle');
  }, []);

  const handleGifDownload = useCallback(() => {
    if (gifBlob) {
      downloadBlob(gifBlob, `toumo-export-${gifWidth}x${gifHeight}.gif`);
    }
  }, [gifBlob, gifWidth, gifHeight]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (gifPreviewUrl) URL.revokeObjectURL(gifPreviewUrl);
    };
  }, [gifPreviewUrl]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Export Project</h3>
          <button onClick={onClose} style={closeButtonStyle} title="关闭 (Esc)">×</button>
        </div>

        {/* Tab bar */}
        <div style={tabBarStyle}>
          <button
            style={activeTab === 'project' ? activeTabStyle : tabStyle}
            onClick={() => { setActiveTab('project'); setCopied(false); }}
          >
            📦 Project JSON
          </button>
          <button
            style={activeTab === 'lottie' ? activeTabStyle : tabStyle}
            onClick={() => { setActiveTab('lottie'); setCopied(false); }}
          >
            🎬 Lottie
          </button>
          <button
            style={activeTab === 'gif' ? activeTabStyle : tabStyle}
            onClick={() => { setActiveTab('gif'); setCopied(false); }}
          >
            🎞️ GIF
          </button>
        </div>
        
        <div style={contentStyle}>
          {activeTab !== 'gif' ? (
            <>
              <div style={statsStyle}>
                <span>📊 {keyframes.length} keyframes</span>
                <span>🔗 {transitions.length} transitions</span>
                {activeTab === 'lottie' && (
                  <span>🎞️ {lottieData.layers.length} layers · {lottieData.op} frames</span>
                )}
                {activeTab === 'project' && (
                  <span>📦 {components.length} components</span>
                )}
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
            </>
          ) : (
            <GifTabContent
              gifFps={gifFps}
              setGifFps={setGifFps}
              gifScale={gifScale}
              setGifScale={setGifScale}
              gifQuality={gifQuality}
              setGifQuality={setGifQuality}
              gifWidth={gifWidth}
              gifHeight={gifHeight}
              gifPhase={gifPhase}
              gifProgress={gifProgress}
              gifRecording={gifRecording}
              gifPreviewUrl={gifPreviewUrl}
              onRecord={handleGifRecord}
              onAbort={handleGifAbort}
              onDownload={handleGifDownload}
              keyframeCount={keyframes.length}
              transitionCount={transitions.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GIF Tab Content Component ────────────────────────────────────────
interface GifTabContentProps {
  gifFps: number;
  setGifFps: (v: number) => void;
  gifScale: number;
  setGifScale: (v: number) => void;
  gifQuality: number;
  setGifQuality: (v: number) => void;
  gifWidth: number;
  gifHeight: number;
  gifPhase: 'idle' | 'capturing' | 'encoding' | 'done';
  gifProgress: number;
  gifRecording: boolean;
  gifPreviewUrl: string | null;
  onRecord: () => void;
  onAbort: () => void;
  onDownload: () => void;
  keyframeCount: number;
  transitionCount: number;
}

function GifTabContent(props: GifTabContentProps) {
  const {
    gifFps, setGifFps, gifScale, setGifScale,
    gifQuality, setGifQuality, gifWidth, gifHeight,
    gifPhase, gifProgress, gifRecording, gifPreviewUrl,
    onRecord, onAbort, onDownload,
    keyframeCount, transitionCount,
  } = props;

  return (
    <>
      {/* Stats */}
      <div style={statsStyle}>
        <span>📊 {keyframeCount} keyframes</span>
        <span>🔗 {transitionCount} transitions</span>
        <span>📐 {gifWidth}×{gifHeight}px</span>
      </div>

      {/* Settings */}
      <div style={gifSettingsStyle}>
        <GifSettingRow label="帧率 (FPS)" value={`${gifFps}`}>
          <input
            type="range" min={5} max={30} step={1} value={gifFps}
            onChange={e => setGifFps(Number(e.target.value))}
            style={gifSliderStyle}
            disabled={gifRecording}
          />
          <span style={gifValueStyle}>{gifFps}</span>
        </GifSettingRow>

        <GifSettingRow label="缩放" value={`${Math.round(gifScale * 100)}%`}>
          <input
            type="range" min={0.25} max={2} step={0.25} value={gifScale}
            onChange={e => setGifScale(Number(e.target.value))}
            style={gifSliderStyle}
            disabled={gifRecording}
          />
          <span style={gifValueStyle}>{Math.round(gifScale * 100)}%</span>
        </GifSettingRow>

        <GifSettingRow label="质量" value={gifQuality <= 5 ? '高' : gifQuality <= 15 ? '中' : '低'}>
          <input
            type="range" min={1} max={30} step={1} value={gifQuality}
            onChange={e => setGifQuality(Number(e.target.value))}
            style={gifSliderStyle}
            disabled={gifRecording}
          />
          <span style={gifValueStyle}>{gifQuality <= 5 ? '高' : gifQuality <= 15 ? '中' : '低'}</span>
        </GifSettingRow>
      </div>

      {/* Progress bar */}
      {gifPhase !== 'idle' && gifPhase !== 'done' && (
        <div style={gifProgressContainerStyle}>
          <div style={gifProgressLabelStyle}>
            {gifPhase === 'capturing' ? '🎥 录制帧...' : '⚙️ 编码 GIF...'}
            <span>{gifProgress}%</span>
          </div>
          <div style={gifProgressBarBgStyle}>
            <div style={{ ...gifProgressBarFillStyle, width: `${gifProgress}%` }} />
          </div>
        </div>
      )}

      {/* Preview */}
      {gifPreviewUrl && gifPhase === 'done' && (
        <div style={gifPreviewContainerStyle}>
          <img
            src={gifPreviewUrl}
            alt="GIF Preview"
            style={gifPreviewImgStyle}
          />
        </div>
      )}

      {/* Actions */}
      <div style={actionsStyle}>
        {gifPhase === 'idle' && (
          <button onClick={onRecord} style={primaryButtonStyle}>
            🎬 录制 GIF
          </button>
        )}
        {(gifPhase === 'capturing' || gifPhase === 'encoding') && (
          <button onClick={onAbort} style={gifCancelBtnStyle}>
            ✕ 取消
          </button>
        )}
        {gifPhase === 'done' && (
          <>
            <button onClick={onRecord} style={buttonStyle}>
              🔄 重新录制
            </button>
            <button onClick={onDownload} style={primaryButtonStyle}>
              💾 下载 GIF
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ─── GIF Setting Row ──────────────────────────────────────────────────
function GifSettingRow({ label, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div style={gifSettingRowStyle}>
      <span style={gifSettingLabelStyle}>{label}</span>
      <div style={gifSettingControlStyle}>{children}</div>
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

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '1px solid #333',
  padding: '0 20px',
};

const tabStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: '#888',
  fontSize: 12,
  cursor: 'pointer',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: '#e5e5e5',
  borderBottom: '2px solid #2563eb',
};

// ─── GIF-specific styles ──────────────────────────────────────────────
const gifSettingsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 8,
  padding: 14,
};

const gifSettingRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const gifSettingLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#a1a1aa',
  minWidth: 70,
  flexShrink: 0,
};

const gifSettingControlStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 1,
};

const gifSliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  accentColor: '#3b82f6',
};

const gifValueStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#71717a',
  minWidth: 32,
  textAlign: 'right',
};

const gifProgressContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const gifProgressLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: '#a1a1aa',
};

const gifProgressBarBgStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  background: '#252525',
  borderRadius: 3,
  overflow: 'hidden',
};

const gifProgressBarFillStyle: React.CSSProperties = {
  height: '100%',
  background: '#3b82f6',
  borderRadius: 3,
  transition: 'width 0.2s ease',
};

const gifPreviewContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 8,
  padding: 12,
  maxHeight: 200,
  overflow: 'hidden',
};

const gifPreviewImgStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: 180,
  borderRadius: 4,
  objectFit: 'contain',
};

const gifCancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: '#3f1515',
  border: '1px solid #7f1d1d',
  borderRadius: 8,
  color: '#fca5a5',
  fontSize: 12,
  cursor: 'pointer',
};
