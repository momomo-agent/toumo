import type { ReactNode } from 'react';
import './KeyframeCanvas.css';

interface Keyframe {
  id: string;
  name: string;
}

interface Props {
  keyframes: Keyframe[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  renderKeyframe: (kf: Keyframe) => ReactNode;
}

export function KeyframeCanvas({ keyframes, selectedId, onSelect, onAdd, renderKeyframe }: Props) {
  return (
    <div className="keyframe-canvas">
      <div className="keyframe-scroll">
        <div className="keyframe-track">
          {keyframes.map((kf) => (
            <div
              key={kf.id}
              className={`keyframe-panel ${kf.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect(kf.id)}
            >
              <div className="keyframe-header">
                <span>{kf.name}</span>
              </div>
              <div className="keyframe-content">
                {renderKeyframe(kf)}
              </div>
            </div>
          ))}
          <button className="keyframe-add" onClick={onAdd}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
