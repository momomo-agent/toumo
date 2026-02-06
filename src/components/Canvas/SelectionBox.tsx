import type { Position } from '../../types';

interface SelectionBoxProps {
  start: Position;
  end: Position;
}

export function SelectionBox({ start, end }: SelectionBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {/* Gradient fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.12))',
          borderRadius: 2,
        }}
      />

      {/* Animated dashed border via SVG */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <rect
          x={0.5}
          y={0.5}
          width={Math.max(0, width - 1)}
          height={Math.max(0, height - 1)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="4 3"
          rx={2}
          ry={2}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-14"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>

      {/* Corner markers */}
      {width > 6 && height > 6 && (
        <>
          <div style={cornerStyle('top', 'left')} />
          <div style={cornerStyle('top', 'right')} />
          <div style={cornerStyle('bottom', 'left')} />
          <div style={cornerStyle('bottom', 'right')} />
        </>
      )}

      {/* Size label */}
      {width > 30 && height > 20 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -22,
            transform: 'translateX(-50%)',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 1px 4px rgba(59,130,246,0.3)',
            letterSpacing: 0.3,
          }}
        >
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </div>
  );
}

function cornerStyle(
  vertical: 'top' | 'bottom',
  horizontal: 'left' | 'right',
): React.CSSProperties {
  return {
    position: 'absolute',
    [vertical]: -2,
    [horizontal]: -2,
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#fff',
    border: '1.5px solid #3b82f6',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
  };
}
