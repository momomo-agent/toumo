import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { Variable, VariableType } from '../../types';

export function VariablePanel() {
  const { variables, addVariable, updateVariable, deleteVariable, setVariableValue } = useEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<VariableType>('string');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const defaultValue = newType === 'number' ? 0 : newType === 'boolean' ? false : '';
    addVariable({
      id: `var-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      defaultValue,
      currentValue: defaultValue,
    });
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div style={{ padding: 12, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Variables</span>
        <button
          onClick={() => setIsAdding(true)}
          style={{
            background: '#3b82f6',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div style={{ background: '#1a1a1a', borderRadius: 6, padding: 10, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Variable name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              width: '100%',
              background: '#222',
              border: '1px solid #333',
              borderRadius: 4,
              padding: '6px 8px',
              color: '#fff',
              fontSize: 12,
              marginBottom: 8,
            }}
            autoFocus
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as VariableType)}
            style={{
              width: '100%',
              background: '#222',
              border: '1px solid #333',
              borderRadius: 4,
              padding: '6px 8px',
              color: '#fff',
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1,
                background: '#3b82f6',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                color: '#fff',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setIsAdding(false)}
              style={{
                flex: 1,
                background: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                color: '#fff',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variable list */}
      {variables.length === 0 && !isAdding ? (
        <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 20 }}>
          No variables yet.<br />
          Add variables to use in triggers.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {variables.map((v) => (
            <VariableItem
              key={v.id}
              variable={v}
              onUpdate={(updates) => updateVariable(v.id, updates)}
              onDelete={() => deleteVariable(v.id)}
              onSetValue={(value) => setVariableValue(v.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VariableItem({
  variable,
  onUpdate,
  onDelete,
  onSetValue,
}: {
  variable: Variable;
  onUpdate: (updates: Partial<Variable>) => void;
  onDelete: () => void;
  onSetValue: (value: string | number | boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const typeColors: Record<VariableType, string> = {
    string: '#f59e0b',
    number: '#3b82f6',
    boolean: '#10b981',
  };

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: 6,
        padding: 10,
        borderLeft: `3px solid ${typeColors[variable.type]}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{variable.name}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ color: typeColors[variable.type], fontSize: 10, textTransform: 'uppercase' }}>
            {variable.type}
          </span>
          <button
            onClick={onDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: 12,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Value editor */}
      {variable.type === 'boolean' ? (
        <button
          onClick={() => onSetValue(!variable.currentValue)}
          style={{
            background: variable.currentValue ? '#10b981' : '#333',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {variable.currentValue ? 'true' : 'false'}
        </button>
      ) : (
        <input
          type={variable.type === 'number' ? 'number' : 'text'}
          value={String(variable.currentValue ?? variable.defaultValue)}
          onChange={(e) => {
            const val = variable.type === 'number' ? Number(e.target.value) : e.target.value;
            onSetValue(val);
          }}
          style={{
            width: '100%',
            background: '#222',
            border: '1px solid #333',
            borderRadius: 4,
            padding: '4px 8px',
            color: '#fff',
            fontSize: 11,
          }}
        />
      )}
    </div>
  );
}
