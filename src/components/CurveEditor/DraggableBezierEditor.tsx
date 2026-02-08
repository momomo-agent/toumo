import { useRef, useState, useCallback } from 'react';

interface Props {
  value: [number, number, number, number];
  onChange: (v: [number, number, number, number]) => void;
  size?: number;
  padding?: number;
}

type DragTarget = 'p1' | 'p2' | null;

export function DraggableBezierEditor({ value, onChange, size = 160, padding = 16 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [x1, y1, x2, y2] = value;

  const total = size + padding * 2;
  const sx = (v: number) => padding + v * size;
  const sy = (v: number) => padding + (1 - v) * size;

  const toNorm = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const nx = (clientX - rect.left - padding) / size;
    // y is inverted: allow overshoot (-0.5 to 1.5)
    const ny = 1 - (clientY - rect.top - padding) / size;
    return [
      Math.max(0, Math.min(1, nx)),
      Math.max(-0.5, Math.min(1.5, ny)),
    ];
  }, [size, padding]);

  const handlePointerDown = useCallback((target: DragTarget) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(target);
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const [nx, ny] = toNorm(e.clientX, e.clientY);
    if (dragging === 'p1') {
      onChange([nx, ny, x2, y2]);
    } else {
      onChange([x1, y1, nx, ny]);
    }
  }, [dragging, toNorm, onChange, x1, y1, x2, y2]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Curve path
  const curvePath = `M${sx(0)},${sy(0)} C${sx(x1)},${sy(y1)} ${sx(x2)},${sy(y2)} ${sx(1)},${sy(1)}`;

  return (
    <svg
      ref={svgRef}
      width={total}
      height={total}
      style={{
        display: 'block',
        margin: '0 auto',
        background: '#111112',
        borderRadius: 8,
        border: '1px solid #2a2a2a',
        cursor: dragging ? 'grabbing' : 'default',
        touchAction: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Grid */}
      <rect x={padding} y={padding} width={size} height={size}
        fill="none" stroke="#1e1e1f" strokeWidth="1" />
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(v => (
        <g key={v}>
          <line x1={sx(v)} y1={sy(0)} x2={sx(v)} y2={sy(1)}
            stroke="#1a1a1b" strokeWidth="0.5" />
          <line x1={sx(0)} y1={sy(v)} x2={sx(1)} y2={sy(v)}
            stroke="#1a1a1b" strokeWidth="0.5" />
        </g>
      ))}
      {/* Diagonal guide */}
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)}
        stroke="#2a2a2b" strokeWidth="1" strokeDasharray="4,4" />

      {/* Control lines */}
      <line x1={sx(0)} y1={sy(0)} x2={sx(x1)} y2={sy(y1)}
        stroke="#3b82f660" strokeWidth="1.5" />
      <line x1={sx(1)} y1={sy(1)} x2={sx(x2)} y2={sy(y2)}
        stroke="#3b82f660" strokeWidth="1.5" />

      {/* Curve */}
      <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth="2.5"
        strokeLinecap="round" />

      {/* Endpoints */}
      <circle cx={sx(0)} cy={sy(0)} r="3" fill="#555" />
      <circle cx={sx(1)} cy={sy(1)} r="3" fill="#555" />

      {/* Draggable P1 */}
      <circle
        cx={sx(x1)} cy={sy(y1)} r={dragging === 'p1' ? 7 : 5.5}
        fill="#3b82f6" stroke="#fff" strokeWidth="1.5"
        style={{ cursor: 'grab', transition: 'r 0.15s ease' }}
        onPointerDown={handlePointerDown('p1')}
      />
      {/* Draggable P2 */}
      <circle
        cx={sx(x2)} cy={sy(y2)} r={dragging === 'p2' ? 7 : 5.5}
        fill="#3b82f6" stroke="#fff" strokeWidth="1.5"
        style={{ cursor: 'grab', transition: 'r 0.15s ease' }}
        onPointerDown={handlePointerDown('p2')}
      />
    </svg>
  );
}

export default DraggableBezierEditor;
