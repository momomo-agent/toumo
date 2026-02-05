import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement, Position, Size, ToolType } from '../../types';
import { DEFAULT_STYLE } from '../../types';
import { CanvasElement, type ResizeHandle } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { AlignmentGuides, type AlignmentLine } from './AlignmentGuides';

const CANVAS_SIZE = 2400;
const SNAP_THRESHOLD = 6;
const MIN_SIZE = 16;

type AlignmentResult = {
  snappedPosition: Position | null;
  snappedSize?: Size | null;
};

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
    setCanvasScale,
    addElement,
    selectionBox,
    setSelectionBox,
    setIsSelecting,
    nudgeSelectedElements,
    setCurrentTool,
    frameSize,
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

  const clampPointToFrame = useCallback((point: Position) => ({
    x: Math.max(0, Math.min(point.x, frameSize.width)),
    y: Math.max(0, Math.min(point.y, frameSize.height)),
  }), [frameSize.height, frameSize.width]);

  const isInsideFrame = useCallback((point: Position) => {
    return point.x >= 0 && point.x <= frameSize.width && point.y >= 0 && point.y <= frameSize.height;
  }, [frameSize.height, frameSize.width]);

  const stageWidth = Math.max(CANVAS_SIZE, frameSize.width + 600);
  const stageHeight = Math.max(CANVAS_SIZE, frameSize.height + 600);

  const toCanvasSpace = (event: ReactMouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const checkAlignment = useCallback((
    draggedId: string,
    position: Position,
    size: Size,
    options?: { mode?: 'move' | 'resize'; handle?: ResizeHandle }
  ): AlignmentResult => {
    const mode = options?.mode ?? 'move';
    const handle = options?.handle;
    const isResize = mode === 'resize';

    const lines: AlignmentLine[] = [];
    const draggedRight = position.x + size.width;
    const draggedBottom = position.y + size.height;
    const draggedCenterX = position.x + size.width / 2;
    const draggedCenterY = position.y + size.height / 2;

    let snapDeltaX: number | null = null;
    let snapDeltaY: number | null = null;

    type Edge = 'left' | 'right' | 'top' | 'bottom';
    type EdgeSnap = { target: number; delta: number };
    const edgeSnaps: Record<Edge, EdgeSnap | null> = {
      left: null,
      right: null,
      top: null,
      bottom: null,
    };

    const updateEdgeSnap = (edge: Edge, target: number, delta: number) => {
      const current = edgeSnaps[edge];
      if (!current || Math.abs(delta) < Math.abs(current.delta)) {
        edgeSnaps[edge] = { target, delta };
      }
    };

    const considerSnap = (
      target: number,
      current: number,
      axis: 'x' | 'y',
      line: AlignmentLine,
      resizeEdge?: Edge,
    ) => {
      const delta = target - current;
      if (Math.abs(delta) > SNAP_THRESHOLD) return;

      lines.push(line);

      if (!isResize) {
        if (axis === 'x') {
          if (snapDeltaX === null || Math.abs(delta) < Math.abs(snapDeltaX)) {
            snapDeltaX = delta;
          }
        } else {
          if (snapDeltaY === null || Math.abs(delta) < Math.abs(snapDeltaY)) {
            snapDeltaY = delta;
          }
        }
      } else if (resizeEdge) {
        updateEdgeSnap(resizeEdge, target, delta);
      }
    };

    const trackLeft = !isResize || handle?.includes('w');
    const trackRight = !isResize || handle?.includes('e');
    const trackTop = !isResize || handle?.includes('n');
    const trackBottom = !isResize || handle?.includes('s');
    const allowCenterX = !isResize;
    const allowCenterY = !isResize;

    elements.forEach((element) => {
      if (element.id === draggedId) return;

      const elRight = element.position.x + element.size.width;
      const elBottom = element.position.y + element.size.height;
      const elCenterX = element.position.x + element.size.width / 2;
      const elCenterY = element.position.y + element.size.height / 2;

      if (trackLeft) {
        considerSnap(
          element.position.x,
          position.x,
          'x',
          { type: 'vertical', position: element.position.x },
          isResize && handle?.includes('w') ? 'left' : undefined,
        );
      }

      if (trackRight) {
        considerSnap(
          elRight,
          draggedRight,
          'x',
          { type: 'vertical', position: elRight },
          isResize && handle?.includes('e') ? 'right' : undefined,
        );
      }

      if (allowCenterX) {
        considerSnap(elCenterX, draggedCenterX, 'x', { type: 'vertical', position: elCenterX });
      }

      if (trackTop) {
        considerSnap(
          element.position.y,
          position.y,
          'y',
          { type: 'horizontal', position: element.position.y },
          isResize && handle?.includes('n') ? 'top' : undefined,
        );
      }

      if (trackBottom) {
        considerSnap(
          elBottom,
          draggedBottom,
          'y',
          { type: 'horizontal', position: elBottom },
          isResize && handle?.includes('s') ? 'bottom' : undefined,
        );
      }

      if (allowCenterY) {
        considerSnap(elCenterY, draggedCenterY, 'y', { type: 'horizontal', position: elCenterY });
      }
    });

    setAlignmentLines(lines);

    if (isResize) {
      let nextX = position.x;
      let nextY = position.y;
      let nextWidth = size.width;
      let nextHeight = size.height;

      const rightEdge = position.x + size.width;
      const bottomEdge = position.y + size.height;

      if (handle?.includes('w') && edgeSnaps.left) {
        nextX = edgeSnaps.left.target;
        nextWidth = Math.max(MIN_SIZE, rightEdge - nextX);
      }

      if (handle?.includes('e') && edgeSnaps.right) {
        const newRight = edgeSnaps.right.target;
        nextWidth = Math.max(MIN_SIZE, newRight - nextX);
      }

      if (handle?.includes('n') && edgeSnaps.top) {
        nextY = edgeSnaps.top.target;
        nextHeight = Math.max(MIN_SIZE, bottomEdge - nextY);
      }

      if (handle?.includes('s') && edgeSnaps.bottom) {
        const newBottom = edgeSnaps.bottom.target;
        nextHeight = Math.max(MIN_SIZE, newBottom - nextY);
      }

      const posChanged = nextX !== position.x || nextY !== position.y;
      const sizeChanged = nextWidth !== size.width || nextHeight !== size.height;

      return {
        snappedPosition: posChanged ? { x: nextX, y: nextY } : null,
        snappedSize: sizeChanged ? { width: nextWidth, height: nextHeight } : undefined,
      };
    }

    if (snapDeltaX === null && snapDeltaY === null) {
      return { snappedPosition: null };
    }

    return {
      snappedPosition: {
        x: position.x + (snapDeltaX ?? 0),
        y: position.y + (snapDeltaY ?? 0),
      },
    };
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
      const clamped = clampPointToFrame(coords);
      setSelectedElementId(null);
      setIsSelecting(true);
      setSelectionBox({ start: clamped, end: clamped });
      return;
    }

    if (['rectangle', 'ellipse', 'text'].includes(currentTool)) {
      if (!isInsideFrame(coords)) return;
      drawStartRef.current = clampPointToFrame(coords);
    }
  }, [canvasOffset.x, canvasOffset.y, canvasScale, clampPointToFrame, currentTool, isInsideFrame, setSelectedElementId, setSelectionBox, setIsSelecting]);

  const handleCanvasMouseMove = useCallback((event: ReactMouseEvent) => {
    const coords = toCanvasSpace(event);

    if (isPanningRef.current && panStartRef.current) {
      const dx = event.clientX - panStartRef.current.pointerX;
      const dy = event.clientY - panStartRef.current.pointerY;
      setCanvasOffset({ x: panStartRef.current.startX + dx, y: panStartRef.current.startY + dy });
      return;
    }

    if (selectionBox) {
      setSelectionBox({ ...selectionBox, end: clampPointToFrame(coords) });
      return;
    }
  }, [clampPointToFrame, selectionBox, setCanvasOffset, setSelectionBox]);

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
      const clampedEnd = clampPointToFrame(coords);
      const width = Math.abs(clampedEnd.x - start.x);
      const height = Math.abs(clampedEnd.y - start.y);

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
          x: Math.min(start.x, clampedEnd.x),
          y: Math.min(start.y, clampedEnd.y),
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
  }, [addElement, clampPointToFrame, currentTool, elements, selectionBox, setIsSelecting, setSelectedElementIds, setSelectionBox]);

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

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const originX = (pointerX - canvasOffset.x) / canvasScale;
    const originY = (pointerY - canvasOffset.y) / canvasScale;

    const factor = event.deltaY < 0 ? 1.05 : 0.95;
    const nextScale = Math.min(4, Math.max(0.25, canvasScale * factor));

    setCanvasScale(nextScale);
    setCanvasOffset({
      x: pointerX - originX * nextScale,
      y: pointerY - originY * nextScale,
    });
  }, [canvasOffset.x, canvasOffset.y, canvasScale, setCanvasOffset, setCanvasScale]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
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
          width: stageWidth,
          height: stageHeight,
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: frameSize.width,
            height: frameSize.height,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: '#050506',
              borderRadius: 32,
              border: '1px solid #2f2f2f',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
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
          </div>
        </div>

        <AlignmentGuides lines={alignmentLines} canvasWidth={stageWidth} canvasHeight={stageHeight} />

        {selectionBox && <SelectionBox start={selectionBox.start} end={selectionBox.end} />}
      </div>
    </div>
  );
}
