import { useCallback, useRef, useState } from 'react';
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
    updateElement,
    deleteElement,
    copySelectedElements,
    pasteElements,
  } = useEditorStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(element.text || '');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Don't render hidden elements
  if (element.visible === false) return null;

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
    if (element.locked) return; // Don't allow dragging locked elements
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
  const isLine = element.shapeType === 'line';
  // Frame renders like rectangle but with different default styles

  const getBackground = () => {
    if (isText) return 'transparent';
    if (isImage) return 'transparent';
    if (isLine) return 'transparent';
    
    const style = element.style;
    // Check for gradient
    if (style?.gradientType && style.gradientType !== 'none' && style.gradientStops?.length) {
      const stops = style.gradientStops
        .map(s => `${s.color} ${s.position}%`)
        .join(', ');
      if (style.gradientType === 'linear') {
        const angle = style.gradientAngle ?? 180;
        return `linear-gradient(${angle}deg, ${stops})`;
      }
      if (style.gradientType === 'radial') {
        return `radial-gradient(circle, ${stops})`;
      }
    }
    
    return style?.fill || '#3b82f6';
  };

  const getBorderRadius = () => {
    if (element.shapeType === 'ellipse') return '50%';
    const style = element.style;
    // Check if individual corners are set
    if (style?.borderRadiusTL !== undefined || style?.borderRadiusTR !== undefined ||
        style?.borderRadiusBR !== undefined || style?.borderRadiusBL !== undefined) {
      const tl = style.borderRadiusTL ?? style.borderRadius ?? 0;
      const tr = style.borderRadiusTR ?? style.borderRadius ?? 0;
      const br = style.borderRadiusBR ?? style.borderRadius ?? 0;
      const bl = style.borderRadiusBL ?? style.borderRadius ?? 0;
      return `${tl}px ${tr}px ${br}px ${bl}px`;
    }
    return style?.borderRadius ?? 8;
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
    
    // Inner shadow
    if (element.style?.innerShadowEnabled && element.style.innerShadowColor) {
      const x = element.style.innerShadowX || 0;
      const y = element.style.innerShadowY || 0;
      const blur = element.style.innerShadowBlur || 4;
      shadows.push(`inset ${x}px ${y}px ${blur}px ${element.style.innerShadowColor}`);
    }
    
    // Selection outline
    if (isSelected) {
      shadows.push('0 0 0 2px #3b82f6');
    }
    
    return shadows.length > 0 ? shadows.join(', ') : 'none';
  };

  const getStroke = () => {
    if (isText) return '1px dashed rgba(255,255,255,0.4)';
    if (element.style?.strokeWidth && element.style.stroke) {
      const style = element.style.strokeStyle || 'solid';
      return `${element.style.strokeWidth}px ${style} ${element.style.stroke}`;
    }
    return undefined;
  };

  return (
    <div
      onMouseDown={handlePointerDown}
      onContextMenu={(e) => {
        e.preventDefault();
        setSelectedElementId(element.id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        background: getBackground(),
        opacity: element.style?.fillOpacity ?? 1,
        borderRadius: getBorderRadius(),
        border: getStroke(),
        transform: [
          element.style?.rotation ? `rotate(${element.style.rotation}deg)` : '',
          element.style?.flipX ? 'scaleX(-1)' : '',
          element.style?.flipY ? 'scaleY(-1)' : '',
          element.style?.scale && element.style.scale !== 1 ? `scale(${element.style.scale})` : '',
          element.style?.skewX ? `skewX(${element.style.skewX}deg)` : '',
          element.style?.skewY ? `skewY(${element.style.skewY}deg)` : '',
        ].filter(Boolean).join(' ') || undefined,
        transformOrigin: element.style?.transformOrigin || 'center',
        perspective: element.style?.perspective || undefined,
        boxSizing: element.style?.boxSizing || 'border-box',
        outline: element.style?.outline || undefined,
        backdropFilter: element.style?.backdropFilter || (element.style?.backdropBlur ? `blur(${element.style.backdropBlur}px)` : undefined),
        transition: element.style?.transition || undefined,
        clipPath: element.style?.clipPath || undefined,
        maskImage: element.style?.maskImage || undefined,
        textShadow: element.style?.textShadow || undefined,
        wordBreak: element.style?.wordBreak || 'normal',
        textOverflow: element.style?.textOverflow || 'clip',
        hyphens: element.style?.hyphens || 'none',
        writingMode: element.style?.writingMode || 'horizontal-tb',
        textIndent: element.style?.textIndent || 0,
        columnCount: element.style?.columnCount || 1,
        columnGap: element.style?.columnGap || 16,
        listStyle: element.style?.listStyle || 'none',
        mixBlendMode: element.style?.blendMode as React.CSSProperties['mixBlendMode'],
        color: element.style?.textColor || '#fff',
        display: 'flex',
        alignItems: element.style?.verticalAlign === 'top' ? 'flex-start' : element.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
        justifyContent: isText ? (element.style?.textAlign || 'center') : 'center',
        fontSize: element.style?.fontSize || 14,
        fontWeight: element.style?.fontWeight || 'normal',
        fontStyle: element.style?.fontStyle || 'normal',
        textDecoration: element.style?.textDecoration || 'none',
        fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
        whiteSpace: element.style?.whiteSpace || 'normal',
        overflow: element.style?.overflow || 'visible',
        textTransform: element.style?.textTransform as React.CSSProperties['textTransform'],
        letterSpacing: element.style?.letterSpacing ?? 0,
        lineHeight: element.style?.lineHeight ?? 1.4,
        cursor: currentTool === 'select' ? 'move' : 'default',
        boxShadow: getBoxShadow(),
        filter: [
          element.style?.blur ? `blur(${element.style.blur}px)` : '',
          element.style?.brightness ? `brightness(${element.style.brightness})` : '',
          element.style?.contrast ? `contrast(${element.style.contrast})` : '',
          element.style?.saturate ? `saturate(${element.style.saturate})` : '',
          element.style?.hueRotate ? `hue-rotate(${element.style.hueRotate}deg)` : '',
          element.style?.invert ? `invert(${element.style.invert})` : '',
          element.style?.grayscale ? `grayscale(${element.style.grayscale})` : '',
          element.style?.sepia ? `sepia(${element.style.sepia})` : '',
          element.style?.dropShadowX !== undefined ? `drop-shadow(${element.style.dropShadowX || 0}px ${element.style.dropShadowY || 0}px ${element.style.dropShadowBlur || 0}px ${element.style.dropShadowColor || '#000'})` : '',
        ].filter(Boolean).join(' ') || undefined,
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
            objectPosition: element.style.objectPosition || 'center',
            borderRadius: getBorderRadius(),
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}
      {isLine && (
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <defs>
            <marker id={`arrow-${element.id}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill={element.style?.stroke || '#ffffff'} />
            </marker>
          </defs>
          <line
            x1="0"
            y1="0"
            x2={element.size.width}
            y2={element.size.height}
            stroke={element.style?.stroke || '#ffffff'}
            strokeWidth={element.style?.strokeWidth || 2}
            strokeLinecap="round"
            markerEnd={element.style?.lineEndArrow ? `url(#arrow-${element.id})` : undefined}
          />
        </svg>
      )}
      {isText ? (
        isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => {
              updateElement(element.id, { text: editText });
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateElement(element.id, { text: editText });
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                setEditText(element.text || '');
                setIsEditing(false);
              }
            }}
            autoFocus
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: element.style?.fontSize || 14,
              textAlign: element.style?.textAlign || 'center',
              outline: 'none',
              padding: element.style?.padding ? `${element.style.padding}px` : '0 8px',
            }}
          />
        ) : (
          <span
            onDoubleClick={() => {
              setEditText(element.text || '');
              setIsEditing(true);
            }}
            style={{ padding: '0 8px', width: '100%', textAlign: element.style?.textAlign || 'center' }}
          >
            {element.text ?? 'Text'}
          </span>
        )
      ) : null}
      {renderHandles()}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 4,
            zIndex: 1000,
            minWidth: 120,
          }}
          onClick={() => setContextMenu(null)}
        >
          <button onClick={() => { copySelectedElements(); setContextMenu(null); }} style={menuItemStyle}>Copy</button>
          <button onClick={() => { pasteElements(); setContextMenu(null); }} style={menuItemStyle}>Paste</button>
          <div style={{ height: 1, background: '#333', margin: '4px 0' }} />
          <button onClick={() => { deleteElement(element.id); setContextMenu(null); }} style={{ ...menuItemStyle, color: '#f43f5e' }}>Delete</button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 12px',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: 12,
  textAlign: 'left',
  cursor: 'pointer',
};
