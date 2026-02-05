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
    <section className="panel layer-panel">
      <div className="panel-heading">
        <h3>Layers</h3>
        <span className="count">{elements.length}</span>
      </div>
      <div className="layer-list">
        {elements.length === 0 ? (
          <p className="muted">No layers yet.</p>
        ) : (
          elements.map((el) => (
            <div
              key={el.id}
              className={`layer-item ${selectedElementId === el.id ? 'selected' : ''}`}
              onClick={() => setSelectedElementId(el.id)}
            >
              <span className="layer-icon">
                {el.shapeType === 'rectangle' && '▢'}
                {el.shapeType === 'ellipse' && '○'}
                {el.shapeType === 'text' && 'T'}
              </span>
              <span className="layer-name">{el.name}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
