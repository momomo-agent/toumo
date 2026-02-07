import React, { useState } from 'react';

const PORT_TYPE_COLORS: Record<string, string> = {
  pulse: '#ffffff',
  boolean: '#22c55e',
  number: '#3b82f6',
  string: '#eab308',
  displayState: '#a855f7',
  any: '#888',
};

interface PatchConnectionProps {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  dataType?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const PatchConnection = React.memo(function PatchConnection({
  id,
  fromX,
  fromY,
  toX,
  toY,
  dataType = 'any',
  selected = false,
  onSelect,
  onDelete,
}: PatchConnectionProps) {
  const [hovered, setHovered] = useState(false);
  const color = PORT_TYPE_COLORS[dataType] || '#888';
  const dx = Math.abs(toX - fromX) * 0.5;
  const cpx1 = fromX + Math.max(dx, 40);
  const cpy1 = fromY;
  const cpx2 = toX - Math.max(dx, 40);
  const cpy2 = toY;

  const path = `M ${fromX} ${fromY} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${toX} ${toY}`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected) {
      onDelete?.(id);
    } else {
      onSelect?.(id);
    }
  };

  const isHighlighted = selected || hovered;

  return (
    <g>
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={selected ? '#ff4444' : hovered ? '#fff' : color}
        strokeWidth={isHighlighted ? 2.5 : 2}
        strokeOpacity={isHighlighted ? 1 : 0.6}
        style={{ pointerEvents: 'none' }}
      />
      {/* Flow animation dots */}
      {isHighlighted && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 8"
          strokeOpacity={0.8}
          style={{ pointerEvents: 'none', animation: 'flowDash 0.6s linear infinite' }}
        />
      )}
    </g>
  );
});

// Temporary connection while dragging
export function DragConnection({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}) {
  const dx = Math.abs(toX - fromX) * 0.5;
  const cpx1 = fromX + Math.max(dx, 40);
  const cpx2 = toX - Math.max(dx, 40);

  const path = `M ${fromX} ${fromY} C ${cpx1} ${fromY}, ${cpx2} ${toY}, ${toX} ${toY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="#fff"
      strokeWidth={2}
      strokeOpacity={0.5}
      strokeDasharray="6 3"
    />
  );
}
