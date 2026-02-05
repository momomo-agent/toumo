import { useEditorStore } from '../../store';

export function Inspector() {
  const { 
    keyframes, 
    transitions,
    selectedKeyframeId, 
    selectedElementId,
    selectedTransitionId,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElementId
  );
  const selectedTransition = transitions.find(tr => tr.id === selectedTransitionId);

  // Show transition inspector if a transition is selected
  if (selectedTransition) {
    const fromKf = keyframes.find(kf => kf.id === selectedTransition.from);
    const toKf = keyframes.find(kf => kf.id === selectedTransition.to);
    
    return (
      <section className="inspector-panel">
        <h3>Transition</h3>
        <div className="inspector-row">
          <label>From</label>
          <span className="inspector-value">{fromKf?.name || '—'}</span>
        </div>
        <div className="inspector-row">
          <label>To</label>
          <span className="inspector-value">{toKf?.name || '—'}</span>
        </div>
        <div className="inspector-row">
          <label>Trigger</label>
          <span className="inspector-value">{selectedTransition.trigger}</span>
        </div>
        <div className="inspector-row">
          <label>Duration</label>
          <span className="inspector-value">{selectedTransition.duration}ms</span>
        </div>
        <div className="inspector-row">
          <label>Delay</label>
          <span className="inspector-value">{selectedTransition.delay}ms</span>
        </div>
        <div className="inspector-row">
          <label>Curve</label>
          <span className="inspector-value">{selectedTransition.curve}</span>
        </div>
      </section>
    );
  }

  if (!selectedElement) {
    return (
      <section className="inspector-panel">
        <h3>Inspector</h3>
        <p style={{ color: '#666' }}>Select a layer to edit.</p>
      </section>
    );
  }

  return (
    <section className="inspector-panel">
      <h3>Inspector</h3>
      <div className="inspector-row">
        <label>Name</label>
        <input type="text" value={selectedElement.name} readOnly />
      </div>
    </section>
  );
}
