import { memo } from 'react';
import { useEditorStore } from '../../store';

const CURVE_OPTIONS = [
  { id: 'linear', label: 'Linear' },
  { id: 'ease', label: 'Ease' },
  { id: 'ease-in', label: 'Ease In' },
  { id: 'ease-out', label: 'Ease Out' },
  { id: 'ease-in-out', label: 'Ease In Out' },
  { id: 'spring', label: 'Spring' },
];

const TRIGGER_OPTIONS = [
  { id: 'tap', label: 'Tap' },
  { id: 'hover', label: 'Hover' },
  { id: 'drag', label: 'Drag' },
  { id: 'scroll', label: 'Scroll' },
  { id: 'timer', label: 'Timer' },
  { id: 'variable', label: 'Variable' },
];

export function TransitionList() {
  const {
    keyframes,
    transitions,
    selectedTransitionId,
    setSelectedTransitionId,
    updateTransition,
    addTransition,
    deleteTransition,
  } = useEditorStore();

  const getKeyframeName = (id: string) => {
    return keyframes.find(kf => kf.id === id)?.name || id;
  };

  const handleAddTransition = () => {
    if (keyframes.length < 2) return;
    addTransition(keyframes[0].id, keyframes[1].id);
  };

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>
          All Transitions ({transitions.length})
        </span>
        <button
          onClick={handleAddTransition}
          disabled={keyframes.length < 2}
          style={{
            padding: '4px 10px',
            background: '#2563eb',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            fontSize: 11,
            cursor: keyframes.length < 2 ? 'not-allowed' : 'pointer',
            opacity: keyframes.length < 2 ? 0.5 : 1,
          }}
        >
          + Add
        </button>
      </div>

      {transitions.length === 0 ? (
        <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 20 }}>
          No transitions yet. Add one to connect states.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transitions.map(tr => {
            const isSelected = tr.id === selectedTransitionId;
            return (
              <TransitionRow
                key={tr.id}
                fromName={getKeyframeName(tr.from)}
                toName={getKeyframeName(tr.to)}
                trigger={tr.trigger}
                duration={tr.duration}
                curve={tr.curve}
                isSelected={isSelected}
                onClick={() => setSelectedTransitionId(isSelected ? null : tr.id)}
              />
            );
          })}
        </div>
      )}

      {/* Inline editor for selected transition */}
      {selectedTransitionId && (
        <SelectedTransitionEditor
          transitionId={selectedTransitionId}
          keyframes={keyframes}
          onUpdate={updateTransition}
          onDelete={() => deleteTransition(selectedTransitionId)}
        />
      )}
    </div>
  );
}

const TransitionRow = memo(function TransitionRow({
  fromName,
  toName,
  trigger,
  duration,
  curve,
  isSelected,
  onClick,
}: {
  fromName: string;
  toName: string;
  trigger: string;
  duration: number;
  curve: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: isSelected ? '#1e3a5f' : '#1a1a1b',
        border: `1px solid ${isSelected ? '#2563eb' : '#2a2a2a'}`,
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#fff' }}>
          {fromName} → {toName}
        </div>
        <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
          {trigger} • {duration}ms • {curve}
        </div>
      </div>
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isSelected ? '#2563eb' : '#444',
        }}
      />
    </button>
  );
});

function SelectedTransitionEditor({
  transitionId,
  keyframes,
  onUpdate,
  onDelete,
}: {
  transitionId: string;
  keyframes: { id: string; name: string }[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { transitions } = useEditorStore();
  const transition = transitions.find(t => t.id === transitionId);
  if (!transition) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        background: '#1a1a1b',
        border: '1px solid #2563eb',
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 11, color: '#888', marginBottom: 12, textTransform: 'uppercase' }}>
        Edit Transition
      </div>

      {/* From / To selectors */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>From</label>
          <select
            value={transition.from}
            onChange={(e) => onUpdate(transitionId, { from: e.target.value })}
            style={selectStyle}
          >
            {keyframes.map(kf => (
              <option key={kf.id} value={kf.id}>{kf.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>To</label>
          <select
            value={transition.to}
            onChange={(e) => onUpdate(transitionId, { to: e.target.value })}
            style={selectStyle}
          >
            {keyframes.map(kf => (
              <option key={kf.id} value={kf.id}>{kf.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trigger */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Trigger</label>
        <select
          value={transition.trigger}
          onChange={(e) => {
            const newTrigger = e.target.value;
            const triggerConfig: Record<string, unknown> = { trigger: newTrigger };
            // Sync triggers array for runtime
            if (newTrigger === 'timer') {
              const existingDelay = transition.triggers?.find(t => t.type === 'timer')?.timerDelay || 1000;
              triggerConfig.triggers = [{ type: 'timer', timerDelay: existingDelay }];
            } else if (newTrigger === 'drag') {
              const existingDir = transition.triggers?.find(t => t.type === 'drag')?.direction || 'any';
              triggerConfig.triggers = [{ type: 'drag', direction: existingDir, threshold: 20 }];
            } else {
              triggerConfig.triggers = [{ type: newTrigger }];
            }
            onUpdate(transitionId, triggerConfig);
          }}
          style={selectStyle}
        >
          {TRIGGER_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Timer-specific: delay */}
      {transition.trigger === 'timer' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
            ⏱️ Timer Delay (ms)
          </label>
          <input
            type="number"
            min={100}
            step={100}
            value={transition.triggers?.find(t => t.type === 'timer')?.timerDelay ?? 1000}
            onChange={(e) => {
              const delay = Math.max(100, Number(e.target.value));
              onUpdate(transitionId, {
                triggers: [{ type: 'timer', timerDelay: delay }],
              });
            }}
            style={inputStyle}
            placeholder="1000"
          />
          <span style={{ fontSize: 9, color: '#555', marginTop: 2, display: 'block' }}>
            Auto-triggers after entering this state
          </span>
        </div>
      )}

      {/* Drag-specific: direction */}
      {transition.trigger === 'drag' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
            ✋ Drag Direction
          </label>
          <select
            value={transition.triggers?.find(t => t.type === 'drag')?.direction ?? 'any'}
            onChange={(e) => {
              onUpdate(transitionId, {
                triggers: [{ type: 'drag', direction: e.target.value, threshold: 20 }],
              });
            }}
            style={selectStyle}
          >
            <option value="any">Any</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
      )}

      {/* Duration & Delay */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Duration (ms)</label>
          <input
            type="number"
            value={transition.duration}
            onChange={(e) => onUpdate(transitionId, { duration: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Delay (ms)</label>
          <input
            type="number"
            value={transition.delay}
            onChange={(e) => onUpdate(transitionId, { delay: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Curve */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Curve</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CURVE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onUpdate(transitionId, { curve: opt.id })}
              style={{
                padding: '4px 8px',
                background: transition.curve === opt.id ? '#2563eb' : '#0d0d0e',
                border: '1px solid #333',
                borderRadius: 4,
                color: transition.curve === opt.id ? '#fff' : '#888',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          width: '100%',
          padding: '6px 0',
          background: 'transparent',
          border: '1px solid #dc2626',
          borderRadius: 6,
          color: '#dc2626',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Delete Transition
      </button>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
};
