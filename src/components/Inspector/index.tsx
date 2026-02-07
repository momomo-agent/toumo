import { useMemo } from 'react';
import { useEditorStore, DEVICE_PRESETS } from '../../store';
import { DesignPanel } from './DesignPanel';
import { MultiSelectPanel } from './MultiSelectPanel';
import { TransitionInspector } from './TransitionInspector';
import { PatchInspector } from './PatchInspector';
import { useResolvedElements } from '../../hooks/useResolvedElements';
import './Inspector.css';

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
    return (
      <div key={panelKey} className="panel-transition-enter">
        <DesignPanel />
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
