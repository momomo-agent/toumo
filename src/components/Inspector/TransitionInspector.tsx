import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { TriggerConfig, TriggerType } from '../../types';

const CURVE_OPTIONS = [
  { id: 'linear', label: 'Linear', preview: 'M0,100 L100,0' },
  { id: 'ease', label: 'Ease', preview: 'M0,100 C20,100 40,0 100,0' },
  { id: 'ease-in', label: 'Ease In', preview: 'M0,100 C60,100 100,0 100,0' },
  { id: 'ease-out', label: 'Ease Out', preview: 'M0,100 C0,100 40,0 100,0' },
  { id: 'ease-in-out', label: 'Ease In Out', preview: 'M0,100 C40,100 60,0 100,0' },
  { id: 'spring', label: 'Spring', preview: 'M0,100 Q50,-20 100,0' },
  { id: 'custom', label: 'Custom', preview: 'M0,100 C25,75 75,25 100,0' },
];

const TRIGGER_OPTIONS: { id: TriggerType; label: string; icon: string }[] = [
  { id: 'tap', label: 'Tap', icon: '👆' },
  { id: 'drag', label: 'Drag', icon: '✋' },
  { id: 'scroll', label: 'Scroll', icon: '📜' },
  { id: 'hover', label: 'Hover', icon: '🎯' },
  { id: 'timer', label: 'Timer', icon: '⏱️' },
  { id: 'variable', label: 'Variable', icon: '📊' },
];

