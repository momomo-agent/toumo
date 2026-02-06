import { useEditorStore } from '../../store';
import { DesignPanel } from './DesignPanel';
import { AlignmentPanel } from './AlignmentPanel';
import './Inspector.css';

const TRIGGER_OPTIONS = ['tap', 'hover', 'drag', 'scroll', 'timer', 'variable'];
const CURVE_OPTIONS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring'];

export function Inspector() {
  const { 
    keyframes, 
    transitions,
    selectedKeyframeId, 
    selectedElementId,
    selectedTransitionId,
    updateTransition,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    (el: { id: string }) => el.id === selectedElementId
  );
  const selectedTransition = transitions.find(tr => tr.id === selectedTransitionId);

  // Show transition inspector if a transition is selected
  if (selectedTransition) {
    return (
      <TransitionInspector
        transition={selectedTransition}
        keyframes={keyframes}
        onUpdate={updateTransition}
      />
    );
  }

  // Show Figma-style design panel when element is selected
  if (selectedElement) {
    return <DesignPanel />;
  }

  // Default: show keyframe/state info
  return (
    <KeyframeInspector
      keyframe={selectedKeyframe}
      keyframes={keyframes}
      transitions={transitions}
    />
  );
}

// Transition Inspector Component
interface TransitionInspectorProps {
  transition: {
    id: string;
    from: string;
    to: string;
    trigger: string;
    duration: number;
    delay: number;
    curve: string;
  };
  keyframes: { id: string; name: string }[];
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
}

function TransitionInspector({ transition, keyframes, onUpdate }: TransitionInspectorProps) {
  const fromKf = keyframes.find(kf => kf.id === transition.from);
  const toKf = keyframes.find(kf => kf.id === transition.to);

  return (
    <section className="inspector-panel figma-style">
      <div className="figma-panel-header">Transition</div>
      
      <div className="figma-section">
        <div className="figma-section-label">States</div>
        <div className="figma-row">
          <span className="figma-label">From</span>
          <span className="figma-badge">{fromKf?.name || '—'}</span>
        </div>
        <div className="figma-row">
          <span className="figma-label">To</span>
          <span className="figma-badge">{toKf?.name || '—'}</span>
        </div>
      </div>

      <div className="figma-section">
        <div className="figma-section-label">Trigger</div>
        <div className="figma-row">
          <span className="figma-label">Type</span>
          <select
            className="figma-select"
            value={transition.trigger}
            onChange={(e) => onUpdate(transition.id, { trigger: e.target.value })}
          >
            {TRIGGER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="figma-section">
        <div className="figma-section-label">Timing</div>
        <div className="figma-row">
          <span className="figma-label">Duration</span>
          <input
            type="number"
            className="figma-input"
            value={transition.duration}
            min={0}
            step={50}
            onChange={(e) => onUpdate(transition.id, { duration: parseInt(e.target.value) || 0 })}
          />
          <span className="figma-unit">ms</span>
        </div>
        <div className="figma-row">
          <span className="figma-label">Delay</span>
          <input
            type="number"
            className="figma-input"
            value={transition.delay}
            min={0}
            step={50}
            onChange={(e) => onUpdate(transition.id, { delay: parseInt(e.target.value) || 0 })}
          />
          <span className="figma-unit">ms</span>
        </div>
        <div className="figma-row">
          <span className="figma-label">Curve</span>
          <select
            className="figma-select"
            value={transition.curve}
            onChange={(e) => onUpdate(transition.id, { curve: e.target.value })}
          >
            {CURVE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
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
