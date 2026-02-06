import { useCallback, useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type { KeyElement, Position, Component } from '../../types';
import { useEditorStore } from '../../store';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type AlignmentResult = {
  snappedPosition: Position | null;
  snappedSize?: { width: number; height: number } | null;
};

interface ComponentInstanceElementProps {
  element: KeyElement;
  component: Component;
  isSelected: boolean;
  scale: number;
  onAlignmentCheck: (
    id: string,
    pos: Position,
    size: { width: number; height: number },
    options?: { mode?: 'move' | 'resize'; handle?: ResizeHandle }
  ) => AlignmentResult | void;
}

const MIN_SIZE = 16;

export function ComponentInstanceElement({
  element,
  component,
  isSelected,
  scale,
  onAlignmentCheck,
}: ComponentInstanceElementProps) {
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
    enterComponentEditMode,
  } = useEditorStore();

  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
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

  // Handle pointer down for dragging
  const handlePointerDown = useCallback((event: ReactMouseEvent) => {
    if (currentTool !== 'select') return;
    if (element.locked) return;
    event.stopPropagation();

    const multiSelect = event.shiftKey || event.metaKey || event.ctrlKey;

    if (multiSelect) {
      if (selectedElementIds.includes(element.id)) {
        setSelectedElementIds(selectedElementIds.filter((id) => id !== element.id));
      } else {
        setSelectedElementIds([...selectedElementIds, element.id]);
      }
    } else if (!selectedElementIds.includes(element.id)) {
      setSelectedElementId(element.id);
    }

    pushHistory();
    setIsDragging(true);

    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: element.position.x,
      startY: element.position.y,
    };

    const handleMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (moveEvent.clientX - dragStartRef.current.pointerX) / scale;
      const dy = (moveEvent.clientY - dragStartRef.current.pointerY) / scale;

      const newPos = {
        x: Math.round(dragStartRef.current.startX + dx),
        y: Math.round(dragStartRef.current.startY + dy),
      };

      const result = onAlignmentCheck(element.id, newPos, element.size);
      const finalPos = result?.snappedPosition || newPos;
      updateElementPosition(element.id, finalPos);
    };

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [currentTool, element, onAlignmentCheck, scale, selectedElementIds, setIsDragging, setSelectedElementId, setSelectedElementIds, updateElementPosition, pushHistory]);

  // Handle double click to enter edit mode
  const handleDoubleClick = useCallback((event: ReactMouseEvent) => {
    event.stopPropagation();
    enterComponentEditMode(element.id);
  }, [element.id, enterComponentEditMode]);

  // Handle resize
  const handleResizeStart = useCallback((event: ReactMouseEvent, handle: ResizeHandle) => {
    if (element.locked) return;
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

      if (handleDir.includes('e')) nextWidth = resizeStartRef.current.startWidth + deltaX;
      if (handleDir.includes('w')) {
        nextWidth = resizeStartRef.current.startWidth - deltaX;
        nextX = resizeStartRef.current.startX + (resizeStartRef.current.startWidth - nextWidth);
      }
      if (handleDir.includes('s')) nextHeight = resizeStartRef.current.startHeight + deltaY;
      if (handleDir.includes('n')) {
        nextHeight = resizeStartRef.current.startHeight - deltaY;
        nextY = resizeStartRef.current.startY + (resizeStartRef.current.startHeight - nextHeight);
      }

      nextWidth = Math.max(MIN_SIZE, nextWidth);
      nextHeight = Math.max(MIN_SIZE, nextHeight);

      updateElementSize(element.id, { width: Math.round(nextWidth), height: Math.round(nextHeight) });
      updateElementPosition(element.id, { x: Math.round(nextX), y: Math.round(nextY) });
    };

    const handleUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [element, pushHistory, scale, setIsResizing, updateElementPosition, updateElementSize]);

  // Render resize handles
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
        border: '1px solid #7c3aed',
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
          onMouseDown={(e) => handleResizeStart(e, handle)}
        />
      );
    });
  };

  // Calculate scale for master elements
  const masterElements = component.masterElements || [];
  let masterWidth = 0, masterHeight = 0;
  masterElements.forEach(el => {
    masterWidth = Math.max(masterWidth, el.position.x + el.size.width);
    masterHeight = Math.max(masterHeight, el.position.y + el.size.height);
  });

  const scaleX = masterWidth > 0 ? element.size.width / masterWidth : 1;
  const scaleY = masterHeight > 0 ? element.size.height / masterHeight : 1;

  return (
    <div
      onMouseDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        boxShadow: isSelected ? '0 0 0 2px #7c3aed' : 'none',
        borderRadius: 4,
        cursor: currentTool === 'select' ? 'move' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Component instance indicator */}
      <div style={{
        position: 'absolute',
        top: -20,
        left: 0,
        fontSize: 10,
        color: '#7c3aed',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}>
        <span>◇</span>
        <span>{component.name}</span>
      </div>

      {/* Render master elements scaled */}
      <div style={{
        width: masterWidth || element.size.width,
        height: masterHeight || element.size.height,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: 'top left',
      }}>
        {masterElements.map(masterEl => {
          const overrides = element.styleOverrides?.[masterEl.id] || {};
          const style = { ...masterEl.style, ...overrides };
          
          return (
            <div
              key={masterEl.id}
              style={{
                position: 'absolute',
                left: masterEl.position.x,
                top: masterEl.position.y,
                width: masterEl.size.width,
                height: masterEl.size.height,
                background: style?.fill || '#3b82f6',
                opacity: style?.fillOpacity ?? 1,
                borderRadius: masterEl.shapeType === 'ellipse' ? '50%' : (style?.borderRadius || 8),
                border: style?.strokeWidth && style?.stroke 
                  ? `${style.strokeWidth}px solid ${style.stroke}` 
                  : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: style?.textColor || '#fff',
                fontSize: style?.fontSize || 14,
                fontWeight: style?.fontWeight || 'normal',
              }}
            >
              {masterEl.shapeType === 'text' && masterEl.text}
            </div>
          );
        })}
      </div>

      {renderHandles()}
    </div>
  );
}
