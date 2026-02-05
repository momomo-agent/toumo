import { useCallback, useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type { KeyElement, Position } from '../../types';
import { useEditorStore } from '../../store';

const MIN_SIZE = 16;

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type AlignmentResult = {
  snappedPosition: Position | null;
  snappedSize?: { width: number; height: number } | null;
};

interface CanvasElementProps {
  element: KeyElement;
  isSelected: boolean;
  scale: number;
  allElements: KeyElement[];
  onAlignmentCheck: (
    id: string,
    pos: Position,
    size: { width: number; height: number },
    options?: { mode?: 'move' | 'resize'; handle?: ResizeHandle }
  ) => AlignmentResult | void;
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

      const pendingPositions = dragStartRef.current.elements.map((elState) => ({
        id: elState.id,
        size: elState.size,
        position: {
          x: Math.round(elState.startX + dx),
          y: Math.round(elState.startY + dy),
        },
      }));

      let snapDx = 0;
      let snapDy = 0;

      const primary = pendingPositions.find((entry) => entry.id === element.id);
      if (primary) {
        const result = onAlignmentCheck(element.id, primary.position, primary.size);
        const snapped = result?.snappedPosition;
        if (snapped) {
          snapDx = snapped.x - primary.position.x;
          snapDy = snapped.y - primary.position.y;
          primary.position = snapped;
        }
      }

      pendingPositions.forEach((entry) => {
        if (entry.id !== element.id) {
          entry.position = {
            x: Math.round(entry.position.x + snapDx),
            y: Math.round(entry.position.y + snapDy),
          };
        }
        updateElementPosition(entry.id, entry.position);
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
        nextWidth = resizeStartRef.current.startWidth + deltaX;
      }
      if (handleDir.includes('w')) {
        nextWidth = resizeStartRef.current.startWidth - deltaX;
        nextX = resizeStartRef.current.startX + (resizeStartRef.current.startWidth - nextWidth);
      }
      if (handleDir.includes('s')) {
        nextHeight = resizeStartRef.current.startHeight + deltaY;
      }
      if (handleDir.includes('n')) {
        nextHeight = resizeStartRef.current.startHeight - deltaY;
        nextY = resizeStartRef.current.startY + (resizeStartRef.current.startHeight - nextHeight);
      }

      // Clamp before snapping so we don't pass sub-minimum sizes to the alignment logic
      nextWidth = Math.max(MIN_SIZE, nextWidth);
      nextHeight = Math.max(MIN_SIZE, nextHeight);

      const snapped = onAlignmentCheck(
        element.id,
        { x: Math.round(nextX), y: Math.round(nextY) },
        { width: Math.round(nextWidth), height: Math.round(nextHeight) },
        { mode: 'resize', handle: handleDir }
      );

      if (snapped?.snappedPosition) {
        nextX = snapped.snappedPosition.x;
        nextY = snapped.snappedPosition.y;
      }
      if (snapped?.snappedSize) {
        nextWidth = snapped.snappedSize.width;
        nextHeight = snapped.snappedSize.height;
      }

      nextWidth = Math.max(MIN_SIZE, nextWidth);
      nextHeight = Math.max(MIN_SIZE, nextHeight);

      updateElementSize(element.id, {
        width: Math.round(nextWidth),
        height: Math.round(nextHeight),
      });
      updateElementPosition(element.id, {
        x: Math.round(nextX),
        y: Math.round(nextY),
      });
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
  const isImage = element.shapeType === 'image';

  const getBackground = () => {
    if (isText) return 'transparent';
    if (isImage) return 'transparent';
    return element.style?.fill || '#3b82f6';
  };

  const getBorderRadius = () => {
    if (element.shapeType === 'ellipse') return '50%';
    return element.style?.borderRadius || 8;
  };

  const getBoxShadow = () => {
    const shadows: string[] = [];
    
    // Element shadow
    if (element.style?.shadowColor && element.style.shadowBlur) {
      const x = element.style.shadowOffsetX || 0;
      const y = element.style.shadowOffsetY || 0;
      const blur = element.style.shadowBlur || 0;
      const spread = element.style.shadowSpread || 0;
      shadows.push(`${x}px ${y}px ${blur}px ${spread}px ${element.style.shadowColor}`);
    }
    
    // Selection outline
    if (isSelected) {
      shadows.push('0 0 0 2px #3b82f6');
    }
    
    return shadows.length > 0 ? shadows.join(', ') : 'none';
  };

  return (
    <div
      onMouseDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        background: getBackground(),
        borderRadius: getBorderRadius(),
        border: isText ? '1px dashed rgba(255,255,255,0.4)' : undefined,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isText ? (element.style?.textAlign || 'center') : 'center',
        fontSize: element.style?.fontSize || 14,
        overflow: 'hidden',
        cursor: currentTool === 'select' ? 'move' : 'default',
        boxShadow: getBoxShadow(),
        userSelect: 'none',
      }}
    >
      {isImage && element.style?.imageSrc && (
        <img
          src={element.style.imageSrc}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: element.style.objectFit || 'cover',
            borderRadius: getBorderRadius(),
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}
      {isText ? (
        <span style={{ padding: '0 8px', width: '100%', textAlign: element.style?.textAlign || 'center' }}>
          {element.text ?? 'Text'}
        </span>
      ) : null}
      {renderHandles()}
    </div>
  );
}
