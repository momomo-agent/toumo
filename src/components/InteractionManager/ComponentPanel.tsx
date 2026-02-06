import { useState, useRef } from 'react';
import { useEditorStore } from '../../store';
import type { Component, FunctionalState } from '../../types';

export function ComponentPanel() {
  const {
    components,
    addComponent,
    updateComponent,
    deleteComponent,
    createComponentFromSelection,
    selectedElementIds,
    keyframes,
    selectedKeyframeId,
  } = useEditorStore();

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [newComponentName, setNewComponentName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const selectedComponent = components.find(c => c.id === selectedComponentId);
  
  // Check if selection can be converted to component
  const currentKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElements = currentKeyframe?.keyElements.filter(
    el => selectedElementIds.includes(el.id) && !el.componentId
  ) || [];
  const canCreateFromSelection = selectedElements.length > 0;

  const handleAddComponent = () => {
    if (!newComponentName.trim()) return;
    addComponent(newComponentName.trim());
    setNewComponentName('');
    setShowNewForm(false);
  };

  const handleCreateFromSelection = () => {
    createComponentFromSelection();
  };

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
          Components ({components.length})
        </span>
        <button
          onClick={() => setShowNewForm(true)}
          style={{
            padding: '4px 10px',
            background: '#2563eb',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          + New
        </button>
      </div>

      {/* Create from selection button */}
      {canCreateFromSelection && (
        <button
          onClick={handleCreateFromSelection}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: 12,
            background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>◇</span>
          Create Component from Selection ({selectedElements.length})
        </button>
      )}

      {/* New component form */}
      {showNewForm && (
        <NewComponentForm
          value={newComponentName}
          onChange={setNewComponentName}
          onSubmit={handleAddComponent}
          onCancel={() => {
            setShowNewForm(false);
            setNewComponentName('');
          }}
        />
      )}

      {/* Component list */}
      {components.length === 0 && !showNewForm ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {components.map(comp => (
            <DraggableComponentRow
              key={comp.id}
              component={comp}
              isSelected={comp.id === selectedComponentId}
              onClick={() => setSelectedComponentId(
                comp.id === selectedComponentId ? null : comp.id
              )}
            />
          ))}
        </div>
      )}

      {/* Selected component editor */}
      {selectedComponent && (
        <ComponentEditor
          component={selectedComponent}
          onUpdate={(updates) => updateComponent(selectedComponent.id, updates)}
          onDelete={() => {
            deleteComponent(selectedComponent.id);
            setSelectedComponentId(null);
          }}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ 
      color: '#555', 
      fontSize: 12, 
      textAlign: 'center', 
      padding: 20 
    }}>
      <div style={{ 
        width: 48, 
        height: 48, 
        margin: '0 auto 12px',
        background: '#1a1a1b',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
      }}>
        ◇
      </div>
      <div style={{ marginBottom: 8, color: '#888' }}>No components yet</div>
      <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>
        Select elements and click "Create Component"<br/>
        or drag components here to reuse them.
      </div>
    </div>
  );
}

function NewComponentForm({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      padding: 12,
      background: '#1a1a1b',
      border: '1px solid #333',
      borderRadius: 8,
      marginBottom: 12,
    }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Component name..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        style={{
          width: '100%',
          padding: '8px 10px',
          background: '#0d0d0e',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          marginBottom: 8,
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          style={{
            flex: 1,
            padding: '6px 0',
            background: value.trim() ? '#2563eb' : '#333',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 11,
            cursor: value.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Create
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '6px 0',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: 4,
            color: '#888',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Draggable component row with drag preview
function DraggableComponentRow({
  component,
  isSelected,
  onClick,
}: {
  component: Component;
  isSelected: boolean;
  onClick: () => void;
}) {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/toumo-component', component.id);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      padding: 8px 12px;
      background: #2563eb;
      border-radius: 6px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      position: absolute;
      top: -1000px;
    `;
    dragImage.textContent = component.name;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const stateCount = component.functionalStates.length;
  const elementCount = component.masterElements?.length || 0;

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: isSelected ? '#1e3a5f' : isDragging ? '#2563eb20' : '#1a1a1b',
        border: `1px solid ${isSelected ? '#2563eb' : isDragging ? '#2563eb' : '#2a2a2a'}`,
        borderRadius: 8,
        cursor: 'grab',
        textAlign: 'left',
        opacity: isDragging ? 0.7 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Component preview */}
      <ComponentPreview component={component} />
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
          {component.name}
        </div>
        <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
          {elementCount} element{elementCount !== 1 ? 's' : ''} • {stateCount} state{stateCount !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div style={{ fontSize: 10, color: '#555' }}>⋮⋮</div>
    </div>
  );
}

// Mini preview of component
function ComponentPreview({ component }: { component: Component }) {
  const elements = component.masterElements || [];
  
  // Calculate bounds
  let maxX = 0, maxY = 0;
  elements.forEach(el => {
    maxX = Math.max(maxX, el.position.x + el.size.width);
    maxY = Math.max(maxY, el.position.y + el.size.height);
  });
  
  const scale = Math.min(24 / (maxX || 24), 24 / (maxY || 24), 1);

  return (
    <div style={{
      width: 28,
      height: 28,
      background: '#0d0d0e',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {elements.length === 0 ? (
        <span style={{ fontSize: 14, color: '#2563eb' }}>◇</span>
      ) : (
        <div style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'center',
          position: 'relative',
          width: maxX,
          height: maxY,
        }}>
          {elements.slice(0, 5).map(el => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.position.x,
                top: el.position.y,
                width: el.size.width,
                height: el.size.height,
                background: el.style?.fill || '#3b82f6',
                borderRadius: el.shapeType === 'ellipse' ? '50%' : (el.style?.borderRadius || 2),
                opacity: el.style?.fillOpacity ?? 1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentEditor({
  component,
  onUpdate,
  onDelete,
}: {
  component: Component;
  onUpdate: (updates: Partial<Component>) => void;
  onDelete: () => void;
}) {
  const [newStateName, setNewStateName] = useState('');
  const { syncComponentInstances } = useEditorStore();

  const handleAddState = () => {
    if (!newStateName.trim()) return;
    const newState: FunctionalState = {
      id: `cfs-${Date.now()}`,
      name: newStateName.trim(),
      isInitial: component.functionalStates.length === 0,
      componentId: component.id,
    };
    onUpdate({
      functionalStates: [...component.functionalStates, newState],
    });
    setNewStateName('');
  };

  const handleDeleteState = (stateId: string) => {
    onUpdate({
      functionalStates: component.functionalStates.filter(s => s.id !== stateId),
      transitions: component.transitions.filter(
        t => t.from !== stateId && t.to !== stateId
      ),
    });
  };

  const handleSetInitial = (stateId: string) => {
    onUpdate({
      functionalStates: component.functionalStates.map(s => ({
        ...s,
        isInitial: s.id === stateId,
      })),
    });
  };

  const handleNameChange = (name: string) => {
    onUpdate({ name });
    // Sync instances after name change
    setTimeout(() => syncComponentInstances(component.id), 0);
  };

  return (
    <div style={{
      marginTop: 16,
      padding: 14,
      background: '#1a1a1b',
      border: '1px solid #2563eb',
      borderRadius: 10,
    }}>
      <div style={{ 
        fontSize: 11, 
        color: '#888', 
        marginBottom: 12, 
        textTransform: 'uppercase' 
      }}>
        Edit Component
      </div>

      {/* Component name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
          Name
        </label>
        <input
          type="text"
          value={component.name}
          onChange={(e) => handleNameChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Master elements info */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
          Master Elements
        </label>
        <div style={{ 
          padding: '8px 10px', 
          background: '#0d0d0e', 
          borderRadius: 6,
          fontSize: 11,
          color: '#888',
        }}>
          {component.masterElements?.length || 0} elements
          <span style={{ color: '#555', marginLeft: 8 }}>
            Double-click instance to edit
          </span>
        </div>
      </div>

      {/* Functional States */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8 
        }}>
          <label style={{ fontSize: 10, color: '#666' }}>
            Functional States
          </label>
        </div>

        {component.functionalStates.length === 0 ? (
          <div style={{ fontSize: 11, color: '#555', padding: '8px 0' }}>
            No states defined yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {component.functionalStates.map(state => (
              <div
                key={state.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: '#0d0d0e',
                  borderRadius: 4,
                }}
              >
                <span style={{ flex: 1, fontSize: 11, color: '#fff' }}>
                  {state.name}
                </span>
                {state.isInitial && (
                  <span style={{
                    fontSize: 9,
                    color: '#22c55e',
                    background: '#22c55e20',
                    padding: '2px 6px',
                    borderRadius: 3,
                  }}>
                    INITIAL
                  </span>
                )}
                {!state.isInitial && (
                  <button
                    onClick={() => handleSetInitial(state.id)}
                    style={smallBtnStyle}
                    title="Set as initial"
                  >
                    ★
                  </button>
                )}
                <button
                  onClick={() => handleDeleteState(state.id)}
                  style={{ ...smallBtnStyle, color: '#dc2626' }}
                  title="Delete state"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add state input */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="New state name..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddState()}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleAddState}
            disabled={!newStateName.trim()}
            style={{
              padding: '6px 12px',
              background: newStateName.trim() ? '#22c55e' : '#333',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 11,
              cursor: newStateName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Mini State Graph */}
      {component.functionalStates.length > 0 && (
        <ComponentStateGraph component={component} onUpdate={onUpdate} />
      )}

      {/* Delete button */}
      <button
        onClick={onDelete}
        style={{
          width: '100%',
          padding: '6px 0',
          marginTop: 12,
          background: 'transparent',
          border: '1px solid #dc2626',
          borderRadius: 6,
          color: '#dc2626',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Delete Component
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
};

const smallBtnStyle: React.CSSProperties = {
  padding: '2px 6px',
  background: 'transparent',
  border: 'none',
  color: '#888',
  fontSize: 12,
  cursor: 'pointer',
};

// Mini state graph for component
function ComponentStateGraph({
  component,
  onUpdate,
}: {
  component: Component;
  onUpdate: (updates: Partial<Component>) => void;
}) {
  const { functionalStates, transitions } = component;
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Simple horizontal layout
  const getNodePos = (index: number) => ({
    x: 20 + index * 90,
    y: 30,
  });

  const handleAddTransition = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const exists = transitions.some(t => t.from === fromId && t.to === toId);
    if (exists) return;
    
    const newTransition = {
      id: `ctr-${Date.now()}`,
      from: fromId,
      to: toId,
      trigger: 'tap',
      duration: 300,
      delay: 0,
      curve: 'ease-out',
    };
    onUpdate({ transitions: [...transitions, newTransition] });
  };

  const handleDeleteTransition = (trId: string) => {
    onUpdate({ transitions: transitions.filter(t => t.id !== trId) });
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 6 }}>
        State Graph
      </label>
      <div
        style={{
          position: 'relative',
          height: 80,
          background: '#0d0d0e',
          borderRadius: 6,
          overflow: 'hidden',
        }}
        onMouseMove={(e) => {
          if (dragFrom) {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }}
        onMouseUp={() => setDragFrom(null)}
        onMouseLeave={() => setDragFrom(null)}
      >
        {/* SVG for edges */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <marker id="comp-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#666" />
            </marker>
          </defs>
          
          {transitions.map(tr => {
            const fromIdx = functionalStates.findIndex(s => s.id === tr.from);
            const toIdx = functionalStates.findIndex(s => s.id === tr.to);
            if (fromIdx === -1 || toIdx === -1) return null;
            
            const from = getNodePos(fromIdx);
            const to = getNodePos(toIdx);
            
            return (
              <g key={tr.id}>
                <line
                  x1={from.x + 60}
                  y1={from.y + 10}
                  x2={to.x}
                  y2={to.y + 10}
                  stroke="#666"
                  strokeWidth={1.5}
                  markerEnd="url(#comp-arrow)"
                />
              </g>
            );
          })}
          
          {/* Drag preview */}
          {dragFrom && (
            <line
              x1={getNodePos(functionalStates.findIndex(s => s.id === dragFrom)).x + 60}
              y1={getNodePos(functionalStates.findIndex(s => s.id === dragFrom)).y + 10}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
          )}
        </svg>

        {/* State nodes */}
        {functionalStates.map((state, idx) => {
          const pos = getNodePos(idx);
          return (
            <div
              key={state.id}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: 60,
                padding: '4px 6px',
                background: state.isInitial ? '#1e3a5f' : '#1a1a1b',
                border: `1px solid ${state.isInitial ? '#2563eb' : '#333'}`,
                borderRadius: 4,
                fontSize: 9,
                color: '#fff',
                textAlign: 'center',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onMouseDown={() => setDragFrom(state.id)}
              onMouseUp={() => {
                if (dragFrom && dragFrom !== state.id) {
                  handleAddTransition(dragFrom, state.id);
                }
                setDragFrom(null);
              }}
            >
              {state.name.slice(0, 8)}
            </div>
          );
        })}

        {/* Help text */}
        <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 8, color: '#444' }}>
          Drag between nodes to add transitions
        </div>
      </div>

      {/* Transition list */}
      {transitions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>Transitions:</div>
          {transitions.map(tr => {
            const fromState = functionalStates.find(s => s.id === tr.from);
            const toState = functionalStates.find(s => s.id === tr.to);
            return (
              <div
                key={tr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 6px',
                  background: '#0d0d0e',
                  borderRadius: 3,
                  marginBottom: 2,
                }}
              >
                <span style={{ flex: 1, fontSize: 9, color: '#888' }}>
                  {fromState?.name || '?'} → {toState?.name || '?'}
                </span>
                <button
                  onClick={() => handleDeleteTransition(tr.id)}
                  style={{ ...smallBtnStyle, fontSize: 10, color: '#dc2626', padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
