import { useMemo } from 'react';
import { useEditorStore, DEVICE_PRESETS } from '../../store';
import { DesignPanel } from './DesignPanel';
import { MultiSelectPanel } from './MultiSelectPanel';
import { TransitionInspector } from './TransitionInspector';
import { PatchInspector } from './PatchInspector';
import { AutoLayoutPanel } from './AutoLayoutPanel';
import { ConstraintsPanel } from './ConstraintsPanel';
import { OverflowPanel } from './OverflowPanel';
import { PrototypeLinkPanel } from './PrototypeLinkPanel';
import { TextPropertiesPanel } from './TextPropertiesPanel';
import { AlignmentPanel } from './AlignmentPanel';
import { useResolvedElements } from '../../hooks/useResolvedElements';
import './Inspector.css';
import { TransitionCurvePanel } from './TransitionCurvePanel';

export function Inspector() {
  const { 
    keyframes, 
    transitions,
    selectedKeyframeId, 
    selectedElementId,
    selectedElementIds,
    selectedTransitionId,
    selectedPatchId,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  // Use resolved elements so Inspector shows overridden values for current display state
  const resolvedElements = useResolvedElements();
  const selectedElement = resolvedElements.find(
    (el: { id: string }) => el.id === selectedElementId
  );
  const selectedTransition = transitions.find(tr => tr.id === selectedTransitionId);

  // Determine which panel variant is active — key changes trigger the slide-in animation
  const panelKey = useMemo(() => {
    if (selectedPatchId) return `patch-${selectedPatchId}`;
    if (selectedTransition) return `transition-${selectedTransition.id}`;
    if (selectedElementIds.length >= 2) return 'multi-select';
    if (selectedElement) return `element-${selectedElement.id}`;
    return `keyframe-${selectedKeyframeId}`;
  }, [selectedTransition, selectedElementIds.length >= 2, selectedElement?.id, selectedKeyframeId]);

  // Show Patch inspector when a patch is selected
  if (selectedPatchId) {
    return (
      <div key={panelKey} className="panel-transition-enter">
        <PatchInspector />
      </div>
    );
  }

  // Show transition inspector if a transition is selected
  if (selectedTransition) {
    return (
      <div key={panelKey} className="panel-transition-enter">
        <section className="inspector-panel figma-style" style={{ padding: 16 }}>
          <TransitionInspector />
        </section>
      </div>
    );
  }

  // Show multi-select panel (alignment + shared properties) when multiple elements are selected
  if (selectedElementIds.length >= 2) {
    return (
      <div key={panelKey} className="panel-transition-enter">
        <section className="inspector-panel figma-style">
          <MultiSelectPanel />
        </section>
      </div>
    );
  }

  // Show Figma-style design panel when single element is selected
  if (selectedElement) {
    const isComponentInstance = !!(selectedElement as any).componentId;
    const compId = (selectedElement as any).componentId;
    const comp = isComponentInstance
      ? useEditorStore.getState().componentsV2.find(c => c.id === compId)
      : null;

    return (
      <div key={panelKey} className="panel-transition-enter">
        {isComponentInstance && comp && (
          <section className="inspector-panel figma-style" style={{ padding: 12, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#a78bfa' }}>◇</span>
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{comp.name}</span>
              <span style={{ fontSize: 10, color: '#666', marginLeft: 'auto' }}>Instance</span>
            </div>
            {/* State override */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Current State</label>
              <select
                value={(selectedElement as any).currentStateId || comp.displayStates[0]?.id || ''}
                onChange={e => {
                  const el = selectedElement as any;
                  useEditorStore.getState().updateElement(el.id, { currentStateId: e.target.value });
                }}
                style={{
                  width: '100%', padding: '4px 6px', background: '#0d0d0e',
                  border: '1px solid #333', borderRadius: 4, color: '#fff', fontSize: 11,
                }}
              >
                {comp.displayStates.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>
            {/* Variable overrides */}
            {comp.variables.length > 0 && (
              <div>
                <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>Variables</label>
                {comp.variables.map(v => (
                  <div key={v.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 4, padding: '3px 6px',
                    background: '#0d0d0e', borderRadius: 4,
                  }}>
                    <span style={{ fontSize: 10, color: '#888', flex: 1 }}>{v.name}</span>
                    {v.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={((selectedElement as any).styleOverrides?.[`var_${v.id}`] ?? v.defaultValue) as boolean}
                        onChange={e => {
                          const el = selectedElement as any;
                          const overrides = { ...(el.styleOverrides || {}), [`var_${v.id}`]: e.target.checked };
                          useEditorStore.getState().updateElement(el.id, { styleOverrides: overrides });
                        }}
                      />
                    ) : (
                      <input
                        type={v.type === 'number' ? 'number' : 'text'}
                        value={String((selectedElement as any).styleOverrides?.[`var_${v.id}`] ?? v.defaultValue)}
                        onChange={e => {
                          const el = selectedElement as any;
                          const val = v.type === 'number' ? Number(e.target.value) : e.target.value;
                          const overrides = { ...(el.styleOverrides || {}), [`var_${v.id}`]: val };
                          useEditorStore.getState().updateElement(el.id, { styleOverrides: overrides });
                        }}
                        style={{
                          width: 60, padding: '2px 4px', background: '#1a1a1b',
                          border: '1px solid #333', borderRadius: 3, color: '#fff', fontSize: 10,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#888', lineHeight: 1.5, marginTop: 4 }}>
              {comp.displayStates.length} states · {comp.variables.length} variables
            </div>
            <button
              onClick={() => useEditorStore.setState({ editingComponentId: comp.id })}
              style={{
                width: '100%', marginTop: 8, padding: '6px 0', background: '#1e1e3a',
                border: '1px solid #3b3b6b', borderRadius: 6, color: '#a78bfa',
                fontSize: 11, cursor: 'pointer', fontWeight: 500,
              }}
            >
              Edit Patches ({comp.patches?.length || 0})
            </button>
          </section>
        )}
        <DesignPanel />
        <TextPropertiesPanel />
        <AlignmentPanel />
        <AutoLayoutPanel />
        <ConstraintsPanel />
        <OverflowPanel />
        <PrototypeLinkPanel />
      </div>
    );
  }

  // Default: show keyframe/state info
  return (
    <div key={panelKey} className="panel-transition-enter">
      <KeyframeInspector
        keyframe={selectedKeyframe}
        keyframes={keyframes}
        transitions={transitions}
      />
    </div>
  );
}

// Keyframe/State Inspector (default view)
interface KeyframeInspectorProps {
  keyframe?: {
    id: string;
    name: string;
    summary: string;
    functionalState?: string;
  };
  keyframes: { id: string; name: string }[];
  transitions: { id: string; from: string; to: string; trigger: string }[];
}

function KeyframeInspector({ keyframe, keyframes, transitions }: KeyframeInspectorProps) {
  if (!keyframe) {
    return (
      <section className="inspector-panel figma-style">
        <div className="figma-panel-header">Design</div>
        <p className="figma-hint">Select a layer to see its properties</p>
      </section>
    );
  }

  const outgoing = transitions.filter(t => t.from === keyframe.id);
  const incoming = transitions.filter(t => t.to === keyframe.id);

  return (
    <section className="inspector-panel figma-style">
      <div className="figma-panel-header">State: {keyframe.name}</div>
      
      <div className="figma-section">
        <div className="figma-section-label">State</div>
        <div className="figma-row">
          <span className="figma-label">ID</span>
          <span className="figma-value">{keyframe.functionalState || keyframe.name.toLowerCase()}</span>
        </div>
        <div className="figma-row">
          <span className="figma-label">Description</span>
          <span className="figma-value">{keyframe.summary}</span>
        </div>
      </div>

      <div className="figma-section">
        <div className="figma-section-label">Variant</div>
        <div className="figma-row">
          <span className="figma-label">Layers</span>
          <span className="figma-value">{useEditorStore.getState().sharedElements.length}</span>
        </div>
      </div>

      <DevicePresetSelector />

      <div className="figma-section">
        <div className="figma-section-label">Transitions</div>
        {outgoing.length > 0 && (
          <div className="figma-transition-list">
            <div className="figma-tl-label">Outgoing:</div>
            {outgoing.map(t => {
              const toKf = keyframes.find(kf => kf.id === t.to);
              return (
                <div key={t.id} className="figma-tl-item">
                  → {toKf?.name} <span className="figma-tl-trigger">({t.trigger})</span>
                </div>
              );
            })}
          </div>
        )}
        {incoming.length > 0 && (
          <div className="figma-transition-list">
            <div className="figma-tl-label">Incoming:</div>
            {incoming.map(t => {
              const fromKf = keyframes.find(kf => kf.id === t.from);
              return (
                <div key={t.id} className="figma-tl-item">
                  ← {fromKf?.name} <span className="figma-tl-trigger">({t.trigger})</span>
                </div>
              );
            })}
          </div>
        )}
        {outgoing.length === 0 && incoming.length === 0 && (
          <p className="figma-hint">No transitions defined.</p>
        )}
      </div>

      <TransitionCurvePanel />
    </section>
  );
}

function DevicePresetSelector() {
  const frameSize = useEditorStore((s) => s.frameSize);
  const setFrameSize = useEditorStore((s) => s.setFrameSize);

  const currentPreset = DEVICE_PRESETS.find(
    (p: typeof DEVICE_PRESETS[number]) => p.width === frameSize.width && p.height === frameSize.height
  );

  return (
    <div className="figma-section">
      <div className="figma-section-label">Canvas Size</div>
      <div className="figma-row">
        <select
          value={currentPreset?.name || 'custom'}
          onChange={(e) => {
            const preset = DEVICE_PRESETS.find(p => p.name === e.target.value);
            if (preset) setFrameSize({ width: preset.width, height: preset.height });
          }}
          style={{
            flex: 1, background: '#2a2a2a', color: '#ccc',
            border: '1px solid #444', borderRadius: 4,
            padding: '4px 8px', fontSize: 12,
          }}
        >
          {DEVICE_PRESETS.map(p => (
            <option key={p.name} value={p.name}>
              {p.name} ({p.width}×{p.height})
            </option>
          ))}
          {!currentPreset && (
            <option value="custom">
              Custom ({frameSize.width}×{frameSize.height})
            </option>
          )}
        </select>
      </div>
    </div>
  );
}
