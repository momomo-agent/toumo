import { useEditorStore } from '../../store';

export function LivePreview() {
  const { keyframes, selectedKeyframeId } = useEditorStore();
  const keyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = keyframe?.keyElements || [];

  return (
    <section className="live-preview">
      <h3>Live Preview</h3>
      <span>{keyframe?.name}</span>
      <div className="device-frame">
        {elements.map((el) => (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.position.x * 0.5,
              top: el.position.y * 0.5,
              width: el.size.width * 0.5,
              height: el.size.height * 0.5,
              backgroundColor: el.style?.fill || '#3b82f6',
              borderRadius: (el.style?.borderRadius || 8) * 0.5,
            }}
          />
        ))}
      </div>
    </section>
  );
}
