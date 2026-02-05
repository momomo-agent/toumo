import { useEditorStore } from '../../store';

export function StateInspector() {
  const {
    keyframes,
    functionalStates,
    selectedKeyframeId,
    selectedElementId,
    updateKeyframeFunctionalState,
    addFunctionalState,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    (el) => el.id === selectedElementId
  );

  if (!selectedKeyframe) {
    return <div style={{ color: '#555', fontSize: 12 }}>No keyframe selected</div>;
  }

  const currentFunctionalState = functionalStates.find(
    (fs) => fs.id === selectedKeyframe.functionalState
  );

  // Find element across all display states
  const elementStateAppearances = selectedElement ? keyframes.map((kf) => {
    const found = kf.keyElements.find(
      (el) => el.name === selectedElement.name || 
              el.id.replace(/-\w+$/, '') === selectedElement.id.replace(/-\w+$/, '')
    );
    const fs = functionalStates.find((f) => f.id === kf.functionalState);
    return {
      keyframeId: kf.id,
      keyframeName: kf.name,
      functionalState: fs?.name || 'Unmapped',
      exists: !!found,
      isCurrent: kf.id === selectedKeyframeId,
      hasOverride: !!(found && selectedElement && (
        found.position.x !== selectedElement.position.x ||
        found.position.y !== selectedElement.position.y ||
        found.size.width !== selectedElement.size.width ||
        found.size.height !== selectedElement.size.height ||
        found.style?.fill !== selectedElement.style?.fill
      )),
    };
  }) : [];

  return (
    <div>
      <SectionHeader>State Mapping</SectionHeader>
      
      {/* Current Display State */}
      <div style={{ marginBottom: 16 }}>
        <Label>Display State</Label>
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

      {/* Current mapping visualization */}
      {currentFunctionalState && (
        <div style={mappingBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={stateChipStyle}>
              <span style={{ fontSize: 10, color: '#888' }}>Functional</span>
              <span style={{ color: '#fff' }}>{currentFunctionalState.name}</span>
            </div>
            <span style={{ color: '#444' }}>→</span>
            <div style={stateChipStyle}>
              <span style={{ fontSize: 10, color: '#888' }}>Display</span>
              <span style={{ color: '#fff' }}>{selectedKeyframe.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Element State Appearances (when element selected) */}
      {selectedElement && elementStateAppearances.length > 0 && (
        <>
          <SectionHeader>Element Across States</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {elementStateAppearances.map((sa) => (
              <ElementStateRow
                key={sa.keyframeId}
                {...sa}
              />
            ))}
          </div>
        </>
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

// Element state row component
function ElementStateRow({ 
  keyframeName, 
  functionalState, 
  exists, 
  isCurrent,
  hasOverride 
}: {
  keyframeId: string;
  keyframeName: string;
  functionalState: string;
  exists: boolean;
  isCurrent: boolean;
  hasOverride: boolean;
}) {
  return (
    <div style={{
      ...elementStateRowStyle,
      borderColor: isCurrent ? '#2563eb' : '#2a2a2a',
      background: isCurrent ? '#2563eb10' : '#0d0d0e',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: exists ? (hasOverride ? '#f59e0b' : '#22c55e') : '#666',
        }} />
        <div>
          <div style={{ fontSize: 11, color: '#fff' }}>{keyframeName}</div>
          <div style={{ fontSize: 9, color: '#666' }}>{functionalState}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#666' }}>
        {!exists ? '—' : hasOverride ? '⚡ Override' : '✓'}
      </div>
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

const mappingBoxStyle: React.CSSProperties = {
  padding: 12,
  background: '#1a1a2e',
  border: '1px solid #2563eb40',
  borderRadius: 8,
  marginBottom: 16,
};

const stateChipStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#0d0d0e',
  border: '1px solid #333',
  borderRadius: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const elementStateRowStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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
