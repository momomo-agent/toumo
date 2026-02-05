import { useEditorStore } from '../../store';

export function Inspector() {
  const { keyframes, selectedKeyframeId, selectedElementId } = useEditorStore();

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const selectedElement = selectedKeyframe?.keyElements.find(
    el => el.id === selectedElementId
  );

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
      <div>
        <label>Name</label>
        <input type="text" value={selectedElement.name} readOnly />
      </div>
    </section>
  );
}
