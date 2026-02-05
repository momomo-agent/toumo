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
  } = useEditorStore();
  
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  const rootElements = elements
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
          
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{el.name}</span>
          
          <span onClick={(e) => toggleLock(el.id, e)} style={{ cursor: 'pointer', opacity: el.locked ? 1 : 0.3, fontSize: 10 }}>🔒</span>
          <span onClick={(e) => toggleVisibility(el.id, e)} style={{ cursor: 'pointer', opacity: el.visible === false ? 0.3 : 1, fontSize: 10 }}>👁</span>
        </div>
        
        {hasChildren && !el.collapsed && children.map(child => renderLayer(child, depth + 1))}
      </div>
    );
  };

  return (
    <section className="layer-panel">
      <h3 style={{ fontSize: 11, fontWeight: 600, color: '#888', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Layers
      </h3>
      <div className="layer-list" style={{ fontSize: 12 }}>
        {elements.length === 0 
          ? <p style={{ color: '#555', fontSize: 11 }}>No layers yet</p>
          : rootElements.map(el => renderLayer(el, 0))
        }
      </div>
    </section>
  );
}
