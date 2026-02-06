import { useCallback, useState } from 'react';
import { useEditorStore } from '../../store';

const GUIDE_COLOR = '#2563eb';
const GUIDE_HOVER_COLOR = '#60a5fa';
const GUIDE_HIT_AREA = 8; // px hit area for dragging

interface GuideLinesProps {
  /** Bounding rect of the canvas stage element (for coordinate conversion) */
  stageRect: DOMRect | null;
}

export function GuideLines({ stageRect }: GuideLinesProps) {
  const guides = useEditorStore(s => s.guides);
  const canvasScale = useEditorStore(s => s.canvasScale);
  const canvasOffset = useEditorStore(s => s.canvasOffset);
  const updateGuide = useEditorStore(s => s.updateGuide);
  const removeGuide = useEditorStore(s => s.removeGuide);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseDown = useCallback((guideId: string, orientation: 'horizontal' | 'vertical', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(guideId);

    const handleMove = (ev: MouseEvent) => {
      if (!stageRect) return;
      if (orientation === 'horizontal') {
        const canvasY = (ev.clientY - stageRect.top - canvasOffset.y) / canvasScale;
        updateGuide(guideId, Math.round(canvasY));
      } else {
        const canvasX = (ev.clientX - stageRect.left - canvasOffset.x) / canvasScale;
        updateGuide(guideId, Math.round(canvasX));
      }
    };

    const handleUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      setDraggingId(null);

      // If dragged off canvas, remove the guide
      if (stageRect) {
        const { clientX, clientY } = ev;
        if (
          clientX < stageRect.left - 20 || clientX > stageRect.right + 20 ||
          clientY < stageRect.top - 20 || clientY > stageRect.bottom + 20
        ) {
          removeGuide(guideId);
        }
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [stageRect, canvasOffset, canvasScale, updateGuide, removeGuide]);

  const handleDoubleClick = useCallback((guideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    removeGuide(guideId);
  }, [removeGuide]);

  return (
    <>
      {guides.map(guide => {
        const isHovered = hoveredId === guide.id;
        const isDragging = draggingId === guide.id;
        const color = (isHovered || isDragging) ? GUIDE_HOVER_COLOR : GUIDE_COLOR;

        if (guide.orientation === 'horizontal') {
          const y = guide.position * canvasScale + canvasOffset.y;
          return (
            <div
              key={guide.id}
              onMouseEnter={() => setHoveredId(guide.id)}
              onMouseLeave={() => setHoveredId(null)}
              onMouseDown={(e) => handleMouseDown(guide.id, 'horizontal', e)}
              onDoubleClick={(e) => handleDoubleClick(guide.id, e)}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y - GUIDE_HIT_AREA / 2,
                height: GUIDE_HIT_AREA,
                cursor: 'ns-resize',
                zIndex: 999,
              }}
            >
              {/* Visible line */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: GUIDE_HIT_AREA / 2 - 0.5,
                height: 1,
                background: color,
                boxShadow: `0 0 3px ${color}`,
                pointerEvents: 'none',
              }} />
              {/* Position label */}
              {(isHovered || isDragging) && (
                <div style={{
                  position: 'absolute',
                  left: 4,
                  top: GUIDE_HIT_AREA / 2 + 4,
                  background: GUIDE_COLOR,
                  color: '#fff',
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 3,
                  pointerEvents: 'none',
                  fontFamily: 'system-ui',
                  whiteSpace: 'nowrap',
                }}>
                  Y: {guide.position}
                </div>
              )}
            </div>
          );
        } else {
          const x = guide.position * canvasScale + canvasOffset.x;
          return (
            <div
              key={guide.id}
              onMouseEnter={() => setHoveredId(guide.id)}
              onMouseLeave={() => setHoveredId(null)}
              onMouseDown={(e) => handleMouseDown(guide.id, 'vertical', e)}
              onDoubleClick={(e) => handleDoubleClick(guide.id, e)}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: x - GUIDE_HIT_AREA / 2,
                width: GUIDE_HIT_AREA,
                cursor: 'ew-resize',
                zIndex: 999,
              }}
            >
              {/* Visible line */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: GUIDE_HIT_AREA / 2 - 0.5,
                width: 1,
                background: color,
                boxShadow: `0 0 3px ${color}`,
                pointerEvents: 'none',
              }} />
              {/* Position label */}
              {(isHovered || isDragging) && (
                <div style={{
                  position: 'absolute',
                  top: 4,
                  left: GUIDE_HIT_AREA / 2 + 4,
                  background: GUIDE_COLOR,
                  color: '#fff',
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 3,
                  pointerEvents: 'none',
                  fontFamily: 'system-ui',
                  whiteSpace: 'nowrap',
                }}>
                  X: {guide.position}
                </div>
              )}
            </div>
          );
        }
      })}
    </>
  );
}
