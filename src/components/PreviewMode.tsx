import React, { useState, useEffect, useCallback } from 'react';
import { clearPreviewHash, type ProjectData } from '../utils/shareUtils';
import { LivePreview } from './LivePreview';
import { DeviceFrameShell } from './DeviceFrame/Shell';
import { DevicePicker } from './DeviceFrame/Picker';
import { DEVICE_FRAMES } from './DeviceFrame/data';

// ─── Props ────────────────────────────────────────────────────────────
interface PreviewModeProps {
  projectData: ProjectData;
  onEnterEditMode: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// PreviewMode — Fullscreen preview thin shell
// Delegates all rendering/interaction to LivePreview.
// Only handles: fullscreen container, device frame, controls bar.
// ═══════════════════════════════════════════════════════════════════════
export function PreviewMode({ projectData: _projectData, onEnterEditMode }: PreviewModeProps) {
  const [deviceFrame, setDeviceFrame] = useState('iphone15pro');
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const device = DEVICE_FRAMES.find(d => d.id === deviceFrame) || DEVICE_FRAMES[0];
  const canRotate = device.category === 'iphone' || device.category === 'android' || device.category === 'ipad';

  // ─── Exit preview ────────────────────────────────────────────────
  const handleEdit = useCallback(() => { clearPreviewHash(); onEnterEditMode(); }, [onEnterEditMode]);

  // ─── Escape key ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); handleEdit(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleEdit]);

  // ─── Auto-hide controls ──────────────────────────────────────────
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onMove = () => { setShowControls(true); clearTimeout(timeout); timeout = setTimeout(() => setShowControls(false), 3000); };
    window.addEventListener('mousemove', onMove);
    timeout = setTimeout(() => setShowControls(false), 3000);
    return () => { window.removeEventListener('mousemove', onMove); clearTimeout(timeout); };
  }, []);

  // ─── Window resize ───────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Close picker on outside click ───────────────────────────────
  useEffect(() => {
    if (!showDevicePicker) return;
    const onClick = () => setShowDevicePicker(false);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [showDevicePicker]);

  // ─── Scale calculation ───────────────────────────────────────────
  const rawW = device.id === 'none' ? 390 : device.width;
  const rawH = device.id === 'none' ? 844 : device.height;
  const contentWidth = (isLandscape && canRotate) ? rawH : rawW;
  const contentHeight = (isLandscape && canRotate) ? rawW : rawH;
  const bezel = device.id === 'none' ? 0 : 12;
  const totalW = contentWidth + bezel * 2;
  const totalH = contentHeight + bezel * 2;
  const scale = Math.min((windowSize.w * 0.9) / totalW, (windowSize.h * 0.85) / totalH, 1);

  // ═════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════
  return (
    <div style={S.container}>
      {/* Preview area */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {device.id !== 'none' ? (
          <DeviceFrameShell device={device} landscape={isLandscape && canRotate}>
            <div style={{ width: contentWidth, height: contentHeight, overflow: 'hidden', position: 'relative' }}>
              <LivePreview fullscreen />
            </div>
          </DeviceFrameShell>
        ) : (
          <div style={{ width: contentWidth, height: contentHeight, overflow: 'hidden', position: 'relative' }}>
            <LivePreview fullscreen />
          </div>
        )}
      </div>

      {/* ── Controls bar ─────────────────────────────────────────── */}
      <div style={{ ...S.controls, opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none' }}>
        <div style={S.controlsInner}>
          {/* Device picker trigger */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDevicePicker(p => !p)} style={S.deviceBtn} title="切换设备">
              {device.icon} {device.label}
              {contentWidth > 0 && <span style={S.deviceDim}>{contentWidth}×{contentHeight}</span>}
              <span style={{ fontSize: 10, marginLeft: 4 }}>▾</span>
            </button>
            {canRotate && device.id !== 'none' && (
              <button onClick={() => setIsLandscape(l => !l)} style={S.orientBtn} title={isLandscape ? '竖屏' : '横屏'}>
                {isLandscape ? '↔' : '↕'}
              </button>
            )}
            {showDevicePicker && (
              <DevicePicker current={deviceFrame} onSelect={(id) => { setDeviceFrame(id); setShowDevicePicker(false); }} />
            )}
          </div>

          {/* Action buttons */}
          <div style={S.buttons}>
            <button onClick={handleEdit} style={S.editBtn}>✏️ Edit</button>
          </div>
        </div>
      </div>

      {/* Escape hint */}
      <div style={S.escHint}>Press <kbd style={S.kbd}>Esc</kbd> to exit</div>
      {/* Branding */}
      <div style={S.branding}>Made with <span style={{ color: '#2563eb' }}>Toumo</span></div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#0a0a0b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column',
  },
  controls: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    zIndex: 10000,
  },
  controlsInner: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(30,30,32,0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16, padding: '10px 20px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  deviceBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.08)', color: '#ccc',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '6px 12px', fontSize: 12,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
  },
  deviceDim: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10, marginLeft: 2,
  },
  orientBtn: {
    background: 'rgba(255,255,255,0.08)', color: '#ccc',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '6px 8px', fontSize: 14,
    cursor: 'pointer', marginLeft: 4,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  buttons: {
    display: 'flex', gap: 8,
  },
  editBtn: {
    background: 'rgba(37,99,235,0.3)', color: '#93bbfc',
    border: '1px solid rgba(37,99,235,0.4)',
    borderRadius: 8, padding: '6px 14px', fontSize: 12,
    cursor: 'pointer',
  },
  escHint: {
    position: 'fixed', top: 16, right: 20,
    color: 'rgba(255,255,255,0.3)', fontSize: 12, zIndex: 10000,
  },
  kbd: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 4, padding: '2px 6px',
    border: '1px solid rgba(255,255,255,0.15)', fontSize: 11,
  },
  branding: {
    position: 'fixed', bottom: 8, right: 16,
    color: 'rgba(255,255,255,0.2)', fontSize: 11, zIndex: 10000,
  },
};
