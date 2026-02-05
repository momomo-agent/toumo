import { useEditorStore } from '../../store';

export function LayerManager() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    selectedElementId,
    setSelectedElementId,
  } = useEditorStore();
  
  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = selectedKeyframe?.keyElements || [];

  return (
    <section className="layer-panel">
      <h3>Layers</h3>
      <div className="layer-list">
        {elements.length === 0 ? (
          <p style={{ color: '#666' }}>No layers yet.</p>
        ) : (
          elements.map((el) => (
            <div
              key={el.id}
              className={`layer-item ${selectedElementId === el.id ? 'selected' : ''}`}
              onClick={() => setSelectedElementId(el.id)}
            >
              <span className="layer-name">{el.name}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
