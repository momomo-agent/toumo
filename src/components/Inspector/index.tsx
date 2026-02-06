import { useMemo } from 'react';
import { useEditorStore } from '../../store';
import { DesignPanel } from './DesignPanel';
import { AlignmentPanel } from './AlignmentPanel';
import { TransitionInspector } from './TransitionInspector';
import './Inspector.css';

export function Inspector() {
  const { 
    keyframes, 
    transitions,
    selectedKeyframeId, 
    selectedElementId,
    selectedElementIds,
    selectedTransitionId,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    (el: { id: string }) => el.id === selectedElementId
  );
  const selectedTransition = transitions.find(tr => tr.id === selectedTransitionId);

  // Determine which panel variant is active — key changes trigger the slide-in animation
  const panelKey = useMemo(() => {
    if (selectedTransition) return `transition-${selectedTransition.id}`;
    if (selectedElementIds.length >= 2) return 'multi-select';
    if (selectedElement) return `element-${selectedElement.id}`;
    return `keyframe-${selectedKeyframeId}`;
  }, [selectedTransition, selectedElementIds.length >= 2, selectedElement?.id, selectedKeyframeId]);

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

  // Show alignment panel when multiple elements are selected
  if (selectedElementIds.length >= 2) {
    return (
      <div key={panelKey} className="panel-transition-enter">
        <section className="inspector-panel figma-style">
          <div className="figma-panel-header">
            {selectedElementIds.length} Elements Selected
          </div>
          <AlignmentPanel />
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
    keyElements: unknown[];
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
          <span className="figma-value">{keyframe.keyElements.length}</span>
        </div>
      </div>

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
