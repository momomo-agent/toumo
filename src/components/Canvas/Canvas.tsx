import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement, Position, ToolType } from '../../types';
import { DEFAULT_STYLE } from '../../types';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { AlignmentGuides, type AlignmentLine } from './AlignmentGuides';

const CANVAS_SIZE = 2400;
const SNAP_THRESHOLD = 6;

export function Canvas() {
  const {
    keyframes,
    selectedKeyframeId,
    selectedElementIds,
    setSelectedElementId,
    setSelectedElementIds,
    currentTool,
    canvasOffset,
    canvasScale,
    setCanvasOffset,
    addElement,
    selectionBox,
    setSelectionBox,
    setIsSelecting,
    nudgeSelectedElements,
    setCurrentTool,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const drawStartRef = useRef<Position | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null);
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const handOverrideRef = useRef(false);
  const previousToolRef = useRef<ToolType>(currentTool);

  const currentKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const elements = currentKeyframe?.keyElements || [];

  const toCanvasSpace = (event: ReactMouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const checkAlignment = useCallback((draggedId: string, position: Position, size: { width: number; height: number }) => {
    const lines: AlignmentLine[] = [];
    const draggedRight = position.x + size.width;
    const draggedBottom = position.y + size.height;
    const draggedCenterX = position.x + size.width / 2;
    const draggedCenterY = position.y + size.height / 2;

    elements.forEach((element) => {
      if (element.id === draggedId) return;

      const elRight = element.position.x + element.size.width;
      const elBottom = element.position.y + element.size.height;
      const elCenterX = element.position.x + element.size.width / 2;
      const elCenterY = element.position.y + element.size.height / 2;

      if (Math.abs(position.x - element.position.x) <= SNAP_THRESHOLD) {
        lines.push({ type: 'vertical', position: element.position.x });
      }
      if (Math.abs(draggedRight - elRight) <= SNAP_THRESHOLD) {
        lines.push({ type: 'vertical', position: elRight });
      }
      if (Math.abs(draggedCenterX - elCenterX) <= SNAP_THRESHOLD) {
        lines.push({ type: 'vertical', position: elCenterX });
      }
      if (Math.abs(position.y - element.position.y) <= SNAP_THRESHOLD) {
        lines.push({ type: 'horizontal', position: element.position.y });
      }
      if (Math.abs(draggedBottom - elBottom) <= SNAP_THRESHOLD) {
        lines.push({ type: 'horizontal', position: elBottom });
      }
      if (Math.abs(draggedCenterY - elCenterY) <= SNAP_THRESHOLD) {
        lines.push({ type: 'horizontal', position: elCenterY });
      }
    });

    setAlignmentLines(lines);
  }, [elements]);

  useEffect(() => {
    const clear = () => setAlignmentLines([]);
    document.addEventListener('mouseup', clear);
    document.addEventListener('mouseleave', clear);
    return () => {
      document.removeEventListener('mouseup', clear);
      document.removeEventListener('mouseleave', clear);
    };
  }, []);

  useEffect(() => {
    if (!handOverrideRef.current) {
      previousToolRef.current = currentTool;
    }
  }, [currentTool]);

  const handleCanvasMouseDown = useCallback((event: ReactMouseEvent) => {
    const coords = toCanvasSpace(event);

    if (currentTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        startX: canvasOffset.x,
        startY: canvasOffset.y,
      };
      return;
    }

    if (currentTool === 'select') {
      setSelectedElementId(null);
      setIsSelecting(true);
      setSelectionBox({ start: coords, end: coords });
      return;
    }

    if (['rectangle', 'ellipse', 'text'].includes(currentTool)) {
      drawStartRef.current = coords;
    }
  }, [canvasOffset.x, canvasOffset.y, canvasScale, currentTool, setSelectedElementId, setSelectionBox, setIsSelecting]);

  const handleCanvasMouseMove = useCallback((event: ReactMouseEvent) => {
    const coords = toCanvasSpace(event);

    if (isPanningRef.current && panStartRef.current) {
      const dx = event.clientX - panStartRef.current.pointerX;
      const dy = event.clientY - panStartRef.current.pointerY;
      setCanvasOffset({ x: panStartRef.current.startX + dx, y: panStartRef.current.startY + dy });
      return;
    }

    if (selectionBox) {
      setSelectionBox({ ...selectionBox, end: coords });
      return;
    }
  }, [selectionBox, setCanvasOffset, setSelectionBox]);

  const handleCanvasMouseUp = useCallback((event: ReactMouseEvent) => {
    const coords = toCanvasSpace(event);

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      return;
    }

    if (selectionBox) {
      const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

      const ids = elements
        .filter((el) => {
          const elRight = el.position.x + el.size.width;
          const elBottom = el.position.y + el.size.height;
          return el.position.x < maxX && elRight > minX && el.position.y < maxY && elBottom > minY;
        })
        .map((el) => el.id);

      setSelectedElementIds(ids);
      setSelectionBox(null);
      setIsSelecting(false);
      return;
    }

    if (drawStartRef.current && ['rectangle', 'ellipse', 'text'].includes(currentTool)) {
      const start = drawStartRef.current;
      const width = Math.abs(coords.x - start.x);
      const height = Math.abs(coords.y - start.y);

      if (width < 5 && height < 5) {
        drawStartRef.current = null;
        return;
      }

      const baseStyle = { ...DEFAULT_STYLE };
      const shapeType = currentTool as KeyElement['shapeType'];
      const newElement: KeyElement = {
        id: `el-${Date.now()}`,
        name: shapeType === 'ellipse' ? 'Ellipse' : shapeType === 'text' ? 'Text' : 'Rectangle',
        category: 'content',
        isKeyElement: true,
        attributes: [],
        position: {
          x: Math.min(start.x, coords.x),
          y: Math.min(start.y, coords.y),
        },
        size: {
          width: Math.max(width, shapeType === 'text' ? 140 : 48),
          height: Math.max(height, shapeType === 'text' ? 40 : 48),
        },
        shapeType,
        style: {
          ...baseStyle,
          borderRadius: shapeType === 'ellipse' ? Math.max(width, height) : baseStyle.borderRadius,
          fontSize: shapeType === 'text' ? 18 : baseStyle.fontSize,
        },
        text: shapeType === 'text' ? 'Text' : undefined,
      };

      if (shapeType === 'text') {
        newElement.style = {
          fill: 'transparent',
          fillOpacity: 1,
          stroke: 'transparent',
          strokeWidth: 0,
          strokeOpacity: 1,
          borderRadius: baseStyle.borderRadius,
          fontSize: 18,
          fontWeight: '500',
          textAlign: 'left',
        };
      }

      addElement(newElement);
      drawStartRef.current = null;
    }
  }, [addElement, currentTool, elements, selectionBox, setIsSelecting, setSelectedElementIds, setSelectionBox]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.code === 'Space' && !handOverrideRef.current && !isTyping) {
        handOverrideRef.current = true;
        previousToolRef.current = currentTool;
        setCurrentTool('hand');
        event.preventDefault();
        return;
      }

      if (isTyping) return;

      const step = event.shiftKey ? 10 : 1;
      switch (event.key) {
        case 'ArrowUp':
          nudgeSelectedElements(0, -step);
          event.preventDefault();
          break;
        case 'ArrowDown':
          nudgeSelectedElements(0, step);
          event.preventDefault();
          break;
        case 'ArrowLeft':
          nudgeSelectedElements(-step, 0);
          event.preventDefault();
          break;
        case 'ArrowRight':
          nudgeSelectedElements(step, 0);
          event.preventDefault();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && handOverrideRef.current) {
        handOverrideRef.current = false;
        const nextTool = previousToolRef.current ?? 'select';
        setCurrentTool(nextTool);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentTool, nudgeSelectedElements, setCurrentTool]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      className="canvas-stage"
      style={{ cursor: currentTool === 'hand' ? 'grab' : currentTool === 'select' ? 'default' : 'crosshair' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
        }}
      >
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            allElements={elements}
            scale={canvasScale}
            isSelected={selectedElementIds.includes(element.id)}
            onAlignmentCheck={checkAlignment}
          />
        ))}

        <AlignmentGuides lines={alignmentLines} canvasWidth={CANVAS_SIZE} canvasHeight={CANVAS_SIZE} />

        {selectionBox && <SelectionBox start={selectionBox.start} end={selectionBox.end} />}
      </div>
    </div>
  );
}
