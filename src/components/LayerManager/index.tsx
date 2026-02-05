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
  
  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  // Build tree structure
  const buildTree = (elements: KeyElement[], parentId?: string): KeyElement[] => {
    return elements
      .filter(el => el.parentId === parentId)
      .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  };

  const rootElements = buildTree(elements, undefined);

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (el) {
      updateElement(id, { visible: el.visible === false ? true : false });
    }
  };

  const toggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (el) {
      updateElement(id, { locked: !el.locked });
    }
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find(e => e.id === id);
    if (el) {
      updateElement(id, { collapsed: !el.collapsed });
    }
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey) {
      if (selectedElementIds.includes(id)) {
        setSelectedElementIds(selectedElementIds.filter(i => i !== id));
      } else {
        setSelectedElementIds([...selectedElementIds, id]);
      }
    } else {
      setSelectedElementId(id);
    }
  };

  const getChildren = (parentId: string) => {
    return elements.filter(el => el.parentId === parentId);
  };

  const renderLayer = (el: KeyElement, depth: number = 0) => {
    const children = getChildren(el.id);
    const hasChildren = children.length > 0;
    const isSelected = selectedElementIds.includes(el.id) || selectedElementId === el.id;
    const isHidden = el.visible === false;
    const isLocked = el.locked === true;

    return (
      <div key={el.id}>
        <div
          className={`layer-item ${isSelected ? 'selected' : ''}`}
          onClick={(e) => handleSelect(el.id, e)}
          style={{
            opacity: isHidden ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            paddingLeft: 8 + depth * 16,
            background: isSelected ? '#2563eb30' : 'transparent',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {/* Collapse toggle */}
          {hasChildren ? (
            <span
              onClick={(e) => toggleCollapse(el.id, e)}
              style={{ cursor: 'pointer', width: 12, color: '#666' }}
            >
              {el.collapsed ? '▶' : '▼'}
            </span>
          ) : (
            <span style={{ width: 12 }} />
          )}

          {/* Icon */}
          <span style={{ fontSize: 10, color: '#888' }}>
            {el.shapeType === 'rectangle' && '▢'}
            {el.shapeType === 'ellipse' && '○'}
            {el.shapeType === 'text' && 'T'}
            {el.shapeType === 'image' && '🖼'}
            {el.shapeType === 'line' && '╱'}
            {!el.shapeType && '□'}
          </span>

          {/* Name */}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {el.name}
          </span>

          {/* Controls */}
          <span
            onClick={(e) => toggleLock(el.id, e)}
            style={{ cursor: 'pointer', opacity: isLocked ? 1 : 0.3, fontSize: 10 }}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            🔒
          </span>
          <span
            onClick={(e) => toggleVisibility(el.id, e)}
            style={{ cursor: 'pointer', opacity: isHidden ? 0.3 : 1, fontSize: 10 }}
            title={isHidden ? 'Show' : 'Hide'}
          >
            👁
          </span>
        </div>

        {/* Children */}
        {hasChildren && !el.collapsed && (
          <div>
            {children
              .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
              .map(child => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="layer-panel">
      <h3 style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: '#888', 
        margin: '0 0 8px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Layers
      </h3>
      <div className="layer-list" style={{ fontSize: 12 }}>
        {elements.length === 0 ? (
          <p style={{ color: '#555', fontSize: 11 }}>No layers yet</p>
        ) : (
          rootElements.map(el => renderLayer(el, 0))
        )}
      </div>
    </section>
  );
}
