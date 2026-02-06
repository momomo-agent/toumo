import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import type { KeyElement, Position } from '../../types';
import { useEditorStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { ContextMenu } from '../ContextMenu';
import { RichTextEditor } from './RichTextEditor';

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
  // Group-related props
  isGroup?: boolean;
  groupOffset?: Position; // 编组的位置偏移，用于子元素位置转换
  isInEditingGroup?: boolean;
  onDoubleClick?: () => void;
}

export const CanvasElement = memo(function CanvasElement({
  element,
  isSelected,
  scale,
  allElements,
  onAlignmentCheck,
  isGroup = false,
  groupOffset,
  isInEditingGroup = false,
  onDoubleClick,
}: CanvasElementProps) {
  // Only subscribe to reactive state we actually need for rendering
  const { currentTool, selectedElementIds, hoveredElementId } = useEditorStore(useShallow((s) => ({
    currentTool: s.currentTool,
    selectedElementIds: s.selectedElementIds,
    hoveredElementId: s.hoveredElementId,
  })));

  // Actions are stable references — won't cause re-renders
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const setSelectedElementIds = useEditorStore((s) => s.setSelectedElementIds);
  const setHoveredElementId = useEditorStore((s) => s.setHoveredElementId);
  const updateElementPosition = useEditorStore((s) => s.updateElementPosition);
  const updateElementSize = useEditorStore((s) => s.updateElementSize);
  const setIsDragging = useEditorStore((s) => s.setIsDragging);
  const setIsResizing = useEditorStore((s) => s.setIsResizing);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const resizeGroup = useEditorStore((s) => s.resizeGroup);
  const updateElement = useEditorStore((s) => s.updateElement);

  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isNew, setIsNew] = useState(true);

  // Clear the pop-in animation class after it finishes
  useEffect(() => {
    if (!isNew) return;
    const timer = setTimeout(() => setIsNew(false), 300);
    return () => clearTimeout(timer);
  }, [isNew]);

  const isText = element.shapeType === 'text';

  // Enter key → start editing text; Escape → stop editing
  useEffect(() => {
    if (!isSelected || !isText) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping) return;

      if (e.key === 'Enter' && !isEditing) {
        e.preventDefault();
        setIsEditing(true);
      }
      if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isText, isEditing]);

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
    
    // 如果是编组内的子元素，但不在编辑模式，不响应点击
    if (element.parentId && !isInEditingGroup) {
      return;
    }
    
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
        // 如果是编组内的子元素，需要将绝对位置转换回相对位置
        let positionToStore = entry.position;
        if (groupOffset) {
          positionToStore = {
            x: entry.position.x - groupOffset.x,
            y: entry.position.y - groupOffset.y,
          };
        }
        updateElementPosition(entry.id, positionToStore);
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
  }, [allElements, currentTool, element.id, onAlignmentCheck, scale, selectedElementIds, setIsDragging, setSelectedElementId, setSelectedElementIds, updateElementPosition, pushHistory, groupOffset]);

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

      // 如果是编组，使用 resizeGroup 来等比缩放子元素
      if (isGroup) {
        resizeGroup(element.id, 
          { width: Math.round(nextWidth), height: Math.round(nextHeight) },
          { x: Math.round(nextX), y: Math.round(nextY) }
        );
      } else {
        updateElementSize(element.id, {
          width: Math.round(nextWidth),
          height: Math.round(nextHeight),
        });
        updateElementPosition(element.id, {
          x: Math.round(nextX),
          y: Math.round(nextY),
        });
      }
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

  const handleRotateStart = useCallback((event: ReactMouseEvent) => {
    if (element.locked) return;
    event.stopPropagation();
    event.preventDefault();

    pushHistory();

    const centerX = element.position.x + element.size.width / 2;
    const centerY = element.position.y + element.size.height / 2;
    const _startRotation = element.style?.rotation || 0;
    void _startRotation;

    const handleMove = (moveEvent: MouseEvent) => {
      // Get canvas-space pointer via the element's parent frame
      const frameEl = (event.target as HTMLElement)?.closest('[data-frame-id]');
      if (!frameEl) return;
      const rect = frameEl.getBoundingClientRect();
      const px = (moveEvent.clientX - rect.left) / scale;
      const py = (moveEvent.clientY - rect.top) / scale;

      const angle = Math.atan2(py - centerY, px - centerX) * (180 / Math.PI) + 90;
      let newRotation = Math.round(angle);

      // Snap to 15° increments when holding Shift
      if (moveEvent.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }

      updateElement(element.id, {
        style: { ...(element.style || {}), fill: element.style?.fill || '#000000', rotation: newRotation } as any,
      });
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [element, pushHistory, scale, updateElement]);

  const renderHandles = () => {
    if (!isSelected || currentTool !== 'select') return null;
    const handles: ResizeHandle[] = ['nw', 'ne', 'se', 'sw'];
    const edgeHandles: ResizeHandle[] = ['n', 'e', 's', 'w'];

    const cornerSize = 10;
    const cornerOffset = -cornerSize / 2;
    const edgeSize = 6;

    const cornerHandleElements = handles.map((handle) => {
      const baseStyle: CSSProperties = {
        position: 'absolute',
        width: cornerSize,
        height: cornerSize,
        background: '#fff',
        border: '2px solid #3b82f6',
        borderRadius: '50%',
        cursor: `${handle}-resize`,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.12)',
        zIndex: 10,
      };

      const styleMap: Record<string, CSSProperties> = {
        nw: { top: cornerOffset, left: cornerOffset },
        ne: { top: cornerOffset, right: cornerOffset },
        se: { bottom: cornerOffset, right: cornerOffset },
        sw: { bottom: cornerOffset, left: cornerOffset },
      };

      return (
        <div
          key={handle}
          style={{ ...baseStyle, ...styleMap[handle] }}
          onMouseDown={(event) => handleResizeStart(event, handle)}
        />
      );
    });

    const edgeHandleElements = edgeHandles.map((handle) => {
      const isHorizontal = handle === 'n' || handle === 's';
      const baseStyle: CSSProperties = {
        position: 'absolute',
        width: isHorizontal ? 20 : edgeSize,
        height: isHorizontal ? edgeSize : 20,
        background: '#fff',
        border: '1.5px solid #3b82f6',
        borderRadius: 3,
        cursor: `${handle}-resize`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 9,
      };

      const styleMap: Record<string, CSSProperties> = {
        n: { top: -edgeSize / 2, left: '50%', marginLeft: -10 },
        e: { top: '50%', right: -edgeSize / 2, marginTop: -10 },
        s: { bottom: -edgeSize / 2, left: '50%', marginLeft: -10 },
        w: { top: '50%', left: -edgeSize / 2, marginTop: -10 },
      };

      return (
        <div
          key={handle}
          style={{ ...baseStyle, ...styleMap[handle] }}
          onMouseDown={(event) => handleResizeStart(event, handle)}
        />
      );
    });

    // Rotation handle — sits above the element, connected by a thin line
    const rotationHandle = (
      <div key="rotate" style={{ position: 'absolute', left: '50%', top: -36, marginLeft: -7, zIndex: 11 }}>
        {/* Connector line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 14,
          width: 1,
          height: 22,
          background: '#3b82f6',
          marginLeft: -0.5,
        }} />
        {/* Rotation circle */}
        <div
          onMouseDown={handleRotateStart}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid #3b82f6',
            cursor: 'grab',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Tiny rotate icon */}
          <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
            <path d="M14 2v4h-4M2 14v-4h4M13.5 6.5A6 6 0 0 0 3.8 3.8M2.5 9.5a6 6 0 0 0 9.7 2.7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );

    return [rotationHandle, ...cornerHandleElements, ...edgeHandleElements];
  };

  const isImage = element.shapeType === 'image';
  const isLine = element.shapeType === 'line';
  const isPath = element.shapeType === 'path';

  const getBackground = () => {
    if (isText) return 'transparent';
    if (isImage) return 'transparent';
    if (isLine) return 'transparent';
    if (isPath) return 'transparent';
    
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
        const cx = style.gradientCenterX ?? 50;
        const cy = style.gradientCenterY ?? 50;
        return `radial-gradient(circle at ${cx}% ${cy}%, ${stops})`;
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
    
    // Selection outline removed from box-shadow — now rendered as a separate overlay
    
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
      className={isNew ? 'canvas-element-enter' : undefined}
      data-element-id={element.id}
      onMouseDown={handlePointerDown}
      onMouseEnter={() => setHoveredElementId(element.id)}
      onMouseLeave={() => setHoveredElementId(null)}
      onDoubleClick={(e) => {
        // Text elements: double-click enters inline editing
        if (isText && !isEditing) {
          e.stopPropagation();
          setIsEditing(true);
          return;
        }
        // Groups or other elements: delegate to parent handler
        onDoubleClick?.();
      }}
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
        // 编组元素是透明的，只用于选择和拖拽
        background: isGroup ? 'transparent' : getBackground(),
        opacity: isGroup ? 1 : (element.style?.fillOpacity ?? 1),
        borderRadius: isGroup ? 0 : getBorderRadius(),
        border: isGroup ? undefined : getStroke(),
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
        caretColor: element.style?.caretColor || 'auto',
        accentColor: element.style?.accentColor || 'auto',
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
      {isPath && element.style?.pathData && (
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <path
            d={element.style.pathData}
            fill={element.style?.pathClosed ? (element.style?.fill || 'transparent') : 'none'}
            stroke={element.style?.stroke || '#ffffff'}
            strokeWidth={element.style?.strokeWidth || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {isText ? (
        isEditing ? (
          <RichTextEditor
            element={element}
            onClose={() => setIsEditing(false)}
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            style={{ 
              padding: element.style?.padding ? `${element.style.padding}px` : '0 8px',
              width: '100%', 
              textAlign: element.style?.textAlign || 'center',
              cursor: 'text',
            }}
            // Render rich text HTML if available
            dangerouslySetInnerHTML={
              (element.style as any)?.richTextHtml 
                ? { __html: (element.style as any).richTextHtml }
                : undefined
            }
          >
            {!(element.style as any)?.richTextHtml && (element.text ?? 'Text')}
          </div>
        )
      ) : null}
      
      {/* Auto Layout visual indicators */}
      {isSelected && element.autoLayout?.enabled && (
        <div className="auto-layout-indicators" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Padding visualization */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: element.autoLayout.paddingTop,
            background: 'rgba(236, 72, 153, 0.15)',
            borderBottom: '1px dashed rgba(236, 72, 153, 0.5)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: element.autoLayout.paddingBottom,
            background: 'rgba(236, 72, 153, 0.15)',
            borderTop: '1px dashed rgba(236, 72, 153, 0.5)',
          }} />
          <div style={{
            position: 'absolute',
            top: element.autoLayout.paddingTop,
            left: 0,
            bottom: element.autoLayout.paddingBottom,
            width: element.autoLayout.paddingLeft,
            background: 'rgba(236, 72, 153, 0.15)',
            borderRight: '1px dashed rgba(236, 72, 153, 0.5)',
          }} />
          <div style={{
            position: 'absolute',
            top: element.autoLayout.paddingTop,
            right: 0,
            bottom: element.autoLayout.paddingBottom,
            width: element.autoLayout.paddingRight,
            background: 'rgba(236, 72, 153, 0.15)',
            borderLeft: '1px dashed rgba(236, 72, 153, 0.5)',
          }} />
          {/* Direction indicator */}
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            padding: '2px 4px',
            background: 'rgba(59, 130, 246, 0.9)',
            borderRadius: 3,
            fontSize: 8,
            color: 'white',
            fontWeight: 600,
          }}>
            {element.autoLayout.direction === 'horizontal' ? '→' : '↓'}
          </div>
        </div>
      )}
      
      {/* Hover highlight overlay (from LayerPanel or Canvas hover) */}
      {hoveredElementId === element.id && !isSelected && currentTool === 'select' && (
        <div
          style={{
            position: 'absolute',
            inset: -1,
            border: '1.5px solid rgba(59,130,246,0.45)',
            borderRadius: isGroup ? 0 : getBorderRadius(),
            pointerEvents: 'none',
            zIndex: 7,
          }}
        />
      )}
      {/* Selection border overlay */}
      {isSelected && currentTool === 'select' && (
        <div
          style={{
            position: 'absolute',
            inset: -1,
            border: '1.5px solid #3b82f6',
            borderRadius: isGroup ? 0 : getBorderRadius(),
            pointerEvents: 'none',
            zIndex: 8,
          }}
        />
      )}
      {renderHandles()}
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          mode="element"
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={element.id}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});

// Context menu styles moved to ContextMenu component
