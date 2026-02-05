import { useEditorStore } from '../../store';
import { CanvasElement } from './CanvasElement';

interface Props {
  keyframeId: string;
  keyframeName: string;
  isActive: boolean;
  onActivate: () => void;
}

export function CanvasFrame({ keyframeId, keyframeName, isActive, onActivate }: Props) {
  const { keyframes, selectedElementId } = useEditorStore();
  const keyframe = keyframes.find(kf => kf.id === keyframeId);
  const elements = keyframe?.keyElements || [];

  return (
    <div 
      className={`canvas-frame ${isActive ? 'active' : ''}`}
      onClick={onActivate}
    >
      <div className="frame-header">
        <span className="frame-name">{keyframeName}</span>
      </div>
      <div className="frame-content">
        {elements.map((el) => (
          <CanvasElement
            key={el.id}
            element={el}
            isSelected={selectedElementId === el.id && isActive}
          />
        ))}
      </div>
    </div>
  );
}
