import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store';

const DEVICE_FRAMES = [
  { id: 'none', label: 'No Frame', width: 0, height: 0, radius: 0 },
  { id: 'iphone14', label: 'iPhone 14', width: 390, height: 844, radius: 47 },
  { id: 'iphone14pro', label: 'iPhone 14 Pro', width: 393, height: 852, radius: 55 },
  { id: 'iphone15pro', label: 'iPhone 15 Pro', width: 393, height: 852, radius: 55 },
  { id: 'iphonese', label: 'iPhone SE', width: 375, height: 667, radius: 0 },
  { id: 'pixel7', label: 'Pixel 7', width: 412, height: 915, radius: 28 },
  { id: 'galaxys23', label: 'Galaxy S23', width: 360, height: 780, radius: 24 },
  { id: 'ipadmini', label: 'iPad Mini', width: 744, height: 1133, radius: 18 },
  { id: 'ipadpro11', label: 'iPad Pro 11"', width: 834, height: 1194, radius: 18 },
];

export function LivePreview() {
  const { keyframes, selectedKeyframeId, frameSize } = useEditorStore();
  
  const [deviceFrame, setDeviceFrame] = useState('iphone14');
  const [zoom, setZoom] = useState(100);
  const [isZoomLocked, setIsZoomLocked] = useState(false);

  const keyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = keyframe?.keyElements || [];
  const device = DEVICE_FRAMES.find(d => d.id === deviceFrame) || DEVICE_FRAMES[0];

  // Calculate scale to fit preview area
  const containerWidth = 288; // 320 - 32 padding
  const containerHeight = 480;
  
  const contentWidth = device.id === 'none' ? frameSize.width : device.width;
  const contentHeight = device.id === 'none' ? frameSize.height : device.height;
  
  const autoScale = Math.min(
    containerWidth / contentWidth,
    containerHeight / contentHeight,
    1
  );
  
  const effectiveScale = (zoom / 100) * autoScale;

  // Intercept browser zoom (Cmd/Ctrl + scroll)
  const handleWheel = useCallback((e: WheelEvent) => {
    if ((e.metaKey || e.ctrlKey) && !isZoomLocked) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.max(25, Math.min(200, prev + delta)));
    }
  }, [isZoomLocked]);

  useEffect(() => {
    const container = document.getElementById('live-preview-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>Live Preview</span>
        <span style={{ fontSize: 10, color: '#666' }}>{keyframe?.name}</span>
      </div>

      {/* Device Frame Selector */}
      <div style={controlsStyle}>
        <select
          value={deviceFrame}
          onChange={(e) => setDeviceFrame(e.target.value)}
          style={selectStyle}
        >
          {DEVICE_FRAMES.map(d => (
            <option key={d.id} value={d.id}>
              {d.label} {d.width > 0 ? `(${d.width}×${d.height})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Preview Area */}
      <div 
        id="live-preview-container"
        style={previewAreaStyle}
      >
        <div style={{
          transform: `scale(${effectiveScale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease',
        }}>
          {/* Device Frame */}
          {device.id !== 'none' ? (
            <DeviceFrame device={device}>
              <PreviewContent elements={elements} />
            </DeviceFrame>
          ) : (
            <div style={{
              width: frameSize.width,
              height: frameSize.height,
              background: '#050506',
              borderRadius: 8,
              border: '1px solid #333',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <PreviewContent elements={elements} />
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div style={zoomControlsStyle}>
        <button
          onClick={() => setZoom(prev => Math.max(25, prev - 25))}
          style={zoomButtonStyle}
        >
          −
        </button>
        <input
          type="range"
          min="25"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={sliderStyle}
        />
        <button
          onClick={() => setZoom(prev => Math.min(200, prev + 25))}
          style={zoomButtonStyle}
        >
          +
        </button>
        <span style={zoomLabelStyle}>{zoom}%</span>
        <button
          onClick={() => setIsZoomLocked(!isZoomLocked)}
          style={{
            ...lockButtonStyle,
            background: isZoomLocked ? '#f59e0b20' : 'transparent',
            borderColor: isZoomLocked ? '#f59e0b' : '#333',
          }}
          title={isZoomLocked ? 'Unlock zoom' : 'Lock zoom'}
        >
          {isZoomLocked ? '🔒' : '🔓'}
        </button>
      </div>

      {/* Reset button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button
          onClick={() => setZoom(100)}
          style={resetButtonStyle}
        >
          Reset Zoom
        </button>
      </div>
    </div>
  );
}

// Device Frame Component
function DeviceFrame({ 
  device, 
  children 
}: { 
  device: typeof DEVICE_FRAMES[0]; 
  children: React.ReactNode;
}) {
  const isIPhone = device.id.startsWith('iphone');
  const isIPad = device.id.startsWith('ipad');
  
  return (
    <div style={{
      position: 'relative',
      padding: isIPhone ? 12 : 8,
      background: '#1a1a1a',
      borderRadius: device.radius + (isIPhone ? 8 : 4),
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Notch for iPhone */}
      {isIPhone && device.id !== 'iphonese' && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 34,
          background: '#000',
          borderRadius: 20,
          zIndex: 10,
        }} />
      )}
      
      {/* Screen */}
      <div style={{
        width: device.width,
        height: device.height,
        background: '#000',
        borderRadius: device.radius,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {children}
      </div>
      
      {/* Home indicator for modern iPhones */}
      {isIPhone && device.id !== 'iphonese' && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 134,
          height: 5,
          background: '#fff',
          borderRadius: 3,
          opacity: 0.3,
        }} />
      )}
      
      {/* iPad home button area */}
      {isIPad && (
        <div style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: 4,
          background: '#333',
          borderRadius: 2,
        }} />
      )}
    </div>
  );
}

// Preview Content Component
function PreviewContent({ 
  elements, 
}: { 
  elements: Array<{
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: { fill?: string; borderRadius?: number };
    shapeType?: string;
  }>;
}) {
  return (
    <>
      {elements.map((el) => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: el.position.x,
            top: el.position.y,
            width: el.size.width,
            height: el.size.height,
            background: el.style?.fill || '#3b82f6',
            borderRadius: el.shapeType === 'ellipse' 
              ? '50%' 
              : (el.style?.borderRadius || 8),
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #2a2a2a',
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const controlsStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderBottom: '1px solid #2a2a2a',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 11,
};

const previewAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0a0b',
  overflow: 'hidden',
  position: 'relative',
};

const zoomControlsStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderTop: '1px solid #2a2a2a',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const zoomButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 4,
  color: '#888',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  accentColor: '#2563eb',
};

const zoomLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#666',
  minWidth: 36,
  textAlign: 'right',
};

const lockButtonStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: 4,
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const resetButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 0',
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#666',
  fontSize: 10,
  cursor: 'pointer',
};
