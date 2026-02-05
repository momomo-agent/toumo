import { useEditorStore } from '../../store';

export function StateInspector() {
  const {
    keyframes,
    functionalStates,
    selectedKeyframeId,
    updateKeyframeFunctionalState,
    addFunctionalState,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);

  if (!selectedKeyframe) {
    return <div style={{ color: '#555', fontSize: 12 }}>No keyframe selected</div>;
  }

  const currentFunctionalState = functionalStates.find(
    (fs) => fs.id === selectedKeyframe.functionalState
  );

  return (
    <div>
      <SectionHeader>State Mapping</SectionHeader>
      
      {/* Current Display State */}
      <div style={{ marginBottom: 16 }}>
        <Label>Display State (Keyframe)</Label>
        <div style={valueBoxStyle}>
          <span style={{ color: '#fff' }}>{selectedKeyframe.name}</span>
          <span style={{ color: '#666', fontSize: 10 }}>
            {selectedKeyframe.keyElements.length} elements
          </span>
        </div>
      </div>

      {/* Functional State Mapping */}
      <div style={{ marginBottom: 16 }}>
        <Label>Functional State</Label>
        <select
          value={selectedKeyframe.functionalState || ''}
          onChange={(e) => 
            updateKeyframeFunctionalState(
              selectedKeyframe.id, 
              e.target.value || undefined
            )
          }
          style={selectStyle}
        >
          <option value="">— None —</option>
          {functionalStates.map((fs) => (
            <option key={fs.id} value={fs.id}>
              {fs.name} {fs.isInitial ? '(Initial)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Current mapping info */}
      {currentFunctionalState && (
        <div style={infoBoxStyle}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>
            MAPPED TO
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: currentFunctionalState.isInitial ? '#22c55e' : '#2563eb',
              }}
            />
            <span style={{ color: '#fff', fontSize: 12 }}>
              {currentFunctionalState.name}
            </span>
          </div>
        </div>
      )}

      {/* Quick add functional state */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            const name = prompt('Functional state name:');
            if (name) addFunctionalState(name);
          }}
          style={addButtonStyle}
        >
          + Add Functional State
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #2a2a2a',
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 10,
        color: '#666',
        display: 'block',
        marginBottom: 4,
      }}
    >
      {children}
    </label>
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

const valueBoxStyle: React.CSSProperties = {
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const infoBoxStyle: React.CSSProperties = {
  padding: 10,
  background: '#1a1a2e',
  border: '1px solid #2563eb40',
  borderRadius: 8,
};

const addButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  background: 'transparent',
  border: '1px dashed #333',
  borderRadius: 6,
  color: '#888',
  fontSize: 11,
  cursor: 'pointer',
};
