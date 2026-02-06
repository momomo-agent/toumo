import { useState, useRef, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement } from '../../types';

// --- Thumbnail component ---
function LayerThumbnail({ element }: { element: KeyElement }) {
  const size = 24;
  const padding = 2;
  const inner = size - padding * 2;

  // Calculate scale to fit element in thumbnail
  const maxDim = Math.max(element.size.width, element.size.height, 1);
  const scale = inner / maxDim;
  const w = element.size.width * scale;
  const h = element.size.height * scale;
  const ox = (inner - w) / 2 + padding;
  const oy = (inner - h) / 2 + padding;

  const fill = element.style?.fill || '#3b82f6';
  const isImage = element.shapeType === 'image';
  const isText = element.shapeType === 'text';
  const isLine = element.shapeType === 'line';
  const isPath = element.shapeType === 'path';
  const isEllipse = element.shapeType === 'ellipse';
  const isFrame = element.shapeType === 'frame';
  const borderRadius = element.style?.borderRadius || 0;
  const scaledRadius = Math.min(borderRadius * scale, w / 2, h / 2);

  if (isImage && element.style?.imageSrc) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 3,
        overflow: 'hidden', flexShrink: 0,
        background: '#1a1a1a',
      }}>
        <img
          src={element.style.imageSrc}
          alt=""
          style={{ width: size, height: size, objectFit: 'cover' }}
          draggable={false}
        />
      </div>
    );
  }

  if (isText) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#1a1a1a', flexShrink: 0,
        fontSize: 11, fontWeight: 700, color: element.style?.textColor || '#888',
        fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
      }}>
        T
      </div>
    );
  }

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <rect width={size} height={size} rx={3} fill="#1a1a1a" />
      {isLine || isPath ? (
        <line
          x1={ox} y1={oy + h}
          x2={ox + w} y2={oy}
          stroke={element.style?.stroke || '#888'}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ) : isEllipse ? (
        <ellipse
          cx={ox + w / 2} cy={oy + h / 2}
          rx={w / 2} ry={h / 2}
          fill={fill === 'transparent' ? 'none' : fill}
          stroke={element.style?.stroke || 'none'}
          strokeWidth={element.style?.strokeWidth ? Math.min(element.style.strokeWidth * scale, 1.5) : 0}
        />
      ) : isFrame ? (
        <rect
          x={ox} y={oy} width={w} height={h}
          rx={scaledRadius}
          fill="none"
          stroke="#666"
          strokeWidth={1}
          strokeDasharray="2 1"
        />
      ) : (
        <rect
          x={ox} y={oy} width={w} height={h}
          rx={scaledRadius}
          fill={fill === 'transparent' ? 'none' : fill}
          stroke={element.style?.stroke || 'none'}
          strokeWidth={element.style?.strokeWidth ? Math.min(element.style.strokeWidth * scale, 1.5) : 0}
        />
      )}
    </svg>
  );
}

// --- Context Menu ---
function ContextMenuItem({
  children, onClick, danger,
}: {
  children: React.ReactNode; onClick: () => void; danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%',
        padding: '6px 10px', background: hovered ? '#2a2a2a' : 'none',
        border: 'none', color: danger ? '#ef4444' : '#ddd',
        fontSize: 11, textAlign: 'left', cursor: 'pointer', borderRadius: 4,
      }}
    >
      {children}
    </button>
  );
}

function ContextMenuDivider() {
  return <div style={{ height: 1, background: '#333', margin: '4px 0' }} />;
}

// Drop position type: above/below for reorder, inside for nesting into Frame
type DropPosition = 'above' | 'below' | 'inside';

