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

export function TransitionInspector() {
  const {
    keyframes,
    transitions,
    selectedTransitionId,
    updateTransition,
    deleteTransition,
  } = useEditorStore();

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

  return (
    <div>
      <SectionHeader>Transition</SectionHeader>

      {/* From → To display */}
      <div style={flowBoxStyle}>
        <StateChip name={fromKeyframe?.name || 'Unknown'} />
        <span style={{ color: '#666' }}>→</span>
        <StateChip name={toKeyframe?.name || 'Unknown'} />
      </div>

      {/* Trigger */}
      <div style={{ marginBottom: 14 }}>
        <Label>Trigger</Label>
        <select
          value={transition.trigger}
          onChange={(e) => updateTransition(transition.id, { trigger: e.target.value })}
          style={selectStyle}
        >
          {TRIGGER_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Duration & Delay */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Label>Duration (ms)</Label>
          <input
            type="number"
            value={transition.duration}
            onChange={(e) => updateTransition(transition.id, { duration: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Delay (ms)</Label>
          <input
            type="number"
            value={transition.delay}
            onChange={(e) => updateTransition(transition.id, { delay: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Curve */}
      <div style={{ marginBottom: 14 }}>
        <Label>Easing Curve</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CURVE_OPTIONS.map((opt) => (
            <CurveButton
              key={opt.id}
              label={opt.label}
              active={transition.curve === opt.id}
              onClick={() => updateTransition(transition.id, { curve: opt.id })}
            />
          ))}
        </div>
      </div>

      {/* Spring params */}
      {transition.curve === 'spring' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <Label>Damping</Label>
            <input
              type="number"
              step="0.1"
              value={transition.springDamping ?? 0.8}
              onChange={(e) => updateTransition(transition.id, { springDamping: Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Response</Label>
            <input
              type="number"
              step="0.1"
              value={transition.springResponse ?? 0.5}
              onChange={(e) => updateTransition(transition.id, { springResponse: Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
        </div>
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

function CurveButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px',
        background: active ? '#2563eb' : '#0d0d0e',
        border: '1px solid #333',
        borderRadius: 4,
        color: active ? '#fff' : '#888',
        fontSize: 10,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

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
  marginTop: 8,
};
