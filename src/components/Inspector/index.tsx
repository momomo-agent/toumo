import { useEditorStore } from '../../store';
import { InteractionPanel } from '../InteractionPanel';
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
    updateElement,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElementId
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

  // Show element inspector with state mappings
  if (selectedElement) {
    return (
      <ElementInspector
        element={selectedElement}
        keyframes={keyframes}
        currentKeyframeId={selectedKeyframeId}
        onUpdate={updateElement}
      />
    );
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
    <section className="inspector-panel">
      <h3>Transition</h3>
      
      <div className="inspector-section">
        <div className="section-title">States</div>
        <div className="inspector-row">
          <label>From</label>
          <span className="inspector-value state-badge">{fromKf?.name || '—'}</span>
        </div>
        <div className="inspector-row">
          <label>To</label>
          <span className="inspector-value state-badge">{toKf?.name || '—'}</span>
        </div>
      </div>

      <div className="inspector-section">
        <div className="section-title">Trigger</div>
        <div className="inspector-row">
          <label>Type</label>
          <select
            value={transition.trigger}
            onChange={(e) => onUpdate(transition.id, { trigger: e.target.value })}
          >
            {TRIGGER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inspector-section">
        <div className="section-title">Timing</div>
        <div className="inspector-row">
          <label>Duration</label>
          <input
            type="number"
            value={transition.duration}
            min={0}
            step={50}
            onChange={(e) => onUpdate(transition.id, { duration: parseInt(e.target.value) || 0 })}
          />
          <span className="unit">ms</span>
        </div>
        <div className="inspector-row">
          <label>Delay</label>
          <input
            type="number"
            value={transition.delay}
            min={0}
            step={50}
            onChange={(e) => onUpdate(transition.id, { delay: parseInt(e.target.value) || 0 })}
          />
          <span className="unit">ms</span>
        </div>
        <div className="inspector-row">
          <label>Curve</label>
          <select
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

// Element Inspector with State Mappings
interface ElementInspectorProps {
  element: {
    id: string;
    name: string;
    category: string;
    isKeyElement: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: {
      fill: string;
      fillOpacity: number;
      borderRadius: number;
    };
  };
  keyframes: { id: string; name: string; functionalState?: string; keyElements: { id: string; name: string }[] }[];
  currentKeyframeId: string;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
}

function ElementInspector({ element, keyframes, currentKeyframeId, onUpdate }: ElementInspectorProps) {
  const currentKeyframe = keyframes.find(kf => kf.id === currentKeyframeId);
  
  // Find this element across all display states (keyframes)
  const stateAppearances = keyframes.map(kf => {
    const found = kf.keyElements.find(el => 
      el.name === element.name || el.id.replace(/-active|-complete/, '') === element.id.replace(/-active|-complete/, '')
    );
    return {
      keyframeId: kf.id,
      keyframeName: kf.name,
      functionalState: kf.functionalState || kf.name.toLowerCase(),
      exists: !!found,
      isCurrent: kf.id === currentKeyframeId,
    };
  });

  return (
    <section className="inspector-panel">
      <h3>{element.name}</h3>
      
      {/* Component Info */}
      <div className="inspector-section">
        <div className="section-title">Component</div>
        <div className="inspector-row">
          <label>Type</label>
          <span className="inspector-value category-badge">{element.category}</span>
        </div>
        <div className="inspector-row">
          <label>Key Element</label>
          <input
            type="checkbox"
            checked={element.isKeyElement}
            onChange={(e) => onUpdate(element.id, { isKeyElement: e.target.checked })}
          />
        </div>
      </div>

      {/* State Mappings */}
      <div className="inspector-section">
        <div className="section-title">State Mappings</div>
        <div className="state-mapping-list">
          {stateAppearances.map(sa => (
            <div 
              key={sa.keyframeId} 
              className={`state-mapping-item ${sa.isCurrent ? 'current' : ''} ${sa.exists ? 'exists' : 'missing'}`}
            >
              <div className="sm-functional">
                <span className="sm-label">Functional:</span>
                <span className="sm-value">{sa.functionalState}</span>
              </div>
              <div className="sm-display">
                <span className="sm-label">Display:</span>
                <span className="sm-value">{sa.keyframeName}</span>
              </div>
              <div className="sm-status">
                {sa.exists ? '✓' : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Display State Properties */}
      <div className="inspector-section">
        <div className="section-title">
          Display State: {currentKeyframe?.name}
        </div>
        <div className="inspector-row">
          <label>X</label>
          <input type="number" value={Math.round(element.position.x)} readOnly />
        </div>
        <div className="inspector-row">
          <label>Y</label>
          <input type="number" value={Math.round(element.position.y)} readOnly />
        </div>
        <div className="inspector-row">
          <label>Width</label>
          <input type="number" value={Math.round(element.size.width)} readOnly />
        </div>
        <div className="inspector-row">
          <label>Height</label>
          <input type="number" value={Math.round(element.size.height)} readOnly />
        </div>
        {element.style && (
          <>
            <div className="inspector-row">
              <label>Fill</label>
              <div className="color-preview" style={{ background: element.style.fill }} />
              <span className="inspector-value">{element.style.fill}</span>
            </div>
            <div className="inspector-row">
              <label>Radius</label>
              <input type="number" value={element.style.borderRadius} readOnly />
            </div>
          </>
        )}
      </div>

      {/* Interaction Panel */}
      <div className="inspector-section">
        <InteractionPanel />
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
      <section className="inspector-panel">
        <h3>Inspector</h3>
        <p className="inspector-hint">Select a layer to edit.</p>
      </section>
    );
  }

  // Find transitions from/to this state
  const outgoing = transitions.filter(t => t.from === keyframe.id);
  const incoming = transitions.filter(t => t.to === keyframe.id);

  return (
    <section className="inspector-panel">
      <h3>State: {keyframe.name}</h3>
      
      <div className="inspector-section">
        <div className="section-title">Functional State</div>
        <div className="inspector-row">
          <label>ID</label>
          <span className="inspector-value">{keyframe.functionalState || keyframe.name.toLowerCase()}</span>
        </div>
        <div className="inspector-row">
          <label>Summary</label>
          <span className="inspector-value">{keyframe.summary}</span>
        </div>
      </div>

      <div className="inspector-section">
        <div className="section-title">Display State</div>
        <div className="inspector-row">
          <label>Elements</label>
          <span className="inspector-value">{keyframe.keyElements.length}</span>
        </div>
      </div>

      <div className="inspector-section">
        <div className="section-title">Transitions</div>
        {outgoing.length > 0 && (
          <div className="transition-list">
            <div className="tl-label">Outgoing:</div>
            {outgoing.map(t => {
              const toKf = keyframes.find(kf => kf.id === t.to);
              return (
                <div key={t.id} className="tl-item">
                  → {toKf?.name} <span className="tl-trigger">({t.trigger})</span>
                </div>
              );
            })}
          </div>
        )}
        {incoming.length > 0 && (
          <div className="transition-list">
            <div className="tl-label">Incoming:</div>
            {incoming.map(t => {
              const fromKf = keyframes.find(kf => kf.id === t.from);
              return (
                <div key={t.id} className="tl-item">
                  ← {fromKf?.name} <span className="tl-trigger">({t.trigger})</span>
                </div>
              );
            })}
          </div>
        )}
        {outgoing.length === 0 && incoming.length === 0 && (
          <p className="inspector-hint">No transitions defined.</p>
        )}
      </div>
    </section>
  );
}