// --- Main LayerPanel ---
export function LayerPanel() {
  const {
    keyframes,
    selectedKeyframeId,
    selectedElementId,
    selectedElementIds,
    hoveredElementId,
    setSelectedElementId,
    setSelectedElementIds,
    setHoveredElementId,
    updateElement,
    deleteElement,
    duplicateSelectedElements,
  } = useEditorStore();

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<DropPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  const rootElements = useMemo(() =>
    elements
      .filter(el => !el.parentId)
      .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)),
    [elements]
  );

  const getChildren = useCallback((parentId: string) =>
    elements
      .filter(el => el.parentId === parentId)
      .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)),
    [elements]
  );

  // Check if `ancestorId` is an ancestor of `elementId` (prevent circular nesting)
  const isAncestorOf = useCallback((ancestorId: string, elementId: string): boolean => {
    let current = elements.find(el => el.id === elementId);
    while (current?.parentId) {
      if (current.parentId === ancestorId) return true;
      current = elements.find(el => el.id === current!.parentId);
    }
    return false;
  }, [elements]);

  // Check if an element can accept children (is a Frame or group-like container)
  const canAcceptChildren = useCallback((el: KeyElement): boolean => {
    return el.shapeType === 'frame';
  }, []);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { visible: el.visible === false ? true : false });
  };

  const toggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { locked: !el.locked });
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey) {
      setSelectedElementIds(
        selectedElementIds.includes(id)
          ? selectedElementIds.filter(i => i !== id)
          : [...selectedElementIds, id]
      );
    } else {
      setSelectedElementId(id);
    }
  };

  // --- Drag handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedIdRef.current = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
      ghost.style.opacity = '0.6';
      ghost.style.position = 'absolute';
      ghost.style.top = '-1000px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      requestAnimationFrame(() => document.body.removeChild(ghost));
    }
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    const draggedId = draggedIdRef.current;
    if (!draggedId || draggedId === id) return;

    const targetEl = elements.find(el => el.id === id);
    if (!targetEl) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const h = rect.height;
    const isContainer = canAcceptChildren(targetEl);

    let position: DropPosition;
    if (isContainer) {
      // Three-zone: top 25% = above, middle 50% = inside, bottom 25% = below
      if (relY < h * 0.25) position = 'above';
      else if (relY > h * 0.75) position = 'below';
      else position = 'inside';
    } else {
      // Two-zone: top half = above, bottom half = below
      position = relY < h * 0.5 ? 'above' : 'below';
    }

    // Prevent nesting into own descendant
    if (position === 'inside' && isAncestorOf(draggedId, id)) {
      position = relY < h * 0.5 ? 'above' : 'below';
    }

    setDragOverId(id);
    setDragPosition(position);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = draggedIdRef.current;
    if (!draggedId || draggedId === targetId) {
      resetDrag();
      return;
    }

    const targetEl = elements.find(el => el.id === targetId);
    const draggedEl = elements.find(el => el.id === draggedId);
    if (!targetEl || !draggedEl) { resetDrag(); return; }

    // Prevent dropping into own descendant
    if (dragPosition === 'inside' && isAncestorOf(draggedId, targetId)) {
      resetDrag();
      return;
    }

    if (dragPosition === 'inside') {
      // --- Nest into Frame ---
      // Auto-expand the target frame
      setCollapsedIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      // Get children of target to assign zIndex (top of children)
      const targetChildren = getChildren(targetId);
      const maxChildZ = targetChildren.length > 0
        ? Math.max(...targetChildren.map(c => c.zIndex ?? 0))
        : 0;
      updateElement(draggedId, {
        parentId: targetId,
        zIndex: maxChildZ + 1,
      });
    } else {
      // --- Reorder (above/below) ---
      // The dragged element should end up in the same parent context as the target
      const newParentId = targetEl.parentId;
      // Get siblings in the target's parent context
      const siblings = newParentId
        ? elements.filter(el => el.parentId === newParentId).sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
        : elements.filter(el => !el.parentId).sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

      const filtered = siblings.filter(el => el.id !== draggedId);
      const targetIndex = filtered.findIndex(el => el.id === targetId);
      const insertIndex = dragPosition === 'above' ? targetIndex : targetIndex + 1;
      filtered.splice(insertIndex, 0, draggedEl);

      // Update parentId if moving between contexts
      if (draggedEl.parentId !== newParentId) {
        updateElement(draggedId, { parentId: newParentId ?? undefined });
      }

      // Reassign zIndex for all siblings
      filtered.forEach((el, idx) => {
        const newZIndex = filtered.length - idx;
        if (el.zIndex !== newZIndex) {
          updateElement(el.id, { zIndex: newZIndex });
        }
      });
    }

    resetDrag();
  };

  const resetDrag = () => {
    setDragOverId(null);
    setDragPosition(null);
    setIsDragging(false);
    draggedIdRef.current = null;
  };

  const handleDragEnd = () => resetDrag();

  // --- Rename ---
  const startRename = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) {
      setEditingId(id);
      setEditName(el.name);
    }
  };

  const finishRename = () => {
    if (editingId && editName.trim()) {
      updateElement(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  // --- Context menu ---
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDelete = (id: string) => {
    deleteElement(id);
    closeContextMenu();
  };

  const handleDuplicate = (id: string) => {
    setSelectedElementId(id);
    setTimeout(() => duplicateSelectedElements(), 0);
    closeContextMenu();
  };

  const handleLockFromMenu = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { locked: !el.locked });
    closeContextMenu();
  };

  const handleHideFromMenu = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { visible: el.visible === false ? true : false });
    closeContextMenu();
  };

  // --- Render a single layer row ---
  const renderLayer = (el: KeyElement, depth: number = 0) => {
    const children = getChildren(el.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedIds.has(el.id);
    const isSelected = selectedElementIds.includes(el.id) || selectedElementId === el.id;
    const isHovered = hoveredElementId === el.id;
    const isDragOver = dragOverId === el.id;
    const isHidden = el.visible === false;
    const isLocked = el.locked;
    const isBeingDragged = isDragging && draggedIdRef.current === el.id;
    const isNestTarget = isDragOver && dragPosition === 'inside';
    const isContainer = canAcceptChildren(el);

    return (
      <div key={el.id} style={{ position: 'relative' }}>
        {/* Drop indicator - above */}
        {isDragOver && dragPosition === 'above' && (
          <div style={{
            position: 'absolute', top: -1, left: 4 + depth * 16, right: 4,
            height: 2, background: '#3b82f6', borderRadius: 1, zIndex: 10,
            boxShadow: '0 0 6px rgba(59,130,246,0.5)',
          }}>
            <div style={{
              position: 'absolute', left: -3, top: -3,
              width: 8, height: 8, borderRadius: '50%',
              background: '#3b82f6', border: '2px solid #1d4ed8',
            }} />
          </div>
        )}

        <div
          draggable={!isLocked}
          onDragStart={(e) => handleDragStart(e, el.id)}
          onDragOver={(e) => handleDragOver(e, el.id)}
          onDrop={(e) => handleDrop(e, el.id)}
          onDragLeave={() => { setDragOverId(null); setDragPosition(null); }}
          onDragEnd={handleDragEnd}
          onClick={(e) => handleSelect(el.id, e)}
          onDoubleClick={() => startRename(el.id)}
          onContextMenu={(e) => handleContextMenu(e, el.id)}
          onMouseEnter={() => { if (!isDragging) setHoveredElementId(el.id); }}
          onMouseLeave={() => { if (!isDragging) setHoveredElementId(null); }}
          style={{
            opacity: isBeingDragged ? 0.35 : isHidden ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            paddingLeft: 8 + depth * 16,
            height: 32,
            background: isNestTarget
              ? 'rgba(139,92,246,0.2)'
              : isSelected
                ? 'rgba(59,130,246,0.15)'
                : isHovered
                  ? 'rgba(255,255,255,0.04)'
                  : 'transparent',
            borderLeft: isNestTarget
              ? '2px solid #8b5cf6'
              : isSelected
                ? '2px solid #3b82f6'
                : isHovered
                  ? '2px solid rgba(59,130,246,0.4)'
                  : '2px solid transparent',
            outline: isNestTarget ? '1px dashed #8b5cf6' : 'none',
            outlineOffset: -1,
            cursor: isLocked ? 'not-allowed' : 'grab',
            fontSize: 12,
            transition: 'background 0.12s ease, border-color 0.12s ease, opacity 0.15s ease, outline 0.12s ease',
            userSelect: 'none',
            borderRadius: '0 4px 4px 0',
            marginRight: 2,
          }}
        >
          {/* Collapse toggle */}
          {hasChildren || isContainer ? (
            <span
              onClick={(e) => toggleCollapse(el.id, e)}
              style={{
                cursor: 'pointer', width: 14, fontSize: 8,
                color: isNestTarget ? '#8b5cf6' : '#666',
                textAlign: 'center', lineHeight: '14px',
                borderRadius: 3, transition: 'color 0.1s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#aaa'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#666'; }}
            >
              {isCollapsed ? '▶' : '▼'}
            </span>
          ) : (
            <span style={{ width: 14 }} />
          )}

          {/* Thumbnail */}
          <LayerThumbnail element={el} />

          {/* Name (editable) */}
          <span style={{
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', minWidth: 0,
          }}>
            {editingId === el.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename();
                  if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', background: '#111',
                  border: '1px solid #3b82f6', borderRadius: 3,
                  color: '#fff', fontSize: 12, padding: '2px 6px',
                  outline: 'none',
                }}
              />
            ) : (
              <span style={{
                color: isNestTarget ? '#c4b5fd' : isSelected ? '#e0e7ff' : isHidden ? '#555' : '#ccc',
                fontWeight: isSelected || isNestTarget ? 500 : 400,
                transition: 'color 0.1s',
              }}>
                {el.name}
                {isNestTarget && (
                  <span style={{
                    marginLeft: 6, fontSize: 9, color: '#8b5cf6',
                    background: 'rgba(139,92,246,0.15)',
                    padding: '1px 5px', borderRadius: 3,
                    fontWeight: 500,
                  }}>
                    Move inside
                  </span>
                )}
              </span>
            )}
          </span>

          {/* Action icons - show on hover or when active */}
          <div style={{
            display: 'flex', gap: 2, alignItems: 'center',
            opacity: isHovered || isSelected || isLocked || isHidden ? 1 : 0,
            transition: 'opacity 0.15s',
          }}>
            {/* Lock */}
            <button
              onClick={(e) => toggleLock(el.id, e)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 3px', borderRadius: 3, fontSize: 10,
                color: isLocked ? '#f59e0b' : '#666',
                opacity: isLocked ? 1 : 0.6,
                lineHeight: 1,
              }}
              title={isLocked ? 'Unlock' : 'Lock'}
            >
              {isLocked ? '🔒' : '🔓'}
            </button>

            {/* Visibility */}
            <button
              onClick={(e) => toggleVisibility(el.id, e)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 3px', borderRadius: 3, fontSize: 10,
                color: isHidden ? '#ef4444' : '#666',
                opacity: isHidden ? 1 : 0.6,
                lineHeight: 1,
              }}
              title={isHidden ? 'Show' : 'Hide'}
            >
              {isHidden ? '👁‍🗨' : '👁'}
            </button>
          </div>
        </div>

        {/* Drop indicator - below */}
        {isDragOver && dragPosition === 'below' && (
          <div style={{
            position: 'absolute', bottom: -1, left: 4 + depth * 16, right: 4,
            height: 2, background: '#3b82f6', borderRadius: 1, zIndex: 10,
            boxShadow: '0 0 6px rgba(59,130,246,0.5)',
          }}>
            <div style={{
              position: 'absolute', left: -3, top: -3,
              width: 8, height: 8, borderRadius: '50%',
              background: '#3b82f6', border: '2px solid #1d4ed8',
            }} />
          </div>
        )}

        {/* Children */}
        {(hasChildren || isContainer) && !isCollapsed && (
          <div style={{
            borderLeft: isNestTarget ? '1px solid rgba(139,92,246,0.4)' : '1px solid #2a2a2a',
            marginLeft: 15 + depth * 16,
            transition: 'border-color 0.15s ease',
          }}>
            {children.map(child => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseLeave={() => setHoveredElementId(null)}
    >
      {/* Header */}
      <div className="panel-header">
        <h3>Layers</h3>
        <span className="panel-count">{elements.length}</span>
      </div>

      {/* Layer list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '4px 0',
        scrollbarWidth: 'thin',
        scrollbarColor: '#333 transparent',
      }}>
        {elements.length === 0 ? (
          <div style={{
            color: '#444', fontSize: 11, padding: '24px 12px',
            textAlign: 'center', lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.5 }}>◇</div>
            No layers yet
          </div>
        ) : (
          rootElements.map(el => renderLayer(el, 0))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={closeContextMenu}
          />
          <div style={{
            position: 'fixed',
            left: contextMenu.x, top: contextMenu.y,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8, padding: 4, zIndex: 1000,
            minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
          }}>
            <ContextMenuItem onClick={() => startRename(contextMenu.id)}>
              ✏️ Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleDuplicate(contextMenu.id)}>
              📋 Duplicate
            </ContextMenuItem>
            <ContextMenuDivider />
            <ContextMenuItem onClick={() => handleLockFromMenu(contextMenu.id)}>
              {elements.find(e => e.id === contextMenu.id)?.locked ? '🔓 Unlock' : '🔒 Lock'}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleHideFromMenu(contextMenu.id)}>
              {elements.find(e => e.id === contextMenu.id)?.visible === false ? '👁 Show' : '👁‍🗨 Hide'}
            </ContextMenuItem>
            <ContextMenuDivider />
            <ContextMenuItem onClick={() => handleDelete(contextMenu.id)} danger>
              🗑 Delete
            </ContextMenuItem>
          </div>
        </>
      )}
    </div>
  );
}
