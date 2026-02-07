import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { ComponentV2 } from '../../types';

export function ComponentPanel() {
  const {
    componentsV2,
    createComponentV2,
    deleteComponentV2,
    updateComponentV2,
    addComponentDisplayState,
    removeComponentDisplayState,
    createComponentFromSelection,
    selectedElementIds,
  } = useEditorStore();

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [newComponentName, setNewComponentName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const selectedComponent = componentsV2.find(c => c.id === selectedComponentId);

  const sharedElements = useEditorStore(s => s.sharedElements);
  const selectedElements = sharedElements.filter(
    el => selectedElementIds.includes(el.id) && !el.componentId
  ) || [];
  const canCreateFromSelection = selectedElements.length > 0;

  const handleAddComponent = () => {
    if (!newComponentName.trim()) return;
    createComponentV2(newComponentName.trim());
    setNewComponentName('');
    setShowNewForm(false);
  };

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
          Components ({componentsV2.length})
        </span>
        <button
          onClick={() => setShowNewForm(true)}
          style={{ padding: '4px 10px', background: '#2563eb', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: 'pointer' }}
        >+ New</button>
      </div>

      {canCreateFromSelection && (
        <button onClick={() => createComponentFromSelection()} style={{
          width: '100%', padding: '10px 12px', marginBottom: 12,
          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>◇</span>
          Create from Selection ({selectedElements.length})
        </button>
      )}

      {showNewForm && (
        <NewComponentForm value={newComponentName} onChange={setNewComponentName}
          onSubmit={handleAddComponent}
          onCancel={() => { setShowNewForm(false); setNewComponentName(''); }} />
      )}

      {componentsV2.length === 0 && !showNewForm ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {componentsV2.map(comp => (
            <ComponentV2Row key={comp.id} component={comp}
              isSelected={comp.id === selectedComponentId}
              onClick={() => setSelectedComponentId(comp.id === selectedComponentId ? null : comp.id)} />
          ))}
        </div>
      )}

      {selectedComponent && (
        <ComponentV2Editor component={selectedComponent}
          onUpdate={(u) => updateComponentV2(selectedComponent.id, u)}
          onDelete={() => { deleteComponentV2(selectedComponent.id); setSelectedComponentId(null); }}
          onAddDisplayState={(n) => addComponentDisplayState(selectedComponent.id, n)}
          onRemoveDisplayState={(sid) => removeComponentDisplayState(selectedComponent.id, sid)} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 20 }}>
      <div style={{
        width: 48, height: 48, margin: '0 auto 12px',
        background: '#1a1a1b', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>◇</div>
      <div style={{ marginBottom: 8, color: '#888' }}>No components yet</div>
      <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>
        Click "+ New" to create a component.
      </div>
    </div>
  );
}

function NewComponentForm({ value, onChange, onSubmit, onCancel }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ padding: 12, background: '#1a1a1b', border: '1px solid #333', borderRadius: 8, marginBottom: 12 }}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Component name..." autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') onCancel(); }}
        style={{ width: '100%', padding: '8px 10px', background: '#0d0d0e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 12, marginBottom: 8 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSubmit} disabled={!value.trim()}
          style={{ flex: 1, padding: '6px 0', background: value.trim() ? '#2563eb' : '#333', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: value.trim() ? 'pointer' : 'not-allowed' }}>
          Create
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '6px 0', background: 'transparent', border: '1px solid #333', borderRadius: 4, color: '#888', fontSize: 11, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ComponentV2Row({ component, isSelected, onClick }: {
  component: ComponentV2; isSelected: boolean; onClick: () => void;
}) {
  const sc = component.displayStates.length;
  const lc = component.layers.length;
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      background: isSelected ? '#1e3a5f' : '#1a1a1b',
      border: `1px solid ${isSelected ? '#2563eb' : '#2a2a2a'}`,
      borderRadius: 8, cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}>
      <div style={{
        width: 28, height: 28, background: '#0d0d0e',
        borderRadius: 6, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 14, color: '#a78bfa' }}>◇</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
          {component.name}
        </div>
        <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
          {lc} layer{lc !== 1 ? 's' : ''} · {sc} state{sc !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

function ComponentV2Editor({ component, onUpdate, onDelete, onAddDisplayState, onRemoveDisplayState }: {
  component: ComponentV2;
  onUpdate: (updates: Partial<ComponentV2>) => void;
  onDelete: () => void;
  onAddDisplayState: (name: string) => void;
  onRemoveDisplayState: (stateId: string) => void;
}) {
  const [newStateName, setNewStateName] = useState('');

  const handleAddState = () => {
    if (!newStateName.trim()) return;
    onAddDisplayState(newStateName.trim());
    setNewStateName('');
  };

  return (
    <div style={{ marginTop: 16, padding: 14, background: '#1a1a1b', border: '1px solid #2563eb', borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 12, textTransform: 'uppercase' }}>
        Edit Component
      </div>

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Name</label>
        <input type="text" value={component.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          style={{ width: '100%', padding: '6px 8px', background: '#0d0d0e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 12 }} />
      </div>

      {/* Layers info */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Layers</label>
        <div style={{ padding: '8px 10px', background: '#0d0d0e', borderRadius: 6, fontSize: 11, color: '#888' }}>
          {component.layers.length} layers
        </div>
      </div>

      {/* Display States */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 8 }}>
          Display States ({component.displayStates.length})
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {component.displayStates.map((ds, idx) => (
            <DisplayStateRow key={ds.id} state={ds} isFirst={idx === 0}
              onRemove={() => onRemoveDisplayState(ds.id)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input type="text" value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="New state name..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddState()}
            style={{ flex: 1, padding: '6px 8px', background: '#0d0d0e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 12 }} />
          <button onClick={handleAddState} disabled={!newStateName.trim()}
            style={{ padding: '6px 12px', background: newStateName.trim() ? '#22c55e' : '#333', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, cursor: newStateName.trim() ? 'pointer' : 'not-allowed' }}>
            Add
          </button>
        </div>
      </div>

      {/* Variables info */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Variables</label>
        <div style={{ padding: '8px 10px', background: '#0d0d0e', borderRadius: 6, fontSize: 11, color: '#888' }}>
          {component.variables.length} variable{component.variables.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Rules info */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Interaction Rules</label>
        <div style={{ padding: '8px 10px', background: '#0d0d0e', borderRadius: 6, fontSize: 11, color: '#888' }}>
          {component.rules.length} rule{component.rules.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Patches info */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Patches</label>
        <div style={{ padding: '8px 10px', background: '#0d0d0e', borderRadius: 6, fontSize: 11, color: '#888' }}>
          {component.patches?.length || 0} patch{(component.patches?.length || 0) !== 1 ? 'es' : ''} · {component.connections?.length || 0} connection{(component.connections?.length || 0) !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Delete */}
      <button onClick={onDelete} style={{
        width: '100%', padding: '6px 0', marginTop: 4,
        background: 'transparent', border: '1px solid #dc2626',
        borderRadius: 6, color: '#dc2626', fontSize: 11, cursor: 'pointer',
      }}>Delete Component</button>
    </div>
  );
}

function DisplayStateRow({ state, isFirst, onRemove }: {
  state: { id: string; name: string }; isFirst: boolean; onRemove: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px', background: '#0d0d0e', borderRadius: 4,
    }}>
      <span style={{ flex: 1, fontSize: 11, color: '#fff' }}>{state.name}</span>
      {isFirst && (
        <span style={{ fontSize: 9, color: '#22c55e', background: '#22c55e20', padding: '2px 6px', borderRadius: 3 }}>
          DEFAULT
        </span>
      )}
      {!isFirst && (
        <button onClick={onRemove} style={{
          padding: '2px 6px', background: 'transparent', border: 'none',
          color: '#dc2626', fontSize: 12, cursor: 'pointer',
        }}>×</button>
      )}
    </div>
  );
}
