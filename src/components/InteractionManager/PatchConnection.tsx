import React from 'react';

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
}: PatchConnectionProps) {
  const color = PORT_TYPE_COLORS[dataType] || '#888';
  const dx = Math.abs(toX - fromX) * 0.5;
  const cpx1 = fromX + Math.max(dx, 40);
  const cpy1 = fromY;
  const cpx2 = toX - Math.max(dx, 40);
  const cpy2 = toY;

  const path = `M ${fromX} ${fromY} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${toX} ${toY}`;

  return (
    <g>
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      />
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={selected ? '#fff' : color}
        strokeWidth={selected ? 2.5 : 2}
        strokeOpacity={selected ? 1 : 0.6}
      />
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
