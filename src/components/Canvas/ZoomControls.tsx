import { useEditorStore } from '../../store';

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export function ZoomControls() {
  const { canvasScale, setCanvasScale, zoomToFit, zoomTo100 } = useEditorStore();

  const zoomPercentage = Math.round(canvasScale * 100);

  const handleZoomIn = () => {
    const nextLevel = ZOOM_LEVELS.find(level => level > canvasScale) ?? 4;
    setCanvasScale(Math.min(4, nextLevel));
  };

  const handleZoomOut = () => {
    const nextLevel = [...ZOOM_LEVELS].reverse().find(level => level < canvasScale) ?? 0.25;
    setCanvasScale(Math.max(0.25, nextLevel));
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: '#1a1a1c',
        borderRadius: 8,
        padding: '4px 8px',
        border: '1px solid #2f2f2f',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 100,
      }}
    >
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={canvasScale <= 0.25}
        title="Zoom Out (⌘-)"
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 4,
          color: canvasScale <= 0.25 ? '#555' : '#999',
          cursor: canvasScale <= 0.25 ? 'not-allowed' : 'pointer',
          fontSize: 16,
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          if (canvasScale > 0.25) e.currentTarget.style.background = '#2a2a2c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        −
      </button>

      {/* Zoom Percentage Display */}
      <div
        style={{
          minWidth: 48,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 500,
          color: '#ccc',
          userSelect: 'none',
        }}
      >
        {zoomPercentage}%
      </div>

      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={canvasScale >= 4}
        title="Zoom In (⌘+)"
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 4,
          color: canvasScale >= 4 ? '#555' : '#999',
          cursor: canvasScale >= 4 ? 'not-allowed' : 'pointer',
          fontSize: 16,
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          if (canvasScale < 4) e.currentTarget.style.background = '#2a2a2c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        +
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: '#3a3a3c', margin: '0 4px' }} />

      {/* Reset to 100% */}
      <button
        onClick={zoomTo100}
        title="Reset to 100% (⌘0)"
        style={{
          height: 28,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: canvasScale === 1 ? '#2563eb30' : 'transparent',
          border: 'none',
          borderRadius: 4,
          color: canvasScale === 1 ? '#8ab4ff' : '#999',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          if (canvasScale !== 1) e.currentTarget.style.background = '#2a2a2c';
        }}
        onMouseLeave={(e) => {
          if (canvasScale !== 1) e.currentTarget.style.background = 'transparent';
        }}
      >
        100%
      </button>

      {/* Fit to Screen */}
      <button
        onClick={zoomToFit}
        title="Fit to Screen"
        style={{
          height: 28,
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: 4,
          color: '#999',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2a2a2c';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Fit
      </button>
    </div>
  );
}
