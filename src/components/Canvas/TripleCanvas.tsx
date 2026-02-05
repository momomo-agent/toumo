import { useEditorStore } from '../../store';
import { CanvasFrame } from './CanvasFrame';

export function TripleCanvas() {
  const { keyframes, selectedKeyframeId, setSelectedKeyframeId } = useEditorStore();
  const visibleFrames = keyframes.slice(0, 3);

  return (
    <div className="triple-canvas">
      <div className="canvas-container">
        {visibleFrames.map((kf) => (
          <CanvasFrame
            key={kf.id}
            keyframeId={kf.id}
            keyframeName={kf.name}
            isActive={selectedKeyframeId === kf.id}
            onActivate={() => setSelectedKeyframeId(kf.id)}
          />
        ))}
      </div>
    </div>
  );
}
