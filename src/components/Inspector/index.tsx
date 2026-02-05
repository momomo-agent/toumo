import { useEditorStore } from '../../store';

export function Inspector() {
  const {
    keyframes,
    selectedKeyframeId,
    selectedElementId,
    updateElementName,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElementId
  );

  if (!selectedElement) {
    return (
      <section className="panel inspector-panel">
        <div className="panel-heading">
          <h3>Inspector</h3>
        </div>
        <p className="muted">Select a layer to edit.</p>
      </section>
    );
  }

  return (
    <section className="panel inspector-panel">
      <div className="panel-heading">
        <h3>Inspector</h3>
      </div>
      <div className="inspector-content">
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={selectedElement.name}
            onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
