import { useEditorStore } from '../../store';
import type { KeyElement } from '../../store/useEditorStore';

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
    <div className={`canvas-frame ${isActive ? 'active' : ''}`} onClick={onActivate}>
      <div className="frame-header">
        <span className="frame-name">{keyframeName}</span>
      </div>
      <div className="frame-content">
        {elements.map((el: KeyElement) => (
          <div
            key={el.id}
            className={`canvas-el ${selectedElementId === el.id ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: el.position.x,
              top: el.position.y,
              width: el.size.width,
              height: el.size.height,
              background: el.style?.fill || '#3b82f6',
              borderRadius: el.style?.borderRadius || 8,
            }}
          />
        ))}
      </div>
    </div>
  );
}
