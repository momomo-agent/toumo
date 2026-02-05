import { useCallback, useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type { KeyElement, Position } from '../../types';
import { useEditorStore } from '../../store';

const MIN_SIZE = 16;

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CanvasElementProps {
  element: KeyElement;
  isSelected: boolean;
  scale: number;
  allElements: KeyElement[];
  onAlignmentCheck: (id: string, pos: Position, size: { width: number; height: number }) => { snappedPosition: Position | null } | void;
}

export function CanvasElement({
  element,
  isSelected,
  scale,
  allElements,
  onAlignmentCheck,
}: CanvasElementProps) {
  const {
    currentTool,
    selectedElementIds,
    setSelectedElementId,
    setSelectedElementIds,
    updateElementPosition,
    updateElementSize,
    setIsDragging,
    setIsResizing,
    pushHistory,
  } = useEditorStore();

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    elements: { id: string; startX: number; startY: number; size: { width: number; height: number } }[];
  } | null>(null);

  const resizeStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
    handle: ResizeHandle;
  } | null>(null);

  const handlePointerDown = useCallback((event: ReactMouseEvent) => {
    if (currentTool !== 'select') return;
    event.stopPropagation();

    const multiSelect = event.shiftKey || event.metaKey || event.ctrlKey;
    let activeIds = selectedElementIds;

    if (multiSelect) {
      if (selectedElementIds.includes(element.id)) {
        activeIds = selectedElementIds.filter((id) => id !== element.id);
      } else {
        activeIds = [...selectedElementIds, element.id];
      }
      setSelectedElementIds(activeIds);
    } else if (!selectedElementIds.includes(element.id)) {
      setSelectedElementId(element.id);
      activeIds = [element.id];
    } else if (activeIds.length === 0) {
      activeIds = [element.id];
      setSelectedElementIds(activeIds);
    }

    pushHistory();
    setIsDragging(true);

    const dragElements = (activeIds.length ? activeIds : [element.id])
      .map((id) => allElements.find((el) => el.id === id))
      .filter((el): el is KeyElement => Boolean(el))
      .map((el) => ({
        id: el.id,
        startX: el.position.x,
        startY: el.position.y,
        size: el.size,
      }));

    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      elements: dragElements,
    };

    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (moveEvent.clientX - dragStartRef.current.pointerX) / scale;
      const dy = (moveEvent.clientY - dragStartRef.current.pointerY) / scale;

      dragStartRef.current.elements.forEach((elState) => {
        const newPos = {
          x: Math.round(elState.startX + dx),
          y: Math.round(elState.startY + dy),
        };
        updateElementPosition(elState.id, newPos);

        if (elState.id === element.id) {
          onAlignmentCheck(elState.id, newPos, elState.size);
        }
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [allElements, currentTool, element.id, onAlignmentCheck, scale, selectedElementIds, setIsDragging, setSelectedElementId, setSelectedElementIds, updateElementPosition, pushHistory]);

  const handleResizeStart = useCallback((event: ReactMouseEvent, handle: ResizeHandle) => {
    event.stopPropagation();
    event.preventDefault();

    pushHistory();
    setIsResizing(true);
    resizeStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startWidth: element.size.width,
      startHeight: element.size.height,
      startX: element.position.x,
      startY: element.position.y,
      handle,
    };

    const handleMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const deltaX = (moveEvent.clientX - resizeStartRef.current.pointerX) / scale;
      const deltaY = (moveEvent.clientY - resizeStartRef.current.pointerY) / scale;

      let nextWidth = resizeStartRef.current.startWidth;
      let nextHeight = resizeStartRef.current.startHeight;
      let nextX = resizeStartRef.current.startX;
      let nextY = resizeStartRef.current.startY;

      const handleDir = resizeStartRef.current.handle;

      if (handleDir.includes('e')) {
        nextWidth = Math.max(MIN_SIZE, resizeStartRef.current.startWidth + deltaX);
      }
      if (handleDir.includes('w')) {
        nextWidth = Math.max(MIN_SIZE, resizeStartRef.current.startWidth - deltaX);
        nextX = resizeStartRef.current.startX + (resizeStartRef.current.startWidth - nextWidth);
      }
      if (handleDir.includes('s')) {
        nextHeight = Math.max(MIN_SIZE, resizeStartRef.current.startHeight + deltaY);
      }
      if (handleDir.includes('n')) {
        nextHeight = Math.max(MIN_SIZE, resizeStartRef.current.startHeight - deltaY);
        nextY = resizeStartRef.current.startY + (resizeStartRef.current.startHeight - nextHeight);
      }

      updateElementSize(element.id, {
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      });
      updateElementPosition(element.id, {
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
      onAlignmentCheck(element.id, { x: Math.round(nextX), y: Math.round(nextY) }, { width: Math.round(nextWidth), height: Math.round(nextHeight) });
    };

    const handleUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [element.id, element.position.x, element.position.y, element.size.height, element.size.width, onAlignmentCheck, scale, setIsResizing, updateElementPosition, updateElementSize, pushHistory]);

  const renderHandles = () => {
    if (!isSelected || currentTool !== 'select') return null;
    const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

    return handles.map((handle) => {
      const size = 8;
      const offset = -size / 2;
      const baseStyle: CSSProperties = {
        position: 'absolute',
        width: size,
        height: size,
        background: '#fff',
        border: '1px solid #3b82f6',
        borderRadius: 2,
        cursor: `${handle}-resize`,
      };

      const styleMap: Record<ResizeHandle, CSSProperties> = {
        nw: { top: offset, left: offset },
        n: { top: offset, left: '50%', marginLeft: offset },
        ne: { top: offset, right: offset },
        e: { top: '50%', right: offset, marginTop: offset },
        se: { bottom: offset, right: offset },
        s: { bottom: offset, left: '50%', marginLeft: offset },
        sw: { bottom: offset, left: offset },
        w: { top: '50%', left: offset, marginTop: offset },
      };

      return (
        <div
          key={handle}
          style={{ ...baseStyle, ...styleMap[handle] }}
          onMouseDown={(event) => handleResizeStart(event, handle)}
        />
      );
    });
  };

  const isText = element.shapeType === 'text';

  return (
    <div
      onMouseDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        background: isText ? 'transparent' : element.style?.fill || '#3b82f6',
        borderRadius: element.shapeType === 'ellipse' ? '50%' : element.style?.borderRadius || 8,
        border: isText ? '1px dashed rgba(255,255,255,0.4)' : undefined,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isText ? (element.style?.textAlign || 'center') : 'center',
        fontSize: element.style?.fontSize || 14,
        overflow: 'hidden',
        cursor: currentTool === 'select' ? 'move' : 'default',
        boxShadow: isSelected ? '0 0 0 2px #3b82f6' : 'none',
        userSelect: 'none',
      }}
    >
      {isText ? (
        <span style={{ padding: '0 8px', width: '100%', textAlign: element.style?.textAlign || 'center' }}>
          {element.text ?? 'Text'}
        </span>
      ) : null}
      {renderHandles()}
    </div>
  );
}
