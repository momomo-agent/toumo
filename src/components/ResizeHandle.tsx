import { useState } from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  side: 'left' | 'right';
}

export function ResizeHandle({ onMouseDown, isDragging, side }: ResizeHandleProps) {
  const [hovered, setHovered] = useState(false);
  const active = isDragging || hovered;

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 6,
        cursor: 'col-resize',
        position: 'relative',
        flexShrink: 0,
        zIndex: 10,
        // Extend hit area
        margin: '0 -3px',
        padding: '0 3px',
      }}
    >
      {/* Visual indicator line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [side === 'left' ? 'right' : 'left']: 2,
          width: 2,
          borderRadius: 1,
          background: active ? 'var(--accent, #6366f1)' : 'transparent',
          // folme
        }}
      />
    </div>
  );
}
