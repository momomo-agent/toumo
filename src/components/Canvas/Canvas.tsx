import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, DragEvent as ReactDragEvent } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement, Position, Size, ToolType } from '../../types';
import { DEFAULT_STYLE } from '../../types';
import { CanvasElement, type ResizeHandle } from './CanvasElement';
import { PenTool } from './PenTool';
import { SelectionBox } from './SelectionBox';
import { AlignmentGuides, type AlignmentLine } from './AlignmentGuides';

const CANVAS_SIZE = 2400;
const SNAP_THRESHOLD = 6;
const MIN_SIZE = 16;
const FRAME_GAP = 200;
const FRAME_MARGIN = 100;

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
    setSelectedKeyframeId,
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
    canvasBackground,
    snapToGrid,
    gridSize,
    instantiateComponent,
    editingGroupId,
    enterGroupEditMode,
    exitGroupEditMode,
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

  const frameLayouts = useMemo(() => {
    return keyframes.map((kf, index) => ({
      id: kf.id,
      x: index * (frameSize.width + FRAME_GAP) + FRAME_MARGIN,
      y: FRAME_MARGIN,
      width: frameSize.width,
      height: frameSize.height,
    }));
  }, [frameSize.height, frameSize.width, keyframes]);

  const frameLayoutMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; width: number; height: number }>();
    frameLayouts.forEach((layout) => map.set(layout.id, layout));
    return map;
  }, [frameLayouts]);

  const clampPointToFrame = useCallback((point: Position) => ({
    x: Math.max(0, Math.min(point.x, frameSize.width)),
    y: Math.max(0, Math.min(point.y, frameSize.height)),
  }), [frameSize.height, frameSize.width]);

  const isInsideFrame = useCallback((point: Position) => {
    return point.x >= 0 && point.x <= frameSize.width && point.y >= 0 && point.y <= frameSize.height;
  }, [frameSize.height, frameSize.width]);

  const getFrameUnderPoint = useCallback((point: Position) => {
    return frameLayouts.find(
      (layout) =>
        point.x >= layout.x &&
        point.x <= layout.x + layout.width &&
        point.y >= layout.y &&
        point.y <= layout.y + layout.height,
    );
  }, [frameLayouts]);

  const activeFrameLayout = selectedKeyframeId ? frameLayoutMap.get(selectedKeyframeId) : undefined;

  const stageWidth = frameLayouts.length
    ? frameLayouts[frameLayouts.length - 1].x + frameSize.width + FRAME_MARGIN
    : Math.max(CANVAS_SIZE, frameSize.width + FRAME_MARGIN * 2);
  const stageHeight = frameSize.height + FRAME_MARGIN * 2 + 80;

  const toCanvasSpace = (event: ReactMouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const toCanvasSpaceFromDrag = (event: ReactDragEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (event.clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const translateToFrameSpace = (point: Position, layout?: { x: number; y: number }) => {
    if (!layout) return point;
    return {
      x: point.x - layout.x,
      y: point.y - layout.y,
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
    const stagePoint = toCanvasSpace(event);
    const hitFrame = getFrameUnderPoint(stagePoint);

    if (hitFrame && hitFrame.id !== selectedKeyframeId) {
      setSelectedKeyframeId(hitFrame.id);
      setSelectedElementId(null);
    }

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

    const activeLayout = hitFrame && hitFrame.id === selectedKeyframeId ? hitFrame : activeFrameLayout;
    if (!activeLayout) return;

    const framePoint = translateToFrameSpace(stagePoint, activeLayout);

    if (currentTool === 'select') {
      // 点击空白处时退出编组编辑模式
      if (editingGroupId) {
        exitGroupEditMode();
      }
      setSelectedElementId(null);
      setIsSelecting(true);
      setSelectionBox({ start: clampPointToFrame(framePoint), end: clampPointToFrame(framePoint) });
      return;
    }

    if (['rectangle', 'ellipse', 'text', 'line', 'frame'].includes(currentTool)) {
      if (!isInsideFrame(framePoint)) return;
      drawStartRef.current = clampPointToFrame(framePoint);
    }
  }, [activeFrameLayout, canvasOffset.x, canvasOffset.y, canvasScale, clampPointToFrame, currentTool, getFrameUnderPoint, isInsideFrame, selectedKeyframeId, setSelectedElementId, setSelectedKeyframeId, setSelectionBox, setIsSelecting]);

  const handleCanvasMouseMove = useCallback((event: ReactMouseEvent) => {
    const stagePoint = toCanvasSpace(event);

    if (isPanningRef.current && panStartRef.current) {
      const dx = event.clientX - panStartRef.current.pointerX;
      const dy = event.clientY - panStartRef.current.pointerY;
      setCanvasOffset({ x: panStartRef.current.startX + dx, y: panStartRef.current.startY + dy });
      return;
    }

    if (selectionBox && activeFrameLayout) {
      const framePoint = translateToFrameSpace(stagePoint, activeFrameLayout);
      setSelectionBox({ ...selectionBox, end: clampPointToFrame(framePoint) });
      return;
    }
  }, [activeFrameLayout, clampPointToFrame, selectionBox, setCanvasOffset, setSelectionBox]);

  const handleCanvasMouseUp = useCallback((event: ReactMouseEvent) => {
    const stagePoint = toCanvasSpace(event);

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      return;
    }

    if (!activeFrameLayout) return;
    const framePoint = translateToFrameSpace(stagePoint, activeFrameLayout);

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

    if (drawStartRef.current && ['rectangle', 'ellipse', 'text', 'line', 'frame'].includes(currentTool)) {
      const start = drawStartRef.current;
      const clampedEnd = clampPointToFrame(framePoint);
      const width = Math.abs(clampedEnd.x - start.x);
      const height = Math.abs(clampedEnd.y - start.y);

      if (width < 5 && height < 5) {
        drawStartRef.current = null;
        return;
      }

      const baseStyle = { ...DEFAULT_STYLE };
      const shapeType = currentTool as KeyElement['shapeType'];
      
      const getElementName = () => {
        if (shapeType === 'ellipse') return 'Ellipse';
        if (shapeType === 'text') return 'Text';
        if (shapeType === 'line') return 'Line';
        if (shapeType === 'frame') return 'Frame';
        if (shapeType === 'path') return 'Path';
        return 'Rectangle';
      };
      
      const newElement: KeyElement = {
        id: `el-${Date.now()}`,
        name: getElementName(),
        category: 'content',
        isKeyElement: true,
        attributes: [],
        position: {
          x: Math.min(start.x, clampedEnd.x),
          y: Math.min(start.y, clampedEnd.y),
        },
        size: {
          width: Math.max(width, shapeType === 'text' ? 140 : shapeType === 'line' ? 2 : 48),
          height: Math.max(height, shapeType === 'text' ? 40 : shapeType === 'line' ? 2 : shapeType === 'frame' ? 100 : 48),
        },
        shapeType,
        style: {
          ...baseStyle,
          borderRadius: shapeType === 'ellipse' ? Math.max(width, height) : shapeType === 'line' ? 0 : baseStyle.borderRadius,
          fontSize: shapeType === 'text' ? 18 : baseStyle.fontSize,
          // Line specific
          ...(shapeType === 'line' ? {
            fill: '#ffffff',
            stroke: '#ffffff',
            strokeWidth: 2,
          } : {}),
          // Frame specific - transparent container
          ...(shapeType === 'frame' ? {
            fill: '#1a1a1a',
            fillOpacity: 1,
            stroke: '#333',
            strokeWidth: 1,
          } : {}),
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
  }, [activeFrameLayout, addElement, clampPointToFrame, currentTool, elements, selectionBox, setIsSelecting, setSelectedElementIds, setSelectionBox]);

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

  const handleWheel = useCallback((event: WheelEvent) => {
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

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Handle component drag over
  const handleDragOver = useCallback((event: ReactDragEvent) => {
    if (event.dataTransfer.types.includes('application/toumo-component')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  // Handle component drop
  const handleDrop = useCallback((event: ReactDragEvent) => {
    const componentId = event.dataTransfer.getData('application/toumo-component');
    if (!componentId) return;
    
    event.preventDefault();
    
    const stagePoint = toCanvasSpaceFromDrag(event);
    const hitFrame = getFrameUnderPoint(stagePoint);
    
    if (hitFrame) {
      if (hitFrame.id !== selectedKeyframeId) {
        setSelectedKeyframeId(hitFrame.id);
      }
      
      const framePoint = translateToFrameSpace(stagePoint, hitFrame);
      instantiateComponent(componentId, {
        x: Math.max(0, framePoint.x - 50),
        y: Math.max(0, framePoint.y - 50),
      });
    }
  }, [getFrameUnderPoint, instantiateComponent, selectedKeyframeId, setSelectedKeyframeId]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
        {frameLayouts.map((layout, index) => {
          const keyframe = keyframes[index];
          if (!keyframe) return null;
          const isActive = keyframe.id === selectedKeyframeId;
          const frameElements = keyframe.keyElements || [];
          return (
            <div key={keyframe.id} style={{ position: 'absolute', left: layout.x, top: layout.y - 60, width: layout.width }}>
              <button
                onClick={() => setSelectedKeyframeId(keyframe.id)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 12px',
                  marginBottom: 12,
                  textAlign: 'left',
                  background: isActive ? '#2563eb30' : '#141416',
                  color: '#fff',
                  borderColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{keyframe.name}</div>
                  <div style={{ fontSize: 11, color: '#7d7d7d' }}>{keyframe.summary ?? 'State description'}</div>
                </div>
                {isActive && <span style={{ fontSize: 11, color: '#8ab4ff' }}>Editing</span>}
              </button>
              <div
                data-frame-id={keyframe.id}
                style={{
                  width: layout.width,
                  height: layout.height,
                  position: 'relative',
                  background: snapToGrid 
                    ? `${canvasBackground} repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 1}px, #333 ${gridSize - 1}px, #333 ${gridSize}px), repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 1}px, #333 ${gridSize - 1}px, #333 ${gridSize}px)`
                    : canvasBackground,
                  borderRadius: 32,
                  border: '1px solid #2f2f2f',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                  overflow: 'hidden',
                  cursor: isActive ? 'default' : 'pointer',
                }}
              >
                {isActive
                  ? (() => {
                      // 分离顶层元素和子元素
                      const topLevelElements = frameElements.filter(el => !el.parentId);
                      const getChildren = (parentId: string) => 
                        frameElements.filter(el => el.parentId === parentId);
                      
                      return topLevelElements.map((element) => {
                        const children = getChildren(element.id);
                        const isGroupElement = children.length > 0;
                        const isEditingThisGroup = editingGroupId === element.id;
                        
                        if (isGroupElement) {
                          // 渲染编组
                          return (
                            <div
                              key={element.id}
                              style={{
                                position: 'absolute',
                                left: element.position.x,
                                top: element.position.y,
                                width: element.size.width,
                                height: element.size.height,
                                pointerEvents: 'auto',
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                enterGroupEditMode(element.id);
                              }}
                            >
                              {/* 编组边框 */}
                              {selectedElementIds.includes(element.id) && !isEditingThisGroup && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: -1,
                                    border: '2px solid #3b82f6',
                                    borderRadius: 4,
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}
                              {/* 编辑模式边框 */}
                              {isEditingThisGroup && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: -1,
                                    border: '2px dashed #3b82f6',
                                    borderRadius: 4,
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}
                              {/* 编组选择层 */}
                              {!isEditingThisGroup && (
                                <CanvasElement
                                  key={`group-${element.id}`}
                                  element={element}
                                  allElements={frameElements}
                                  scale={canvasScale}
                                  isSelected={selectedElementIds.includes(element.id)}
                                  onAlignmentCheck={checkAlignment}
                                  isGroup={true}
                                />
                              )}
                              {/* 子元素 */}
                              {children.map((child) => (
                                <CanvasElement
                                  key={child.id}
                                  element={child}
                                  allElements={frameElements}
                                  scale={canvasScale}
                                  isSelected={isEditingThisGroup && selectedElementIds.includes(child.id)}
                                  onAlignmentCheck={checkAlignment}
                                  parentOffset={{ x: element.position.x, y: element.position.y }}
                                  isInEditingGroup={isEditingThisGroup}
                                />
                              ))}
                            </div>
                          );
                        }
                        
                        // 普通元素
                        return (
                          <CanvasElement
                            key={element.id}
                            element={element}
                            allElements={frameElements}
                            scale={canvasScale}
                            isSelected={selectedElementIds.includes(element.id)}
                            onAlignmentCheck={checkAlignment}
                          />
                        );
                      });
                    })()
                  : frameElements.map((element) => (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: element.position.x,
                          top: element.position.y,
                          width: element.size.width,
                          height: element.size.height,
                          background: element.style?.fill || '#3b82f6',
                          borderRadius: element.shapeType === 'ellipse' ? '50%' : element.style?.borderRadius || 8,
                          opacity: 0.7,
                        }}
                      />
                    ))}
              </div>
            </div>
          );
        })}

        {activeFrameLayout && (
          <div style={{ position: 'absolute', left: activeFrameLayout.x, top: activeFrameLayout.y }}>
            <AlignmentGuides lines={alignmentLines} canvasWidth={frameSize.width} canvasHeight={frameSize.height} />
            {selectionBox && <SelectionBox start={selectionBox.start} end={selectionBox.end} />}
          </div>
        )}
        
        {/* Pen Tool */}
        <PenTool
          isActive={currentTool === 'pen'}
          canvasOffset={canvasOffset}
          canvasScale={canvasScale}
          frameLayout={activeFrameLayout || null}
        />
      </div>
    </div>
  );
}
