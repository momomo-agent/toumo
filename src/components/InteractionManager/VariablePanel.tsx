import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { Variable, VariableType, ConditionRule } from '../../types';

const TYPE_COLORS: Record<VariableType, string> = {
  string: '#f59e0b',
  number: '#3b82f6',
  boolean: '#10b981',
  color: '#e879f9',
};

type PanelTab = 'variables' | 'conditions';

export function VariablePanel() {
  const {
    variables, addVariable, updateVariable, deleteVariable, setVariableValue,
    conditionRules, addConditionRule, updateConditionRule, deleteConditionRule,
  } = useEditorStore();
  const [tab, setTab] = useState<PanelTab>('variables');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<VariableType>('string');
  const [newDefault, setNewDefault] = useState<string>('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    const defaultValue = newType === 'number'
      ? Number(newDefault) || 0
      : newType === 'boolean'
        ? newDefault === 'true'
        : newType === 'color'
          ? (newDefault || '#3b82f6')
          : newDefault;
    addVariable({
      id: `var-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      defaultValue,
      currentValue: defaultValue,
    });
    setNewName('');
    setNewDefault('');
    setNewType('string');
    setIsAdding(false);
  };

  return (
    <div style={{ padding: 12, height: '100%', overflow: 'auto' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid #2a2a2a' }}>
        <SubTab active={tab === 'variables'} onClick={() => setTab('variables')}>
          Variables ({variables.length})
        </SubTab>
        <SubTab active={tab === 'conditions'} onClick={() => setTab('conditions')}>
          Conditions ({conditionRules.length})
        </SubTab>
      </div>

      {tab === 'variables' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: '#888' }}>Manage variables</span>
            <button
              onClick={() => setIsAdding(true)}
              style={{
                background: '#3b82f6', border: 'none', borderRadius: 4,
                padding: '4px 8px', color: '#fff', fontSize: 11, cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>

          {/* Add form */}
          {isAdding && (
            <CreateVariableForm
              newName={newName}
              setNewName={setNewName}
              newType={newType}
              setNewType={setNewType}
              newDefault={newDefault}
              setNewDefault={setNewDefault}
              onAdd={handleAdd}
              onCancel={() => { setIsAdding(false); setNewName(''); setNewDefault(''); }}
            />
          )}

          {/* Variable list */}
          {variables.length === 0 && !isAdding ? (
            <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 20 }}>
              No variables yet.<br />
              Add variables to control element properties.
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
        </>
      )}

      {tab === 'conditions' && (
        <ConditionsTab
          conditionRules={conditionRules}
          variables={variables}
          onAdd={addConditionRule}
          onUpdate={updateConditionRule}
          onDelete={deleteConditionRule}
        />
      )}
    </div>
  );
}

/* ─── Sub-tab button ─── */
function SubTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', background: 'transparent', border: 'none',
        borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        color: active ? '#fff' : '#666', fontSize: 11, cursor: 'pointer', marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

/* ─── Create Variable Form ─── */
function CreateVariableForm({
  newName, setNewName, newType, setNewType, newDefault, setNewDefault, onAdd, onCancel,
}: {
  newName: string; setNewName: (v: string) => void;
  newType: VariableType; setNewType: (v: VariableType) => void;
  newDefault: string; setNewDefault: (v: string) => void;
  onAdd: () => void; onCancel: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#222', border: '1px solid #333',
    borderRadius: 4, padding: '6px 8px', color: '#fff', fontSize: 12, marginBottom: 8,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#1a1a1a', borderRadius: 6, padding: 10, marginBottom: 12 }}>
      <input
        type="text" placeholder="Variable name" value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        style={inputStyle} autoFocus
      />
      <select
        value={newType}
        onChange={(e) => { setNewType(e.target.value as VariableType); setNewDefault(''); }}
        style={inputStyle}
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
        <option value="color">Color</option>
      </select>

      {/* Default value input based on type */}
      <label style={{ fontSize: 10, color: '#888', marginBottom: 4, display: 'block' }}>Default value</label>
      {newType === 'boolean' ? (
        <select value={newDefault || 'false'} onChange={(e) => setNewDefault(e.target.value)} style={inputStyle}>
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      ) : newType === 'color' ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            type="color" value={newDefault || '#3b82f6'}
            onChange={(e) => setNewDefault(e.target.value)}
            style={{ width: 32, height: 32, border: '1px solid #333', borderRadius: 4, padding: 0, cursor: 'pointer', background: 'transparent' }}
          />
          <input
            type="text" value={newDefault || '#3b82f6'}
            onChange={(e) => setNewDefault(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          />
        </div>
      ) : (
        <input
          type={newType === 'number' ? 'number' : 'text'}
          placeholder={newType === 'number' ? '0' : 'default value'}
          value={newDefault}
          onChange={(e) => setNewDefault(e.target.value)}
          style={inputStyle}
        />
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAdd} style={{
          flex: 1, background: '#3b82f6', border: 'none', borderRadius: 4,
          padding: '6px', color: '#fff', fontSize: 11, cursor: 'pointer',
        }}>Create</button>
        <button onClick={onCancel} style={{
          flex: 1, background: '#333', border: 'none', borderRadius: 4,
          padding: '6px', color: '#fff', fontSize: 11, cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Variable Item (with inline edit) ─── */
function VariableItem({
  variable, onUpdate, onDelete, onSetValue,
}: {
  variable: Variable;
  onUpdate: (updates: Partial<Variable>) => void;
  onDelete: () => void;
  onSetValue: (value: string | number | boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(variable.name);
  const [editDesc, setEditDesc] = useState(variable.description || '');

  const saveEdit = () => {
    if (editName.trim()) {
      onUpdate({ name: editName.trim(), description: editDesc.trim() || undefined });
    }
    setIsEditing(false);
  };

  const currentVal = variable.currentValue ?? variable.defaultValue;

  return (
    <div style={{
      background: '#1a1a1a', borderRadius: 6, padding: 10,
      borderLeft: `3px solid ${TYPE_COLORS[variable.type]}`,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        {isEditing ? (
          <input
            value={editName} onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            onBlur={saveEdit}
            style={{
              background: '#222', border: '1px solid #444', borderRadius: 3,
              padding: '2px 6px', color: '#fff', fontSize: 12, width: '60%',
            }}
            autoFocus
          />
        ) : (
          <span
            style={{ color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to edit"
          >
            {variable.name}
          </span>
        )}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ color: TYPE_COLORS[variable.type], fontSize: 10, textTransform: 'uppercase' }}>
            {variable.type}
          </span>
          <button onClick={() => setIsEditing(!isEditing)} style={iconBtnStyle} title="Edit">✎</button>
          <button onClick={onDelete} style={iconBtnStyle} title="Delete">×</button>
        </div>
      </div>

      {/* Description (edit mode) */}
      {isEditing && (
        <input
          value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
          placeholder="Description (optional)"
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          style={{
            width: '100%', background: '#222', border: '1px solid #333', borderRadius: 3,
            padding: '4px 6px', color: '#aaa', fontSize: 10, marginBottom: 6, boxSizing: 'border-box',
          }}
        />
      )}

      {/* Description display */}
      {!isEditing && variable.description && (
        <div style={{ color: '#666', fontSize: 10, marginBottom: 6 }}>{variable.description}</div>
      )}

      {/* Value editor by type */}
      <VariableValueEditor variable={variable} currentVal={currentVal} onSetValue={onSetValue} />
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#666',
  cursor: 'pointer', fontSize: 12, padding: '0 4px', lineHeight: 1,
};

/* ─── Value Editor per type ─── */
function VariableValueEditor({
  variable, currentVal, onSetValue,
}: {
  variable: Variable;
  currentVal: string | number | boolean;
  onSetValue: (v: string | number | boolean) => void;
}) {
  if (variable.type === 'boolean') {
    return (
      <button
        onClick={() => onSetValue(!currentVal)}
        style={{
          background: currentVal ? '#10b981' : '#333', border: 'none', borderRadius: 4,
          padding: '4px 8px', color: '#fff', fontSize: 11, cursor: 'pointer', width: '100%',
        }}
      >
        {currentVal ? 'true' : 'false'}
      </button>
    );
  }

  if (variable.type === 'color') {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="color" value={String(currentVal || '#3b82f6')}
          onChange={(e) => onSetValue(e.target.value)}
          style={{
            width: 28, height: 28, border: '1px solid #333', borderRadius: 4,
            padding: 0, cursor: 'pointer', background: 'transparent',
          }}
        />
        <input
          type="text" value={String(currentVal)}
          onChange={(e) => onSetValue(e.target.value)}
          style={{
            flex: 1, background: '#222', border: '1px solid #333', borderRadius: 4,
            padding: '4px 8px', color: '#fff', fontSize: 11,
          }}
        />
      </div>
    );
  }

  return (
    <input
      type={variable.type === 'number' ? 'number' : 'text'}
      value={String(currentVal)}
      onChange={(e) => {
        const val = variable.type === 'number' ? Number(e.target.value) : e.target.value;
        onSetValue(val);
      }}
      style={{
        width: '100%', background: '#222', border: '1px solid #333', borderRadius: 4,
        padding: '4px 8px', color: '#fff', fontSize: 11, boxSizing: 'border-box',
      }}
    />
  );
}

/* ─── Conditions Tab ─── */
function ConditionsTab({
  conditionRules, variables, onAdd, onUpdate, onDelete,
}: {
  conditionRules: ConditionRule[];
  variables: Variable[];
  onAdd: (rule: ConditionRule) => void;
  onUpdate: (id: string, updates: Partial<ConditionRule>) => void;
  onDelete: (id: string) => void;
}) {
  const handleAddRule = () => {
    if (variables.length === 0) return;
    const firstVar = variables[0];
    onAdd({
      id: `rule-${Date.now()}`,
      variableId: firstVar.id,
      operator: '==',
      value: firstVar.type === 'number' ? 0 : firstVar.type === 'boolean' ? true : '',
      actions: [],
    });
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#888' }}>If variable meets condition…</span>
        <button
          onClick={variables.length > 0 ? handleAddRule : undefined}
          disabled={variables.length === 0}
          style={{
            background: variables.length > 0 ? '#3b82f6' : '#333',
            border: 'none', borderRadius: 4, padding: '4px 8px',
            color: '#fff', fontSize: 11,
            cursor: variables.length > 0 ? 'pointer' : 'not-allowed',
            opacity: variables.length > 0 ? 1 : 0.5,
          }}
        >
          + Add Rule
        </button>
      </div>

      {variables.length === 0 && (
        <div style={{ color: '#666', fontSize: 11, textAlign: 'center', padding: 16 }}>
          Create variables first to add conditions.
        </div>
      )}

      {conditionRules.length === 0 && variables.length > 0 && (
        <div style={{ color: '#666', fontSize: 11, textAlign: 'center', padding: 16 }}>
          No condition rules yet.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conditionRules.map((rule) => (
          <ConditionRuleItem
            key={rule.id}
            rule={rule}
            variables={variables}
            onUpdate={(updates) => onUpdate(rule.id, updates)}
            onDelete={() => onDelete(rule.id)}
          />
        ))}
      </div>
    </>
  );
}

/* ─── Condition Rule Item ─── */
function ConditionRuleItem({
  rule, variables, onUpdate, onDelete,
}: {
  rule: ConditionRule;
  variables: Variable[];
  onUpdate: (updates: Partial<ConditionRule>) => void;
  onDelete: () => void;
}) {
  const variable = variables.find(v => v.id === rule.variableId);
  const selectStyle: React.CSSProperties = {
    background: '#222', border: '1px solid #333', borderRadius: 3,
    padding: '3px 6px', color: '#fff', fontSize: 11, flex: 1,
  };
  const operators = ['==', '!=', '>', '<', '>=', '<='] as const;

  return (
    <div style={{
      background: '#1a1a1a', borderRadius: 6, padding: 10,
      borderLeft: '3px solid #f97316',
    }}>
      {/* IF row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <span style={{ color: '#f97316', fontSize: 10, fontWeight: 600 }}>IF</span>
        <select
          value={rule.variableId}
          onChange={(e) => onUpdate({ variableId: e.target.value })}
          style={selectStyle}
        >
          {variables.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select
          value={rule.operator}
          onChange={(e) => onUpdate({ operator: e.target.value as typeof operators[number] })}
          style={{ ...selectStyle, flex: 'none', width: 50 }}
        >
          {operators.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        <ConditionValueInput
          variable={variable}
          value={rule.value}
          onChange={(v) => onUpdate({ value: v })}
        />
        <button onClick={onDelete} style={iconBtnStyle} title="Delete rule">×</button>
      </div>

      {/* THEN actions */}
      <div style={{ paddingLeft: 8 }}>
        <span style={{ color: '#888', fontSize: 10, display: 'block', marginBottom: 4 }}>THEN →</span>
        {rule.actions.map((action, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
            <select
              value={action.type}
              onChange={(e) => {
                const updated = [...rule.actions];
                updated[i] = { ...updated[i], type: e.target.value as any };
                onUpdate({ actions: updated });
              }}
              style={{ ...selectStyle, flex: 1 }}
            >
              <option value="goToState">Go to State</option>
              <option value="setVariable">Set Variable</option>
              <option value="setProperty">Set Property</option>
            </select>
            <button
              onClick={() => {
                const updated = rule.actions.filter((_, idx) => idx !== i);
                onUpdate({ actions: updated });
              }}
              style={iconBtnStyle}
              title="Remove action"
            >×</button>
          </div>
        ))}
        <button
          onClick={() => {
            onUpdate({ actions: [...rule.actions, { type: 'goToState' }] });
          }}
          style={{ fontSize: 10, padding: '2px 6px', background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb40', borderRadius: 3, cursor: 'pointer' }}
        >
          + Action
        </button>
      </div>
    </div>
  );
}

/* ─── Condition Value Input (type-aware) ─── */
function ConditionValueInput({
  variable, value, onChange,
}: {
  variable: Variable | undefined;
  value: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  const inputStyle: React.CSSProperties = {
    background: '#222', border: '1px solid #333', borderRadius: 3,
    padding: '3px 6px', color: '#fff', fontSize: 11, flex: 1, minWidth: 40,
  };

  if (!variable) {
    return <input type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
  }

  if (variable.type === 'boolean') {
    return (
      <select value={String(value)} onChange={(e) => onChange(e.target.value === 'true')} style={inputStyle}>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  if (variable.type === 'color') {
    return (
      <input type="color" value={String(value || '#000000')}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 28, height: 22, border: '1px solid #333', borderRadius: 3, padding: 0, cursor: 'pointer' }}
      />
    );
  }

  return (
    <input
      type={variable.type === 'number' ? 'number' : 'text'}
      value={String(value)}
      onChange={(e) => onChange(variable.type === 'number' ? Number(e.target.value) : e.target.value)}
      style={inputStyle}
    />
  );
}
