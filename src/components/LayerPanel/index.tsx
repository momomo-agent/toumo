import { useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement } from '../../types';

export function LayerPanel() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    selectedElementId,
    selectedElementIds,
    setSelectedElementId,
    setSelectedElementIds,
    updateElement,
    deleteElement,
    duplicateSelectedElements,
  } = useEditorStore();
  
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  
  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  // Sort by zIndex descending (higher zIndex = top of list)
  const sortedElements = [...elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedIdRef.current = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedIdRef.current === id) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';
    
    setDragOverId(id);
    setDragPosition(position);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = draggedIdRef.current;
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      setDragPosition(null);
      return;
    }
    
    // Reorder by adjusting zIndex
    const targetEl = elements.find(el => el.id === targetId);
    const draggedEl = elements.find(el => el.id === draggedId);
    if (!targetEl || !draggedEl) return;
    
    const targetIndex = sortedElements.findIndex(el => el.id === targetId);
    const insertIndex = dragPosition === 'above' ? targetIndex : targetIndex + 1;
    
    // Recalculate zIndex for all elements
    const newOrder = sortedElements.filter(el => el.id !== draggedId);
    newOrder.splice(insertIndex, 0, draggedEl);
    
    // Assign new zIndex values (higher index = lower zIndex)
    newOrder.forEach((el, idx) => {
      const newZIndex = newOrder.length - idx;
      if (el.zIndex !== newZIndex) {
        updateElement(el.id, { zIndex: newZIndex });
      }
    });
    
    setDragOverId(null);
    setDragPosition(null);
    draggedIdRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDragPosition(null);
    draggedIdRef.current = null;
  };

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

  const getTypeIcon = (el: KeyElement) => {
    switch (el.shapeType) {
      case 'rectangle': return '▢';
      case 'ellipse': return '○';
      case 'text': return 'T';
      case 'image': return '🖼';
      case 'line': return '╱';
      case 'frame': return '⬚';
      default: return '□';
    }
  };

  const renderLayer = (el: KeyElement, depth: number = 0) => {
    const isSelected = selectedElementIds.includes(el.id) || selectedElementId === el.id;
    const isDragOver = dragOverId === el.id;
    const isHidden = el.visible === false;
    const isLocked = el.locked;

    return (
      <div 
        key={el.id}
        style={{ position: 'relative' }}
      >
        {/* Drop indicator above */}
        {isDragOver && dragPosition === 'above' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 8 + depth * 12,
            right: 8,
            height: 2,
            background: '#2563eb',
            borderRadius: 1,
          }} />
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
          style={{
            opacity: isHidden ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            paddingLeft: 8 + depth * 12,
            background: isSelected ? '#2563eb25' : 'transparent',
            borderLeft: isSelected ? '2px solid #2563eb' : '2px solid transparent',
            cursor: isLocked ? 'not-allowed' : 'grab',
            fontSize: 12,
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = '#ffffff08';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Type icon */}
          <span style={{ fontSize: 10, color: '#666', width: 14, textAlign: 'center' }}>
            {getTypeIcon(el)}
          </span>
          
          {/* Color preview */}
          {el.style?.fill && (
            <span style={{ 
              width: 10, 
              height: 10, 
              borderRadius: 2, 
              background: el.style.fill,
              border: '1px solid #444',
              flexShrink: 0,
            }} />
          )}
          
          {/* Name (editable) */}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  width: '100%',
                  background: '#1a1a1a',
                  border: '1px solid #2563eb',
                  borderRadius: 2,
                  color: '#fff',
                  fontSize: 12,
                  padding: '1px 4px',
                  outline: 'none',
                }}
              />
            ) : (
              <span style={{ color: isHidden ? '#666' : '#ddd' }}>{el.name}</span>
            )}
          </span>
          
          {/* Lock icon */}
          <span 
            onClick={(e) => toggleLock(el.id, e)} 
            style={{ 
              cursor: 'pointer', 
              opacity: isLocked ? 1 : 0,
              fontSize: 11,
              padding: '2px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.opacity = '0.5'; }}
            onMouseLeave={(e) => { if (!isLocked) e.currentTarget.style.opacity = '0'; }}
          >
            🔒
          </span>
          
          {/* Visibility icon */}
          <span 
            onClick={(e) => toggleVisibility(el.id, e)} 
            style={{ 
              cursor: 'pointer', 
              opacity: isHidden ? 0.5 : 0,
              fontSize: 11,
              padding: '2px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!isHidden) e.currentTarget.style.opacity = '0.5'; }}
            onMouseLeave={(e) => { if (!isHidden) e.currentTarget.style.opacity = '0'; }}
          >
            {isHidden ? '👁‍🗨' : '👁'}
          </span>
        </div>
        
        {/* Drop indicator below */}
        {isDragOver && dragPosition === 'below' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 8 + depth * 12,
            right: 8,
            height: 2,
            background: '#2563eb',
            borderRadius: 1,
          }} />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: '#888', 
          margin: 0, 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px' 
        }}>
          Layers
        </h3>
        <span style={{ fontSize: 10, color: '#555' }}>
          {elements.length}
        </span>
      </div>
      
      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {elements.length === 0 ? (
          <p style={{ color: '#555', fontSize: 11, padding: '12px', textAlign: 'center' }}>
            No layers yet
          </p>
        ) : (
          sortedElements.map(el => renderLayer(el, 0))
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
            onClick={closeContextMenu}
          />
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
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

function ContextMenuItem({ 
  children, 
  onClick, 
  danger 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '6px 10px',
        background: 'none',
        border: 'none',
        color: danger ? '#ef4444' : '#ddd',
        fontSize: 11,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 4,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      {children}
    </button>
  );
}

function ContextMenuDivider() {
  return <div style={{ height: 1, background: '#333', margin: '4px 0' }} />;
}
