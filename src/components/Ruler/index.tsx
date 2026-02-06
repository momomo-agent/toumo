import { useCallback, useRef, useState, type ReactElement } from 'react';
import { useEditorStore } from '../../store';

const RULER_SIZE = 20;
const RULER_BG = '#1a1a1a';
const RULER_BORDER = '#333';
const TICK_COLOR = '#555';
const LABEL_COLOR = '#888';
const GUIDE_DRAG_COLOR = '#2563eb';

/** Calculate nice tick intervals based on zoom */
function getTickInterval(scale: number): { major: number; minor: number } {
  const base = 100 / scale;
  const steps = [10, 20, 50, 100, 200, 500, 1000, 2000];
  const major = steps.find(s => s >= base) ?? 1000;
  return { major, minor: major / 5 };
}

export function HorizontalRuler() {
  const canvasScale = useEditorStore(s => s.canvasScale);
  const canvasOffset = useEditorStore(s => s.canvasOffset);
  const addGuide = useEditorStore(s => s.addGuide);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const { major, minor } = getTickInterval(canvasScale);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);

    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMove = (ev: MouseEvent) => {
      setDragPos(ev.clientY - rect.bottom);
    };

    const handleUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setDragging(false);
      setDragPos(null);

      // Convert screen position to canvas coordinate
      if (rect) {
        const canvasY = (ev.clientY - rect.bottom - canvasOffset.y) / canvasScale;
        if (canvasY > 0) {
          addGuide('horizontal', Math.round(canvasY));
        }
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [addGuide, canvasOffset.y, canvasScale]);

  // Build ticks
  const ticks: ReactElement[] = [];
  if (rulerRef.current) {
    const width = rulerRef.current.clientWidth;
    const startVal = -canvasOffset.x / canvasScale;
    const endVal = (width - canvasOffset.x) / canvasScale;
    const firstTick = Math.floor(startVal / minor) * minor;

    for (let val = firstTick; val <= endVal; val += minor) {
      const x = val * canvasScale + canvasOffset.x;
      if (x < 0 || x > width) continue;
      const isMajor = Math.abs(val % major) < 0.5;

      ticks.push(
        <line
          key={val}
          x1={x} y1={isMajor ? 0 : 12}
          x2={x} y2={RULER_SIZE}
          stroke={TICK_COLOR}
          strokeWidth={1}
        />
      );

      if (isMajor) {
        ticks.push(
          <text
            key={`l${val}`}
            x={x + 3} y={10}
            fill={LABEL_COLOR}
            fontSize={9}
            fontFamily="system-ui"
          >
            {Math.round(val)}
          </text>
        );
      }
    }
  }

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        left: RULER_SIZE,
        right: 0,
        height: RULER_SIZE,
        background: RULER_BG,
        borderBottom: `1px solid ${RULER_BORDER}`,
        cursor: 'ns-resize',
        zIndex: 100,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <svg width="100%" height={RULER_SIZE} style={{ display: 'block' }}>
        {ticks}
      </svg>
      {/* Drag preview line */}
      {dragging && dragPos !== null && (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: (rulerRef.current?.getBoundingClientRect().bottom ?? 0) + dragPos,
          height: 1,
          background: GUIDE_DRAG_COLOR,
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: `0 0 4px ${GUIDE_DRAG_COLOR}`,
        }} />
      )}
    </div>
  );
}

export function VerticalRuler() {
  const canvasScale = useEditorStore(s => s.canvasScale);
  const canvasOffset = useEditorStore(s => s.canvasOffset);
  const addGuide = useEditorStore(s => s.addGuide);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const { major, minor } = getTickInterval(canvasScale);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);

    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMove = (ev: MouseEvent) => {
      setDragPos(ev.clientX - rect.right);
    };

    const handleUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setDragging(false);
      setDragPos(null);

      if (rect) {
        const canvasX = (ev.clientX - rect.right - canvasOffset.x) / canvasScale;
        if (canvasX > 0) {
          addGuide('vertical', Math.round(canvasX));
        }
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [addGuide, canvasOffset.x, canvasScale]);

  // Build ticks
  const ticks: ReactElement[] = [];
  if (rulerRef.current) {
    const height = rulerRef.current.clientHeight;
    const startVal = -canvasOffset.y / canvasScale;
    const endVal = (height - canvasOffset.y) / canvasScale;
    const firstTick = Math.floor(startVal / minor) * minor;

    for (let val = firstTick; val <= endVal; val += minor) {
      const y = val * canvasScale + canvasOffset.y;
      if (y < 0 || y > height) continue;
      const isMajor = Math.abs(val % major) < 0.5;

      ticks.push(
        <line
          key={val}
          x1={isMajor ? 0 : 12} y1={y}
          x2={RULER_SIZE} y2={y}
          stroke={TICK_COLOR}
          strokeWidth={1}
        />
      );

      if (isMajor) {
        ticks.push(
          <text
            key={`l${val}`}
            x={10} y={y - 3}
            fill={LABEL_COLOR}
            fontSize={9}
            fontFamily="system-ui"
            transform={`rotate(-90, 10, ${y - 3})`}
          >
            {Math.round(val)}
          </text>
        );
      }
    }
  }

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: RULER_SIZE,
        left: 0,
        width: RULER_SIZE,
        bottom: 0,
        background: RULER_BG,
        borderRight: `1px solid ${RULER_BORDER}`,
        cursor: 'ew-resize',
        zIndex: 100,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <svg width={RULER_SIZE} height="100%" style={{ display: 'block' }}>
        {ticks}
      </svg>
      {/* Drag preview line */}
      {dragging && dragPos !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: (rulerRef.current?.getBoundingClientRect().right ?? 0) + dragPos,
          width: 1,
          background: GUIDE_DRAG_COLOR,
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: `0 0 4px ${GUIDE_DRAG_COLOR}`,
        }} />
      )}
    </div>
  );
}

/** Corner square where rulers meet */
export function RulerCorner() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: RULER_SIZE,
      height: RULER_SIZE,
      background: RULER_BG,
      borderRight: `1px solid ${RULER_BORDER}`,
      borderBottom: `1px solid ${RULER_BORDER}`,
      zIndex: 101,
    }} />
  );
}

export { RULER_SIZE };
