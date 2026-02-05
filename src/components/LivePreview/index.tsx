import { useEditorStore } from '../../store';
import { DEFAULT_STYLE } from '../../types';

export function LivePreview() {
  const { keyframes, selectedKeyframeId } = useEditorStore();
  const keyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = keyframe?.keyElements || [];

  return (
    <section className="live-preview">
      <div className="preview-header">
        <h3>Live Preview</h3>
        <span className="state-badge">{keyframe?.name}</span>
      </div>
      <div className="preview-device">
        <div className="device-frame">
          {elements.map((el) => {
            const style = { ...DEFAULT_STYLE, ...el.style };
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.position.x * 0.5,
                  top: el.position.y * 0.5,
                  width: el.size.width * 0.5,
                  height: el.size.height * 0.5,
                  backgroundColor: style.fill,
                  borderRadius: el.shapeType === 'ellipse' 
                    ? '50%' 
                    : style.borderRadius * 0.5,
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