const DRAG_DIRECTIONS = [
  { id: 'any', label: 'Any' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'up', label: 'Up' },
  { id: 'down', label: 'Down' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

export function TransitionInspector() {
  const {
    keyframes,
    transitions,
    selectedTransitionId,
    updateTransition,
    deleteTransition,
  } = useEditorStore();

  const [showCurveEditor, setShowCurveEditor] = useState(false);

  const transition = transitions.find((t) => t.id === selectedTransitionId);

  if (!transition) {
    return (
      <div style={{ color: '#555', fontSize: 12 }}>
        Select a transition to edit
      </div>
    );
  }

  const fromKeyframe = keyframes.find((kf) => kf.id === transition.from);
  const toKeyframe = keyframes.find((kf) => kf.id === transition.to);

  // Get triggers array (convert legacy single trigger if needed)
  const triggers: TriggerConfig[] = transition.triggers || [{ type: transition.trigger as TriggerType }];

  const handleAddTrigger = () => {
    const newTriggers = [...triggers, { type: 'tap' as TriggerType }];
    updateTransition(transition.id, { triggers: newTriggers });
  };

  const handleRemoveTrigger = (index: number) => {
    if (triggers.length <= 1) return;
    const newTriggers = triggers.filter((_, i) => i !== index);
    updateTransition(transition.id, { triggers: newTriggers });
  };

  const handleUpdateTrigger = (index: number, updates: Partial<TriggerConfig>) => {
    const newTriggers = triggers.map((t, i) => 
      i === index ? { ...t, ...updates } : t
    );
    updateTransition(transition.id, { triggers: newTriggers });
  };

  return (
    <div>
      <SectionHeader>Transition</SectionHeader>

      {/* From → To display */}
      <div style={flowBoxStyle}>
        <StateChip name={fromKeyframe?.name || 'Unknown'} />
        <span style={{ color: '#666' }}>→</span>
        <StateChip name={toKeyframe?.name || 'Unknown'} />
      </div>

      {/* Triggers Section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Label>Triggers</Label>
          <button onClick={handleAddTrigger} style={smallButtonStyle}>+ Add</button>
        </div>
        
        {triggers.map((trigger, index) => (
          <TriggerEditor
            key={index}
            trigger={trigger}
            index={index}
            canRemove={triggers.length > 1}
            onUpdate={(updates) => handleUpdateTrigger(index, updates)}
            onRemove={() => handleRemoveTrigger(index)}
          />
        ))}
        
        {triggers.length > 1 && (
          <div style={comboHintStyle}>
            Combo: All triggers must fire to activate
          </div>
        )}
      </div>

      {/* Timing Section */}
      <SectionHeader>Timing</SectionHeader>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Label>Duration</Label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={transition.duration}
              onChange={(e) => updateTransition(transition.id, { duration: Number(e.target.value) })}
              style={inputStyle}
              min={0}
              step={50}
            />
            <span style={unitStyle}>ms</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Label>Delay</Label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={transition.delay}
              onChange={(e) => updateTransition(transition.id, { delay: Number(e.target.value) })}
              style={inputStyle}
              min={0}
              step={50}
            />
            <span style={unitStyle}>ms</span>
          </div>
        </div>
      </div>

      {/* Duration presets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[100, 200, 300, 500, 800].map((ms) => (
          <button
            key={ms}
            onClick={() => updateTransition(transition.id, { duration: ms })}
            style={{
              ...presetButtonStyle,
              background: transition.duration === ms ? '#2563eb' : '#0d0d0e',
              color: transition.duration === ms ? '#fff' : '#888',
            }}
          >
            {ms}
          </button>
        ))}
      </div>

      {/* Easing Section */}
      <SectionHeader>Easing</SectionHeader>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CURVE_OPTIONS.map((opt) => (
            <CurveButton
              key={opt.id}
              label={opt.label}
              preview={opt.preview}
              active={transition.curve === opt.id}
              onClick={() => {
                updateTransition(transition.id, { curve: opt.id });
                if (opt.id === 'custom') setShowCurveEditor(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Spring Parameters */}
      {transition.curve === 'spring' && (
        <SpringEditor transition={transition} onUpdate={updateTransition} />
      )}

      {/* Custom Bezier Editor */}
      {transition.curve === 'custom' && showCurveEditor && (
        <BezierEditor transition={transition} onUpdate={updateTransition} />
      )}

      {/* Delete */}
      <button
        onClick={() => deleteTransition(transition.id)}
        style={deleteButtonStyle}
      >
        Delete Transition
      </button>
    </div>
  );
}

// Trigger Editor Component
interface TriggerEditorProps {
  trigger: TriggerConfig;
  index: number;
  canRemove: boolean;
  onUpdate: (updates: Partial<TriggerConfig>) => void;
  onRemove: () => void;
}

function TriggerEditor({ trigger, index, canRemove, onUpdate, onRemove }: TriggerEditorProps) {
  return (
    <div style={triggerBoxStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#666' }}>Trigger {index + 1}</span>
        {canRemove && (
          <button onClick={onRemove} style={removeButtonStyle}>×</button>
        )}
      </div>
      
      {/* Trigger Type Selection */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {TRIGGER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onUpdate({ type: opt.id })}
            style={{
              ...triggerTypeButtonStyle,
              background: trigger.type === opt.id ? '#2563eb' : '#0d0d0e',
              borderColor: trigger.type === opt.id ? '#2563eb' : '#333',
            }}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Type-specific options */}
      {trigger.type === 'drag' && (
        <DragOptions trigger={trigger} onUpdate={onUpdate} />
      )}
      {trigger.type === 'scroll' && (
        <ScrollOptions trigger={trigger} onUpdate={onUpdate} />
      )}
      {trigger.type === 'timer' && (
        <TimerOptions trigger={trigger} onUpdate={onUpdate} />
      )}
      {trigger.type === 'variable' && (
        <VariableOptions trigger={trigger} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// Drag Options
function DragOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Direction</Label>
      <select
        value={trigger.direction || 'any'}
        onChange={(e) => onUpdate({ direction: e.target.value as TriggerConfig['direction'] })}
        style={selectStyle}
      >
        {DRAG_DIRECTIONS.map((d) => (
          <option key={d.id} value={d.id}>{d.label}</option>
        ))}
      </select>
      <div style={{ marginTop: 8 }}>
        <Label>Threshold (px)</Label>
        <input
          type="number"
          value={trigger.threshold || 50}
          onChange={(e) => onUpdate({ threshold: Number(e.target.value) })}
          style={inputStyle}
          min={0}
        />
      </div>
    </div>
  );
}

// Scroll Options
function ScrollOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Scroll Direction</Label>
      <select
        value={trigger.scrollDirection || 'down'}
        onChange={(e) => onUpdate({ scrollDirection: e.target.value as 'up' | 'down' })}
        style={selectStyle}
      >
        <option value="down">Down</option>
        <option value="up">Up</option>
      </select>
      <div style={{ marginTop: 8 }}>
        <Label>Offset (px)</Label>
        <input
          type="number"
          value={trigger.scrollOffset || 100}
          onChange={(e) => onUpdate({ scrollOffset: Number(e.target.value) })}
          style={inputStyle}
          min={0}
        />
      </div>
    </div>
  );
}

// Timer Options
function TimerOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Auto-trigger after (ms)</Label>
      <input
        type="number"
        value={trigger.timerDelay || 1000}
        onChange={(e) => onUpdate({ timerDelay: Number(e.target.value) })}
        style={inputStyle}
        min={0}
        step={100}
      />
    </div>
  );
}

// Variable Options
function VariableOptions({ trigger, onUpdate }: { trigger: TriggerConfig; onUpdate: (u: Partial<TriggerConfig>) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <Label>Variable Name</Label>
      <input
        type="text"
        value={trigger.variableName || ''}
        onChange={(e) => onUpdate({ variableName: e.target.value })}
        style={inputStyle}
        placeholder="e.g., isLoading"
      />
      <div style={{ marginTop: 8 }}>
        <Label>Condition</Label>
        <select
          value={trigger.variableCondition || 'equals'}
          onChange={(e) => onUpdate({ variableCondition: e.target.value as TriggerConfig['variableCondition'] })}
          style={selectStyle}
        >
          <option value="equals">Equals</option>
          <option value="greater">Greater than</option>
          <option value="less">Less than</option>
          <option value="changed">Changed</option>
        </select>
      </div>
      {trigger.variableCondition !== 'changed' && (
        <div style={{ marginTop: 8 }}>
          <Label>Value</Label>
          <input
            type="text"
            value={trigger.variableValue ?? ''}
            onChange={(e) => onUpdate({ variableValue: e.target.value })}
            style={inputStyle}
            placeholder="true, false, or number"
          />
        </div>
      )}
    </div>
  );
}

// Spring Editor Component
function SpringEditor({ transition, onUpdate }: { transition: { id: string; springDamping?: number; springResponse?: number; springMass?: number; springStiffness?: number }; onUpdate: (id: string, updates: Record<string, unknown>) => void }) {
  return (
    <div style={springBoxStyle}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>SPRING PHYSICS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <Label>Damping</Label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={transition.springDamping ?? 0.8}
            onChange={(e) => onUpdate(transition.id, { springDamping: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
            {transition.springDamping ?? 0.8}
          </div>
        </div>
        <div>
          <Label>Response</Label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={transition.springResponse ?? 0.5}
            onChange={(e) => onUpdate(transition.id, { springResponse: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
            {transition.springResponse ?? 0.5}
          </div>
        </div>
        <div>
          <Label>Mass</Label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={transition.springMass ?? 1}
            onChange={(e) => onUpdate(transition.id, { springMass: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
            {transition.springMass ?? 1}
          </div>
        </div>
        <div>
          <Label>Stiffness</Label>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={transition.springStiffness ?? 200}
            onChange={(e) => onUpdate(transition.id, { springStiffness: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
            {transition.springStiffness ?? 200}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bezier Editor Component
function BezierEditor({ transition, onUpdate }: { transition: { id: string; cubicBezier?: [number, number, number, number] }; onUpdate: (id: string, updates: Record<string, unknown>) => void }) {
  const bezier = transition.cubicBezier || [0.25, 0.1, 0.25, 1];
  
  return (
    <div style={springBoxStyle}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>CUBIC BEZIER</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {['x1', 'y1', 'x2', 'y2'].map((label, i) => (
          <div key={label}>
            <Label>{label.toUpperCase()}</Label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={bezier[i]}
              onChange={(e) => {
                const newBezier = [...bezier] as [number, number, number, number];
                newBezier[i] = Number(e.target.value);
                onUpdate(transition.id, { cubicBezier: newBezier });
              }}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: '#666' }}>
        cubic-bezier({bezier.join(', ')})
      </div>
    </div>
  );
}

// Helper Components
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#888',
      textTransform: 'uppercase',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '1px solid #2a2a2a',
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

function StateChip({ name }: { name: string }) {
  return (
    <span style={{
      padding: '4px 8px',
      background: '#1a1a1b',
      border: '1px solid #333',
      borderRadius: 4,
      fontSize: 11,
      color: '#fff',
    }}>
      {name}
    </span>
  );
}

function CurveButton({ label, preview, active, onClick }: { label: string; preview: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 8px',
        background: active ? '#2563eb' : '#0d0d0e',
        border: '1px solid',
        borderColor: active ? '#2563eb' : '#333',
        borderRadius: 4,
        color: active ? '#fff' : '#888',
        fontSize: 10,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minWidth: 56,
      }}
    >
      <svg width="24" height="16" viewBox="0 0 100 100" style={{ opacity: 0.7 }}>
        <path d={preview} fill="none" stroke="currentColor" strokeWidth="8" />
      </svg>
      {label}
    </button>
  );
}

// Styles
const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

const flowBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 12,
  background: '#0d0d0e',
  borderRadius: 8,
  marginBottom: 16,
};

const deleteButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  background: 'transparent',
  border: '1px solid #dc2626',
  borderRadius: 6,
  color: '#dc2626',
  fontSize: 11,
  cursor: 'pointer',
  marginTop: 16,
};

const smallButtonStyle: React.CSSProperties = {
  padding: '2px 8px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  fontSize: 10,
  cursor: 'pointer',
};

const triggerBoxStyle: React.CSSProperties = {
  padding: 10,
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  marginBottom: 8,
};

const triggerTypeButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #333',
  borderRadius: 4,
  color: '#fff',
  fontSize: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const removeButtonStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  padding: 0,
  background: '#dc262620',
  border: '1px solid #dc2626',
  borderRadius: 4,
  color: '#dc2626',
  fontSize: 12,
  cursor: 'pointer',
  lineHeight: 1,
};

const presetButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 0',
  border: '1px solid #333',
  borderRadius: 4,
  fontSize: 10,
  cursor: 'pointer',
};

const comboHintStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#2563eb15',
  border: '1px solid #2563eb40',
  borderRadius: 6,
  fontSize: 10,
  color: '#60a5fa',
  textAlign: 'center',
};

const springBoxStyle: React.CSSProperties = {
  padding: 12,
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  marginBottom: 16,
};

const unitStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 10,
  color: '#666',
  pointerEvents: 'none',
};
