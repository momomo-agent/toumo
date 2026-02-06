import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { KeyElement } from '../../types';

export function LayerManager() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    selectedElementId,
    selectedElementIds,
    setSelectedElementId,
    setSelectedElementIds,
    updateElement,
    deleteElement,
  } = useEditorStore();
  
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  
  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  const filteredElements = searchQuery 
    ? elements.filter(el => el.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : elements;

  const rootElements = filteredElements
    .filter(el => !el.parentId)
    .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

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

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (el) updateElement(id, { collapsed: !el.collapsed });
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
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId === targetId) return;
    
    const targetEl = elements.find(el => el.id === targetId);
    const draggedEl = elements.find(el => el.id === draggedId);
    if (!targetEl || !draggedEl) return;
    
    // Swap zIndex
    const targetZ = targetEl.zIndex ?? 0;
    const draggedZ = draggedEl.zIndex ?? 0;
    updateElement(targetId, { zIndex: draggedZ });
    updateElement(draggedId, { zIndex: targetZ });
    setDragOverId(null);
  };

  const getChildren = (parentId: string) => 
    elements.filter(el => el.parentId === parentId)
      .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  const renderLayer = (el: KeyElement, depth: number = 0) => {
    const children = getChildren(el.id);
    const hasChildren = children.length > 0;
    const isSelected = selectedElementIds.includes(el.id) || selectedElementId === el.id;
    const isDragOver = dragOverId === el.id;

    return (
      <div key={el.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, el.id)}
          onDragOver={(e) => handleDragOver(e, el.id)}
          onDrop={(e) => handleDrop(e, el.id)}
          onDragLeave={() => setDragOverId(null)}
          onClick={(e) => handleSelect(el.id, e)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, id: el.id }); }}
          style={{
            opacity: el.visible === false ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            paddingLeft: 8 + depth * 16,
            background: isDragOver ? '#2563eb50' : isSelected ? '#2563eb30' : 'transparent',
            borderRadius: 4,
            cursor: 'grab',
            fontSize: 12,
          }}
        >
          {hasChildren ? (
            <span onClick={(e) => toggleCollapse(el.id, e)} style={{ cursor: 'pointer', width: 12, color: '#666' }}>
              {el.collapsed ? '▶' : '▼'}
            </span>
          ) : <span style={{ width: 12 }} />}
          
          <span style={{ fontSize: 10, color: '#888' }}>
            {el.shapeType === 'rectangle' && '▢'}
            {el.shapeType === 'ellipse' && '○'}
            {el.shapeType === 'text' && 'T'}
            {el.shapeType === 'image' && '🖼'}
            {el.shapeType === 'line' && '╱'}
            {el.shapeType === 'frame' && '⬚'}
            {!el.shapeType && '□'}
          </span>
          
          {el.style?.fill && (
            <span style={{ 
              width: 12, 
              height: 12, 
              borderRadius: 2, 
              background: el.style.fill,
              border: '1px solid #333',
              flexShrink: 0,
            }} />
          )}
          
          <span 
            onDoubleClick={() => { setEditingId(el.id); setEditName(el.name); }}
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {editingId === el.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => { updateElement(el.id, { name: editName }); setEditingId(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { updateElement(el.id, { name: editName }); setEditingId(null); } }}
                style={{ width: '100%', background: '#222', border: 'none', color: '#fff', fontSize: 12 }}
              />
            ) : el.name}
          </span>
          
          <span onClick={(e) => toggleLock(el.id, e)} style={{ cursor: 'pointer', opacity: el.locked ? 1 : 0.3, fontSize: 10 }}>🔒</span>
          <span onClick={(e) => toggleVisibility(el.id, e)} style={{ cursor: 'pointer', opacity: el.visible === false ? 0.3 : 1, fontSize: 10 }}>👁</span>
        </div>
        
        {hasChildren && !el.collapsed && children.map(child => renderLayer(child, depth + 1))}
      </div>
    );
  };

  return (
    <section className="layer-panel">
      <div className="panel-header" style={{ marginBottom: 8, borderBottom: 'none' }}>
        <h3>Layers ({elements.length})</h3>
        <button
          onClick={() => setSelectedElementIds(elements.map(e => e.id))}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}
        >
          Select All
        </button>
      </div>
      <input
        type="text"
        placeholder="Search layers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          marginBottom: 8,
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 4,
          color: '#fff',
          fontSize: 11,
        }}
      />
      <div className="layer-list" style={{ fontSize: 12 }}>
        {elements.length === 0 
          ? <p style={{ color: '#555', fontSize: 11 }}>No layers yet</p>
          : rootElements.map(el => renderLayer(el, 0))
        }
      </div>
      {contextMenu && (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 4, zIndex: 1000 }}
          onClick={() => setContextMenu(null)}
        >
          <button onClick={() => { setEditingId(contextMenu.id); setEditName(elements.find(e => e.id === contextMenu.id)?.name || ''); }} style={menuBtn}>Rename</button>
          <button onClick={() => deleteElement(contextMenu.id)} style={{ ...menuBtn, color: '#ef4444' }}>Delete</button>
        </div>
      )}
    </section>
  );
}

const menuBtn: React.CSSProperties = { display: 'block', width: '100%', padding: '6px 12px', background: 'none', border: 'none', color: '#fff', fontSize: 11, textAlign: 'left', cursor: 'pointer' };
